const express = require('express');
const bcrypt = require('bcryptjs');
const { authenticateToken, requireRole, getAllRoles, ROLE_PERMISSIONS } = require('../middleware/auth');

const router = express.Router();

/**
 * USER MANAGEMENT - ADMIN ONLY
 * Only administrators can manage user accounts
 */

// Get all users - ADMIN ONLY
router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { page = 1, limit = 50, role, search, active } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '1=1';
    const params = [];

    if (role) { whereClause += ' AND role = ?'; params.push(role); }
    if (active !== undefined) { whereClause += ' AND is_active = ?'; params.push(active === 'true'); }
    if (search) {
      whereClause += ' AND (username LIKE ? OR email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    const total = await db.prepare(`SELECT COUNT(*) as count FROM users WHERE ${whereClause}`).get(...params).count;
    const users = await db.prepare(`
      SELECT id, username, email, role, first_name, last_name, avatar_url, is_active, last_login, created_at
      FROM users WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).all(...params, parseInt(limit), offset);

    res.json({
      data: users.map(u => ({
        id: u.id, username: u.username, email: u.email, role: u.role,
        firstName: u.first_name, lastName: u.last_name, avatarUrl: u.avatar_url,
        isActive: u.is_active === 1, lastLogin: u.last_login, createdAt: u.created_at,
        roleDescription: ROLE_PERMISSIONS[u.role]?.description || 'Unknown role'
      })),
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Get available roles - ADMIN ONLY
router.get('/roles', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const roles = getAllRoles();
    res.json({ roles });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ error: 'Failed to get roles' });
  }
});

// Get user by ID - ADMIN ONLY
router.get('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const user = await db.prepare(`
      SELECT id, username, email, role, first_name, last_name, avatar_url, is_active, last_login, created_at
      FROM users WHERE id = ?
    `).get(req.params.id);

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      id: user.id, username: user.username, email: user.email, role: user.role,
      firstName: user.first_name, lastName: user.last_name, avatarUrl: user.avatar_url,
      isActive: user.is_active === 1, lastLogin: user.last_login, createdAt: user.created_at,
      permissions: ROLE_PERMISSIONS[user.role]?.permissions || [],
      roleDescription: ROLE_PERMISSIONS[user.role]?.description || 'Unknown role'
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Create user - ADMIN ONLY
router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { username, email, password, role, firstName, lastName } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    // Validate role
    const validRoles = ['admin', 'scheduler', 'viewer'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ 
        error: 'Invalid role', 
        validRoles,
        message: 'Role must be one of: admin, scheduler, viewer'
      });
    }

    const existingUser = await db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const userRole = validRoles.includes(role) ? role : 'viewer';

    const result = await db.prepare(`
      INSERT INTO users (username, email, password_hash, role, first_name, last_name)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(username, email, passwordHash, userRole, firstName || null, lastName || null);

    // Audit log
    await db.prepare(`
      INSERT INTO audit_log (user_id, action, entity_type, entity_id, new_values)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.user.id, 'CREATE_USER', 'user', result.lastInsertRowid, JSON.stringify({ username, email, role: userRole }));

    res.status(201).json({
      id: result.lastInsertRowid,
      username, email, role: userRole, firstName, lastName,
      message: 'User created successfully',
      roleDescription: ROLE_PERMISSIONS[userRole]?.description
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user - ADMIN ONLY
router.put('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { email, role, firstName, lastName, isActive } = req.body;

    const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Prevent admin from deactivating themselves
    if (req.params.id == req.user.id && isActive === false) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }

    // Prevent admin from removing their own admin role
    if (req.params.id == req.user.id && role && role !== 'admin') {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    // Validate role if provided
    if (role) {
      const validRoles = ['admin', 'scheduler', 'viewer'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role', validRoles });
      }
    }

    const updates = [];
    const values = [];

    if (email !== undefined) { updates.push('email = ?'); values.push(email); }
    if (role !== undefined) { updates.push('role = ?'); values.push(role); }
    if (firstName !== undefined) { updates.push('first_name = ?'); values.push(firstName); }
    if (lastName !== undefined) { updates.push('last_name = ?'); values.push(lastName); }
    if (isActive !== undefined) { updates.push('is_active = ?'); values.push(!!isActive); }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.params.id);

    await db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    // Audit log
    await db.prepare(`
      INSERT INTO audit_log (user_id, action, entity_type, entity_id, old_values, new_values)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.user.id, 'UPDATE_USER', 'user', req.params.id, JSON.stringify({ role: user.role, is_active: user.is_active }), JSON.stringify(req.body));

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user - ADMIN ONLY
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    if (req.params.id == req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);

    // Audit log
    await db.prepare(`
      INSERT INTO audit_log (user_id, action, entity_type, entity_id, old_values)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.user.id, 'DELETE_USER', 'user', req.params.id, JSON.stringify({ username: user.username, email: user.email, role: user.role }));

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Reset user password - ADMIN ONLY
router.post('/:id/reset-password', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = await db.prepare('SELECT id, username FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const passwordHash = bcrypt.hashSync(newPassword, 10);
    await db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(passwordHash, req.params.id);

    // Audit log
    await db.prepare(`
      INSERT INTO audit_log (user_id, action, entity_type, entity_id, new_values)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.user.id, 'RESET_PASSWORD', 'user', req.params.id, JSON.stringify({ username: user.username }));

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;
