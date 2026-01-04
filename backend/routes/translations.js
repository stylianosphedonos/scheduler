const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * TRANSLATIONS API
 * Allows admins to manage custom translations
 */

// Get all custom translations
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    const translations = await db.prepare(`
      SELECT language_code, translation_key, translation_value, updated_at
      FROM custom_translations
      ORDER BY language_code, translation_key
    `).all();
    
    // Group by language
    const grouped = {};
    for (const t of translations) {
      if (!grouped[t.language_code]) {
        grouped[t.language_code] = {};
      }
      // Convert dot notation to nested object
      setNestedValue(grouped[t.language_code], t.translation_key, t.translation_value);
    }
    
    res.json({ translations: grouped });
  } catch (error) {
    console.error('Get translations error:', error);
    res.status(500).json({ error: 'Failed to get translations' });
  }
});

// Get translations for a specific language
router.get('/:langCode', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { langCode } = req.params;
    
    const translations = await db.prepare(`
      SELECT translation_key, translation_value, updated_at
      FROM custom_translations
      WHERE language_code = ?
      ORDER BY translation_key
    `).all(langCode);
    
    // Convert to nested object
    const result = {};
    for (const t of translations) {
      setNestedValue(result, t.translation_key, t.translation_value);
    }
    
    res.json({ language: langCode, translations: result });
  } catch (error) {
    console.error('Get language translations error:', error);
    res.status(500).json({ error: 'Failed to get translations' });
  }
});

// Update or create a translation - ADMIN ONLY
router.put('/:langCode/:key(*)', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { langCode, key } = req.params;
    const { value } = req.body;
    
    if (!value && value !== '') {
      return res.status(400).json({ error: 'Translation value is required' });
    }
    
    // Validate language code
    const validLanguages = ['en', 'el'];
    if (!validLanguages.includes(langCode)) {
      return res.status(400).json({ error: 'Invalid language code' });
    }
    
    // Check if translation exists
    const existing = await db.prepare(`
      SELECT id FROM custom_translations WHERE language_code = ? AND translation_key = ?
    `).get(langCode, key);
    
    if (existing) {
      // Update
      await db.prepare(`
        UPDATE custom_translations 
        SET translation_value = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
        WHERE language_code = ? AND translation_key = ?
      `).run(value, req.user.id, langCode, key);
    } else {
      // Insert
      await db.prepare(`
        INSERT INTO custom_translations (language_code, translation_key, translation_value, created_by, updated_by)
        VALUES (?, ?, ?, ?, ?)
      `).run(langCode, key, value, req.user.id, req.user.id);
    }
    
    res.json({ message: 'Translation saved', key, value, language: langCode });
  } catch (error) {
    console.error('Save translation error:', error);
    res.status(500).json({ error: 'Failed to save translation' });
  }
});

// Bulk update translations - ADMIN ONLY
router.post('/bulk', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { langCode, translations } = req.body;
    
    if (!langCode || !translations || typeof translations !== 'object') {
      return res.status(400).json({ error: 'Language code and translations object required' });
    }
    
    // Validate language code
    const validLanguages = ['en', 'el'];
    if (!validLanguages.includes(langCode)) {
      return res.status(400).json({ error: 'Invalid language code' });
    }
    
    // Flatten the translations object
    const flat = flattenObject(translations);
    let updated = 0;
    let created = 0;
    
    for (const [key, value] of Object.entries(flat)) {
      if (typeof value !== 'string') continue;
      
      const existing = await db.prepare(`
        SELECT id FROM custom_translations WHERE language_code = ? AND translation_key = ?
      `).get(langCode, key);
      
      if (existing) {
        await db.prepare(`
          UPDATE custom_translations 
          SET translation_value = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
          WHERE language_code = ? AND translation_key = ?
        `).run(value, req.user.id, langCode, key);
        updated++;
      } else {
        await db.prepare(`
          INSERT INTO custom_translations (language_code, translation_key, translation_value, created_by, updated_by)
          VALUES (?, ?, ?, ?, ?)
        `).run(langCode, key, value, req.user.id, req.user.id);
        created++;
      }
    }
    
    res.json({ message: 'Translations saved', created, updated, total: created + updated });
  } catch (error) {
    console.error('Bulk save translations error:', error);
    res.status(500).json({ error: 'Failed to save translations' });
  }
});

// Delete a translation - ADMIN ONLY
router.delete('/:langCode/:key(*)', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { langCode, key } = req.params;
    
    await db.prepare(`
      DELETE FROM custom_translations WHERE language_code = ? AND translation_key = ?
    `).run(langCode, key);
    
    res.json({ message: 'Translation deleted', key, language: langCode });
  } catch (error) {
    console.error('Delete translation error:', error);
    res.status(500).json({ error: 'Failed to delete translation' });
  }
});

// Reset all custom translations for a language - ADMIN ONLY
router.delete('/:langCode', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { langCode } = req.params;
    
    const result = await db.prepare(`
      DELETE FROM custom_translations WHERE language_code = ?
    `).run(langCode);
    
    res.json({ message: 'All custom translations reset', language: langCode, deleted: result.changes || 0 });
  } catch (error) {
    console.error('Reset translations error:', error);
    res.status(500).json({ error: 'Failed to reset translations' });
  }
});

// Export translations as JSON - ADMIN ONLY
router.get('/export/:langCode', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { langCode } = req.params;
    
    const translations = await db.prepare(`
      SELECT translation_key, translation_value
      FROM custom_translations
      WHERE language_code = ?
      ORDER BY translation_key
    `).all(langCode);
    
    // Convert to nested object
    const result = {};
    for (const t of translations) {
      setNestedValue(result, t.translation_key, t.translation_value);
    }
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="translations_${langCode}.json"`);
    res.json(result);
  } catch (error) {
    console.error('Export translations error:', error);
    res.status(500).json({ error: 'Failed to export translations' });
  }
});

// Helper function to set nested value using dot notation
function setNestedValue(obj, path, value) {
  const parts = path.split('.');
  let current = obj;
  
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) {
      current[parts[i]] = {};
    }
    current = current[parts[i]];
  }
  
  current[parts[parts.length - 1]] = value;
}

// Helper function to flatten nested object to dot notation
function flattenObject(obj, prefix = '') {
  const result = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, fullKey));
    } else if (typeof value === 'string') {
      result[fullKey] = value;
    }
  }
  
  return result;
}

module.exports = router;


