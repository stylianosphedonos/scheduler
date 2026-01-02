const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * CONFLICT MANAGEMENT
 * - Admin & Scheduler: Can detect and resolve conflicts
 * - Viewer: Can only view conflicts
 */

// Get all conflicts - ALL ROLES
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { type, severity, resolved, startDate, endDate, personId, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '1=1';
    const params = [];

    if (type) { whereClause += ' AND type = ?'; params.push(type); }
    if (severity) { whereClause += ' AND severity = ?'; params.push(severity); }
    if (resolved !== undefined) { whereClause += ' AND is_resolved = ?'; params.push(resolved === 'true' ? 1 : 0); }
    if (startDate) { whereClause += ' AND date >= ?'; params.push(startDate); }
    if (endDate) { whereClause += ' AND date <= ?'; params.push(endDate); }
    if (personId) { whereClause += ' AND person_id = ?'; params.push(personId); }

    const total = await db.prepare(`SELECT COUNT(*) as count FROM schedule_conflicts WHERE ${whereClause}`).get(...params).count;
    const conflicts = await db.prepare(`
      SELECT c.*, p.first_name || ' ' || p.last_name as person_name, pr.name as project_name,
        u.username as resolved_by_name
      FROM schedule_conflicts c
      LEFT JOIN people p ON c.person_id = p.id
      LEFT JOIN projects pr ON c.project_id = pr.id
      LEFT JOIN users u ON c.resolved_by = u.id
      WHERE ${whereClause}
      ORDER BY CASE c.severity WHEN 'critical' THEN 1 WHEN 'error' THEN 2 WHEN 'warning' THEN 3 ELSE 4 END, c.date DESC
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(limit), offset);

    res.json({
      data: conflicts.map(c => ({
        id: c.id, type: c.type, severity: c.severity, date: c.date,
        personId: c.person_id, personName: c.person_name,
        projectId: c.project_id, projectName: c.project_name,
        assignmentId: c.assignment_id, description: c.description,
        suggestedResolution: c.suggested_resolution, isResolved: c.is_resolved === 1,
        resolvedByName: c.resolved_by_name, resolvedAt: c.resolved_at,
        resolutionNotes: c.resolution_notes, createdAt: c.created_at
      })),
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Get conflicts error:', error);
    res.status(500).json({ error: 'Failed to get conflicts' });
  }
});

// Detect conflicts for a date range - ADMIN & SCHEDULER ONLY
router.post('/detect', authenticateToken, requireRole('admin', 'scheduler'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start and end dates are required' });
    }

    const newConflicts = [];

    // Get all assignments in the date range
    const assignments = await db.prepare(`
      SELECT a.*, p.first_name || ' ' || p.last_name as person_name,
        p.max_hours_per_day, p.max_projects_per_day, pr.name as project_name
      FROM assignments a
      JOIN people p ON a.person_id = p.id
      JOIN projects pr ON a.project_id = pr.id
      WHERE a.date >= ? AND a.date <= ? AND a.status NOT IN ('cancelled', 'completed')
      ORDER BY a.person_id, a.date, a.start_hour
    `).all(startDate, endDate);

    // Group by person and date
    const personDateMap = new Map();
    for (const a of assignments) {
      const key = `${a.person_id}-${a.date}`;
      if (!personDateMap.has(key)) {
        personDateMap.set(key, {
          personId: a.person_id,
          personName: a.person_name,
          date: a.date,
          maxHours: a.max_hours_per_day,
          maxProjects: a.max_projects_per_day,
          assignments: []
        });
      }
      personDateMap.get(key).assignments.push(a);
    }

    // Check for conflicts
    for (const [key, data] of personDateMap) {
      const { personId, personName, date, maxHours, maxProjects, assignments: personAssignments } = data;

      // Check for overlaps
      for (let i = 0; i < personAssignments.length; i++) {
        for (let j = i + 1; j < personAssignments.length; j++) {
          const a1 = personAssignments[i];
          const a2 = personAssignments[j];

          if (a1.start_hour < a2.end_hour && a2.start_hour < a1.end_hour) {
            newConflicts.push({
              type: 'overlap',
              severity: 'error',
              date,
              personId,
              assignmentId: a1.id,
              projectId: a1.project_id,
              description: `${personName} has overlapping assignments: ${a1.project_name} (${a1.start_hour}:00-${a1.end_hour}:00) and ${a2.project_name} (${a2.start_hour}:00-${a2.end_hour}:00)`,
              suggestedResolution: 'Reschedule one of the assignments to a different time slot'
            });
          }
        }
      }

      // Check for overallocation (hours)
      const totalHours = personAssignments.reduce((sum, a) => sum + (a.end_hour - a.start_hour), 0);
      if (totalHours > maxHours) {
        newConflicts.push({
          type: 'max_hours',
          severity: 'warning',
          date,
          personId,
          description: `${personName} is scheduled for ${totalHours} hours, exceeding max of ${maxHours} hours`,
          suggestedResolution: 'Reduce scheduled hours or reassign some work'
        });
      }

      // Check for max projects
      const uniqueProjects = new Set(personAssignments.map(a => a.project_id));
      if (uniqueProjects.size > maxProjects) {
        newConflicts.push({
          type: 'max_projects',
          severity: 'warning',
          date,
          personId,
          description: `${personName} is assigned to ${uniqueProjects.size} projects, exceeding max of ${maxProjects}`,
          suggestedResolution: 'Consolidate work on fewer projects'
        });
      }
    }

    // Check availability conflicts
    const availabilityConflicts = await db.prepare(`
      SELECT a.*, p.first_name || ' ' || p.last_name as person_name, pr.name as project_name,
        aw.type as unavailable_type, aw.reason as unavailable_reason
      FROM assignments a
      JOIN people p ON a.person_id = p.id
      JOIN projects pr ON a.project_id = pr.id
      JOIN availability_windows aw ON a.person_id = aw.person_id
        AND a.date >= aw.start_date AND a.date <= aw.end_date
        AND aw.status = 'approved'
      WHERE a.date >= ? AND a.date <= ? AND a.status NOT IN ('cancelled', 'completed')
    `).all(startDate, endDate);

    for (const c of availabilityConflicts) {
      newConflicts.push({
        type: 'availability',
        severity: 'error',
        date: c.date,
        personId: c.person_id,
        assignmentId: c.id,
        projectId: c.project_id,
        description: `${c.person_name} is scheduled on ${c.project_name} but marked as unavailable (${c.unavailable_type}: ${c.unavailable_reason || 'N/A'})`,
        suggestedResolution: 'Reassign to available team member or reschedule'
      });
    }

    // Insert new conflicts (avoiding duplicates)
    let insertedCount = 0;
    for (const conflict of newConflicts) {
      // Check for existing similar conflict
      const existing = await db.prepare(`
        SELECT id FROM schedule_conflicts 
        WHERE type = ? AND date = ? AND person_id = ? AND is_resolved = false
        AND (assignment_id = ? OR (assignment_id IS NULL AND ? IS NULL))
      `).get(conflict.type, conflict.date, conflict.personId, conflict.assignmentId || null, conflict.assignmentId || null);

      if (!existing) {
        await db.prepare(`
          INSERT INTO schedule_conflicts (type, severity, date, person_id, assignment_id, project_id, description, suggested_resolution)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          conflict.type, conflict.severity, conflict.date, conflict.personId,
          conflict.assignmentId || null, conflict.projectId || null,
          conflict.description, conflict.suggestedResolution
        );
        insertedCount++;
      }
    }

    res.json({
      message: 'Conflict detection completed',
      detected: newConflicts.length,
      inserted: insertedCount,
      dateRange: { startDate, endDate }
    });
  } catch (error) {
    console.error('Detect conflicts error:', error);
    res.status(500).json({ error: 'Failed to detect conflicts' });
  }
});

