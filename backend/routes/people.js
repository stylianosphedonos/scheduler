const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { getDatabaseType } = require('../database');

const router = express.Router();

// Helper for database-agnostic string aggregation
const getStringAgg = () => {
  return getDatabaseType() === 'postgres' ? 'STRING_AGG' : 'GROUP_CONCAT';
};

// Helper for database-agnostic date functions
const getDateNow = () => {
  return getDatabaseType() === 'postgres' ? 'CURRENT_DATE' : "date('now')";
};

const getDateOffset = (days) => {
  if (getDatabaseType() === 'postgres') {
    return `CURRENT_DATE - INTERVAL '${Math.abs(days)} days'`;
  }
  return `date('now', '${days} days')`;
};

/**
 * PEOPLE MANAGEMENT
 * - Admin & Scheduler: Full CRUD access
 * - Viewer: Read-only access
 */

// Get all people - ALL ROLES
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { page = 1, limit = 50, department, search, active, hasSkill } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '1=1';
    const params = [];

    if (department) { whereClause += ' AND department = ?'; params.push(department); }
    if (active !== undefined) { whereClause += ' AND is_active = ?'; params.push(active === 'true'); }
    if (search) {
      whereClause += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR employee_id LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }
    if (hasSkill) { whereClause += ' AND id IN (SELECT person_id FROM person_skills WHERE skill_id = ?)'; params.push(hasSkill); }

    const totalResult = await db.prepare(`SELECT COUNT(*) as count FROM people WHERE ${whereClause}`).get(...params);
    const total = totalResult?.count || 0;
    
    const stringAgg = getStringAgg();
    const people = await db.prepare(`
      SELECT p.*, (SELECT ${stringAgg}(s.name, ', ') FROM skills s JOIN person_skills ps ON s.id = ps.skill_id WHERE ps.person_id = p.id) as skills_list
      FROM people p WHERE ${whereClause} ORDER BY p.last_name, p.first_name LIMIT ? OFFSET ?
    `).all(...params, parseInt(limit), offset);

    res.json({
      data: people.map(p => ({
        id: p.id, employeeId: p.employee_id, firstName: p.first_name, lastName: p.last_name,
        email: p.email, phone: p.phone, department: p.department, jobTitle: p.job_title,
        avatarUrl: p.avatar_url, maxHoursPerDay: p.max_hours_per_day, maxProjectsPerDay: p.max_projects_per_day,
        hourlyRate: p.hourly_rate, employmentType: p.employment_type, startDate: p.start_date,
        isActive: !!p.is_active, skills: p.skills_list ? p.skills_list.split(', ') : [], createdAt: p.created_at
      })),
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Get people error:', error);
    res.status(500).json({ error: 'Failed to get people' });
  }
});

// Get person by ID - ALL ROLES
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const person = await db.prepare('SELECT * FROM people WHERE id = ?').get(req.params.id);
    if (!person) return res.status(404).json({ error: 'Person not found' });

    const skills = await db.prepare(`
      SELECT s.id, s.name, s.category, s.color, ps.proficiency_level, ps.years_experience, ps.certified
      FROM skills s JOIN person_skills ps ON s.id = ps.skill_id WHERE ps.person_id = ?
      ORDER BY ps.proficiency_level DESC, s.name
    `).all(req.params.id);

    const dateOffset = getDateOffset(-7);
    const dateNow = getDateNow();
    
    const assignments = await db.prepare(`
      SELECT a.*, p.name as project_name, p.color as project_color
      FROM assignments a JOIN projects p ON a.project_id = p.id
      WHERE a.person_id = ? AND a.date >= ${dateOffset}
      ORDER BY a.date DESC, a.start_hour LIMIT 20
    `).all(req.params.id);

    const availability = await db.prepare(`SELECT * FROM availability_windows WHERE person_id = ? AND end_date >= ${dateNow} ORDER BY start_date`).all(req.params.id);

    res.json({
      id: person.id, employeeId: person.employee_id, firstName: person.first_name, lastName: person.last_name,
      email: person.email, phone: person.phone, department: person.department, jobTitle: person.job_title,
      avatarUrl: person.avatar_url, maxHoursPerDay: person.max_hours_per_day, maxProjectsPerDay: person.max_projects_per_day,
      hourlyRate: person.hourly_rate, employmentType: person.employment_type, startDate: person.start_date,
      isActive: !!person.is_active, notes: person.notes, createdAt: person.created_at, updatedAt: person.updated_at,
      skills: skills.map(s => ({ id: s.id, name: s.name, category: s.category, color: s.color, proficiencyLevel: s.proficiency_level, yearsExperience: s.years_experience, certified: !!s.certified })),
      recentAssignments: assignments, availability
    });
  } catch (error) {
    console.error('Get person error:', error);
    res.status(500).json({ error: 'Failed to get person' });
  }
});

