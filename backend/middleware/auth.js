const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Use environment variable in production, generate random secret for dev
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  if (process.env.NODE_ENV === 'production') {
    console.error('⚠️  WARNING: JWT_SECRET not set in production! Set JWT_SECRET environment variable.');
    process.exit(1);
  }
  console.log('⚠️  Using development JWT secret. Set JWT_SECRET in production.');
  return 'dev-scheduler-secret-' + crypto.randomBytes(16).toString('hex');
})();

// Import security helpers (lazy load to avoid circular dependency)
let securityModule = null;
function getSecurity() {
  if (!securityModule) {
    securityModule = require('./security');
  }
  return securityModule;
}

/**
 * Role-Based Access Control (RBAC) Configuration
 * 
 * ROLES:
 * - admin: Full system access - can manage users, all data, settings
 * - scheduler: Can manage schedules, people, projects, skills (no user management)
 * - viewer: Read-only access to schedules and reports
 */

const ROLE_PERMISSIONS = {
  admin: {
    level: 3,
    permissions: [
      'users:read', 'users:create', 'users:update', 'users:delete',
      'people:read', 'people:create', 'people:update', 'people:delete',
      'projects:read', 'projects:create', 'projects:update', 'projects:delete',
      'skills:read', 'skills:create', 'skills:update', 'skills:delete',
      'assignments:read', 'assignments:create', 'assignments:update', 'assignments:delete',
      'availability:read', 'availability:create', 'availability:update', 'availability:delete',
      'conflicts:read', 'conflicts:resolve',
      'analytics:read',
      'exports:excel', 'exports:pdf',
      'settings:read', 'settings:update'
    ],
    description: 'Full system administrator with complete access'
  },
  scheduler: {
    level: 2,
    permissions: [
      'people:read', 'people:create', 'people:update',
      'projects:read', 'projects:create', 'projects:update',
      'skills:read', 'skills:create', 'skills:update',
      'assignments:read', 'assignments:create', 'assignments:update', 'assignments:delete',
      'availability:read', 'availability:create', 'availability:update',
      'conflicts:read', 'conflicts:resolve',
      'analytics:read',
      'exports:excel', 'exports:pdf'
    ],
    description: 'Can manage schedules, people, projects, and skills'
  },
  viewer: {
    level: 1,
    permissions: [
      'people:read',
      'projects:read',
      'skills:read',
      'assignments:read',
      'availability:read',
      'conflicts:read',
      'analytics:read'
    ],
    description: 'Read-only access to view schedules and reports'
  }
};

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // Check if token has been invalidated (logout, password change)
  const security = getSecurity();
  if (security.isTokenInvalidated(token)) {
    return res.status(401).json({ error: 'Token has been invalidated. Please log in again.' });
  }

  jwt.verify(token, JWT_SECRET, async (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token has expired. Please log in again.' });
      }
      return res.status(403).json({ error: 'Invalid token' });
    }

    try {
      const db = req.app.locals.db;
      const dbUser = await db.prepare('SELECT id, username, email, role, is_active FROM users WHERE id = ?').get(user.id);
      
      if (!dbUser) {
        return res.status(403).json({ error: 'User not found' });
      }
      
      if (!dbUser.is_active) {
        return res.status(403).json({ error: 'User account is inactive' });
      }

      // Attach user and permissions
      req.user = dbUser;
      req.userPermissions = ROLE_PERMISSIONS[dbUser.role]?.permissions || [];
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({ error: 'Authentication error' });
    }
  });
}

// Middleware to check role permissions
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access denied. Insufficient permissions.',
        requiredRoles: allowedRoles,
        yourRole: req.user.role,
        message: `This action requires one of these roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
}

// Middleware to check specific permission
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userPerms = ROLE_PERMISSIONS[req.user.role]?.permissions || [];
    
    if (!userPerms.includes(permission)) {
      return res.status(403).json({ 
        error: 'Access denied. You do not have permission for this action.',
        requiredPermission: permission,
        yourRole: req.user.role
      });
    }

    next();
  };
}

// Check if user has a specific permission
function hasPermission(userRole, permission) {
  const userPerms = ROLE_PERMISSIONS[userRole]?.permissions || [];
  return userPerms.includes(permission);
}

// Check role hierarchy level
function hasRoleLevel(userRole, requiredRole) {
  const userLevel = ROLE_PERMISSIONS[userRole]?.level || 0;
  const requiredLevel = ROLE_PERMISSIONS[requiredRole]?.level || 0;
  return userLevel >= requiredLevel;
}

// Optional authentication (doesn't fail if no token)
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  jwt.verify(token, JWT_SECRET, async (err, user) => {
    if (!err) {
      try {
        const db = req.app.locals.db;
        const dbUser = await db.prepare('SELECT id, username, email, role, is_active FROM users WHERE id = ?').get(user.id);
        if (dbUser && dbUser.is_active) {
          req.user = dbUser;
          req.userPermissions = ROLE_PERMISSIONS[dbUser.role]?.permissions || [];
        }
      } catch (error) {
        console.error('Optional auth error:', error);
      }
    }
    next();
  });
}

// Generate JWT token
function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// Get role info for frontend
function getRoleInfo(role) {
  return ROLE_PERMISSIONS[role] || null;
}

// Get all roles info
function getAllRoles() {
  return Object.entries(ROLE_PERMISSIONS).map(([name, info]) => ({
    name,
    level: info.level,
    description: info.description,
    permissionCount: info.permissions.length
  }));
}

module.exports = {
  authenticateToken,
  requireRole,
  requirePermission,
  hasPermission,
  hasRoleLevel,
  optionalAuth,
  generateToken,
  getRoleInfo,
  getAllRoles,
  ROLE_PERMISSIONS
  // JWT_SECRET is NOT exported for security - use generateToken() instead
};