// Resolve a conflict - ADMIN & SCHEDULER ONLY
router.post('/:id/resolve', authenticateToken, requireRole('admin', 'scheduler'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { resolutionNotes } = req.body;

    const conflict = await db.prepare('SELECT * FROM schedule_conflicts WHERE id = ?').get(req.params.id);
    if (!conflict) return res.status(404).json({ error: 'Conflict not found' });

    if (conflict.is_resolved) {
      return res.status(400).json({ error: 'Conflict is already resolved' });
    }

    await db.prepare(`
      UPDATE schedule_conflicts 
      SET is_resolved = true, resolved_by = ?, resolved_at = CURRENT_TIMESTAMP, resolution_notes = ?
      WHERE id = ?
    `).run(req.user.id, resolutionNotes || null, req.params.id);

    res.json({ message: 'Conflict resolved successfully' });
  } catch (error) {
    console.error('Resolve conflict error:', error);
    res.status(500).json({ error: 'Failed to resolve conflict' });
  }
});

// Bulk resolve conflicts - ADMIN & SCHEDULER ONLY
router.post('/bulk-resolve', authenticateToken, requireRole('admin', 'scheduler'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { conflictIds, resolutionNotes } = req.body;

    if (!Array.isArray(conflictIds) || conflictIds.length === 0) {
      return res.status(400).json({ error: 'Conflict IDs array is required' });
    }

    let resolvedCount = 0;
    for (const id of conflictIds) {
      const result = await db.prepare(`
        UPDATE schedule_conflicts 
        SET is_resolved = true, resolved_by = ?, resolved_at = CURRENT_TIMESTAMP, resolution_notes = ?
        WHERE id = ? AND is_resolved = false
      `).run(req.user.id, resolutionNotes || 'Bulk resolved', id);
      
      if (result.changes > 0) resolvedCount++;
    }

    res.json({ message: 'Conflicts resolved', resolvedCount });
  } catch (error) {
    console.error('Bulk resolve error:', error);
    res.status(500).json({ error: 'Failed to bulk resolve conflicts' });
  }
});

// Get conflict statistics - ALL ROLES
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { startDate, endDate } = req.query;

    let dateFilter = '';
    const params = [];
    if (startDate) { dateFilter += ' AND date >= ?'; params.push(startDate); }
    if (endDate) { dateFilter += ' AND date <= ?'; params.push(endDate); }

    const stats = await db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_resolved = false THEN 1 ELSE 0 END) as unresolved,
        SUM(CASE WHEN is_resolved = true THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN severity = 'critical' AND is_resolved = false THEN 1 ELSE 0 END) as critical,
        SUM(CASE WHEN severity = 'error' AND is_resolved = false THEN 1 ELSE 0 END) as errors,
        SUM(CASE WHEN severity = 'warning' AND is_resolved = false THEN 1 ELSE 0 END) as warnings
      FROM schedule_conflicts WHERE 1=1 ${dateFilter}
    `).get(...params);

    const byType = await db.prepare(`
      SELECT type, COUNT(*) as count
      FROM schedule_conflicts WHERE is_resolved = false ${dateFilter}
      GROUP BY type ORDER BY count DESC
    `).all(...params);

    res.json({
      total: stats.total,
      unresolved: stats.unresolved,
      resolved: stats.resolved,
      bySeverity: { critical: stats.critical, error: stats.errors, warning: stats.warnings },
      byType: byType.map(t => ({ type: t.type, count: t.count }))
    });
  } catch (error) {
    console.error('Get conflict stats error:', error);
    res.status(500).json({ error: 'Failed to get conflict statistics' });
  }
});

module.exports = router;
