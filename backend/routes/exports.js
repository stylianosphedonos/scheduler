const express = require('express');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * EXPORT FUNCTIONALITY
 * - Admin & Scheduler: Can export data
 * - Viewer: NO access to exports
 */

// Export to Excel - ADMIN & SCHEDULER ONLY
router.get('/excel', authenticateToken, requireRole('admin', 'scheduler'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { startDate, endDate, includeConflicts = 'true', includeSkills = 'true' } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Resource Scheduler';
    workbook.created = new Date();

    // Sheet 1: Daily Schedule
    const scheduleSheet = workbook.addWorksheet('Daily Schedule');
    scheduleSheet.columns = [
      { header: 'Date', key: 'date', width: 12 }, { header: 'Person', key: 'person', width: 25 },
      { header: 'Department', key: 'department', width: 15 }, { header: 'Project', key: 'project', width: 25 },
      { header: 'Start', key: 'start', width: 8 }, { header: 'End', key: 'end', width: 8 },
      { header: 'Hours', key: 'hours', width: 8 }, { header: 'Status', key: 'status', width: 12 }
    ];

    const assignments = await db.prepare(`SELECT a.*, p.first_name || ' ' || p.last_name as person_name, p.department, pr.name as project_name FROM assignments a JOIN people p ON a.person_id = p.id JOIN projects pr ON a.project_id = pr.id WHERE a.date >= ? AND a.date <= ? ORDER BY a.date, p.last_name, a.start_hour`).all(startDate, endDate);

    for (const a of assignments) {
      scheduleSheet.addRow({ date: a.date, person: a.person_name, department: a.department, project: a.project_name, start: `${a.start_hour}:00`, end: `${a.end_hour}:00`, hours: a.end_hour - a.start_hour, status: a.status });
    }

    scheduleSheet.getRow(1).font = { bold: true };
    scheduleSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } };
    scheduleSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Sheet 2: Person Summary
    const personSheet = workbook.addWorksheet('Person Summary');
    personSheet.columns = [
      { header: 'Person', key: 'person', width: 25 }, { header: 'Department', key: 'department', width: 15 },
      { header: 'Total Hours', key: 'hours', width: 12 }, { header: 'Assignments', key: 'assignments', width: 12 }
    ];

    const personSummary = db.prepare(`SELECT p.first_name || ' ' || p.last_name as person_name, p.department, SUM(a.end_hour - a.start_hour) as total_hours, COUNT(*) as assignment_count FROM people p JOIN assignments a ON p.id = a.person_id WHERE a.date >= ? AND a.date <= ? AND a.status != 'cancelled' GROUP BY p.id ORDER BY total_hours DESC`).all(startDate, endDate);

    for (const p of personSummary) {
      personSheet.addRow({ person: p.person_name, department: p.department, hours: p.total_hours, assignments: p.assignment_count });
    }
    personSheet.getRow(1).font = { bold: true };

    // Conflicts sheet
    if (includeConflicts === 'true') {
      const conflictSheet = workbook.addWorksheet('Conflicts');
      conflictSheet.columns = [
        { header: 'Date', key: 'date', width: 12 }, { header: 'Type', key: 'type', width: 15 },
        { header: 'Severity', key: 'severity', width: 10 }, { header: 'Description', key: 'description', width: 50 }
      ];

      const conflicts = await db.prepare(`SELECT * FROM schedule_conflicts WHERE date >= ? AND date <= ? ORDER BY date`).all(startDate, endDate);
      for (const c of conflicts) {
        conflictSheet.addRow({ date: c.date, type: c.type, severity: c.severity, description: c.description });
      }
      conflictSheet.getRow(1).font = { bold: true };
    }

    // Log export
    const filename = `schedule_${startDate}_${endDate}.xlsx`;
    db.prepare(`INSERT INTO export_logs (type, filename, parameters, date_range_start, date_range_end, record_count, exported_by) VALUES (?, ?, ?, ?, ?, ?, ?)`).run('excel', filename, JSON.stringify(req.query), startDate, endDate, assignments.length, req.user.id);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Excel export error:', error);
    res.status(500).json({ error: 'Failed to generate Excel export' });
  }
});

// Export to PDF - ADMIN & SCHEDULER ONLY
router.get('/pdf', authenticateToken, requireRole('admin', 'scheduler'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const filename = `schedule_${startDate}_${endDate}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    doc.fontSize(28).fillColor('#6366f1').text('Resource Scheduler', { align: 'center' });
    doc.moveDown();
    doc.fontSize(20).fillColor('#374151').text('Schedule Report', { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(14).fillColor('#6b7280').text(`Period: ${startDate} to ${endDate}`, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.text(`Generated by: ${req.user.username} (${req.user.role})`, { align: 'center' });

    doc.addPage();

    const summary = db.prepare(`SELECT COUNT(*) as total_assignments, COUNT(DISTINCT person_id) as people_scheduled, COUNT(DISTINCT project_id) as projects_active, SUM(end_hour - start_hour) as total_hours FROM assignments WHERE date >= ? AND date <= ? AND status != 'cancelled'`).get(startDate, endDate);

    doc.fontSize(18).fillColor('#1f2937').text('Executive Summary', { underline: true });
    doc.moveDown();
    doc.fontSize(12).fillColor('#374151');
    doc.text(`Total Assignments: ${summary.total_assignments}`);
    doc.text(`People Scheduled: ${summary.people_scheduled}`);
    doc.text(`Active Projects: ${summary.projects_active}`);
    doc.text(`Total Hours: ${summary.total_hours || 0}`);

    db.prepare(`INSERT INTO export_logs (type, filename, parameters, date_range_start, date_range_end, record_count, exported_by) VALUES (?, ?, ?, ?, ?, ?, ?)`).run('pdf', filename, JSON.stringify(req.query), startDate, endDate, summary.total_assignments, req.user.id);

    doc.end();
  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ error: 'Failed to generate PDF export' });
  }
});

// Get export logs - ADMIN ONLY
router.get('/logs', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const total = db.prepare('SELECT COUNT(*) as count FROM export_logs').get().count;
    const logs = await db.prepare(`SELECT e.*, u.username as exported_by_name FROM export_logs e LEFT JOIN users u ON e.exported_by = u.id ORDER BY e.created_at DESC LIMIT ? OFFSET ?`).all(parseInt(limit), offset);

    res.json({
      data: logs.map(l => ({
        id: l.id, type: l.type, filename: l.filename, dateRangeStart: l.date_range_start,
        dateRangeEnd: l.date_range_end, recordCount: l.record_count, exportedByName: l.exported_by_name,
        status: l.status, createdAt: l.created_at
      })),
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Get export logs error:', error);
    res.status(500).json({ error: 'Failed to get export logs' });
  }
});

module.exports = router;
