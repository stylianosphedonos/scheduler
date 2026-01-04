const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { getDatabaseType } = require('../database');
const path = require('path');
const fs = require('fs');

const router = express.Router();

/**
 * DATABASE MANAGEMENT - ADMIN ONLY
 * Backup, export, and clean database operations
 */

// Get database info - ADMIN ONLY
router.get('/info', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const dbType = getDatabaseType();
    
    // Get table counts
    const tables = ['users', 'people', 'skills', 'projects', 'assignments', 'availability_windows', 'schedule_conflicts', 'person_skills', 'project_skills'];
    const counts = {};
    
    for (const table of tables) {
      try {
        const result = await db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
        counts[table] = result?.count || 0;
      } catch (e) {
        counts[table] = 0;
      }
    }
    
    res.json({
      databaseType: dbType,
      tables: counts,
      totalRecords: Object.values(counts).reduce((a, b) => a + b, 0)
    });
  } catch (error) {
    console.error('Database info error:', error);
    res.status(500).json({ error: 'Failed to get database info' });
  }
});

// Export database as JSON - ADMIN ONLY
router.get('/export', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    // Export all tables
    const exportData = {
      exportDate: new Date().toISOString(),
      databaseType: getDatabaseType(),
      data: {}
    };
    
    const tables = [
      'users', 'people', 'skills', 'projects', 'assignments', 
      'availability_windows', 'schedule_conflicts', 'person_skills', 
      'project_skills', 'settings', 'export_logs'
    ];
    
    for (const table of tables) {
      try {
        const rows = await db.prepare(`SELECT * FROM ${table}`).all();
        exportData.data[table] = rows;
      } catch (e) {
        exportData.data[table] = [];
      }
    }
    
    // Log the export
    try {
      await db.prepare(`
        INSERT INTO export_logs (export_type, format, file_name, record_count, created_by)
        VALUES (?, ?, ?, ?, ?)
      `).run('database_backup', 'json', `backup_${Date.now()}.json`, 
        Object.values(exportData.data).reduce((a, b) => a + b.length, 0), 
        req.user.id);
    } catch (e) {
      console.error('Failed to log export:', e);
    }
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=scheduler_backup_${new Date().toISOString().split('T')[0]}.json`);
    res.json(exportData);
  } catch (error) {
    console.error('Database export error:', error);
    res.status(500).json({ error: 'Failed to export database' });
  }
});

// Create backup (returns download) - ADMIN ONLY
router.post('/backup', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const dbType = getDatabaseType();
    
    // For SQLite, we can create a file backup
    // For PostgreSQL, we export as JSON (pg_dump would require shell access)
    
    const backupData = {
      backupDate: new Date().toISOString(),
      backupType: 'full',
      databaseType: dbType,
      version: '1.0',
      data: {}
    };
    
    const tables = [
      { name: 'users', excludeFields: ['password_hash'] },
      { name: 'people', excludeFields: [] },
      { name: 'skills', excludeFields: [] },
      { name: 'projects', excludeFields: [] },
      { name: 'assignments', excludeFields: [] },
      { name: 'availability_windows', excludeFields: [] },
      { name: 'schedule_conflicts', excludeFields: [] },
      { name: 'person_skills', excludeFields: [] },
      { name: 'project_skills', excludeFields: [] },
      { name: 'settings', excludeFields: [] },
      { name: 'custom_translations', excludeFields: [] }
    ];
    
    for (const table of tables) {
      try {
        let rows = await db.prepare(`SELECT * FROM ${table.name}`).all();
        
        // Remove sensitive fields
        if (table.excludeFields.length > 0) {
          rows = rows.map(row => {
            const filtered = { ...row };
            table.excludeFields.forEach(field => delete filtered[field]);
            return filtered;
          });
        }
        
        backupData.data[table.name] = rows;
      } catch (e) {
        backupData.data[table.name] = [];
      }
    }
    
    // Log the backup
    try {
      await db.prepare(`
        INSERT INTO audit_log (user_id, action, entity_type, new_values)
        VALUES (?, ?, ?, ?)
      `).run(req.user.id, 'DATABASE_BACKUP', 'system', JSON.stringify({ 
        tables: Object.keys(backupData.data).length,
        totalRecords: Object.values(backupData.data).reduce((a, b) => a + b.length, 0)
      }));
    } catch (e) {
      console.error('Failed to log backup:', e);
    }
    
    res.json({
      success: true,
      message: 'Backup created successfully',
      backup: backupData
    });
  } catch (error) {
    console.error('Database backup error:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

// Clean database (remove old data) - ADMIN ONLY
router.post('/clean', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { 
      cleanAssignments = false, 
      cleanConflicts = false, 
      cleanExportLogs = false,
      cleanAuditLogs = false,
      olderThanDays = 90 
    } = req.body;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];
    
    const results = {
      assignmentsDeleted: 0,
      conflictsDeleted: 0,
      exportLogsDeleted: 0,
      auditLogsDeleted: 0
    };
    
    if (cleanAssignments) {
      const result = await db.prepare(`
        DELETE FROM assignments WHERE date < ? AND status IN ('completed', 'cancelled')
      `).run(cutoffDateStr);
      results.assignmentsDeleted = result.changes || 0;
    }
    
    if (cleanConflicts) {
      const dbType = getDatabaseType();
      const resolvedCond = dbType === 'postgres' ? 'is_resolved = true' : 'is_resolved = 1';
      const result = await db.prepare(`
        DELETE FROM schedule_conflicts WHERE date < ? AND ${resolvedCond}
      `).run(cutoffDateStr);
      results.conflictsDeleted = result.changes || 0;
    }
    
    if (cleanExportLogs) {
      const result = await db.prepare(`
        DELETE FROM export_logs WHERE created_at < ?
      `).run(cutoffDateStr);
      results.exportLogsDeleted = result.changes || 0;
    }
    
    if (cleanAuditLogs) {
      const result = await db.prepare(`
        DELETE FROM audit_log WHERE created_at < ?
      `).run(cutoffDateStr);
      results.auditLogsDeleted = result.changes || 0;
    }
    
    // Log the cleanup
    try {
      await db.prepare(`
        INSERT INTO audit_log (user_id, action, entity_type, new_values)
        VALUES (?, ?, ?, ?)
      `).run(req.user.id, 'DATABASE_CLEAN', 'system', JSON.stringify(results));
    } catch (e) {
      console.error('Failed to log cleanup:', e);
    }
    
    res.json({
      success: true,
      message: 'Database cleaned successfully',
      results,
      cutoffDate: cutoffDateStr
    });
  } catch (error) {
    console.error('Database clean error:', error);
    res.status(500).json({ error: 'Failed to clean database' });
  }
});

// Reset database (DANGER - removes all data except admin user) - ADMIN ONLY
router.post('/reset', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { confirmReset } = req.body;
    
    if (confirmReset !== 'RESET_DATABASE') {
      return res.status(400).json({ 
        error: 'Reset not confirmed', 
        message: 'Please send confirmReset: "RESET_DATABASE" to confirm this action' 
      });
    }
    
    // Tables to clear (order matters due to foreign keys)
    const tablesToClear = [
      'export_logs',
      'audit_log',
      'schedule_conflicts',
      'assignments',
      'availability_windows',
      'person_skills',
      'project_skills',
      'projects',
      'people',
      'skills',
      'custom_translations'
    ];
    
    const results = {};
    
    for (const table of tablesToClear) {
      try {
        const countBefore = await db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
        await db.prepare(`DELETE FROM ${table}`).run();
        results[table] = countBefore?.count || 0;
      } catch (e) {
        results[table] = 'error';
      }
    }
    
    // Keep admin users but remove others
    try {
      const dbType = getDatabaseType();
      const adminCond = dbType === 'postgres' ? "role != 'admin'" : "role != 'admin'";
      await db.prepare(`DELETE FROM users WHERE ${adminCond}`).run();
    } catch (e) {
      console.error('Error cleaning users:', e);
    }
    
    res.json({
      success: true,
      message: 'Database reset successfully. Admin users preserved.',
      deletedRecords: results
    });
  } catch (error) {
    console.error('Database reset error:', error);
    res.status(500).json({ error: 'Failed to reset database' });
  }
});

module.exports = router;

