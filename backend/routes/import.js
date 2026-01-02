const express = require('express');
const multer = require('multer');
const ExcelJS = require('exceljs');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
    }
  }
});

// Helper to parse Excel file
async function parseExcel(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];
  
  const headers = [];
  const rows = [];
  
  worksheet.eachRow((row, rowNum) => {
    if (rowNum === 1) {
      // Header row
      row.eachCell((cell, colNum) => {
        headers[colNum - 1] = String(cell.value).replace('*', '').trim().toLowerCase();
      });
    } else {
      // Data rows
      const rowData = {};
      row.eachCell((cell, colNum) => {
        const header = headers[colNum - 1];
        if (header) {
          let value = cell.value;
          // Handle date objects
          if (value instanceof Date) {
            value = value.toISOString().split('T')[0];
          }
          rowData[header] = value;
        }
      });
      if (Object.keys(rowData).length > 0) {
        rows.push(rowData);
      }
    }
  });
  
  return rows;
}

// Import People
router.post('/people', authenticateToken, requireRole('admin', 'scheduler'), upload.single('file'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const rows = await parseExcel(req.file.buffer);
    const results = { created: 0, updated: 0, skipped: 0, errors: [] };
    
    for (const row of rows) {
      try {
        // Validate required fields
        if (!row.first_name || !row.last_name || !row.email) {
          results.errors.push({ row: row.email || 'unknown', error: 'Missing required fields (first_name, last_name, email)' });
          results.skipped++;
          continue;
        }
        
        // Check if person exists
        const existing = await db.prepare('SELECT id FROM people WHERE email = ?').get(row.email);
        
        if (existing) {
          // Update existing
          db.prepare(`
            UPDATE people SET 
              employee_id = COALESCE(?, employee_id),
              first_name = ?,
              last_name = ?,
              phone = COALESCE(?, phone),
              department = COALESCE(?, department),
              job_title = COALESCE(?, job_title),
              max_hours_per_day = COALESCE(?, max_hours_per_day),
              employment_type = COALESCE(?, employment_type),
              start_date = COALESCE(?, start_date),
              notes = COALESCE(?, notes),
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(
            row.employee_id || null,
            row.first_name,
            row.last_name,
            row.phone || null,
            row.department || null,
            row.job_title || null,
            row.max_hours_per_day || null,
            row.employment_type || null,
            row.start_date || null,
            row.notes || null,
            existing.id
          );
          results.updated++;
        } else {
          // Create new
          db.prepare(`
            INSERT INTO people (employee_id, first_name, last_name, email, phone, department, job_title, max_hours_per_day, employment_type, start_date, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            row.employee_id || null,
            row.first_name,
            row.last_name,
            row.email,
            row.phone || null,
            row.department || null,
            row.job_title || null,
            row.max_hours_per_day || 8,
            row.employment_type || 'full-time',
            row.start_date || null,
            row.notes || null
          );
          results.created++;
        }
      } catch (err) {
        results.errors.push({ row: row.email || 'unknown', error: err.message });
        results.skipped++;
      }
    }
    
    res.json({
      message: `Import completed: ${results.created} created, ${results.updated} updated, ${results.skipped} skipped`,
      ...results
    });
  } catch (error) {
    console.error('Import people error:', error);
    res.status(500).json({ error: 'Failed to import people: ' + error.message });
  }
});

