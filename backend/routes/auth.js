const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { authenticateToken, generateToken, ROLE_PERMISSIONS, getAllRoles } = require('../middleware/auth');
const {
  sanitizeInput,
  isValidEmail,
  isValidUsername,
  isStrongPassword,
  recordFailedLogin,
  isAccountLocked,
  clearLoginAttempts,
  generatePasswordResetToken,
  validatePasswordResetToken,
  invalidatePasswordResetToken,
  invalidateToken,
  createAuditLog
} = require('../middleware/security');
const { getBooleanCondition } = require('../database');

const router = express.Router();

// Helper for active condition
const getActiveCondition = (column = 'is_active') => getBooleanCondition(column, true);

/**
 * AUTHENTICATION ROUTES
 * Role-based access with 3 user types:
 * - Admin: Full system control
 * - Scheduler: Manage schedules, people, projects
 * - Viewer: Read-only access
 */

// Login with account lockout protection
router.post('/login', async (req, res) => {
  try {
    const db = req.app.locals.db;
    let { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Sanitize input
    username = sanitizeInput(username, { maxLength: 254 });
    
    // Check account lockout
    const lockStatus = isAccountLocked(username);
    if (lockStatus.locked) {
      createAuditLog(db, {
        userId: null,
        action: 'LOGIN_BLOCKED',
        entityType: 'auth',
        entityId: null,
        newValues: { username, reason: 'account_locked' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(423).json({ 
        error: lockStatus.message,
        lockedFor: lockStatus.remainingTime
      });
    }

    const user = await db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(username, username);

    // Use constant-time comparison to prevent timing attacks
    if (!user) {
      // Still do a bcrypt compare to prevent timing attacks that reveal user existence
      bcrypt.compareSync(password, '$2a$12$fakehashfakehashfakehashfakehashfakehashfake');
      recordFailedLogin(username);
      
      const remaining = isAccountLocked(username);
      return res.status(401).json({ 
        error: 'Invalid credentials',
        remainingAttempts: remaining.remainingAttempts
      });
    }
    
    if (!bcrypt.compareSync(password, user.password_hash)) {
      const record = recordFailedLogin(username);
      
      createAuditLog(db, {
        userId: user.id,
        action: 'LOGIN_FAILED',
        entityType: 'auth',
        entityId: user.id,
        newValues: { username, attemptCount: record.attempts.length },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      const remaining = isAccountLocked(username);
      if (remaining.locked) {
        return res.status(423).json({ 
          error: remaining.message,
          lockedFor: remaining.remainingTime
        });
      }
      
      return res.status(401).json({ 
        error: 'Invalid credentials',
        remainingAttempts: remaining.remainingAttempts
      });
    }

    if (!user.is_active) {
      createAuditLog(db, {
        userId: user.id,
        action: 'LOGIN_DENIED',
        entityType: 'auth',
        entityId: user.id,
        newValues: { reason: 'account_inactive' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(403).json({ error: 'Account is deactivated. Contact administrator.' });
    }

    // Successful login - clear any failed attempts
    clearLoginAttempts(username);

    // Update last login
    await db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

    const token = generateToken(user);
    const roleInfo = ROLE_PERMISSIONS[user.role];

    // Audit successful login
    createAuditLog(db, {
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      entityType: 'auth',
      entityId: user.id,
      newValues: { role: user.role },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        avatarUrl: user.avatar_url
      },
      permissions: roleInfo?.permissions || [],
      roleDescription: roleInfo?.description || 'Unknown role',
      roleLevel: roleInfo?.level || 1
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout - invalidate token
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      invalidateToken(token);
    }
    
    createAuditLog(db, {
      userId: req.user.id,
      action: 'LOGOUT',
      entityType: 'auth',
      entityId: req.user.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Register (creates viewer by default)
router.post('/register', async (req, res) => {
  try {
    const db = req.app.locals.db;
    let { username, email, password, firstName, lastName } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    // Sanitize inputs
    username = sanitizeInput(username);
    email = sanitizeInput(email);
    firstName = firstName ? sanitizeInput(firstName) : null;
    lastName = lastName ? sanitizeInput(lastName) : null;

    // Validate username
    if (!isValidUsername(username)) {
      return res.status(400).json({ error: 'Username must be 3-50 characters, alphanumeric with _.- allowed' });
    }

    // Validate email
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password strength
    const passwordCheck = isStrongPassword(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({ error: passwordCheck.message });
    }

    const existing = await db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
    if (existing) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Use stronger bcrypt rounds (12)
    const passwordHash = bcrypt.hashSync(password, 12);
    const role = 'viewer'; // New registrations are viewers by default

    const isPostgres = getDatabaseType() === 'postgres';
    let userId;
    
    if (isPostgres) {
      const result = await db.prepare(`
        INSERT INTO users (username, email, password_hash, role, first_name, last_name)
        VALUES (?, ?, ?, ?, ?, ?) RETURNING id
      `).get(username, email, passwordHash, role, firstName || null, lastName || null);
      userId = result?.id;
    } else {
      const result = await db.prepare(`
        INSERT INTO users (username, email, password_hash, role, first_name, last_name)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(username, email, passwordHash, role, firstName || null, lastName || null);
      userId = result.lastInsertRowid;
    }

    const roleInfo = ROLE_PERMISSIONS[role];

    // Audit registration
    createAuditLog(db, {
      userId: userId,
      action: 'REGISTER',
      entityType: 'user',
      entityId: userId,
      newValues: { username, email, role },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: userId,
        username,
        email,
        role,
        firstName,
        lastName
      },
      permissions: roleInfo?.permissions || [],
      roleDescription: roleInfo?.description
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const user = await db.prepare(`
      SELECT id, username, email, role, first_name, last_name, avatar_url, last_login, created_at
      FROM users WHERE id = ?
    `).get(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const roleInfo = ROLE_PERMISSIONS[user.role];

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
      avatarUrl: user.avatar_url,
      lastLogin: user.last_login,
      createdAt: user.created_at,
      permissions: roleInfo?.permissions || [],
      roleDescription: roleInfo?.description || 'Unknown role',
      roleLevel: roleInfo?.level || 1
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update own profile
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    let { email, firstName, lastName, avatarUrl } = req.body;

    // Sanitize inputs
    if (email) email = sanitizeInput(email);
    if (firstName) firstName = sanitizeInput(firstName);
    if (lastName) lastName = sanitizeInput(lastName);
    if (avatarUrl) avatarUrl = sanitizeInput(avatarUrl, { maxLength: 500 });

    // Validate email if provided
    if (email && !isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const updates = [];
    const values = [];

    if (email !== undefined) { updates.push('email = ?'); values.push(email); }
    if (firstName !== undefined) { updates.push('first_name = ?'); values.push(firstName); }
    if (lastName !== undefined) { updates.push('last_name = ?'); values.push(lastName); }
    if (avatarUrl !== undefined) { updates.push('avatar_url = ?'); values.push(avatarUrl); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.user.id);

    await db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    createAuditLog(db, {
      userId: req.user.id,
      action: 'UPDATE_PROFILE',
      entityType: 'user',
      entityId: req.user.id,
      newValues: { email, firstName, lastName },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change own password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }

    // Validate new password strength
    const passwordCheck = isStrongPassword(newPassword);
    if (!passwordCheck.valid) {
      return res.status(400).json({ error: passwordCheck.message });
    }

    const user = await db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);

    if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Check that new password is different from current
    if (bcrypt.compareSync(newPassword, user.password_hash)) {
      return res.status(400).json({ error: 'New password must be different from current password' });
    }

    const newHash = bcrypt.hashSync(newPassword, 12);
    await db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(newHash, req.user.id);

    // Invalidate current token to force re-login
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
      invalidateToken(token);
    }

    createAuditLog(db, {
      userId: req.user.id,
      action: 'CHANGE_PASSWORD',
      entityType: 'user',
      entityId: req.user.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({ 
      message: 'Password changed successfully. Please log in again.',
      requireRelogin: true
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const db = req.app.locals.db;
    let { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    email = sanitizeInput(email);

    // Always return success to prevent email enumeration
    const successMessage = 'If an account exists with this email, a password reset link has been sent.';

    const activeCondition = getActiveCondition('is_active');
    const user = await db.prepare(`SELECT id, email FROM users WHERE email = ? AND ${activeCondition}`).get(email);

    if (!user) {
      // Return same message to prevent enumeration
      return res.json({ message: successMessage });
    }

    const resetToken = generatePasswordResetToken(user.id);

    // In production, send email with reset link
    // For now, log it (remove in production!)
    console.log(`Password reset token for ${email}: ${resetToken}`);

    createAuditLog(db, {
      userId: user.id,
      action: 'PASSWORD_RESET_REQUEST',
      entityType: 'auth',
      entityId: user.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({ 
      message: successMessage,
      // Only include token in development - remove in production!
      ...(process.env.NODE_ENV !== 'production' && { resetToken })
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Request failed' });
  }
});

// Reset password with token
router.post('/reset-password', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    // Validate token
    const tokenValidation = validatePasswordResetToken(token);
    if (!tokenValidation.valid) {
      return res.status(400).json({ error: tokenValidation.message });
    }

    // Validate new password strength
    const passwordCheck = isStrongPassword(newPassword);
    if (!passwordCheck.valid) {
      return res.status(400).json({ error: passwordCheck.message });
    }

    const newHash = bcrypt.hashSync(newPassword, 12);
    await db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(newHash, tokenValidation.userId);

    // Invalidate the reset token
    invalidatePasswordResetToken(token);

    createAuditLog(db, {
      userId: tokenValidation.userId,
      action: 'PASSWORD_RESET_COMPLETE',
      entityType: 'auth',
      entityId: tokenValidation.userId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({ message: 'Password reset successfully. Please log in with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
});

// Get roles info (public)
router.get('/roles', async (req, res) => {
  try {
    const roles = getAllRoles();
    
    res.json({
      roles,
      summary: {
        admin: {
          name: 'Administrator',
          description: 'Full system access including user management',
          canManageUsers: true,
          canExport: true,
          canEdit: true
        },
        scheduler: {
          name: 'Scheduler',
          description: 'Can manage schedules, people, and projects',
          canManageUsers: false,
          canExport: true,
          canEdit: true
        },
        viewer: {
          name: 'Viewer',
          description: 'Read-only access to schedules',
          canManageUsers: false,
          canExport: false,
          canEdit: false
        }
      }
    });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ error: 'Failed to get roles' });
  }
});

module.exports = router;
