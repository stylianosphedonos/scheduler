const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { getDatabaseType } = require('../database');

const router = express.Router();

// Helper for database-agnostic date functions
const getDateNow = () => {
  return getDatabaseType() === 'postgres' ? 'CURRENT_DATE' : "date('now')";
};

/**
 * PROJECT MANAGEMENT
 * - Admin & Scheduler: Full CRUD access
 * - Viewer: Read-only access
 */

// Get clients list - ALL ROLES (must be before /:id to avoid route conflict)
router.get('/meta/clients', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const clients = await db.prepare('SELECT DISTINCT client FROM projects WHERE client IS NOT NULL ORDER BY client').all();
    res.json(clients.map(c => c.client));
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Failed to get clients' });
  }
});

// Get all projects - ALL ROLES
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { page = 1, limit = 50, status, priority, search, client } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '1=1';
    const params = [];

    if (status) { whereClause += ' AND status = ?'; params.push(status); }
    if (priority) { whereClause += ' AND priority = ?'; params.push(priority); }
    if (client) { whereClause += ' AND client = ?'; params.push(client); }
    if (search) {
      whereClause += ' AND (name LIKE ? OR code LIKE ? OR description LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    const totalResult = await db.prepare(`SELECT COUNT(*) as count FROM projects WHERE ${whereClause}`).get(...params);
    const total = totalResult?.count || 0;
    const projects = await db.prepare(`
      SELECT p.*, m.first_name || ' ' || m.last_name as manager_name,
        (SELECT COUNT(*) FROM assignments WHERE project_id = p.id) as assignment_count,
        (SELECT COUNT(DISTINCT person_id) FROM assignments WHERE project_id = p.id) as assigned_people
      FROM projects p LEFT JOIN people m ON p.manager_id = m.id
      WHERE ${whereClause}
      ORDER BY CASE p.priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END, p.name
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(limit), offset);

    res.json({
      data: projects.map(p => ({
        id: p.id, name: p.name, code: p.code, client: p.client, description: p.description,
        status: p.status, priority: p.priority, color: p.color, startDate: p.start_date,
        endDate: p.end_date, budgetHours: p.budget_hours, managerId: p.manager_id,
        managerName: p.manager_name, isBillable: !!p.is_billable,
        assignmentCount: p.assignment_count, assignedPeople: p.assigned_people, createdAt: p.created_at
      })),
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to get projects' });
  }
});

// Get project by ID - ALL ROLES
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const projectId = parseInt(req.params.id);
    
    // Validate ID is a number
    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }
    
    const project = await db.prepare(`
      SELECT p.*, m.first_name || ' ' || m.last_name as manager_name
      FROM projects p LEFT JOIN people m ON p.manager_id = m.id WHERE p.id = ?
    `).get(projectId);

    if (!project) return res.status(404).json({ error: 'Project not found' });

    const skills = await db.prepare(`
      SELECT s.id, s.name, s.category, s.color, ps.required_proficiency, ps.is_mandatory, ps.people_needed, ps.hours_needed
      FROM skills s JOIN project_skills ps ON s.id = ps.skill_id WHERE ps.project_id = ?
      ORDER BY ps.is_mandatory DESC, s.name
    `).all(projectId);

    const stats = await db.prepare(`
      SELECT COUNT(*) as total_assignments, COUNT(DISTINCT person_id) as unique_people,
        SUM(end_hour - start_hour) as total_hours, COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count
      FROM assignments WHERE project_id = ?
    `).get(projectId);

    res.json({
      id: project.id, name: project.name, code: project.code, client: project.client,
      description: project.description, status: project.status, priority: project.priority,
      color: project.color, startDate: project.start_date, endDate: project.end_date,
      budgetHours: project.budget_hours, managerId: project.manager_id,
      managerName: project.manager_name, isBillable: !!project.is_billable,
      notes: project.notes, createdAt: project.created_at, updatedAt: project.updated_at,
      skills: skills.map(s => ({
        id: s.id, name: s.name, category: s.category, color: s.color,
        requiredProficiency: s.required_proficiency, isMandatory: !!s.is_mandatory, 
        peopleNeeded: s.people_needed || 1, hoursNeeded: s.hours_needed
      })),
      statistics: { totalAssignments: stats?.total_assignments || 0, uniquePeople: stats?.unique_people || 0, totalHours: stats?.total_hours || 0, completedCount: stats?.completed_count || 0 }
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to get project' });
  }
});

// Create project - ADMIN & SCHEDULER ONLY
router.post('/', authenticateToken, requireRole('admin', 'scheduler'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { name, code, client, description, status, priority, color, startDate, endDate, budgetHours, managerId, isBillable, notes, skills } = req.body;

    if (!name) return res.status(400).json({ error: 'Project name is required' });

    if (code) {
      const existing = await db.prepare('SELECT id FROM projects WHERE code = ?').get(code);
      if (existing) return res.status(400).json({ error: 'Project code already exists' });
    }

    const isPostgres = getDatabaseType() === 'postgres';
    let projectId;
    const isBillableValue = isBillable !== false ? 1 : 0;
    
    if (isPostgres) {
      const result = await db.prepare(`
        INSERT INTO projects (name, code, client, description, status, priority, color, start_date, end_date, budget_hours, manager_id, is_billable, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id
      `).get(name, code || null, client || null, description || null, status || 'planning', priority || 'medium', color || '#8b5cf6', startDate || null, endDate || null, budgetHours || null, managerId || null, isBillableValue, notes || null);
      projectId = result?.id;
    } else {
      const result = await db.prepare(`
        INSERT INTO projects (name, code, client, description, status, priority, color, start_date, end_date, budget_hours, manager_id, is_billable, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(name, code || null, client || null, description || null, status || 'planning', priority || 'medium', color || '#8b5cf6', startDate || null, endDate || null, budgetHours || null, managerId || null, isBillableValue, notes || null);
      projectId = result.lastInsertRowid;
    }

    if (skills && Array.isArray(skills)) {
      for (const skill of skills) {
        if (skill.skillId) {
          await db.prepare(`INSERT INTO project_skills (project_id, skill_id, required_proficiency, is_mandatory, people_needed, hours_needed) VALUES (?, ?, ?, ?, ?, ?)`)
            .run(projectId, skill.skillId, skill.requiredProficiency || 3, skill.isMandatory !== false ? 1 : 0, skill.peopleNeeded || 1, skill.hoursNeeded || null);
        }
      }
    }

    res.status(201).json({ id: projectId, message: 'Project created successfully' });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project - ADMIN & SCHEDULER ONLY
router.put('/:id', authenticateToken, requireRole('admin', 'scheduler'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    console.log('Update project request - ID:', req.params.id, 'Body:', JSON.stringify(req.body));
    
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) return res.status(400).json({ error: 'Invalid project ID' });
    
    const project = await db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const { name, code, client, description, status, priority, color, startDate, endDate, budgetHours, managerId, isBillable, notes } = req.body;

    const updates = [];
    const values = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (code !== undefined) { updates.push('code = ?'); values.push(code || null); }
    if (client !== undefined) { updates.push('client = ?'); values.push(client || null); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (status !== undefined) { updates.push('status = ?'); values.push(status); }
    if (priority !== undefined) { updates.push('priority = ?'); values.push(priority); }
    if (color !== undefined) { updates.push('color = ?'); values.push(color); }
    if (startDate !== undefined) { updates.push('start_date = ?'); values.push(startDate); }
    if (endDate !== undefined) { updates.push('end_date = ?'); values.push(endDate); }
    if (budgetHours !== undefined) { updates.push('budget_hours = ?'); values.push(budgetHours); }
    if (managerId !== undefined) { updates.push('manager_id = ?'); values.push(managerId); }
    if (notes !== undefined) { updates.push('notes = ?'); values.push(notes); }
    if (isBillable !== undefined) { updates.push('is_billable = ?'); values.push(isBillable ? 1 : 0); }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(projectId);

    await db.prepare(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    res.json({ message: 'Project updated successfully' });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project', details: error.message });
  }
});

// Delete project - ADMIN ONLY
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) return res.status(400).json({ error: 'Invalid project ID' });
    
    const project = await db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const dateNow = getDateNow();
    const activeAssignments = await db.prepare(`
      SELECT COUNT(*) as count FROM assignments WHERE project_id = ? AND date >= ${dateNow} AND status NOT IN ('completed', 'cancelled')
    `).get(projectId);

    if (activeAssignments?.count > 0) {
      return res.status(400).json({ error: 'Cannot delete project with active future assignments', assignmentCount: activeAssignments.count });
    }

    await db.prepare('DELETE FROM projects WHERE id = ?').run(projectId);
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Update project skills - ADMIN & SCHEDULER ONLY
router.put('/:id/skills', authenticateToken, requireRole('admin', 'scheduler'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) return res.status(400).json({ error: 'Invalid project ID' });
    
    const { skills } = req.body;

    const project = await db.prepare('SELECT id FROM projects WHERE id = ?').get(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    await db.prepare('DELETE FROM project_skills WHERE project_id = ?').run(projectId);

    if (skills && Array.isArray(skills)) {
      for (const skill of skills) {
        if (skill.skillId) {
          await db.prepare(`INSERT INTO project_skills (project_id, skill_id, required_proficiency, is_mandatory, people_needed, hours_needed) VALUES (?, ?, ?, ?, ?, ?)`)
            .run(projectId, skill.skillId, skill.requiredProficiency || 3, skill.isMandatory !== false ? 1 : 0, skill.peopleNeeded || 1, skill.hoursNeeded || null);
        }
      }
    }

    res.json({ message: 'Project skills updated successfully' });
  } catch (error) {
    console.error('Update project skills error:', error);
    res.status(500).json({ error: 'Failed to update project skills' });
  }
});

module.exports = router;
