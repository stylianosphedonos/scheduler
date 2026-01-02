const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * ASSIGNMENT/SCHEDULE MANAGEMENT
 * - Admin & Scheduler: Full CRUD access
 * - Viewer: Read-only access
 */

// Get assignments - ALL ROLES
router.get('/', authenticateToken, (req, res) => {
  try {
    const db = req.app.locals.db;
    const { startDate, endDate, personId, projectId, status, page = 1, limit = 100 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '1=1';
    const params = [];

    if (startDate) { whereClause += ' AND a.date >= ?'; params.push(startDate); }
    if (endDate) { whereClause += ' AND a.date <= ?'; params.push(endDate); }
    if (personId) { whereClause += ' AND a.person_id = ?'; params.push(personId); }
    if (projectId) { whereClause += ' AND a.project_id = ?'; params.push(projectId); }
    if (status) { whereClause += ' AND a.status = ?'; params.push(status); }

    const total = db.prepare(`SELECT COUNT(*) as count FROM assignments a WHERE ${whereClause}`).get(...params).count;
    const assignments = db.prepare(`
      SELECT a.*, pe.first_name || ' ' || pe.last_name as person_name, pe.department as person_department,
        pr.name as project_name, pr.code as project_code, pr.color as project_color, pr.client as project_client
      FROM assignments a JOIN people pe ON a.person_id = pe.id JOIN projects pr ON a.project_id = pr.id
      WHERE ${whereClause} ORDER BY a.date, a.start_hour, pe.last_name LIMIT ? OFFSET ?
    `).all(...params, parseInt(limit), offset);

    res.json({
      data: assignments.map(a => ({
        id: a.id, personId: a.person_id, personName: a.person_name, personDepartment: a.person_department,
        projectId: a.project_id, projectName: a.project_name, projectCode: a.project_code,
        projectColor: a.project_color, projectClient: a.project_client, date: a.date,
        startHour: a.start_hour, endHour: a.end_hour, duration: a.end_hour - a.start_hour,
        status: a.status, taskDescription: a.task_description, location: a.location,
        isRemote: a.is_remote === 1, notes: a.notes, createdAt: a.created_at
      })),
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ error: 'Failed to get assignments' });
  }
});

// Get daily schedule - ALL ROLES
router.get('/daily/:date', authenticateToken, (req, res) => {
  try {
    const db = req.app.locals.db;
    const { date } = req.params;
    const { department, projectId } = req.query;

    let whereClause = 'a.date = ?';
    const params = [date];

    if (department) { whereClause += ' AND pe.department = ?'; params.push(department); }
    if (projectId) { whereClause += ' AND a.project_id = ?'; params.push(projectId); }

    const assignments = db.prepare(`
      SELECT a.*, pe.first_name, pe.last_name, pe.department, pe.avatar_url,
        pe.max_hours_per_day, pe.max_projects_per_day, pr.name as project_name, pr.code as project_code, pr.color as project_color
      FROM assignments a JOIN people pe ON a.person_id = pe.id JOIN projects pr ON a.project_id = pr.id
      WHERE ${whereClause} ORDER BY pe.last_name, pe.first_name, a.start_hour
    `).all(...params);

    const peopleMap = new Map();

    for (const a of assignments) {
      if (!peopleMap.has(a.person_id)) {
        peopleMap.set(a.person_id, {
          personId: a.person_id, firstName: a.first_name, lastName: a.last_name,
          department: a.department, avatarUrl: a.avatar_url, maxHoursPerDay: a.max_hours_per_day,
          maxProjectsPerDay: a.max_projects_per_day, assignments: [], totalHours: 0, projectCount: new Set()
        });
      }
      const person = peopleMap.get(a.person_id);
      person.assignments.push({
        id: a.id, projectId: a.project_id, projectName: a.project_name, projectCode: a.project_code,
        projectColor: a.project_color, startHour: a.start_hour, endHour: a.end_hour, status: a.status,
        taskDescription: a.task_description, isRemote: a.is_remote === 1
      });
      person.totalHours += (a.end_hour - a.start_hour);
      person.projectCount.add(a.project_id);
    }

    const schedule = Array.from(peopleMap.values()).map(p => ({
      ...p, projectCount: p.projectCount.size,
      warnings: { overHours: p.totalHours > p.maxHoursPerDay, overProjects: p.projectCount.size > p.maxProjectsPerDay }
    }));

    const conflicts = db.prepare('SELECT * FROM schedule_conflicts WHERE date = ? AND is_resolved = 0').all(date);

    res.json({
      date, schedule,
      summary: { totalPeople: schedule.length, totalAssignments: assignments.length, totalHours: assignments.reduce((sum, a) => sum + (a.end_hour - a.start_hour), 0), conflictCount: conflicts.length },
      conflicts
    });
  } catch (error) {
    console.error('Get daily schedule error:', error);
    res.status(500).json({ error: 'Failed to get daily schedule' });
  }
});

// Get weekly schedule - ALL ROLES
router.get('/weekly/:startDate', authenticateToken, (req, res) => {
  try {
    const db = req.app.locals.db;
    const { startDate } = req.params;
    const { department, personId } = req.query;

    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const endDate = end.toISOString().split('T')[0];

    let whereClause = 'a.date >= ? AND a.date <= ?';
    const params = [startDate, endDate];

    if (department) { whereClause += ' AND pe.department = ?'; params.push(department); }
    if (personId) { whereClause += ' AND a.person_id = ?'; params.push(personId); }

    const assignments = db.prepare(`
      SELECT a.*, pe.first_name, pe.last_name, pe.department, pr.name as project_name, pr.color as project_color
      FROM assignments a JOIN people pe ON a.person_id = pe.id JOIN projects pr ON a.project_id = pr.id
      WHERE ${whereClause} ORDER BY a.date, pe.last_name, a.start_hour
    `).all(...params);

    const days = {};
    for (let d = new Date(startDate); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      days[dateStr] = { date: dateStr, dayName: d.toLocaleDateString('en-US', { weekday: 'long' }), assignments: [], totalHours: 0 };
    }

    for (const a of assignments) {
      if (days[a.date]) {
        days[a.date].assignments.push({
          id: a.id, personId: a.person_id, personName: `${a.first_name} ${a.last_name}`,
          projectName: a.project_name, projectColor: a.project_color, startHour: a.start_hour, endHour: a.end_hour, status: a.status
        });
        days[a.date].totalHours += (a.end_hour - a.start_hour);
      }
    }

    res.json({ startDate, endDate, days: Object.values(days), summary: { totalAssignments: assignments.length, totalHours: Object.values(days).reduce((sum, d) => sum + d.totalHours, 0) } });
  } catch (error) {
    console.error('Get weekly schedule error:', error);
    res.status(500).json({ error: 'Failed to get weekly schedule' });
  }
});

// Create assignment - ADMIN & SCHEDULER ONLY
router.post('/', authenticateToken, requireRole('admin', 'scheduler'), (req, res) => {
  try {
    const db = req.app.locals.db;
    const { personId, projectId, date, startHour, endHour, status, taskDescription, location, isRemote, notes } = req.body;

    if (!personId || !projectId || !date || startHour === undefined || endHour === undefined) {
      return res.status(400).json({ error: 'Person, project, date, start hour, and end hour are required' });
    }
    if (startHour >= endHour) return res.status(400).json({ error: 'End hour must be after start hour' });

    const person = db.prepare('SELECT * FROM people WHERE id = ?').get(personId);
    if (!person) return res.status(404).json({ error: 'Person not found' });

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Check for overlapping assignments
    const overlaps = db.prepare(`
      SELECT * FROM assignments WHERE person_id = ? AND date = ?
      AND ((start_hour < ? AND end_hour > ?) OR (start_hour < ? AND end_hour > ?) OR (start_hour >= ? AND end_hour <= ?))
      AND status != 'cancelled'
    `).all(personId, date, endHour, startHour, endHour, startHour, startHour, endHour);

    if (overlaps.length > 0) {
      return res.status(400).json({ error: 'Time slot overlaps with existing assignment', conflictingAssignments: overlaps });
    }

    const result = db.prepare(`
      INSERT INTO assignments (person_id, project_id, date, start_hour, end_hour, status, task_description, location, is_remote, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(personId, projectId, date, startHour, endHour, status || 'scheduled', taskDescription || null, location || null, isRemote ? 1 : 0, notes || null, req.user.id);

    res.status(201).json({ id: result.lastInsertRowid, message: 'Assignment created successfully' });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

// Update assignment - ADMIN & SCHEDULER ONLY
router.put('/:id', authenticateToken, requireRole('admin', 'scheduler'), (req, res) => {
  try {
    const db = req.app.locals.db;
    const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    const { personId, projectId, date, startHour, endHour, status, taskDescription, location, isRemote, notes } = req.body;

    const updates = [];
    const values = [];

    if (personId !== undefined) { updates.push('person_id = ?'); values.push(personId); }
    if (projectId !== undefined) { updates.push('project_id = ?'); values.push(projectId); }
    if (date !== undefined) { updates.push('date = ?'); values.push(date); }
    if (startHour !== undefined) { updates.push('start_hour = ?'); values.push(startHour); }
    if (endHour !== undefined) { updates.push('end_hour = ?'); values.push(endHour); }
    if (status !== undefined) { updates.push('status = ?'); values.push(status); }
    if (taskDescription !== undefined) { updates.push('task_description = ?'); values.push(taskDescription); }
    if (location !== undefined) { updates.push('location = ?'); values.push(location); }
    if (isRemote !== undefined) { updates.push('is_remote = ?'); values.push(isRemote ? 1 : 0); }
    if (notes !== undefined) { updates.push('notes = ?'); values.push(notes); }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.params.id);

    db.prepare(`UPDATE assignments SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    res.json({ message: 'Assignment updated successfully' });
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({ error: 'Failed to update assignment' });
  }
});

// Delete assignment - ADMIN & SCHEDULER ONLY
router.delete('/:id', authenticateToken, requireRole('admin', 'scheduler'), (req, res) => {
  try {
    const db = req.app.locals.db;
    const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    db.prepare('DELETE FROM assignments WHERE id = ?').run(req.params.id);
    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

// Bulk create - ADMIN & SCHEDULER ONLY
router.post('/bulk', authenticateToken, requireRole('admin', 'scheduler'), (req, res) => {
  try {
    const db = req.app.locals.db;
    const { assignments } = req.body;

    if (!Array.isArray(assignments) || assignments.length === 0) {
      return res.status(400).json({ error: 'Assignments array is required' });
    }

    const results = { created: 0, skipped: 0, errors: [] };

    for (const a of assignments) {
      try {
        if (!a.personId || !a.projectId || !a.date || a.startHour === undefined || a.endHour === undefined) {
          results.errors.push({ assignment: a, error: 'Missing required fields' });
          results.skipped++;
          continue;
        }

        db.prepare(`
          INSERT INTO assignments (person_id, project_id, date, start_hour, end_hour, status, task_description, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(a.personId, a.projectId, a.date, a.startHour, a.endHour, a.status || 'scheduled', a.taskDescription || null, req.user.id);
        results.created++;
      } catch (err) {
        results.errors.push({ assignment: a, error: err.message });
        results.skipped++;
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Bulk create error:', error);
    res.status(500).json({ error: 'Bulk create failed' });
  }
});

module.exports = router;
