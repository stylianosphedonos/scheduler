const express = require('express');
const router = express.Router();
const { getDb, getDatabaseType } = require('../database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Get all groups
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const { search, active } = req.query;
    
    let query = `
      SELECT g.*,
        (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) as member_count,
        (SELECT COUNT(*) FROM group_projects gp WHERE gp.group_id = g.id) as project_count
      FROM groups g
      WHERE 1=1
    `;
    const params = [];
    
    if (search) {
      query += ` AND (g.name LIKE ? OR g.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (active !== undefined) {
      const dbType = getDatabaseType();
      if (dbType === 'sqlite') {
        query += ` AND g.is_active = ?`;
        params.push(active === 'true' ? 1 : 0);
      } else {
        query += ` AND g.is_active = ?`;
        params.push(active === 'true');
      }
    }
    
    query += ` ORDER BY g.name ASC`;
    
    const groups = db.prepare(query).all(...params);
    
    res.json({ data: groups, total: groups.length });
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// Get single group with members and projects
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    
    if (isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid group ID' });
    }
    
    const group = db.prepare(`
      SELECT * FROM groups WHERE id = ?
    `).get(id);
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // Get members
    const members = db.prepare(`
      SELECT p.id, p.first_name, p.last_name, p.email, p.position, p.department,
             gm.role as group_role, gm.joined_at
      FROM people p
      JOIN group_members gm ON p.id = gm.person_id
      WHERE gm.group_id = ?
      ORDER BY gm.role DESC, p.first_name ASC
    `).all(id);
    
    // Get projects
    const projects = db.prepare(`
      SELECT pr.id, pr.name, pr.code, pr.status, pr.priority,
             gp.assigned_at
      FROM projects pr
      JOIN group_projects gp ON pr.id = gp.project_id
      WHERE gp.group_id = ?
      ORDER BY pr.name ASC
    `).all(id);
    
    res.json({ ...group, members, projects });
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({ error: 'Failed to fetch group' });
  }
});

// Create group
router.post('/', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const db = getDb();
    const { name, description, color, leaderId } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Group name is required' });
    }
    
    const dbType = getDatabaseType();
    let result;
    
    if (dbType === 'sqlite') {
      result = db.prepare(`
        INSERT INTO groups (name, description, color, leader_id, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, 1, datetime('now'), datetime('now'))
      `).run(name, description || null, color || '#6366f1', leaderId || null);
      
      const newGroup = db.prepare('SELECT * FROM groups WHERE id = ?').get(result.lastInsertRowid);
      res.status(201).json(newGroup);
    } else {
      result = db.prepare(`
        INSERT INTO groups (name, description, color, leader_id, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `).get(name, description || null, color || '#6366f1', leaderId || null);
      
      res.status(201).json(result);
    }
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// Update group
router.put('/:id', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { name, description, color, leaderId, isActive } = req.body;
    
    if (isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid group ID' });
    }
    
    const existing = db.prepare('SELECT * FROM groups WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    const dbType = getDatabaseType();
    const isActiveValue = dbType === 'sqlite' ? (isActive ? 1 : 0) : isActive;
    
    db.prepare(`
      UPDATE groups 
      SET name = ?, description = ?, color = ?, leader_id = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name || existing.name,
      description !== undefined ? description : existing.description,
      color || existing.color,
      leaderId !== undefined ? leaderId : existing.leader_id,
      isActiveValue !== undefined ? isActiveValue : existing.is_active,
      id
    );
    
    const updated = db.prepare('SELECT * FROM groups WHERE id = ?').get(id);
    res.json(updated);
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({ error: 'Failed to update group' });
  }
});

// Delete group
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    
    if (isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid group ID' });
    }
    
    const existing = db.prepare('SELECT * FROM groups WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // Delete group members and projects first
    db.prepare('DELETE FROM group_members WHERE group_id = ?').run(id);
    db.prepare('DELETE FROM group_projects WHERE group_id = ?').run(id);
    db.prepare('DELETE FROM groups WHERE id = ?').run(id);
    
    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ error: 'Failed to delete group' });
  }
});

// Add member to group
router.post('/:id/members', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { personId, role } = req.body;
    
    if (!personId) {
      return res.status(400).json({ error: 'Person ID is required' });
    }
    
    // Check if already a member
    const existing = db.prepare(`
      SELECT * FROM group_members WHERE group_id = ? AND person_id = ?
    `).get(id, personId);
    
    if (existing) {
      return res.status(400).json({ error: 'Person is already a member of this group' });
    }
    
    const dbType = getDatabaseType();
    if (dbType === 'sqlite') {
      db.prepare(`
        INSERT INTO group_members (group_id, person_id, role, joined_at)
        VALUES (?, ?, ?, datetime('now'))
      `).run(id, personId, role || 'member');
    } else {
      db.prepare(`
        INSERT INTO group_members (group_id, person_id, role, joined_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `).run(id, personId, role || 'member');
    }
    
    res.status(201).json({ message: 'Member added successfully' });
  } catch (error) {
    console.error('Error adding member:', error);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

// Remove member from group
router.delete('/:id/members/:personId', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const db = getDb();
    const { id, personId } = req.params;
    
    db.prepare(`
      DELETE FROM group_members WHERE group_id = ? AND person_id = ?
    `).run(id, personId);
    
    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

// Update member role in group
router.put('/:id/members/:personId', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const db = getDb();
    const { id, personId } = req.params;
    const { role } = req.body;
    
    db.prepare(`
      UPDATE group_members SET role = ? WHERE group_id = ? AND person_id = ?
    `).run(role, id, personId);
    
    res.json({ message: 'Member role updated successfully' });
  } catch (error) {
    console.error('Error updating member role:', error);
    res.status(500).json({ error: 'Failed to update member role' });
  }
});

// Add project to group
router.post('/:id/projects', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { projectId } = req.body;
    
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }
    
    // Check if already assigned
    const existing = db.prepare(`
      SELECT * FROM group_projects WHERE group_id = ? AND project_id = ?
    `).get(id, projectId);
    
    if (existing) {
      return res.status(400).json({ error: 'Project is already assigned to this group' });
    }
    
    const dbType = getDatabaseType();
    if (dbType === 'sqlite') {
      db.prepare(`
        INSERT INTO group_projects (group_id, project_id, assigned_at)
        VALUES (?, ?, datetime('now'))
      `).run(id, projectId);
    } else {
      db.prepare(`
        INSERT INTO group_projects (group_id, project_id, assigned_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `).run(id, projectId);
    }
    
    res.status(201).json({ message: 'Project assigned successfully' });
  } catch (error) {
    console.error('Error assigning project:', error);
    res.status(500).json({ error: 'Failed to assign project' });
  }
});

// Remove project from group
router.delete('/:id/projects/:projectId', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const db = getDb();
    const { id, projectId } = req.params;
    
    db.prepare(`
      DELETE FROM group_projects WHERE group_id = ? AND project_id = ?
    `).run(id, projectId);
    
    res.json({ message: 'Project removed successfully' });
  } catch (error) {
    console.error('Error removing project:', error);
    res.status(500).json({ error: 'Failed to remove project' });
  }
});

module.exports = router;

