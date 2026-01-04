const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { getDatabaseType } = require('../database');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { personId, startDate, endDate, type, status } = req.query;
    let whereClause = '1=1';
    const params = [];

    if (personId) { whereClause += ' AND aw.person_id = ?'; params.push(personId); }
    if (startDate) { whereClause += ' AND aw.end_date >= ?'; params.push(startDate); }
    if (endDate) { whereClause += ' AND aw.start_date <= ?'; params.push(endDate); }
    if (type) { whereClause += ' AND aw.type = ?'; params.push(type); }
    if (status) { whereClause += ' AND aw.status = ?'; params.push(status); }

    const windows = await db.prepare(`
      SELECT aw.*, p.first_name || ' ' || p.last_name as person_name, p.department as person_department
      FROM availability_windows aw JOIN people p ON aw.person_id = p.id WHERE ${whereClause} ORDER BY aw.start_date DESC
    `).all(...params);

    res.json({ data: windows.map(w => ({
      id: w.id, personId: w.person_id, personName: w.person_name, personDepartment: w.person_department,
      type: w.type, startDate: w.start_date, endDate: w.end_date, startHour: w.start_hour, endHour: w.end_hour,
      isRecurring: !!w.is_recurring, status: w.status, reason: w.reason, createdAt: w.created_at
    }))});
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({ error: 'Failed to get availability windows' });
  }
});

router.post('/', authenticateToken, requireRole('admin', 'manager', 'scheduler'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { personId, type, startDate, endDate, startHour, endHour, isRecurring, recurrencePattern, reason } = req.body;
    if (!personId || !startDate || !endDate) return res.status(400).json({ error: 'Person, start date, and end date are required' });

    const person = await db.prepare('SELECT id FROM people WHERE id = ?').get(personId);
    if (!person) return res.status(404).json({ error: 'Person not found' });

    const autoApprove = ['admin', 'manager'].includes(req.user.role);

    const isPostgres = getDatabaseType() === 'postgres';
    let windowId;
    
    if (isPostgres) {
      const result = await db.prepare(`
        INSERT INTO availability_windows (person_id, type, start_date, end_date, start_hour, end_hour, is_recurring, recurrence_pattern, status, reason, approved_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id
      `).get(personId, type || 'time-off', startDate, endDate, startHour || 0, endHour || 24, !!isRecurring, recurrencePattern || null, autoApprove ? 'approved' : 'pending', reason || null, autoApprove ? req.user.id : null);
      windowId = result?.id;
    } else {
      const result = await db.prepare(`
        INSERT INTO availability_windows (person_id, type, start_date, end_date, start_hour, end_hour, is_recurring, recurrence_pattern, status, reason, approved_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(personId, type || 'time-off', startDate, endDate, startHour || 0, endHour || 24, isRecurring ? 1 : 0, recurrencePattern || null, autoApprove ? 'approved' : 'pending', reason || null, autoApprove ? req.user.id : null);
      windowId = result.lastInsertRowid;
    }

    res.status(201).json({ id: windowId, message: 'Availability window created successfully', status: autoApprove ? 'approved' : 'pending' });
  } catch (error) {
    console.error('Create availability error:', error);
    res.status(500).json({ error: 'Failed to create availability window' });
  }
});

router.delete('/:id', authenticateToken, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const window = await db.prepare('SELECT * FROM availability_windows WHERE id = ?').get(req.params.id);
    if (!window) return res.status(404).json({ error: 'Availability window not found' });
    await db.prepare('DELETE FROM availability_windows WHERE id = ?').run(req.params.id);
    res.json({ message: 'Availability window deleted successfully' });
  } catch (error) {
    console.error('Delete availability error:', error);
    res.status(500).json({ error: 'Failed to delete availability window' });
  }
});

router.get('/person/:personId/check', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { startDate, endDate } = req.query;
    const { personId } = req.params;
    if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });

    const unavailable = await db.prepare(`SELECT * FROM availability_windows WHERE person_id = ? AND end_date >= ? AND start_date <= ? AND status = 'approved' AND type NOT IN ('preferred')`).all(personId, startDate, endDate);
    const assignments = await db.prepare(`SELECT date, SUM(end_hour - start_hour) as hours FROM assignments WHERE person_id = ? AND date >= ? AND date <= ? AND status NOT IN ('cancelled') GROUP BY date`).all(personId, startDate, endDate);
    const person = await db.prepare('SELECT max_hours_per_day FROM people WHERE id = ?').get(personId);

    const availability = {};
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayAssignment = assignments.find(a => a.date === dateStr);
      const bookedHours = dayAssignment ? dayAssignment.hours : 0;
      const dayUnavailable = unavailable.filter(u => u.start_date <= dateStr && u.end_date >= dateStr);
      availability[dateStr] = { date: dateStr, available: dayUnavailable.length === 0, bookedHours, remainingHours: person ? Math.max(0, person.max_hours_per_day - bookedHours) : 8 - bookedHours };
    }

    res.json({ personId: parseInt(personId), startDate, endDate, availability: Object.values(availability) });
  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({ error: 'Failed to check availability' });
  }
});

module.exports = router;