// Create person - ADMIN & SCHEDULER ONLY
router.post('/', authenticateToken, requireRole('admin', 'scheduler'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { employeeId, firstName, lastName, email, phone, department, jobTitle, maxHoursPerDay, maxProjectsPerDay, workStartHour, workEndHour, hasTransportation, hourlyRate, employmentType, startDate, notes, skills } = req.body;

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: 'First name, last name, and email are required' });
    }

    const existing = await db.prepare('SELECT id FROM people WHERE email = ?').get(email);
    if (existing) return res.status(400).json({ error: 'Email already exists' });

    const isPostgres = getDatabaseType() === 'postgres';
    let personId;
    const transportationValue = hasTransportation ? 1 : 0;
    
    if (isPostgres) {
      const result = await db.prepare(`
        INSERT INTO people (employee_id, first_name, last_name, email, phone, department, job_title, max_hours_per_day, max_projects_per_day, work_start_hour, work_end_hour, has_transportation, hourly_rate, employment_type, start_date, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id
      `).get(employeeId || null, firstName, lastName, email, phone || null, department || null, jobTitle || null, maxHoursPerDay || 8, maxProjectsPerDay || 3, workStartHour || 9, workEndHour || 17, transportationValue, hourlyRate || null, employmentType || 'full-time', startDate || null, notes || null);
      personId = result?.id;
    } else {
      const result = await db.prepare(`
        INSERT INTO people (employee_id, first_name, last_name, email, phone, department, job_title, max_hours_per_day, max_projects_per_day, work_start_hour, work_end_hour, has_transportation, hourly_rate, employment_type, start_date, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(employeeId || null, firstName, lastName, email, phone || null, department || null, jobTitle || null, maxHoursPerDay || 8, maxProjectsPerDay || 3, workStartHour || 9, workEndHour || 17, transportationValue, hourlyRate || null, employmentType || 'full-time', startDate || null, notes || null);
      personId = result.lastInsertRowid;
    }

    if (skills && Array.isArray(skills)) {
      for (const skill of skills) {
        if (skill.skillId) {
          await db.prepare(`INSERT INTO person_skills (person_id, skill_id, proficiency_level, years_experience, certified) VALUES (?, ?, ?, ?, ?)`)
            .run(personId, skill.skillId, skill.proficiencyLevel || 3, skill.yearsExperience || null, skill.certified ? 1 : 0);
        }
      }
    }

    res.status(201).json({ id: personId, message: 'Person created successfully' });
  } catch (error) {
    console.error('Create person error:', error);
    res.status(500).json({ error: 'Failed to create person' });
  }
});

// Update person - ADMIN & SCHEDULER ONLY
router.put('/:id', authenticateToken, requireRole('admin', 'scheduler'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const person = await db.prepare('SELECT * FROM people WHERE id = ?').get(req.params.id);
    if (!person) return res.status(404).json({ error: 'Person not found' });

    const { employeeId, firstName, lastName, email, phone, department, jobTitle, maxHoursPerDay, maxProjectsPerDay, workStartHour, workEndHour, hasTransportation, hourlyRate, employmentType, startDate, isActive, notes } = req.body;

    const updates = [];
    const values = [];

    if (employeeId !== undefined) { updates.push('employee_id = ?'); values.push(employeeId); }
    if (firstName !== undefined) { updates.push('first_name = ?'); values.push(firstName); }
    if (lastName !== undefined) { updates.push('last_name = ?'); values.push(lastName); }
    if (email !== undefined) { updates.push('email = ?'); values.push(email); }
    if (phone !== undefined) { updates.push('phone = ?'); values.push(phone); }
    if (department !== undefined) { updates.push('department = ?'); values.push(department); }
    if (jobTitle !== undefined) { updates.push('job_title = ?'); values.push(jobTitle); }
    if (maxHoursPerDay !== undefined) { updates.push('max_hours_per_day = ?'); values.push(maxHoursPerDay); }
    if (maxProjectsPerDay !== undefined) { updates.push('max_projects_per_day = ?'); values.push(maxProjectsPerDay); }
    if (workStartHour !== undefined) { updates.push('work_start_hour = ?'); values.push(workStartHour); }
    if (workEndHour !== undefined) { updates.push('work_end_hour = ?'); values.push(workEndHour); }
    if (hasTransportation !== undefined) { updates.push('has_transportation = ?'); values.push(hasTransportation ? 1 : 0); }
    if (hourlyRate !== undefined) { updates.push('hourly_rate = ?'); values.push(hourlyRate); }
    if (employmentType !== undefined) { updates.push('employment_type = ?'); values.push(employmentType); }
    if (startDate !== undefined) { updates.push('start_date = ?'); values.push(startDate); }
    if (notes !== undefined) { updates.push('notes = ?'); values.push(notes); }
    if (isActive !== undefined) { updates.push('is_active = ?'); values.push(isActive ? 1 : 0); }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.params.id);

    await db.prepare(`UPDATE people SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    res.json({ message: 'Person updated successfully' });
  } catch (error) {
    console.error('Update person error:', error);
    res.status(500).json({ error: 'Failed to update person' });
  }
});

