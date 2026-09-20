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

    const personSummary = await db.prepare(`SELECT p.first_name || ' ' || p.last_name as person_name, p.department, SUM(a.end_hour - a.start_hour) as total_hours, COUNT(*) as assignment_count FROM people p JOIN assignments a ON p.id = a.person_id WHERE a.date >= ? AND a.date <= ? AND a.status != 'cancelled' GROUP BY p.id ORDER BY total_hours DESC`).all(startDate, endDate);

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
    await db.prepare(`INSERT INTO export_logs (type, filename, parameters, date_range_start, date_range_end, record_count, exported_by) VALUES (?, ?, ?, ?, ?, ?, ?)`).run('excel', filename, JSON.stringify(req.query), startDate, endDate, assignments.length, req.user.id);

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

    const summary = await db.prepare(`SELECT COUNT(*) as total_assignments, COUNT(DISTINCT person_id) as people_scheduled, COUNT(DISTINCT project_id) as projects_active, SUM(end_hour - start_hour) as total_hours FROM assignments WHERE date >= ? AND date <= ? AND status != 'cancelled'`).get(startDate, endDate);

    doc.fontSize(18).fillColor('#1f2937').text('Executive Summary', { underline: true });
    doc.moveDown();
    doc.fontSize(12).fillColor('#374151');
    doc.text(`Total Assignments: ${summary.total_assignments}`);
    doc.text(`People Scheduled: ${summary.people_scheduled}`);
    doc.text(`Active Projects: ${summary.projects_active}`);
    doc.text(`Total Hours: ${summary.total_hours || 0}`);

    await db.prepare(`INSERT INTO export_logs (type, filename, parameters, date_range_start, date_range_end, record_count, exported_by) VALUES (?, ?, ?, ?, ?, ?, ?)`).run('pdf', filename, JSON.stringify(req.query), startDate, endDate, summary.total_assignments, req.user.id);

    doc.end();
  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ error: 'Failed to generate PDF export' });
  }
});

function formatMoney(amount, currency = 'EUR') {
  const value = Number(amount) || 0;
  try {
    return new Intl.NumberFormat('en-CY', { style: 'currency', currency }).format(value);
  } catch (_) {
    return `€${value.toFixed(2)}`;
  }
}

function formatDisplayDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Export quotation PDF for a project/web request - ADMIN & SCHEDULER ONLY
router.post('/quotation/:projectId', authenticateToken, requireRole('admin', 'scheduler'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const projectId = parseInt(req.params.projectId);
    if (isNaN(projectId)) return res.status(400).json({ error: 'Invalid project ID' });

    const project = await db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const {
      amount,
      taxRate,
      notes,
      validUntil,
      save = true
    } = req.body || {};

    const quotationAmount = amount !== undefined && amount !== null && amount !== ''
      ? Number(amount)
      : (project.quotation_amount != null ? Number(project.quotation_amount) : null);

    if (quotationAmount == null || Number.isNaN(quotationAmount) || quotationAmount < 0) {
      return res.status(400).json({ error: 'Please enter a valid quotation amount' });
    }

    const vatRate = taxRate !== undefined && taxRate !== null && taxRate !== ''
      ? Number(taxRate)
      : (project.quotation_tax_rate != null ? Number(project.quotation_tax_rate) : 19);

    const quotationNotes = notes !== undefined ? String(notes || '') : (project.quotation_notes || '');
    const quotationValidUntil = validUntil || project.quotation_valid_until || null;

    if (save) {
      await db.prepare(`
        UPDATE projects
        SET quotation_amount = ?, quotation_notes = ?, quotation_valid_until = ?, quotation_tax_rate = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(quotationAmount, quotationNotes || null, quotationValidUntil || null, vatRate, projectId);
    }

    const settingsRows = await db.prepare(
      `SELECT key, value FROM settings WHERE key IN ('company_name', 'footer_text', 'support_email', 'primary_color')`
    ).all();
    const settings = Object.fromEntries((settingsRows || []).map(r => [r.key, r.value]));

    const companyName = settings.company_name || 'Resource Scheduler';
    const footerText = settings.footer_text || '';
    const supportEmail = settings.support_email || '';
    const accent = settings.primary_color || '#1f4b3f';

    const subtotal = quotationAmount;
    const taxAmount = subtotal * ((Number.isFinite(vatRate) ? vatRate : 0) / 100);
    const total = subtotal + taxAmount;
    const today = new Date();
    const quoteNo = `QT-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-${String(projectId).padStart(4, '0')}`;
    const filename = `quotation_${project.code || projectId}_${today.toISOString().slice(0, 10)}.pdf`;

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    // Header bar
    doc.rect(0, 0, doc.page.width, 110).fill(accent);
    doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text(companyName, 50, 36, { width: 320 });
    doc.fontSize(11).font('Helvetica').text('QUOTATION', 50, 66);
    doc.fontSize(10).text(quoteNo, doc.page.width - 220, 42, { width: 170, align: 'right' });
    doc.text(formatDisplayDate(today.toISOString()), doc.page.width - 220, 58, { width: 170, align: 'right' });

    let y = 140;
    doc.fillColor('#111827').fontSize(11).font('Helvetica-Bold').text('Prepared for', 50, y);
    doc.font('Helvetica').fontSize(10).fillColor('#374151');
    y += 18;
    doc.text(project.client || project.name || 'Customer', 50, y);
    y += 14;
    if (project.contact_email) { doc.text(project.contact_email, 50, y); y += 14; }
    if (project.contact_phone) { doc.text(project.contact_phone, 50, y); y += 14; }
    if (project.location_name) { doc.text(project.location_name, 50, y, { width: 240 }); y += 14; }

    const metaX = 340;
    let metaY = 140;
    doc.fillColor('#111827').font('Helvetica-Bold').fontSize(11).text('Request details', metaX, metaY);
    metaY += 18;
    doc.font('Helvetica').fontSize(10).fillColor('#374151');
    doc.text(`Reference: ${project.code || project.id}`, metaX, metaY); metaY += 14;
    doc.text(`Service: ${project.service_category || 'Custom'}`, metaX, metaY); metaY += 14;
    doc.text(`Priority: ${project.priority || 'medium'}`, metaX, metaY); metaY += 14;
    if (project.start_date) {
      doc.text(`Preferred date: ${formatDisplayDate(project.start_date)}`, metaX, metaY);
      metaY += 14;
    }
    if (quotationValidUntil) {
      doc.text(`Valid until: ${formatDisplayDate(quotationValidUntil)}`, metaX, metaY);
      metaY += 14;
    }

    y = Math.max(y, metaY) + 24;

    // Scope section
    doc.fillColor('#111827').font('Helvetica-Bold').fontSize(12).text('Scope of work', 50, y);
    y += 18;
    doc.font('Helvetica').fontSize(10).fillColor('#374151');
    const scopeText = (project.description || project.name || 'Service as requested').trim();
    doc.text(scopeText, 50, y, { width: 495, align: 'left' });
    y = doc.y + 20;

    // Table header
    doc.rect(50, y, 495, 28).fill('#f3f4f6');
    doc.fillColor('#111827').font('Helvetica-Bold').fontSize(10);
    doc.text('Description', 60, y + 9);
    doc.text('Amount', 430, y + 9, { width: 100, align: 'right' });
    y += 36;

    doc.font('Helvetica').fillColor('#374151');
    const lineTitle = project.name || 'Requested service';
    doc.text(lineTitle, 60, y, { width: 340 });
    doc.text(formatMoney(subtotal), 430, y, { width: 100, align: 'right' });
    y = Math.max(doc.y, y + 16) + 12;

    doc.moveTo(50, y).lineTo(545, y).strokeColor('#e5e7eb').stroke();
    y += 16;

    const totalsX = 330;
    doc.font('Helvetica').fillColor('#6b7280').fontSize(10);
    doc.text('Subtotal', totalsX, y);
    doc.fillColor('#111827').text(formatMoney(subtotal), 430, y, { width: 100, align: 'right' });
    y += 16;
    doc.fillColor('#6b7280').text(`VAT (${Number.isFinite(vatRate) ? vatRate : 0}%)`, totalsX, y);
    doc.fillColor('#111827').text(formatMoney(taxAmount), 430, y, { width: 100, align: 'right' });
    y += 20;
    doc.rect(totalsX - 10, y - 4, 215, 28).fill(accent);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(11);
    doc.text('Total', totalsX, y + 6);
    doc.text(formatMoney(total), 430, y + 6, { width: 100, align: 'right' });
    y += 44;

    if (quotationNotes) {
      doc.fillColor('#111827').font('Helvetica-Bold').fontSize(11).text('Notes', 50, y);
      y += 16;
      doc.font('Helvetica').fontSize(10).fillColor('#374151').text(quotationNotes, 50, y, { width: 495 });
      y = doc.y + 18;
    }

    doc.fillColor('#111827').font('Helvetica-Bold').fontSize(11).text('Terms', 50, y);
    y += 16;
    doc.font('Helvetica').fontSize(9).fillColor('#6b7280');
    doc.text(
      'This quotation is an estimate based on the details provided in the web request. Final pricing may be adjusted after an on-site assessment. Payment terms and scheduling will be confirmed upon acceptance.',
      50, y, { width: 495 }
    );
    y = doc.y + 28;

    doc.fillColor('#111827').font('Helvetica').fontSize(10);
    doc.text('Prepared by', 50, y);
    doc.text('Customer acceptance', 320, y);
    y += 36;
    doc.moveTo(50, y).lineTo(220, y).strokeColor('#9ca3af').stroke();
    doc.moveTo(320, y).lineTo(490, y).stroke();
    y += 8;
    doc.fillColor('#9ca3af').fontSize(8);
    doc.text(req.user?.username || 'Scheduler', 50, y);
    doc.text('Signature / Date', 320, y);

    // Footer
    const footerY = doc.page.height - 50;
    doc.fontSize(8).fillColor('#9ca3af');
    if (footerText) doc.text(footerText, 50, footerY, { width: 300 });
    if (supportEmail) doc.text(supportEmail, 350, footerY, { width: 195, align: 'right' });

    try {
      await db.prepare(
        `INSERT INTO export_logs (type, filename, parameters, date_range_start, date_range_end, record_count, exported_by) VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run('pdf', filename, JSON.stringify({ projectId, quoteNo, amount: quotationAmount }), null, null, 1, req.user.id);
    } catch (_) {
      // Logging is best-effort
    }

    doc.end();
  } catch (error) {
    console.error('Quotation PDF export error:', error);
    res.status(500).json({ error: 'Failed to generate quotation PDF' });
  }
});

// Get export logs - ADMIN ONLY
router.get('/logs', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const totalResult = await db.prepare('SELECT COUNT(*) as count FROM export_logs').get();
    const total = totalResult?.count || 0;
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