// Import Projects
router.post('/projects', authenticateToken, requireRole('admin', 'scheduler'), upload.single('file'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const rows = await parseExcel(req.file.buffer);
    const results = { created: 0, updated: 0, skipped: 0, errors: [] };
    
    for (const row of rows) {
      try {
        if (!row.name) {
          results.errors.push({ row: row.code || 'unknown', error: 'Missing required field (name)' });
          results.skipped++;
          continue;
        }
        
        // Check if project exists by code
        let existing = null;
        if (row.code) {
          existing = await db.prepare('SELECT id FROM projects WHERE code = ?').get(row.code);
        }
        
        // Parse boolean
        const isBillable = row.is_billable === 'yes' || row.is_billable === true || row.is_billable === 1 ? 1 : 0;
        
        // Validate status and priority
        const validStatuses = ['planning', 'active', 'on-hold', 'completed', 'cancelled'];
        const validPriorities = ['low', 'medium', 'high', 'critical'];
        const status = validStatuses.includes(row.status) ? row.status : 'planning';
        const priority = validPriorities.includes(row.priority) ? row.priority : 'medium';
        
        if (existing) {
          db.prepare(`
            UPDATE projects SET 
              name = ?,
              client = COALESCE(?, client),
              description = COALESCE(?, description),
              status = ?,
              priority = ?,
              start_date = COALESCE(?, start_date),
              end_date = COALESCE(?, end_date),
              budget_hours = COALESCE(?, budget_hours),
              is_billable = ?,
              notes = COALESCE(?, notes),
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(
            row.name,
            row.client || null,
            row.description || null,
            status,
            priority,
            row.start_date || null,
            row.end_date || null,
            row.budget_hours || null,
            isBillable,
            row.notes || null,
            existing.id
          );
          results.updated++;
        } else {
          db.prepare(`
            INSERT INTO projects (name, code, client, description, status, priority, start_date, end_date, budget_hours, is_billable, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            row.name,
            row.code || null,
            row.client || null,
            row.description || null,
            status,
            priority,
            row.start_date || null,
            row.end_date || null,
            row.budget_hours || null,
            isBillable,
            row.notes || null
          );
          results.created++;
        }
      } catch (err) {
        results.errors.push({ row: row.name || 'unknown', error: err.message });
        results.skipped++;
      }
    }
    
    res.json({
      message: `Import completed: ${results.created} created, ${results.updated} updated, ${results.skipped} skipped`,
      ...results
    });
  } catch (error) {
    console.error('Import projects error:', error);
    res.status(500).json({ error: 'Failed to import projects: ' + error.message });
  }
});

// Import Skills
router.post('/skills', authenticateToken, requireRole('admin', 'scheduler'), upload.single('file'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const rows = await parseExcel(req.file.buffer);
    const results = { created: 0, updated: 0, skipped: 0, errors: [] };
    
    for (const row of rows) {
      try {
        if (!row.name) {
          results.errors.push({ row: 'unknown', error: 'Missing required field (name)' });
          results.skipped++;
          continue;
        }
        
        const existing = await db.prepare('SELECT id FROM skills WHERE name = ?').get(row.name);
        
        // Validate color format
        let color = row.color || '#6366f1';
        if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
          color = '#6366f1';
        }
        
        if (existing) {
          db.prepare(`
            UPDATE skills SET 
              category = COALESCE(?, category),
              description = COALESCE(?, description),
              color = ?
            WHERE id = ?
          `).run(
            row.category || null,
            row.description || null,
            color,
            existing.id
          );
          results.updated++;
        } else {
          db.prepare(`
            INSERT INTO skills (name, category, description, color)
            VALUES (?, ?, ?, ?)
          `).run(
            row.name,
            row.category || null,
            row.description || null,
            color
          );
          results.created++;
        }
      } catch (err) {
        results.errors.push({ row: row.name || 'unknown', error: err.message });
        results.skipped++;
      }
    }
    
    res.json({
      message: `Import completed: ${results.created} created, ${results.updated} updated, ${results.skipped} skipped`,
      ...results
    });
  } catch (error) {
    console.error('Import skills error:', error);
    res.status(500).json({ error: 'Failed to import skills: ' + error.message });
  }
});

// Download templates
router.get('/templates/:type', async (req, res) => {
  const { type } = req.params;
  const validTypes = ['people', 'projects', 'skills'];
  
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: 'Invalid template type' });
  }
  
  const path = require('path');
  const filePath = path.join(__dirname, '..', '..', 'templates', `${type}_import_template.xlsx`);
  
  res.download(filePath, `${type}_import_template.xlsx`, (err) => {
    if (err) {
      console.error('Download error:', err);
      res.status(404).json({ error: 'Template not found' });
    }
  });
});

module.exports = router;

