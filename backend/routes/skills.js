const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * SKILLS MANAGEMENT
 * - Admin & Scheduler: Full CRUD access
 * - Viewer: Read-only access
 */

// Get all skills - ALL ROLES
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { page = 1, limit = 100, category, search, active } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '1=1';
    const params = [];

    if (category) { whereClause += ' AND category = ?'; params.push(category); }
    if (active !== undefined) { whereClause += ' AND is_active = ?'; params.push(active === 'true'); }
    if (search) {
      whereClause += ' AND (name LIKE ? OR category LIKE ? OR description LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    const totalResult = await db.prepare(`SELECT COUNT(*) as count FROM skills WHERE ${whereClause}`).get(...params);
    const total = totalResult?.count || 0;
    const skills = await db.prepare(`
      SELECT s.*, 
        (SELECT COUNT(*) FROM person_skills WHERE skill_id = s.id) as person_count,
        (SELECT COUNT(*) FROM project_skills WHERE skill_id = s.id) as project_count
      FROM skills s WHERE ${whereClause} ORDER BY s.category, s.name LIMIT ? OFFSET ?
    `).all(...params, parseInt(limit), offset);

    res.json({
      data: skills.map(s => ({
        id: s.id, name: s.name, category: s.category, description: s.description,
        color: s.color, isActive: !!s.is_active, personCount: s.person_count,
        projectCount: s.project_count, createdAt: s.created_at
      })),
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({ error: 'Failed to get skills' });
  }
});

// Get skill by ID - ALL ROLES
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const skill = await db.prepare('SELECT * FROM skills WHERE id = ?').get(req.params.id);
    if (!skill) return res.status(404).json({ error: 'Skill not found' });

    const people = await db.prepare(`
      SELECT p.id, p.first_name, p.last_name, p.department, ps.proficiency_level, ps.years_experience, ps.certified
      FROM people p JOIN person_skills ps ON p.id = ps.person_id WHERE ps.skill_id = ? AND p.is_active = true
      ORDER BY ps.proficiency_level DESC, p.last_name
    `).all(req.params.id);

    const projects = await db.prepare(`
      SELECT pr.id, pr.name, pr.code, pr.status, ps.required_proficiency, ps.is_mandatory
      FROM projects pr JOIN project_skills ps ON pr.id = ps.project_id WHERE ps.skill_id = ?
      ORDER BY ps.is_mandatory DESC, pr.name
    `).all(req.params.id);

    res.json({
      id: skill.id, name: skill.name, category: skill.category, description: skill.description,
      color: skill.color, isActive: !!skill.is_active, createdAt: skill.created_at, updatedAt: skill.updated_at,
      people: people.map(p => ({
        id: p.id, firstName: p.first_name, lastName: p.last_name, department: p.department,
        proficiencyLevel: p.proficiency_level, yearsExperience: p.years_experience, certified: !!p.certified
      })),
      projects: projects.map(pr => ({
        id: pr.id, name: pr.name, code: pr.code, status: pr.status,
        requiredProficiency: pr.required_proficiency, isMandatory: !!pr.is_mandatory
      }))
    });
  } catch (error) {
    console.error('Get skill error:', error);
    res.status(500).json({ error: 'Failed to get skill' });
  }
});

// Create skill - ADMIN & SCHEDULER ONLY
router.post('/', authenticateToken, requireRole('admin', 'scheduler'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { name, category, description, color } = req.body;

    if (!name) return res.status(400).json({ error: 'Skill name is required' });

    const existing = await db.prepare('SELECT id FROM skills WHERE name = ?').get(name);
    if (existing) return res.status(400).json({ error: 'Skill name already exists' });

    const result = await db.prepare(`
      INSERT INTO skills (name, category, description, color)
      VALUES (?, ?, ?, ?)
    `).run(name, category || null, description || null, color || '#6366f1');

    res.status(201).json({ id: result.lastInsertRowid, message: 'Skill created successfully' });
  } catch (error) {
    console.error('Create skill error:', error);
    res.status(500).json({ error: 'Failed to create skill' });
  }
});

// Update skill - ADMIN & SCHEDULER ONLY
router.put('/:id', authenticateToken, requireRole('admin', 'scheduler'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const skill = await db.prepare('SELECT * FROM skills WHERE id = ?').get(req.params.id);
    if (!skill) return res.status(404).json({ error: 'Skill not found' });

    const { name, category, description, color, isActive } = req.body;

    const updates = [];
    const values = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (category !== undefined) { updates.push('category = ?'); values.push(category); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (color !== undefined) { updates.push('color = ?'); values.push(color); }
    if (isActive !== undefined) { updates.push('is_active = ?'); values.push(!!isActive); }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.params.id);

    await db.prepare(`UPDATE skills SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    res.json({ message: 'Skill updated successfully' });
  } catch (error) {
    console.error('Update skill error:', error);
    res.status(500).json({ error: 'Failed to update skill' });
  }
});

// Delete skill - ADMIN ONLY
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const skill = await db.prepare('SELECT * FROM skills WHERE id = ?').get(req.params.id);
    if (!skill) return res.status(404).json({ error: 'Skill not found' });

    const usedByPeople = await db.prepare('SELECT COUNT(*) as count FROM person_skills WHERE skill_id = ?').get(req.params.id);
    const usedByProjects = await db.prepare('SELECT COUNT(*) as count FROM project_skills WHERE skill_id = ?').get(req.params.id);

    if (usedByPeople.count > 0 || usedByProjects.count > 0) {
      return res.status(400).json({
        error: 'Cannot delete skill that is in use',
        usedByPeople: usedByPeople.count,
        usedByProjects: usedByProjects.count
      });
    }

    await db.prepare('DELETE FROM skills WHERE id = ?').run(req.params.id);
    res.json({ message: 'Skill deleted successfully' });
  } catch (error) {
    console.error('Delete skill error:', error);
    res.status(500).json({ error: 'Failed to delete skill' });
  }
});

// Get categories list - ALL ROLES
router.get('/meta/categories', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const categories = await db.prepare('SELECT DISTINCT category FROM skills WHERE category IS NOT NULL ORDER BY category').all();
    res.json(categories.map(c => c.category));
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

module.exports = router;
