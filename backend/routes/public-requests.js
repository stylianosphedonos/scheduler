const express = require('express');
const router = express.Router();

const CLEANING_SERVICES = [
  'House cleaning',
  'Office cleaning',
  'Deep cleaning',
  'Window cleaning',
  'Post-construction cleaning',
  'Carpet cleaning'
];

const CONSTRUCTION_SERVICES = [
  'Renovation',
  'Painting',
  'Plumbing',
  'Electrical work',
  'Flooring',
  'General repairs',
  'Demolition',
  'Pelecanics'
];

const ALLOWED_SERVICES = new Set([...CLEANING_SERVICES, ...CONSTRUCTION_SERVICES]);
const ALLOWED_PRIORITIES = new Set(['low', 'medium', 'high', 'critical']);
const CATEGORY_COLORS = {
  cleaning: '#2f6f5e',
  construction: '#b85c38',
  custom: '#3d4f5f',
  mixed: '#8a5a2b'
};

function sanitizeText(value, maxLen = 500) {
  if (value == null) return '';
  return String(value).trim().slice(0, maxLen);
}

function generateRequestCode() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `WEB-${stamp}-${rand}`;
}

// Catalog for the public request page
router.get('/catalog', (req, res) => {
  res.json({
    cleaning: CLEANING_SERVICES,
    construction: CONSTRUCTION_SERVICES
  });
});

// Public customer job request → creates a project with status=requested
router.post('/', async (req, res) => {
  try {
    const db = req.app.locals.db;
    const {
      customerName,
      email,
      phone,
      address,
      preferredDate,
      priority,
      services,
      customDescription,
      notes
    } = req.body || {};

    const name = sanitizeText(customerName, 120);
    const contactEmail = sanitizeText(email, 255);
    const contactPhone = sanitizeText(phone, 50);
    const locationName = sanitizeText(address, 500);
    const preferred = sanitizeText(preferredDate, 40);
    const customJob = sanitizeText(customDescription, 2000);
    const extraNotes = sanitizeText(notes, 1000);
    const selectedPriority = ALLOWED_PRIORITIES.has(priority) ? priority : 'medium';

    const selectedServices = Array.isArray(services)
      ? [...new Set(services.map(s => sanitizeText(s, 80)).filter(s => ALLOWED_SERVICES.has(s)))]
      : [];

    if (!name) {
      return res.status(400).json({ error: 'Please enter your name.' });
    }
    if (!contactEmail && !contactPhone) {
      return res.status(400).json({ error: 'Please provide an email or phone number.' });
    }
    if (selectedServices.length === 0 && !customJob) {
      return res.status(400).json({
        error: 'Select at least one service, or describe the job you need.'
      });
    }

    const hasCleaning = selectedServices.some(s => CLEANING_SERVICES.includes(s));
    const hasConstruction = selectedServices.some(s => CONSTRUCTION_SERVICES.includes(s));
    let serviceCategory = 'custom';
    if (hasCleaning && hasConstruction) serviceCategory = 'mixed';
    else if (hasCleaning) serviceCategory = 'cleaning';
    else if (hasConstruction) serviceCategory = 'construction';
    else if (customJob) serviceCategory = 'custom';

    const primaryService = selectedServices[0] || 'Custom job request';
    const projectName = `${primaryService}${selectedServices.length > 1 ? ` (+${selectedServices.length - 1} more)` : ''} — ${name}`;
    const code = generateRequestCode();
    const color = CATEGORY_COLORS[serviceCategory] || CATEGORY_COLORS.custom;

    const descriptionParts = [];
    if (selectedServices.length) {
      descriptionParts.push(`Requested services:\n• ${selectedServices.join('\n• ')}`);
    }
    if (customJob) {
      descriptionParts.push(`Custom job description:\n${customJob}`);
    }
    if (preferred) {
      descriptionParts.push(`Preferred date: ${preferred}`);
    }

    const notesParts = [
      'Submitted via public web request form.',
      contactEmail ? `Email: ${contactEmail}` : null,
      contactPhone ? `Phone: ${contactPhone}` : null,
      extraNotes ? `Customer notes: ${extraNotes}` : null
    ].filter(Boolean);

    const result = await db.prepare(`
      INSERT INTO projects (
        name, code, client, description, status, priority, color,
        start_date, location_name, notes, is_billable,
        source, contact_email, contact_phone, service_category
      ) VALUES (?, ?, ?, ?, 'requested', ?, ?, ?, ?, ?, 1, 'web', ?, ?, ?)
    `).run(
      projectName,
      code,
      name,
      descriptionParts.join('\n\n'),
      selectedPriority,
      color,
      preferred || null,
      locationName || null,
      notesParts.join('\n'),
      contactEmail || null,
      contactPhone || null,
      serviceCategory
    );

    res.status(201).json({
      id: result.lastInsertRowid,
      code,
      message: 'Your request was submitted successfully. Our team will contact you soon.'
    });
  } catch (error) {
    console.error('Public request error:', error);
    res.status(500).json({ error: 'Failed to submit request. Please try again.' });
  }
});

module.exports = router;