// Delete person - ADMIN ONLY
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const person = await db.prepare('SELECT * FROM people WHERE id = ?').get(req.params.id);
    if (!person) return res.status(404).json({ error: 'Person not found' });

    const dateNowDel = getDateNow();
    const activeAssignments = await db.prepare(`SELECT COUNT(*) as count FROM assignments WHERE person_id = ? AND date >= ${dateNowDel} AND status NOT IN ('completed', 'cancelled')`).get(req.params.id);
    if (activeAssignments?.count > 0) {
      return res.status(400).json({ error: 'Cannot delete person with active future assignments', assignmentCount: activeAssignments.count });
    }

    await db.prepare('DELETE FROM people WHERE id = ?').run(req.params.id);
    res.json({ message: 'Person deleted successfully' });
  } catch (error) {
    console.error('Delete person error:', error);
    res.status(500).json({ error: 'Failed to delete person' });
  }
});

// Update person skills - ADMIN & SCHEDULER ONLY
router.put('/:id/skills', authenticateToken, requireRole('admin', 'scheduler'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { skills } = req.body;

    const person = await db.prepare('SELECT id FROM people WHERE id = ?').get(req.params.id);
    if (!person) return res.status(404).json({ error: 'Person not found' });

    await db.prepare('DELETE FROM person_skills WHERE person_id = ?').run(req.params.id);

    if (skills && Array.isArray(skills)) {
      for (const skill of skills) {
        if (skill.skillId) {
          await db.prepare(`INSERT INTO person_skills (person_id, skill_id, proficiency_level, years_experience, certified) VALUES (?, ?, ?, ?, ?)`)
            .run(req.params.id, skill.skillId, skill.proficiencyLevel || 3, skill.yearsExperience || null, skill.certified ? 1 : 0);
        }
      }
    }

    res.json({ message: 'Skills updated successfully' });
  } catch (error) {
    console.error('Update skills error:', error);
    res.status(500).json({ error: 'Failed to update skills' });
  }
});

// Get departments list - ALL ROLES
router.get('/meta/departments', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const departments = await db.prepare('SELECT DISTINCT department FROM people WHERE department IS NOT NULL ORDER BY department').all();
    res.json(departments.map(d => d.department));
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ error: 'Failed to get departments' });
  }
});

// Bulk import - ADMIN ONLY
router.post('/bulk-import', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { people } = req.body;

    if (!Array.isArray(people) || people.length === 0) {
      return res.status(400).json({ error: 'People array is required' });
    }

    const results = { created: 0, skipped: 0, errors: [] };

    for (const person of people) {
      try {
        if (!person.firstName || !person.lastName || !person.email) {
          results.errors.push({ email: person.email, error: 'Missing required fields' });
          results.skipped++;
          continue;
        }

        const existing = await db.prepare('SELECT id FROM people WHERE email = ?').get(person.email);
        if (existing) {
          results.errors.push({ email: person.email, error: 'Email already exists' });
          results.skipped++;
          continue;
        }

        await db.prepare(`INSERT INTO people (employee_id, first_name, last_name, email, phone, department, job_title, employment_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
          .run(person.employeeId || null, person.firstName, person.lastName, person.email, person.phone || null, person.department || null, person.jobTitle || null, person.employmentType || 'full-time');
        results.created++;
      } catch (err) {
        results.errors.push({ email: person.email, error: err.message });
        results.skipped++;
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({ error: 'Bulk import failed' });
  }
});

module.exports = router;
