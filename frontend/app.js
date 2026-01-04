// ===== Global State =====
const state = {
  token: localStorage.getItem('scheduler_token'),
  user: null,
  permissions: [],
  currentView: 'dashboard',
  scheduleDate: new Date().toISOString().split('T')[0],
  scheduleViewType: 'day'
};

// ===== Help System =====
const helpContent = {
  dashboard: {
    title: 'Dashboard Help',
    content: `
      <h4>Overview</h4>
      <p>The Dashboard provides a real-time overview of your organization's scheduling status.</p>
      
      <h4>Key Metrics</h4>
      <ul>
        <li><strong>Active People:</strong> Total employees in the system</li>
        <li><strong>Active Projects:</strong> Projects currently in progress</li>
        <li><strong>Today's Assignments:</strong> Scheduled work for today</li>
        <li><strong>Conflicts:</strong> Issues requiring attention</li>
      </ul>
      
      <h4>Tips</h4>
      <ul>
        <li>Click any metric card to navigate to detailed view</li>
        <li>Red conflict indicator means urgent attention needed</li>
        <li>Charts show 7-day trends</li>
      </ul>
    `
  },
  schedule: {
    title: 'Schedule Help',
    content: `
      <h4>Overview</h4>
      <p>View and manage daily/weekly schedules with hourly time slots.</p>
      
      <h4>Navigation</h4>
      <ul>
        <li><strong>← / →:</strong> Previous/Next day</li>
        <li><strong>Today:</strong> Jump to current date</li>
        <li><strong>Day/Week:</strong> Toggle view mode</li>
      </ul>
      
      <h4>Creating Assignments</h4>
      <ol>
        <li>Click "Add Assignment" button</li>
        <li>Select person and project</li>
        <li>Set date and time (start/end hours)</li>
        <li>Add optional task description</li>
      </ol>
      
      <h4>Tips</h4>
      <ul>
        <li>Click on a person's timeline row to add assignment there</li>
        <li>Colors indicate different projects</li>
        <li>Hover over assignments to see details</li>
      </ul>
    `
  },
  people: {
    title: 'People Management Help',
    content: `
      <h4>Overview</h4>
      <p>Manage employee profiles, skills, and availability.</p>
      
      <h4>Adding a Person</h4>
      <ol>
        <li>Click "Add Person"</li>
        <li>Enter required fields (name, email)</li>
        <li>Set department and job title</li>
        <li>Configure max hours per day</li>
      </ol>
      
      <h4>Assigning Skills</h4>
      <ol>
        <li>Click on a person card</li>
        <li>Click "Edit"</li>
        <li>Scroll to Skills section</li>
        <li>Check skills and set proficiency levels (1-5)</li>
      </ol>
      
      <h4>Proficiency Levels</h4>
      <ul>
        <li><strong>1:</strong> Beginner</li>
        <li><strong>2:</strong> Elementary</li>
        <li><strong>3:</strong> Intermediate</li>
        <li><strong>4:</strong> Advanced</li>
        <li><strong>5:</strong> Expert</li>
      </ul>
    `
  },
  projects: {
    title: 'Project Management Help',
    content: `
      <h4>Overview</h4>
      <p>Create projects with skill requirements and track assignments.</p>
      
      <h4>Creating a Project</h4>
      <ol>
        <li>Click "Add Project"</li>
        <li>Enter project name (required)</li>
        <li>Set code, client, status, priority</li>
        <li>Define skill requirements</li>
      </ol>
      
      <h4>Skill Requirements</h4>
      <p>For each required skill, specify:</p>
      <ul>
        <li><strong>People Needed:</strong> How many with this skill</li>
        <li><strong>Min Level:</strong> Required proficiency (1-5)</li>
        <li><strong>Required:</strong> Mandatory vs optional</li>
      </ul>
      
      <h4>Find Candidates</h4>
      <p>Click "Find Candidates" to see best matches based on skills and availability.</p>
    `
  },
  skills: {
    title: 'Skills Management Help',
    content: `
      <h4>Overview</h4>
      <p>Define and manage skills available in your organization.</p>
      
      <h4>Adding a Skill</h4>
      <ol>
        <li>Click "Add Skill"</li>
        <li>Enter skill name</li>
        <li>Select category</li>
        <li>Choose a color</li>
        <li>Add description</li>
      </ol>
      
      <h4>Skill Statistics</h4>
      <p>Each skill shows:</p>
      <ul>
        <li>Number of people with this skill</li>
        <li>Number of projects requiring it</li>
      </ul>
      
      <h4>Skill Gaps</h4>
      <p>If projects require more people with a skill than available, consider training or hiring.</p>
    `
  },
  'ai-scheduler': {
    title: 'AI Scheduler Help',
    content: `
      <h4>Overview</h4>
      <p>Let AI analyze projects, skills, and availability to suggest optimal schedules.</p>
      
      <h4>How to Use</h4>
      <ol>
        <li>Select start and end dates</li>
        <li>Click "Generate Suggestions"</li>
        <li>Review AI-generated assignments</li>
        <li>Accept, modify, or reject each suggestion</li>
      </ol>
      
      <h4>Suggestion Actions</h4>
      <ul>
        <li><strong>✓ Accept:</strong> Create this assignment</li>
        <li><strong>↔ Reschedule:</strong> Assign to different person</li>
        <li><strong>✗ Remove:</strong> Discard suggestion</li>
      </ul>
      
      <h4>AI Considerations</h4>
      <ul>
        <li>Project priority (Critical first)</li>
        <li>Skill match percentage</li>
        <li>Person availability</li>
        <li>Workload balance</li>
      </ul>
    `
  },
  conflicts: {
    title: 'Conflicts Help',
    content: `
      <h4>Overview</h4>
      <p>View and resolve scheduling conflicts detected by the system.</p>
      
      <h4>Conflict Types</h4>
      <ul>
        <li><strong>Overlap:</strong> Same person, same time, different projects</li>
        <li><strong>Overallocation:</strong> Too many hours in one day</li>
        <li><strong>Skill Gap:</strong> Person lacks required skill</li>
        <li><strong>Availability:</strong> Assigned during time-off</li>
      </ul>
      
      <h4>Severity Levels</h4>
      <ul>
        <li><span style="color:#ef4444">●</span> <strong>Critical:</strong> Must be resolved immediately</li>
        <li><span style="color:#f59e0b">●</span> <strong>Warning:</strong> Should be addressed soon</li>
        <li><span style="color:#64748b">●</span> <strong>Info:</strong> For your awareness</li>
      </ul>
      
      <h4>Resolving</h4>
      <ol>
        <li>Review conflict description</li>
        <li>Modify or delete the assignment</li>
        <li>Click "Resolve" to mark as handled</li>
      </ol>
    `
  },
  reports: {
    title: 'Reports Help',
    content: `
      <h4>Overview</h4>
      <p>Generate reports and export data.</p>
      
      <h4>Project Summary</h4>
      <p>Shows all active projects with:</p>
      <ul>
        <li>Assigned team members</li>
        <li>Total hours worked</li>
        <li>Budget usage</li>
      </ul>
      
      <h4>Preview Report</h4>
      <ol>
        <li>Select date range</li>
        <li>Click "Preview Report"</li>
        <li>Review before exporting</li>
      </ol>
      
      <h4>Exporting</h4>
      <ul>
        <li><strong>Excel:</strong> Download .xlsx file</li>
        <li><strong>PDF:</strong> Print preview → Save as PDF</li>
      </ul>
      
      <h4>Report Structure</h4>
      <p>Reports are organized by day, then by project status (Active first).</p>
    `
  },
  users: {
    title: 'User Management Help',
    content: `
      <h4>Overview</h4>
      <p>Manage user accounts and roles (Admin only).</p>
      
      <h4>Adding Users</h4>
      <ol>
        <li>Click "Add User"</li>
        <li>Enter username and email</li>
        <li>Set password (min 6 characters)</li>
        <li>Assign role</li>
      </ol>
      
      <h4>Roles</h4>
      <ul>
        <li><strong>Admin:</strong> Full access, user management</li>
        <li><strong>Manager:</strong> Manage people/projects</li>
        <li><strong>Scheduler:</strong> Manage schedules</li>
        <li><strong>Viewer:</strong> Read-only access</li>
      </ul>
      
      <h4>Actions</h4>
      <ul>
        <li>Edit user details and role</li>
        <li>Activate/deactivate accounts</li>
        <li>Delete users (except yourself)</li>
      </ul>
    `
  },
  settings: {
    title: 'Settings Help',
    content: `
      <h4>Branding</h4>
      <p>Customize the application appearance:</p>
      <ul>
        <li><strong>Company Name:</strong> Displayed in sidebar and reports</li>
        <li><strong>Logo:</strong> Upload URL or select an icon</li>
        <li><strong>Primary Color:</strong> Main accent color</li>
        <li><strong>Footer:</strong> Text shown in exports</li>
      </ul>
      
      <h4>Language & Translations</h4>
      <p>Configure language settings:</p>
      <ul>
        <li><strong>Default Language:</strong> Language for new users (English or Greek)</li>
        <li><strong>Your Language:</strong> Your personal preference</li>
        <li><strong>Manage Translations:</strong> Customize any text in the application</li>
      </ul>
      <p>The Translation Manager allows you to override any default text with your own custom translations for each language.</p>
      
      <h4>System Settings</h4>
      <ul>
        <li><strong>Work Hours:</strong> Default start/end times</li>
        <li><strong>Max Hours/Day:</strong> Default limit per person</li>
        <li><strong>Max Projects/Day:</strong> Default project limit</li>
        <li><strong>Conflict Detection:</strong> Auto-detect issues</li>
      </ul>
      
      <h4>Preview</h4>
      <p>Changes are previewed in real-time. Click Save to apply.</p>
    `
  }
};

function showHelp() {
  const view = state.currentView;
  const help = helpContent[view] || {
    title: 'Help',
    content: '<p>Help content not available for this page.</p>'
  };
  
  showModal(help.title, `
    <div class="help-content">
      ${help.content}
      <div class="help-footer">
        <a href="/manual.html" target="_blank" class="btn btn-secondary">
          <i class="fas fa-book"></i> View Full Manual
        </a>
        <button class="btn btn-primary" onclick="closeModal()">Got it!</button>
      </div>
    </div>
  `);
}

// ===== Branding System =====
const defaultBranding = {
  companyName: 'Resource Scheduler',
  logoUrl: '',
  logoIcon: 'fa-calendar-check',
  primaryColor: '#6366f1',
  footerText: '© 2026 Resource Scheduler. All rights reserved.',
  supportEmail: ''
};

let branding = { ...defaultBranding };

async function loadBranding(usePublic = false) {
  try {
    let settings;
    if (usePublic) {
      // Use public endpoint (no auth required) - for login page
      const response = await fetch(`${API_BASE}/settings/public`);
      if (!response.ok) throw new Error('Failed to load public settings');
      settings = await response.json();
    } else {
      // Use authenticated endpoint
      settings = await api('/settings');
    }
    branding = {
      companyName: settings.company_name || defaultBranding.companyName,
      logoUrl: settings.logo_url || '',
      logoIcon: settings.logo_icon || defaultBranding.logoIcon,
      primaryColor: settings.primary_color || defaultBranding.primaryColor,
      footerText: settings.footer_text || defaultBranding.footerText,
      supportEmail: settings.support_email || ''
    };
    applyBranding();
  } catch (error) {
    console.log('Using default branding');
    applyBranding();
  }
}

function applyBranding() {
  // Update app name
  const appNameEl = document.getElementById('app-name');
  if (appNameEl) appNameEl.textContent = branding.companyName;
  
  // Update logo
  const logoIconEl = document.getElementById('logo-icon');
  if (logoIconEl) {
    if (branding.logoUrl) {
      logoIconEl.innerHTML = `<img src="${branding.logoUrl}" alt="Logo" class="logo-image">`;
    } else {
      logoIconEl.innerHTML = `<i class="fas ${branding.logoIcon}"></i>`;
    }
  }
  
  // Update primary color
  document.documentElement.style.setProperty('--primary', branding.primaryColor);
  document.documentElement.style.setProperty('--primary-dark', adjustColor(branding.primaryColor, -20));
  
  // Update footer
  const footerTextEl = document.getElementById('footer-text');
  if (footerTextEl) footerTextEl.textContent = branding.footerText;
  
  // Update page title
  document.title = branding.companyName;
}

function adjustColor(color, amount) {
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}

function loadSettings() {
  if (!canManageUsers()) {
    showToast('Access denied', 'error');
    return;
  }
  
  // Populate form with current values
  document.getElementById('setting-company-name').value = branding.companyName;
  document.getElementById('setting-logo-url').value = branding.logoUrl;
  document.getElementById('setting-primary-color').value = branding.primaryColor;
  document.getElementById('setting-primary-color-hex').value = branding.primaryColor;
  document.getElementById('setting-footer-text').value = branding.footerText;
  document.getElementById('setting-support-email').value = branding.supportEmail || '';
  
  // Select current icon
  document.querySelectorAll('.icon-option').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.icon === branding.logoIcon);
  });
  
  // Update preview
  updateBrandingPreview();
  
  // Load system settings
  loadSystemSettings();
  
  // Load language settings
  loadLanguageSettings();
}

async function loadSystemSettings() {
  try {
    const settings = await api('/settings');
    document.getElementById('setting-work-start').value = settings.work_hours_start || 9;
    document.getElementById('setting-work-end').value = settings.work_hours_end || 18;
    document.getElementById('setting-max-hours').value = settings.default_max_hours_per_day || 8;
    document.getElementById('setting-max-projects').value = settings.default_max_projects_per_day || 3;
    document.getElementById('setting-auto-conflicts').checked = settings.auto_detect_conflicts !== false;
    document.getElementById('setting-allow-overtime').checked = settings.allow_overtime === true;
  } catch (error) {
    console.error('Failed to load system settings:', error);
  }
}

function updateBrandingPreview() {
  const name = document.getElementById('setting-company-name').value || defaultBranding.companyName;
  const logoUrl = document.getElementById('setting-logo-url').value;
  const color = document.getElementById('setting-primary-color').value;
  const footer = document.getElementById('setting-footer-text').value || defaultBranding.footerText;
  const selectedIcon = document.querySelector('.icon-option.selected');
  const icon = selectedIcon ? selectedIcon.dataset.icon : defaultBranding.logoIcon;
  
  // Update preview logo
  const previewLogo = document.getElementById('preview-logo');
  if (previewLogo) {
    const iconHtml = logoUrl 
      ? `<img src="${logoUrl}" alt="Logo" class="logo-image">` 
      : `<i class="fas ${icon}"></i>`;
    previewLogo.innerHTML = `
      <div class="preview-logo-icon" style="background: linear-gradient(135deg, ${color}, ${adjustColor(color, 40)})">${iconHtml}</div>
      <span class="preview-logo-text">${name}</span>
    `;
  }
  
  // Update preview footer
  const previewFooter = document.getElementById('preview-footer');
  if (previewFooter) previewFooter.textContent = footer;
  
  // Update current logo preview
  const currentLogoPreview = document.getElementById('current-logo-preview');
  if (currentLogoPreview) {
    if (logoUrl) {
      currentLogoPreview.innerHTML = `<img src="${logoUrl}" alt="Logo" class="logo-image">`;
    } else {
      currentLogoPreview.innerHTML = `<i class="fas ${icon}"></i>`;
    }
  }
}

async function saveBranding(e) {
  e.preventDefault();
  
  const selectedIcon = document.querySelector('.icon-option.selected');
  const newBranding = {
    company_name: document.getElementById('setting-company-name').value || defaultBranding.companyName,
    logo_url: document.getElementById('setting-logo-url').value,
    logo_icon: selectedIcon ? selectedIcon.dataset.icon : defaultBranding.logoIcon,
    primary_color: document.getElementById('setting-primary-color').value,
    footer_text: document.getElementById('setting-footer-text').value || defaultBranding.footerText,
    support_email: document.getElementById('setting-support-email').value
  };
  
  try {
    // Save each setting
    for (const [key, value] of Object.entries(newBranding)) {
      await api('/settings', {
        method: 'PUT',
        body: JSON.stringify({ key, value })
      });
    }
    
    // Update local branding
    branding = {
      companyName: newBranding.company_name,
      logoUrl: newBranding.logo_url,
      logoIcon: newBranding.logo_icon,
      primaryColor: newBranding.primary_color,
      footerText: newBranding.footer_text,
      supportEmail: newBranding.support_email
    };
    
    applyBranding();
    showToast('Branding saved successfully');
  } catch (error) {
    showToast('Failed to save branding: ' + error.message, 'error');
  }
}

async function saveSystemSettings(e) {
  e.preventDefault();
  
  const settings = {
    work_hours_start: document.getElementById('setting-work-start').value,
    work_hours_end: document.getElementById('setting-work-end').value,
    default_max_hours_per_day: document.getElementById('setting-max-hours').value,
    default_max_projects_per_day: document.getElementById('setting-max-projects').value,
    auto_detect_conflicts: document.getElementById('setting-auto-conflicts').checked ? '1' : '0',
    allow_overtime: document.getElementById('setting-allow-overtime').checked ? '1' : '0'
  };
  
  try {
    for (const [key, value] of Object.entries(settings)) {
      await api('/settings', {
        method: 'PUT',
        body: JSON.stringify({ key, value: String(value) })
      });
    }
    showToast('Settings saved successfully');
  } catch (error) {
    showToast('Failed to save settings: ' + error.message, 'error');
  }
}

function resetBranding() {
  if (!confirm('Reset all branding to default values?')) return;
  
  document.getElementById('setting-company-name').value = defaultBranding.companyName;
  document.getElementById('setting-logo-url').value = '';
  document.getElementById('setting-primary-color').value = defaultBranding.primaryColor;
  document.getElementById('setting-primary-color-hex').value = defaultBranding.primaryColor;
  document.getElementById('setting-footer-text').value = defaultBranding.footerText;
  document.getElementById('setting-support-email').value = '';
  
  document.querySelectorAll('.icon-option').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.icon === defaultBranding.logoIcon);
  });
  
  updateBrandingPreview();
  showToast('Branding reset to defaults. Click Save to apply.');
}

// ===== Language & Translation Management =====
let translationsCache = {};
let customTranslationsCache = {};

async function loadLanguageSettings() {
  try {
    const settings = await api('/settings');
    const defaultLang = settings.default_language || 'en';
    const userLang = localStorage.getItem('scheduler_language') || defaultLang;
    
    document.getElementById('setting-default-language').value = defaultLang;
    document.getElementById('setting-user-language').value = userLang;
    
    // Initialize i18n if available
    if (window.i18n) {
      await window.i18n.init();
    }
  } catch (error) {
    console.error('Failed to load language settings:', error);
  }
}

async function saveLanguageSetting() {
  const defaultLang = document.getElementById('setting-default-language').value;
  
  try {
    await api('/settings', {
      method: 'PUT',
      body: JSON.stringify({ key: 'default_language', value: defaultLang })
    });
    showToast('Default language saved');
  } catch (error) {
    showToast('Failed to save language setting', 'error');
  }
}

async function changeUserLanguage(langCode) {
  localStorage.setItem('scheduler_language', langCode);
  
  if (window.i18n) {
    await window.i18n.setLanguage(langCode);
  }
  
  showToast(`Language changed to ${langCode === 'el' ? 'Greek' : 'English'}. Some text will update on next page load.`);
}

async function openTranslationModal() {
  document.getElementById('translation-modal').classList.remove('hidden');
  
  // Load base translations
  const lang = document.getElementById('translation-language').value;
  await loadTranslationsForLanguage(lang);
}

function closeTranslationModal() {
  document.getElementById('translation-modal').classList.add('hidden');
}

async function loadTranslationsForLanguage(langCode) {
  if (!langCode) {
    langCode = document.getElementById('translation-language').value;
  }
  
  try {
    // Load base translations
    if (!translationsCache[langCode]) {
      const response = await fetch(`/i18n/${langCode}.json`);
      if (response.ok) {
        translationsCache[langCode] = await response.json();
      }
    }
    
    // Load custom translations
    try {
      const customResponse = await api(`/translations/${langCode}`);
      customTranslationsCache[langCode] = customResponse.translations || {};
    } catch (e) {
      customTranslationsCache[langCode] = {};
    }
    
    // Render translation list
    renderTranslationList(langCode);
  } catch (error) {
    console.error('Failed to load translations:', error);
    showToast('Failed to load translations', 'error');
  }
}

function renderTranslationList(langCode) {
  const container = document.getElementById('translation-list');
  const baseTranslations = translationsCache[langCode] || {};
  const customTranslations = customTranslationsCache[langCode] || {};
  const searchTerm = document.getElementById('translation-search').value.toLowerCase();
  
  // Flatten translations for display
  const flatBase = flattenObject(baseTranslations);
  const flatCustom = flattenObject(customTranslations);
  
  // Group by category (first part of key)
  const categories = {};
  for (const [key, value] of Object.entries(flatBase)) {
    if (key === 'meta' || key.startsWith('meta.')) continue;
    if (typeof value !== 'string') continue;
    
    // Filter by search
    if (searchTerm && !key.toLowerCase().includes(searchTerm) && !value.toLowerCase().includes(searchTerm)) {
      continue;
    }
    
    const category = key.split('.')[0];
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push({ key, defaultValue: value, customValue: flatCustom[key] || '' });
  }
  
  // Render HTML
  let html = '';
  for (const [category, items] of Object.entries(categories)) {
    html += `<div class="translation-category">${category}</div>`;
    
    for (const item of items) {
      const hasCustom = item.customValue && item.customValue !== item.defaultValue;
      html += `
        <div class="translation-item" data-key="${item.key}">
          <div class="translation-key">
            <code>${item.key}</code>
            <div class="default-value">${escapeHtml(item.defaultValue)}</div>
          </div>
          <div class="translation-value">
            <input type="text" 
              value="${escapeHtml(item.customValue || '')}" 
              placeholder="${escapeHtml(item.defaultValue)}"
              onchange="saveTranslation('${langCode}', '${item.key}', this.value)">
            ${hasCustom ? `
              <div class="custom-indicator">
                <span>✓ Custom value</span>
                <button class="reset-btn" onclick="resetTranslation('${langCode}', '${item.key}')">Reset</button>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }
  }
  
  container.innerHTML = html || '<div class="p-4 text-center text-muted">No translations found</div>';
}

function filterTranslations() {
  const langCode = document.getElementById('translation-language').value;
  renderTranslationList(langCode);
}

async function saveTranslation(langCode, key, value) {
  try {
    if (value.trim() === '') {
      // Reset to default
      await resetTranslation(langCode, key);
      return;
    }
    
    await api(`/translations/${langCode}/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value })
    });
    
    // Update cache
    if (!customTranslationsCache[langCode]) {
      customTranslationsCache[langCode] = {};
    }
    setNestedValue(customTranslationsCache[langCode], key, value);
    
    // Update i18n if available
    if (window.i18n && window.i18n.customTranslations) {
      if (!window.i18n.customTranslations[langCode]) {
        window.i18n.customTranslations[langCode] = {};
      }
      setNestedValue(window.i18n.customTranslations[langCode], key, value);
    }
    
    // Re-render
    renderTranslationList(langCode);
    showToast('Translation saved');
  } catch (error) {
    showToast('Failed to save translation', 'error');
  }
}

async function resetTranslation(langCode, key) {
  try {
    await api(`/translations/${langCode}/${key}`, {
      method: 'DELETE'
    });
    
    // Update cache
    if (customTranslationsCache[langCode]) {
      deleteNestedValue(customTranslationsCache[langCode], key);
    }
    
    // Re-render
    await loadTranslationsForLanguage(langCode);
    showToast('Translation reset to default');
  } catch (error) {
    showToast('Failed to reset translation', 'error');
  }
}

async function resetTranslations() {
  const langCode = document.getElementById('translation-language').value;
  const langName = langCode === 'el' ? 'Greek' : 'English';
  
  if (!confirm(`Reset ALL custom translations for ${langName}? This cannot be undone.`)) {
    return;
  }
  
  try {
    await api(`/translations/${langCode}`, {
      method: 'DELETE'
    });
    
    customTranslationsCache[langCode] = {};
    await loadTranslationsForLanguage(langCode);
    showToast(`All ${langName} translations reset to defaults`);
  } catch (error) {
    showToast('Failed to reset translations', 'error');
  }
}

async function exportTranslations() {
  const langCode = document.getElementById('translation-language').value;
  window.open(`/api/translations/export/${langCode}`, '_blank');
}

// Helper functions for translation management
function flattenObject(obj, prefix = '') {
  const result = {};
  for (const [key, value] of Object.entries(obj || {})) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, fullKey));
    } else {
      result[fullKey] = value;
    }
  }
  return result;
}

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

function deleteNestedValue(obj, path) {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) return;
    current = current[parts[i]];
  }
  delete current[parts[parts.length - 1]];
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
}

// ===== Role-Based Access Control =====
function canEdit() {
  return state.user && ['admin', 'scheduler'].includes(state.user.role);
}

function canExport() {
  return state.user && ['admin', 'scheduler'].includes(state.user.role);
}

function canManageUsers() {
  return state.user && state.user.role === 'admin';
}

function hasPermission(permission) {
  return state.permissions.includes(permission);
}

// Update UI based on role
function updateUIForRole() {
  if (!state.user) return;
  
  const role = state.user.role;
  
  // Show/hide add buttons based on role
  const addButtons = ['add-assignment-btn', 'quick-add-btn', 'add-person-btn', 'add-project-btn', 'add-skill-btn'];
  addButtons.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.style.display = canEdit() ? '' : 'none';
    }
  });
  
  // Show/hide export buttons
  const exportButtons = ['export-excel-btn', 'export-pdf-btn'];
  exportButtons.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.style.display = canExport() ? '' : 'none';
    }
  });
  
  // Show/hide user management nav item
  const usersNavItem = document.querySelector('[data-view="users"]');
  if (usersNavItem) {
    usersNavItem.style.display = canManageUsers() ? '' : 'none';
  }
  
  // Show/hide detect conflicts button (admin/scheduler only)
  const detectConflictsBtn = document.getElementById('detect-conflicts-btn');
  if (detectConflictsBtn) {
    detectConflictsBtn.style.display = canEdit() ? '' : 'none';
  }
  
  // Update role badge styling
  const roleBadge = document.querySelector('.user-role');
  if (roleBadge) {
    roleBadge.className = `user-role role-${role}`;
  }
  
  // Show role-restricted message where needed
  updateRoleMessages();
}

function updateRoleMessages() {
  // Add viewer notice to reports view
  const reportsView = document.getElementById('reports-view');
  if (reportsView && !canExport()) {
    const notice = reportsView.querySelector('.role-notice');
    if (!notice) {
      const noticeDiv = document.createElement('div');
      noticeDiv.className = 'role-notice warning';
      noticeDiv.innerHTML = `
        <i class="fas fa-info-circle"></i>
        <span>You have view-only access. Contact an administrator or scheduler to export reports.</span>
      `;
      reportsView.querySelector('.view-header')?.after(noticeDiv);
    }
  }
}

// ===== API Helper =====
async function api(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (state.token) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }
  
  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers
  });
  
  if (response.status === 401) {
    logout();
    throw new Error('Session expired');
  }
  
  // Check content type to avoid parsing HTML as JSON
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    console.error('Non-JSON response:', response.status, response.url);
    throw new Error(`Server error (${response.status}). Please try again.`);
  }
  
  if (response.status === 403) {
    const data = await response.json();
    showToast(data.message || 'Access denied. Insufficient permissions.', 'error');
    throw new Error(data.error || 'Permission denied');
  }
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }
  
  return data;
}

// ===== Toast Notifications =====
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icons = {
    success: 'fa-check',
    error: 'fa-times',
    warning: 'fa-exclamation'
  };
  
  toast.innerHTML = `
    <div class="toast-icon"><i class="fas ${icons[type]}"></i></div>
    <span class="toast-message">${message}</span>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'toastIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ===== Modal =====
function showModal(title, content) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = content;
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

// ===== Authentication =====
async function login(username, password) {
  try {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    
    state.token = data.token;
    state.user = data.user;
    state.permissions = data.permissions || [];
    localStorage.setItem('scheduler_token', data.token);
    
    showApp();
    showToast(`Welcome back, ${data.user.firstName || data.user.username}!`, 'success');
  } catch (error) {
    throw error;
  }
}

function logout() {
  state.token = null;
  state.user = null;
  state.permissions = [];
  localStorage.removeItem('scheduler_token');
  showLogin();
}

async function checkAuth() {
  if (!state.token) {
    showLogin();
    return;
  }
  
  try {
    const userData = await api('/auth/me');
    state.user = userData;
    state.permissions = userData.permissions || [];
    showApp();
  } catch (error) {
    showLogin();
  }
}

function showLogin() {
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
  // Hide mobile navigation on login screen
  document.getElementById('mobile-bottom-nav')?.classList.add('hidden');
  document.getElementById('mobile-more-menu')?.classList.remove('active');
}

function showApp() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  // Show mobile navigation after login
  document.getElementById('mobile-bottom-nav')?.classList.remove('hidden');
  
  // Update user info
  if (state.user) {
    document.querySelector('.user-name').textContent = 
      `${state.user.firstName || ''} ${state.user.lastName || state.user.username}`.trim();
    
    const roleDisplay = {
      admin: 'Administrator',
      manager: 'Manager',
      scheduler: 'Scheduler',
      viewer: 'Viewer'
    };
    document.querySelector('.user-role').textContent = roleDisplay[state.user.role] || state.user.role;
  }
  
  // Set current date
  document.getElementById('current-date').textContent = 
    new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  // Update UI for role
  updateUIForRole();
  
  // Load branding settings
  loadBranding();
  
  loadDashboard();
}

// ===== View Navigation =====
function switchView(viewName) {
  // Check permissions for users view
  if (viewName === 'users' && !canManageUsers()) {
    showToast('Access denied. Administrator privileges required.', 'error');
    return;
  }
  
  // Check permissions for settings view
  if (viewName === 'settings' && !canManageUsers()) {
    showToast('Access denied. Administrator privileges required.', 'error');
    return;
  }
  
  state.currentView = viewName;
  
  // Update nav
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.view === viewName);
  });
  
  // Update views
  document.querySelectorAll('.view').forEach(view => {
    view.classList.toggle('active', view.id === `${viewName}-view`);
  });
  
  // Update title
  const titles = {
    dashboard: 'Dashboard',
    schedule: 'Schedule',
    people: 'People',
    projects: 'Projects',
    skills: 'Skills',
    conflicts: 'Conflicts',
    'ai-scheduler': 'AI Schedule Optimizer',
    reports: 'Reports',
    users: 'User Management',
    settings: 'System Settings'
  };
  document.getElementById('page-title').textContent = titles[viewName] || viewName;
  
  // Load view data
  switch (viewName) {
    case 'dashboard': loadDashboard(); break;
    case 'schedule': loadSchedule(); break;
    case 'people': loadPeople(); break;
    case 'projects': loadProjects(); break;
    case 'skills': loadSkills(); break;
    case 'conflicts': loadConflicts(); break;
    case 'ai-scheduler': loadAIScheduler(); break;
    case 'reports': loadReports(); break;
    case 'users': loadUsers(); break;
    case 'settings': loadSettings(); break;
  }
}

// ===== Dashboard =====
async function loadDashboard() {
  try {
    const data = await api('/analytics/dashboard');
    
    // Update stats
    document.getElementById('stat-people').textContent = data.metrics.totalPeople;
    document.getElementById('stat-projects').textContent = data.metrics.totalProjects;
    document.getElementById('stat-hours').textContent = data.today.total_hours || 0;
    document.getElementById('stat-conflicts').textContent = data.metrics.unresolvedConflicts;
    
    // Update conflict badge
    const conflictBadge = document.getElementById('conflict-badge');
    if (data.metrics.unresolvedConflicts > 0) {
      conflictBadge.textContent = data.metrics.unresolvedConflicts;
      conflictBadge.classList.remove('hidden');
    } else {
      conflictBadge.classList.add('hidden');
    }
    
    // Today's timeline
    const timeline = document.getElementById('today-timeline');
    const today = new Date().toISOString().split('T')[0];
    const todaySchedule = await api(`/assignments/daily/${today}`);
    
    if (todaySchedule.schedule.length === 0) {
      timeline.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-calendar-check"></i>
          <h3>No assignments today</h3>
          <p>Schedule some work to get started</p>
        </div>
      `;
    } else {
      timeline.innerHTML = todaySchedule.schedule.slice(0, 10).map(person => 
        person.assignments.map(a => `
          <div class="timeline-item" style="border-left-color: ${a.projectColor}">
            <span class="timeline-time">${a.startHour}:00 - ${a.endHour}:00</span>
            <span class="timeline-person">${person.firstName} ${person.lastName}</span>
            <span class="timeline-project">
              <span class="color-dot" style="background: ${a.projectColor}"></span>
              ${a.projectName}
            </span>
          </div>
        `).join('')
      ).join('');
    }
    
    // Utilization chart
    const chartContainer = document.getElementById('utilization-chart');
    if (data.weeklyHours.length > 0) {
      const maxHours = Math.max(...data.weeklyHours.map(d => d.hours || 0), 1);
      chartContainer.innerHTML = data.weeklyHours.map(d => {
        const height = ((d.hours || 0) / maxHours * 100);
        const dayName = new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' });
        return `
          <div class="chart-bar" style="height: ${Math.max(height, 5)}%">
            <span class="chart-bar-value">${d.hours || 0}h</span>
            <span class="chart-bar-label">${dayName}</span>
          </div>
        `;
      }).join('');
    } else {
      chartContainer.innerHTML = '<div class="empty-state"><p>No data available</p></div>';
    }
    
    // Top utilized
    const topList = document.getElementById('top-utilized-list');
    if (data.topUtilized.length === 0) {
      topList.innerHTML = '<div class="empty-state"><p>No utilization data</p></div>';
    } else {
      topList.innerHTML = data.topUtilized.slice(0, 5).map(p => `
        <div class="list-item">
          <div class="list-item-left">
            <div class="list-item-avatar">${p.name.charAt(0)}</div>
            <div>
              <span class="list-item-name">${p.name}</span>
              <span class="list-item-sub">${p.department || 'No department'}</span>
            </div>
          </div>
          <span class="list-item-value">${p.totalHours}h</span>
        </div>
      `).join('');
    }
    
    // Conflicts list
    const conflictsList = document.getElementById('conflicts-list');
    const conflicts = await api('/conflicts?resolved=false');
    
    if (conflicts.data.length === 0) {
      conflictsList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-check-circle"></i>
          <p>No active conflicts</p>
        </div>
      `;
    } else {
      conflictsList.innerHTML = conflicts.data.slice(0, 5).map(c => `
        <div class="list-item">
          <div class="list-item-left">
            <div class="conflict-severity ${c.severity}"></div>
            <div>
              <span class="list-item-name">${c.type.replace('_', ' ')}</span>
              <span class="list-item-sub">${c.description.substring(0, 50)}...</span>
            </div>
          </div>
          <span class="conflict-date">${c.date}</span>
        </div>
      `).join('');
    }
    
    // Skill demand
    const skillList = document.getElementById('skill-demand-list');
    if (data.skillDemand.length === 0) {
      skillList.innerHTML = '<div class="empty-state"><p>No skill data</p></div>';
    } else {
      skillList.innerHTML = data.skillDemand.slice(0, 5).map(s => `
        <div class="list-item">
          <div class="list-item-left">
            <div class="list-item-avatar" style="background: ${s.color}20; color: ${s.color}">${s.name.charAt(0)}</div>
            <div>
              <span class="list-item-name">${s.name}</span>
              <span class="list-item-sub">${s.projectsRequiring} projects need this</span>
            </div>
          </div>
          <span class="list-item-value">${s.peopleWithSkill} people</span>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Dashboard error:', error);
    showToast('Failed to load dashboard', 'error');
  }
}

// ===== Schedule =====
async function loadSchedule() {
  try {
    const dateInput = document.getElementById('schedule-date');
    dateInput.value = state.scheduleDate;
    
    const content = document.getElementById('schedule-content');
    
    if (state.scheduleViewType === 'day') {
      const data = await api(`/assignments/daily/${state.scheduleDate}`);
      
      if (data.schedule.length === 0) {
        content.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-calendar-times"></i>
            <h3>No assignments for this day</h3>
            <p>${canEdit() ? 'Click "Add Assignment" to schedule work' : 'No work scheduled for this date'}</p>
          </div>
        `;
        return;
      }
      
      // Build schedule grid
      let html = '<div class="schedule-grid">';
      
      // Header row
      html += '<div class="schedule-header-row">';
      html += '<div class="schedule-header-cell">Person</div>';
      for (let h = 0; h < 24; h++) {
        html += `<div class="schedule-header-cell">${h}:00</div>`;
      }
      html += '</div>';
      
      // Person rows
      for (const person of data.schedule) {
        html += '<div class="schedule-row">';
        html += `
          <div class="schedule-person-cell">
            <div class="schedule-person-avatar">${person.firstName.charAt(0)}${person.lastName.charAt(0)}</div>
            <div class="schedule-person-info">
              <span class="schedule-person-name">${person.firstName} ${person.lastName}</span>
              <span class="schedule-person-dept">${person.department || ''}</span>
            </div>
          </div>
        `;
        
        // Hour cells with assignments
        for (let h = 0; h < 24; h++) {
          const assignment = person.assignments.find(a => a.startHour <= h && a.endHour > h);
          html += '<div class="schedule-hour-cell">';
          if (assignment && assignment.startHour === h) {
            const width = (assignment.endHour - assignment.startHour);
            html += `
              <div class="schedule-assignment" 
                   style="background: ${assignment.projectColor}; width: calc(${width * 100}% - 4px);"
                   onclick="showAssignmentDetails(${assignment.id})"
                   title="${assignment.projectName}">
                ${assignment.projectName}
              </div>
            `;
          }
          html += '</div>';
        }
        html += '</div>';
      }
      
      html += '</div>';
      content.innerHTML = html;
    } else {
      // Week view
      const data = await api(`/assignments/weekly/${state.scheduleDate}`);
      
      let html = '<div class="week-view">';
      for (const day of data.days) {
        html += `
          <div class="week-day-card">
            <div class="week-day-header">
              <span class="week-day-name">${day.dayName}</span>
              <span class="week-day-date">${day.date}</span>
            </div>
            <div class="week-day-assignments">
              ${day.assignments.length === 0 ? '<p class="text-muted">No assignments</p>' : 
                day.assignments.slice(0, 5).map(a => `
                  <div class="week-assignment" style="border-left-color: ${a.projectColor}">
                    <span>${a.personName}</span>
                    <span>${a.startHour}:00 - ${a.endHour}:00</span>
                  </div>
                `).join('')}
            </div>
          </div>
        `;
      }
      html += '</div>';
      content.innerHTML = html;
    }
  } catch (error) {
    console.error('Schedule error:', error);
    showToast('Failed to load schedule', 'error');
  }
}

function changeScheduleDate(offset) {
  const date = new Date(state.scheduleDate);
  date.setDate(date.getDate() + offset);
  state.scheduleDate = date.toISOString().split('T')[0];
  loadSchedule();
}

// ===== People =====
async function loadPeople() {
  try {
    const search = document.getElementById('people-search').value;
    const department = document.getElementById('people-department-filter').value;
    
    let url = '/people?active=true';
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (department) url += `&department=${encodeURIComponent(department)}`;
    
    const data = await api(url);
    
    // Load departments for filter
    const departments = await api('/people/meta/departments');
    const deptFilter = document.getElementById('people-department-filter');
    if (deptFilter.options.length <= 1) {
      departments.forEach(d => {
        const option = document.createElement('option');
        option.value = d;
        option.textContent = d;
        deptFilter.appendChild(option);
      });
    }
    
    const grid = document.getElementById('people-grid');
    
    if (data.data.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-users"></i>
          <h3>No people found</h3>
          <p>${canEdit() ? 'Add team members to get started' : 'No team members match your search'}</p>
        </div>
      `;
      return;
    }
    
    grid.innerHTML = data.data.map(p => `
      <div class="grid-card" onclick="showPersonDetails(${p.id})">
        <div class="grid-card-header">
          <div class="grid-card-avatar">${p.firstName.charAt(0)}${p.lastName.charAt(0)}</div>
          <div>
            <div class="grid-card-title">${p.firstName} ${p.lastName}</div>
            <div class="grid-card-subtitle">${p.jobTitle || p.department || 'No title'}</div>
          </div>
        </div>
        <div class="grid-card-body">
          <div class="grid-card-tags">
            ${(p.skills || []).slice(0, 3).map(s => `<span class="tag">${s}</span>`).join('')}
            ${p.skills && p.skills.length > 3 ? `<span class="tag">+${p.skills.length - 3}</span>` : ''}
          </div>
        </div>
        <div class="grid-card-footer">
          <div class="grid-card-stat">
            <span class="grid-card-stat-value">${p.maxHoursPerDay}</span>
            <span class="grid-card-stat-label">Max Hours</span>
          </div>
          <div class="grid-card-stat">
            <span class="grid-card-stat-value">${p.employmentType}</span>
            <span class="grid-card-stat-label">Type</span>
          </div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('People error:', error);
    showToast('Failed to load people', 'error');
  }
}

async function showPersonDetails(id) {
  try {
    const person = await api(`/people/${id}`);
    
    showModal(`${person.firstName} ${person.lastName}`, `
      <div class="person-details">
        <div class="detail-row">
          <span class="detail-label">Email</span>
          <span class="detail-value">${person.email}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Department</span>
          <span class="detail-value">${person.department || '-'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Job Title</span>
          <span class="detail-value">${person.jobTitle || '-'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Employment Type</span>
          <span class="detail-value">${person.employmentType}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Max Hours/Day</span>
          <span class="detail-value">${person.maxHoursPerDay}</span>
        </div>
        <h4 style="margin: 20px 0 10px;">Skills</h4>
        <div class="grid-card-tags">
          ${person.skills.map(s => `
            <span class="tag tag-primary">
              ${s.name}
              <span class="proficiency-dots">
                ${[1,2,3,4,5].map(l => `<span class="proficiency-dot ${l <= s.proficiencyLevel ? 'filled' : ''}"></span>`).join('')}
              </span>
            </span>
          `).join('')}
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal()">Close</button>
          ${canEdit() ? `<button class="btn btn-primary" onclick="editPerson(${id})">Edit</button>` : ''}
        </div>
      </div>
    `);
  } catch (error) {
    showToast('Failed to load person details', 'error');
  }
}

function showAddPersonModal() {
  if (!canEdit()) {
    showToast('You do not have permission to add people', 'error');
    return;
  }
  
  showModal('Add Person', `
    <form id="add-person-form" class="modal-form">
      <div class="form-row">
        <div class="form-group">
          <label>First Name *</label>
          <input type="text" name="firstName" required>
        </div>
        <div class="form-group">
          <label>Last Name *</label>
          <input type="text" name="lastName" required>
        </div>
      </div>
      <div class="form-group">
        <label>Email *</label>
        <input type="email" name="email" required>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Department</label>
          <input type="text" name="department">
        </div>
        <div class="form-group">
          <label>Job Title</label>
          <input type="text" name="jobTitle">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Max Hours/Day</label>
          <input type="number" name="maxHoursPerDay" value="8" min="1" max="24">
        </div>
        <div class="form-group">
          <label>Employment Type</label>
          <select name="employmentType">
            <option value="full-time">Full Time</option>
            <option value="part-time">Part Time</option>
            <option value="contractor">Contractor</option>
            <option value="intern">Intern</option>
          </select>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Add Person</button>
      </div>
    </form>
  `);
  
  document.getElementById('add-person-form').onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    try {
      await api('/people', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      closeModal();
      showToast('Person added successfully');
      loadPeople();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };
}

async function editPerson(id) {
  if (!canEdit()) {
    showToast('You do not have permission to edit people', 'error');
    return;
  }
  
  try {
    const [person, allSkills] = await Promise.all([
      api(`/people/${id}`),
      api('/skills?active=true')
    ]);
    
    // Create a map of person's current skills
    const personSkillsMap = new Map();
    person.skills.forEach(s => personSkillsMap.set(s.id, s));
    
    showModal(`Edit ${person.firstName} ${person.lastName}`, `
      <form id="edit-person-form" class="modal-form">
        <div class="form-row">
          <div class="form-group">
            <label>First Name *</label>
            <input type="text" name="firstName" value="${person.firstName}" required>
          </div>
          <div class="form-group">
            <label>Last Name *</label>
            <input type="text" name="lastName" value="${person.lastName}" required>
          </div>
        </div>
        <div class="form-group">
          <label>Email *</label>
          <input type="email" name="email" value="${person.email}" required>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Department</label>
            <input type="text" name="department" value="${person.department || ''}">
          </div>
          <div class="form-group">
            <label>Job Title</label>
            <input type="text" name="jobTitle" value="${person.jobTitle || ''}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Max Hours/Day</label>
            <input type="number" name="maxHoursPerDay" value="${person.maxHoursPerDay}" min="1" max="24">
          </div>
          <div class="form-group">
            <label>Employment Type</label>
            <select name="employmentType">
              <option value="full-time" ${person.employmentType === 'full-time' ? 'selected' : ''}>Full Time</option>
              <option value="part-time" ${person.employmentType === 'part-time' ? 'selected' : ''}>Part Time</option>
              <option value="contractor" ${person.employmentType === 'contractor' ? 'selected' : ''}>Contractor</option>
              <option value="intern" ${person.employmentType === 'intern' ? 'selected' : ''}>Intern</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Phone</label>
          <input type="tel" name="phone" value="${person.phone || ''}">
        </div>
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" name="isActive" ${person.isActive ? 'checked' : ''}>
            Active Employee
          </label>
        </div>
        
        <h4 style="margin: 20px 0 10px; border-top: 1px solid var(--border-color); padding-top: 20px;">
          <i class="fas fa-star"></i> Skills
        </h4>
        <p class="text-muted" style="margin-bottom: 15px; font-size: 0.85rem;">
          Assign skills and proficiency levels (1=Beginner, 5=Expert)
        </p>
        
        <div id="person-skills-list" class="skills-assignment-list">
          ${allSkills.data.map(skill => {
            const hasSkill = personSkillsMap.has(skill.id);
            const personSkill = personSkillsMap.get(skill.id);
            return `
              <div class="skill-assignment-row" data-skill-id="${skill.id}">
                <label class="checkbox-label skill-checkbox">
                  <input type="checkbox" class="skill-enabled" ${hasSkill ? 'checked' : ''}>
                  <span class="skill-name" style="color: ${skill.color}">${skill.name}</span>
                  <span class="skill-category">${skill.category || ''}</span>
                </label>
                <div class="skill-proficiency">
                  <label>Level:</label>
                  <select class="skill-level" ${!hasSkill ? 'disabled' : ''}>
                    ${[1,2,3,4,5].map(l => `<option value="${l}" ${personSkill?.proficiencyLevel === l ? 'selected' : ''}>${l}</option>`).join('')}
                  </select>
                </div>
              </div>
            `;
          }).join('')}
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </div>
      </form>
    `);
    
    // Add skill toggle listeners
    document.querySelectorAll('.skill-assignment-row').forEach(row => {
      const checkbox = row.querySelector('.skill-enabled');
      const levelSelect = row.querySelector('.skill-level');
      checkbox.addEventListener('change', () => {
        levelSelect.disabled = !checkbox.checked;
        if (checkbox.checked) levelSelect.value = '3';
      });
    });
    
    document.getElementById('edit-person-form').onsubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      
      // Collect selected skills
      const skills = [];
      document.querySelectorAll('.skill-assignment-row').forEach(row => {
        const checkbox = row.querySelector('.skill-enabled');
        if (checkbox.checked) {
          skills.push({
            skillId: parseInt(row.dataset.skillId),
            proficiencyLevel: parseInt(row.querySelector('.skill-level').value)
          });
        }
      });
      
      const data = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        department: formData.get('department'),
        jobTitle: formData.get('jobTitle'),
        maxHoursPerDay: parseInt(formData.get('maxHoursPerDay')),
        employmentType: formData.get('employmentType'),
        phone: formData.get('phone'),
        isActive: formData.get('isActive') === 'on'
      };
      
      try {
        // Update person info
        await api(`/people/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        });
        
        // Update person skills
        await api(`/people/${id}/skills`, {
          method: 'PUT',
          body: JSON.stringify({ skills })
        });
        
        closeModal();
        showToast('Person updated successfully');
        loadPeople();
      } catch (error) {
        showToast(error.message, 'error');
      }
    };
  } catch (error) {
    showToast('Failed to load person details', 'error');
  }
}

// ===== Projects =====
async function loadProjects() {
  try {
    const search = document.getElementById('projects-search').value;
    const status = document.getElementById('projects-status-filter').value;
    
    let url = '/projects';
    const params = [];
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    if (status) params.push(`status=${status}`);
    if (params.length) url += '?' + params.join('&');
    
    const data = await api(url);
    const grid = document.getElementById('projects-grid');
    
    if (data.data.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-folder-open"></i>
          <h3>No projects found</h3>
          <p>${canEdit() ? 'Create a project to start scheduling' : 'No projects match your search'}</p>
        </div>
      `;
      return;
    }
    
    grid.innerHTML = data.data.map(p => `
      <div class="grid-card" onclick="showProjectDetails(${p.id})">
        <div class="grid-card-header">
          <div class="grid-card-avatar" style="background: ${p.color}">${p.name.substring(0, 2).toUpperCase()}</div>
          <div>
            <div class="grid-card-title">${p.name}</div>
            <div class="grid-card-subtitle">${p.client || 'No client'}</div>
          </div>
        </div>
        <div class="grid-card-body">
          <span class="status-badge ${p.status}">${p.status}</span>
          <span class="tag" style="margin-left: 8px;">${p.priority} priority</span>
        </div>
        <div class="grid-card-footer">
          <div class="grid-card-stat">
            <span class="grid-card-stat-value">${p.assignedPeople}</span>
            <span class="grid-card-stat-label">People</span>
          </div>
          <div class="grid-card-stat">
            <span class="grid-card-stat-value">${p.assignmentCount}</span>
            <span class="grid-card-stat-label">Assignments</span>
          </div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Projects error:', error);
    showToast('Failed to load projects', 'error');
  }
}

async function showProjectDetails(id) {
  try {
    const project = await api(`/projects/${id}`);
    
    showModal(project.name, `
      <div class="project-details">
        <div class="detail-row">
          <span class="detail-label">Status</span>
          <span class="status-badge ${project.status}">${project.status}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Priority</span>
          <span class="detail-value">${project.priority}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Client</span>
          <span class="detail-value">${project.client || '-'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Budget Hours</span>
          <span class="detail-value">${project.budgetHours || '-'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Hours Used</span>
          <span class="detail-value">${project.statistics.totalHours}</span>
        </div>
        <h4 style="margin: 20px 0 10px;"><i class="fas fa-users"></i> Required Skills & Staffing</h4>
        ${project.skills.length === 0 ? '<p class="text-muted">No skill requirements defined</p>' : `
          <div class="skill-requirements-list">
            ${project.skills.map(s => `
              <div class="skill-requirement-item">
                <div class="skill-req-info">
                  <span class="skill-req-name" style="color: ${s.color || '#6366f1'}">${s.name}</span>
                  <span class="skill-req-level">Level ${s.requiredProficiency}+</span>
                  ${s.isMandatory ? '<span class="tag tag-primary">Required</span>' : '<span class="tag">Optional</span>'}
                </div>
                <div class="skill-req-count">
                  <strong>${s.peopleNeeded || 1}</strong> ${(s.peopleNeeded || 1) === 1 ? 'person' : 'people'} needed
                </div>
              </div>
            `).join('')}
          </div>
        `}
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal()">Close</button>
          ${canEdit() ? `<button class="btn btn-secondary" onclick="editProject(${id})"><i class="fas fa-edit"></i> Edit</button>` : ''}
          <button class="btn btn-primary" onclick="findCandidates(${id})">Find Candidates</button>
        </div>
      </div>
    `);
  } catch (error) {
    showToast('Failed to load project details', 'error');
  }
}

async function findCandidates(projectId) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const data = await api(`/matching/project/${projectId}/candidates?date=${today}`);
    
    showModal(`Best Candidates for ${data.projectName}`, `
      <div class="candidates-list">
        ${data.candidates.length === 0 ? '<p>No candidates found matching the required skills.</p>' :
          data.candidates.map(c => `
            <div class="list-item">
              <div class="list-item-left">
                <div class="list-item-avatar">${c.firstName.charAt(0)}${c.lastName.charAt(0)}</div>
                <div>
                  <span class="list-item-name">${c.firstName} ${c.lastName}</span>
                  <span class="list-item-sub">${c.department || ''} • ${c.matchScore}% match</span>
                </div>
              </div>
              ${c.mandatorySkillsMet ? '<span class="tag tag-primary">All Required</span>' : '<span class="tag">Partial</span>'}
            </div>
          `).join('')}
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal()">Close</button>
        </div>
      </div>
    `);
  } catch (error) {
    showToast('Failed to find candidates', 'error');
  }
}

async function showAddProjectModal() {
  if (!canEdit()) {
    showToast('You do not have permission to add projects', 'error');
    return;
  }
  
  try {
    const allSkills = await api('/skills?active=true');
    
    showModal('Add Project', `
      <form id="add-project-form" class="modal-form">
        <div class="form-group">
          <label>Project Name *</label>
          <input type="text" name="name" required>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Code</label>
            <input type="text" name="code" placeholder="e.g., PRJ-001">
          </div>
          <div class="form-group">
            <label>Client</label>
            <input type="text" name="client">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Status</label>
            <select name="status">
              <option value="planning">Planning</option>
              <option value="active" selected>Active</option>
              <option value="on-hold">On Hold</option>
            </select>
          </div>
          <div class="form-group">
            <label>Priority</label>
            <select name="priority">
              <option value="low">Low</option>
              <option value="medium" selected>Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Start Date</label>
            <input type="date" name="startDate">
          </div>
          <div class="form-group">
            <label>End Date</label>
            <input type="date" name="endDate">
          </div>
        </div>
        <div class="form-group">
          <label>Budget Hours</label>
          <input type="number" name="budgetHours" min="0">
        </div>
        
        <h4 style="margin: 20px 0 10px; border-top: 1px solid var(--border-color); padding-top: 20px;">
          <i class="fas fa-users"></i> Skill Requirements
        </h4>
        <p class="text-muted" style="margin-bottom: 15px; font-size: 0.85rem;">
          Specify which skills are needed and how many people with each skill
        </p>
        
        <div id="project-skills-list" class="project-skills-list">
          ${allSkills.data.map(skill => `
            <div class="project-skill-row" data-skill-id="${skill.id}">
              <label class="checkbox-label skill-checkbox">
                <input type="checkbox" class="skill-enabled">
                <span class="skill-name" style="color: ${skill.color}">${skill.name}</span>
                <span class="skill-category">${skill.category || ''}</span>
              </label>
              <div class="skill-requirements-inputs">
                <div class="skill-input-group">
                  <label>People:</label>
                  <input type="number" class="skill-people-needed" min="1" value="1" disabled>
                </div>
                <div class="skill-input-group">
                  <label>Min Level:</label>
                  <select class="skill-level" disabled>
                    ${[1,2,3,4,5].map(l => `<option value="${l}" ${l === 3 ? 'selected' : ''}>${l}</option>`).join('')}
                  </select>
                </div>
                <div class="skill-input-group">
                  <label class="checkbox-label">
                    <input type="checkbox" class="skill-mandatory" disabled checked>
                    Required
                  </label>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Create Project</button>
        </div>
      </form>
    `);
    
    // Add skill toggle listeners
    document.querySelectorAll('.project-skill-row').forEach(row => {
      const checkbox = row.querySelector('.skill-enabled');
      const inputs = row.querySelectorAll('.skill-people-needed, .skill-level, .skill-mandatory');
      checkbox.addEventListener('change', () => {
        inputs.forEach(input => input.disabled = !checkbox.checked);
      });
    });
    
    document.getElementById('add-project-form').onsubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      
      // Collect selected skills
      const skills = [];
      document.querySelectorAll('.project-skill-row').forEach(row => {
        const checkbox = row.querySelector('.skill-enabled');
        if (checkbox.checked) {
          skills.push({
            skillId: parseInt(row.dataset.skillId),
            requiredProficiency: parseInt(row.querySelector('.skill-level').value),
            isMandatory: row.querySelector('.skill-mandatory').checked,
            peopleNeeded: parseInt(row.querySelector('.skill-people-needed').value) || 1
          });
        }
      });
      
      const data = {
        name: formData.get('name'),
        code: formData.get('code'),
        client: formData.get('client'),
        status: formData.get('status'),
        priority: formData.get('priority'),
        startDate: formData.get('startDate'),
        endDate: formData.get('endDate'),
        budgetHours: formData.get('budgetHours') ? parseInt(formData.get('budgetHours')) : null,
        skills
      };
      
      try {
        await api('/projects', {
          method: 'POST',
          body: JSON.stringify(data)
        });
        closeModal();
        showToast('Project created successfully');
        loadProjects();
      } catch (error) {
        showToast(error.message, 'error');
      }
    };
  } catch (error) {
    showToast('Failed to load skills', 'error');
  }
}

async function editProject(id) {
  if (!canEdit()) {
    showToast('You do not have permission to edit projects', 'error');
    return;
  }
  
  try {
    const [project, allSkills] = await Promise.all([
      api(`/projects/${id}`),
      api('/skills?active=true')
    ]);
    
    // Create a map of project's current skills
    const projectSkillsMap = new Map();
    project.skills.forEach(s => projectSkillsMap.set(s.id, s));
    
    showModal(`Edit ${project.name}`, `
      <form id="edit-project-form" class="modal-form">
        <div class="form-group">
          <label>Project Name *</label>
          <input type="text" name="name" value="${project.name}" required>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Code</label>
            <input type="text" name="code" value="${project.code || ''}" placeholder="e.g., PRJ-001">
          </div>
          <div class="form-group">
            <label>Client</label>
            <input type="text" name="client" value="${project.client || ''}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Status</label>
            <select name="status">
              <option value="planning" ${project.status === 'planning' ? 'selected' : ''}>Planning</option>
              <option value="active" ${project.status === 'active' ? 'selected' : ''}>Active</option>
              <option value="on-hold" ${project.status === 'on-hold' ? 'selected' : ''}>On Hold</option>
              <option value="completed" ${project.status === 'completed' ? 'selected' : ''}>Completed</option>
            </select>
          </div>
          <div class="form-group">
            <label>Priority</label>
            <select name="priority">
              <option value="low" ${project.priority === 'low' ? 'selected' : ''}>Low</option>
              <option value="medium" ${project.priority === 'medium' ? 'selected' : ''}>Medium</option>
              <option value="high" ${project.priority === 'high' ? 'selected' : ''}>High</option>
              <option value="critical" ${project.priority === 'critical' ? 'selected' : ''}>Critical</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Start Date</label>
            <input type="date" name="startDate" value="${project.startDate || ''}">
          </div>
          <div class="form-group">
            <label>End Date</label>
            <input type="date" name="endDate" value="${project.endDate || ''}">
          </div>
        </div>
        <div class="form-group">
          <label>Budget Hours</label>
          <input type="number" name="budgetHours" value="${project.budgetHours || ''}" min="0">
        </div>
        
        <h4 style="margin: 20px 0 10px; border-top: 1px solid var(--border-color); padding-top: 20px;">
          <i class="fas fa-users"></i> Skill Requirements
        </h4>
        <p class="text-muted" style="margin-bottom: 15px; font-size: 0.85rem;">
          Specify which skills are needed and how many people with each skill
        </p>
        
        <div id="project-skills-list" class="project-skills-list">
          ${allSkills.data.map(skill => {
            const hasSkill = projectSkillsMap.has(skill.id);
            const projectSkill = projectSkillsMap.get(skill.id);
            return `
              <div class="project-skill-row" data-skill-id="${skill.id}">
                <label class="checkbox-label skill-checkbox">
                  <input type="checkbox" class="skill-enabled" ${hasSkill ? 'checked' : ''}>
                  <span class="skill-name" style="color: ${skill.color}">${skill.name}</span>
                  <span class="skill-category">${skill.category || ''}</span>
                </label>
                <div class="skill-requirements-inputs">
                  <div class="skill-input-group">
                    <label>People:</label>
                    <input type="number" class="skill-people-needed" min="1" value="${projectSkill?.peopleNeeded || 1}" ${!hasSkill ? 'disabled' : ''}>
                  </div>
                  <div class="skill-input-group">
                    <label>Min Level:</label>
                    <select class="skill-level" ${!hasSkill ? 'disabled' : ''}>
                      ${[1,2,3,4,5].map(l => `<option value="${l}" ${projectSkill?.requiredProficiency === l ? 'selected' : ''}>${l}</option>`).join('')}
                    </select>
                  </div>
                  <div class="skill-input-group">
                    <label class="checkbox-label">
                      <input type="checkbox" class="skill-mandatory" ${!hasSkill ? 'disabled' : ''} ${projectSkill?.isMandatory !== false ? 'checked' : ''}>
                      Required
                    </label>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </div>
      </form>
    `);
    
    // Add skill toggle listeners
    document.querySelectorAll('.project-skill-row').forEach(row => {
      const checkbox = row.querySelector('.skill-enabled');
      const inputs = row.querySelectorAll('.skill-people-needed, .skill-level, .skill-mandatory');
      checkbox.addEventListener('change', () => {
        inputs.forEach(input => input.disabled = !checkbox.checked);
      });
    });
    
    document.getElementById('edit-project-form').onsubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      
      // Collect selected skills
      const skills = [];
      document.querySelectorAll('.project-skill-row').forEach(row => {
        const checkbox = row.querySelector('.skill-enabled');
        if (checkbox.checked) {
          skills.push({
            skillId: parseInt(row.dataset.skillId),
            requiredProficiency: parseInt(row.querySelector('.skill-level').value),
            isMandatory: row.querySelector('.skill-mandatory').checked,
            peopleNeeded: parseInt(row.querySelector('.skill-people-needed').value) || 1
          });
        }
      });
      
      const data = {
        name: formData.get('name'),
        code: formData.get('code'),
        client: formData.get('client'),
        status: formData.get('status'),
        priority: formData.get('priority'),
        startDate: formData.get('startDate'),
        endDate: formData.get('endDate'),
        budgetHours: formData.get('budgetHours') ? parseInt(formData.get('budgetHours')) : null
      };
      
      try {
        // Update project info
        await api(`/projects/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        });
        
        // Update project skills
        await api(`/projects/${id}/skills`, {
          method: 'PUT',
          body: JSON.stringify({ skills })
        });
        
        closeModal();
        showToast('Project updated successfully');
        loadProjects();
      } catch (error) {
        showToast(error.message, 'error');
      }
    };
  } catch (error) {
    showToast('Failed to load project details', 'error');
  }
}

// ===== Skills =====
async function loadSkills() {
  try {
    const search = document.getElementById('skills-search').value;
    const category = document.getElementById('skills-category-filter').value;
    
    let url = '/skills?active=true';
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (category) url += `&category=${encodeURIComponent(category)}`;
    
    const data = await api(url);
    
    // Load categories
    const categories = await api('/skills/meta/categories');
    const catFilter = document.getElementById('skills-category-filter');
    if (catFilter.options.length <= 1) {
      categories.forEach(c => {
        const option = document.createElement('option');
        option.value = c;
        option.textContent = c;
        catFilter.appendChild(option);
      });
    }
    
    const grid = document.getElementById('skills-grid');
    
    if (data.data.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-star"></i>
          <h3>No skills found</h3>
          <p>${canEdit() ? 'Add skills to enable skill matching' : 'No skills match your search'}</p>
        </div>
      `;
      return;
    }
    
    grid.innerHTML = data.data.map(s => `
      <div class="grid-card" onclick="showSkillDetails(${s.id})">
        <div class="grid-card-header">
          <div class="grid-card-avatar" style="background: ${s.color}">${s.name.charAt(0)}</div>
          <div>
            <div class="grid-card-title">${s.name}</div>
            <div class="grid-card-subtitle">${s.category || 'Uncategorized'}</div>
          </div>
        </div>
        <div class="grid-card-body">
          <p class="text-muted">${s.description || 'No description'}</p>
        </div>
        <div class="grid-card-footer">
          <div class="grid-card-stat">
            <span class="grid-card-stat-value">${s.personCount}</span>
            <span class="grid-card-stat-label">People</span>
          </div>
          <div class="grid-card-stat">
            <span class="grid-card-stat-value">${s.projectCount}</span>
            <span class="grid-card-stat-label">Projects</span>
          </div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Skills error:', error);
    showToast('Failed to load skills', 'error');
  }
}

async function showSkillDetails(id) {
  try {
    const skill = await api(`/skills/${id}`);
    
    showModal(skill.name, `
      <div class="skill-details">
        <div class="detail-row">
          <span class="detail-label">Category</span>
          <span class="detail-value">${skill.category || '-'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Description</span>
          <span class="detail-value">${skill.description || '-'}</span>
        </div>
        <h4 style="margin: 20px 0 10px;">People with this skill (${skill.people.length})</h4>
        <div class="list" style="max-height: 200px;">
          ${skill.people.map(p => `
            <div class="list-item">
              <span class="list-item-name">${p.firstName} ${p.lastName}</span>
              <span class="proficiency-dots">
                ${[1,2,3,4,5].map(l => `<span class="proficiency-dot ${l <= p.proficiencyLevel ? 'filled' : ''}"></span>`).join('')}
              </span>
            </div>
          `).join('')}
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal()">Close</button>
        </div>
      </div>
    `);
  } catch (error) {
    showToast('Failed to load skill details', 'error');
  }
}

function showAddSkillModal() {
  if (!canEdit()) {
    showToast('You do not have permission to add skills', 'error');
    return;
  }
  
  showModal('Add Skill', `
    <form id="add-skill-form" class="modal-form">
      <div class="form-group">
        <label>Skill Name *</label>
        <input type="text" name="name" required>
      </div>
      <div class="form-group">
        <label>Category</label>
        <input type="text" name="category" placeholder="e.g., Programming, Design, Management">
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea name="description" rows="3"></textarea>
      </div>
      <div class="form-group">
        <label>Color</label>
        <input type="color" name="color" value="#6366f1">
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Add Skill</button>
      </div>
    </form>
  `);
  
  document.getElementById('add-skill-form').onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    try {
      await api('/skills', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      closeModal();
      showToast('Skill added successfully');
      loadSkills();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };
}

// ===== Conflicts =====
async function loadConflicts() {
  try {
    const type = document.getElementById('conflicts-type-filter').value;
    const severity = document.getElementById('conflicts-severity-filter').value;
    const showResolved = document.getElementById('conflicts-show-resolved').checked;
    
    let url = '/conflicts';
    const params = [];
    if (type) params.push(`type=${type}`);
    if (severity) params.push(`severity=${severity}`);
    if (!showResolved) params.push('resolved=false');
    if (params.length) url += '?' + params.join('&');
    
    const data = await api(url);
    const table = document.getElementById('conflicts-table');
    
    if (data.data.length === 0) {
      table.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-check-circle"></i>
          <h3>No conflicts</h3>
          <p>All scheduling conflicts have been resolved</p>
        </div>
      `;
      return;
    }
    
    table.innerHTML = data.data.map(c => `
      <div class="conflict-row ${c.isResolved ? 'resolved' : ''}">
        <div class="conflict-severity ${c.severity}"></div>
        <span class="conflict-type">${c.type.replace('_', ' ')}</span>
        <span class="conflict-description">${c.description}</span>
        <span class="conflict-date">${c.date}</span>
        <div class="conflict-actions">
          ${!c.isResolved && canEdit() ? `
            <button class="btn btn-sm btn-success" onclick="resolveConflict(${c.id})">
              <i class="fas fa-check"></i> Resolve
            </button>
          ` : c.isResolved ? '<span class="tag">Resolved</span>' : ''}
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Conflicts error:', error);
    showToast('Failed to load conflicts', 'error');
  }
}

async function resolveConflict(id) {
  if (!canEdit()) {
    showToast('You do not have permission to resolve conflicts', 'error');
    return;
  }
  
  try {
    await api(`/conflicts/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolutionNotes: 'Marked as resolved' })
    });
    showToast('Conflict resolved');
    loadConflicts();
    loadDashboard(); // Update dashboard counts
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// ===== AI Scheduler =====
let aiSuggestions = [];

function loadAIScheduler() {
  // Set default dates
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  document.getElementById('ai-start-date').value = today.toISOString().split('T')[0];
  document.getElementById('ai-end-date').value = nextWeek.toISOString().split('T')[0];
}

async function generateAISuggestions() {
  if (!canEdit()) {
    showToast('You do not have permission to use AI scheduler', 'error');
    return;
  }
  
  const startDate = document.getElementById('ai-start-date').value;
  const endDate = document.getElementById('ai-end-date').value;
  
  if (!startDate) {
    showToast('Please select a start date', 'warning');
    return;
  }
  
  const resultsDiv = document.getElementById('ai-results');
  resultsDiv.innerHTML = `
    <div class="ai-loading">
      <div class="ai-loading-spinner"></div>
      <h3>Analyzing schedules...</h3>
      <p>The AI is examining projects, skills, and availability to find the best matches.</p>
    </div>
  `;
  
  try {
    const data = await api('/ai-scheduler/suggest', {
      method: 'POST',
      body: JSON.stringify({ startDate, endDate: endDate || startDate })
    });
    
    aiSuggestions = data.days;
    renderAISuggestions(data);
  } catch (error) {
    resultsDiv.innerHTML = `
      <div class="ai-error">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Failed to generate suggestions</h3>
        <p>${error.message}</p>
        <button class="btn btn-primary" onclick="generateAISuggestions()">Try Again</button>
      </div>
    `;
  }
}

function renderAISuggestions(data) {
  const resultsDiv = document.getElementById('ai-results');
  
  if (data.totalSuggestions === 0) {
    resultsDiv.innerHTML = `
      <div class="ai-no-results">
        <i class="fas fa-calendar-check"></i>
        <h3>No suggestions generated</h3>
        <p>Either all slots are filled, or there are no active projects with skill requirements.</p>
        <ul>
          <li>Make sure you have active projects with skill requirements</li>
          <li>Ensure there are available people with matching skills</li>
          <li>Check that people have remaining hours in their schedule</li>
        </ul>
      </div>
    `;
    return;
  }
  
  let html = `
    <div class="ai-summary card">
      <div class="card-body">
        <div class="ai-summary-stats">
          <div class="ai-stat">
            <span class="ai-stat-value">${data.totalSuggestions}</span>
            <span class="ai-stat-label">Suggestions</span>
          </div>
          <div class="ai-stat">
            <span class="ai-stat-value">${data.days.length}</span>
            <span class="ai-stat-label">Days</span>
          </div>
          <div class="ai-stat">
            <span class="ai-stat-value">${data.days.reduce((sum, d) => sum + d.warnings.length, 0)}</span>
            <span class="ai-stat-label">Warnings</span>
          </div>
        </div>
        <div class="ai-actions">
          <button class="btn btn-success" onclick="applyAllSuggestions()">
            <i class="fas fa-check-double"></i> Apply All Suggestions
          </button>
          <button class="btn btn-secondary" onclick="generateAISuggestions()">
            <i class="fas fa-sync"></i> Regenerate
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Render each day
  for (const day of data.days) {
    html += `
      <div class="ai-day-card">
        <div class="ai-day-header">
          <div class="ai-day-info">
            <h3>${day.dayName}</h3>
            <span class="ai-day-date">${day.date}</span>
          </div>
          <div class="ai-day-stats">
            <span class="tag">${day.suggestions.length} suggestions</span>
            ${day.warnings.length > 0 ? `<span class="tag warning">${day.warnings.length} warnings</span>` : ''}
          </div>
        </div>
        
        ${day.warnings.length > 0 ? `
          <div class="ai-warnings">
            ${day.warnings.map(w => `
              <div class="ai-warning">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${w.message}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        <div class="ai-suggestions-list">
          ${day.suggestions.map((s, idx) => `
            <div class="ai-suggestion" data-id="${s.id}">
              <div class="ai-suggestion-project" style="border-left-color: ${s.projectColor}">
                <span class="project-name">${s.projectName}</span>
                <span class="project-priority ${s.projectPriority}">${s.projectPriority}</span>
              </div>
              <div class="ai-suggestion-details">
                <div class="ai-suggestion-person">
                  <div class="ai-person-avatar">${s.personName.split(' ').map(n => n[0]).join('')}</div>
                  <div class="ai-person-info">
                    <span class="person-name">${s.personName}</span>
                    <span class="person-dept">${s.department || ''}</span>
                  </div>
                </div>
                <div class="ai-suggestion-skill">
                  <span class="skill-badge" style="background: ${s.skillColor}20; color: ${s.skillColor}">
                    ${s.skillName}
                  </span>
                  <span class="skill-level">Level ${s.proficiencyLevel}</span>
                </div>
                <div class="ai-suggestion-time">
                  <i class="fas fa-clock"></i>
                  <span>${s.startHour}:00 - ${s.endHour}:00</span>
                </div>
                <div class="ai-suggestion-score">
                  <div class="score-bar" style="width: ${s.matchScore}%"></div>
                  <span>${s.matchScore}% match</span>
                </div>
              </div>
              <div class="ai-suggestion-actions">
                <button class="btn btn-sm btn-success" onclick="applySuggestion('${s.id}')" title="Apply">
                  <i class="fas fa-check"></i>
                </button>
                <button class="btn btn-sm btn-secondary" onclick="showRescheduleModal('${s.id}')" title="Reschedule">
                  <i class="fas fa-exchange-alt"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="removeSuggestion('${s.id}')" title="Remove">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  resultsDiv.innerHTML = html;
}

async function applySuggestion(suggestionId) {
  const suggestion = findSuggestion(suggestionId);
  if (!suggestion) {
    showToast('Suggestion not found', 'error');
    return;
  }
  
  try {
    await api('/ai-scheduler/apply', {
      method: 'POST',
      body: JSON.stringify({ suggestions: [suggestion] })
    });
    
    showToast('Assignment created successfully');
    removeSuggestionFromUI(suggestionId);
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function applyAllSuggestions() {
  const allSuggestions = [];
  for (const day of aiSuggestions) {
    allSuggestions.push(...day.suggestions);
  }
  
  if (allSuggestions.length === 0) {
    showToast('No suggestions to apply', 'warning');
    return;
  }
  
  try {
    const result = await api('/ai-scheduler/apply', {
      method: 'POST',
      body: JSON.stringify({ suggestions: allSuggestions })
    });
    
    showToast(`Created ${result.created} assignments (${result.skipped} skipped)`);
    
    if (result.created > 0) {
      // Refresh the suggestions
      generateAISuggestions();
    }
  } catch (error) {
    showToast(error.message, 'error');
  }
}

function removeSuggestion(suggestionId) {
  removeSuggestionFromUI(suggestionId);
  
  // Also remove from aiSuggestions data
  for (const day of aiSuggestions) {
    day.suggestions = day.suggestions.filter(s => s.id !== suggestionId);
  }
  
  showToast('Suggestion removed');
}

function removeSuggestionFromUI(suggestionId) {
  const element = document.querySelector(`.ai-suggestion[data-id="${suggestionId}"]`);
  if (element) {
    element.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => element.remove(), 300);
  }
}

function findSuggestion(suggestionId) {
  for (const day of aiSuggestions) {
    const suggestion = day.suggestions.find(s => s.id === suggestionId);
    if (suggestion) return suggestion;
  }
  return null;
}

async function showRescheduleModal(suggestionId) {
  const suggestion = findSuggestion(suggestionId);
  if (!suggestion) return;
  
  try {
    // Get available people for this skill and time slot
    const available = await api(`/ai-scheduler/available?date=${suggestion.date}&skillId=${suggestion.skillId}&startHour=${suggestion.startHour}&endHour=${suggestion.endHour}&excludePersonId=${suggestion.personId}`);
    
    showModal('Reschedule Assignment', `
      <div class="reschedule-modal">
        <div class="reschedule-current">
          <h4>Current Assignment</h4>
          <div class="reschedule-info">
            <div class="detail-row">
              <span class="detail-label">Project</span>
              <span class="detail-value">${suggestion.projectName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Skill Required</span>
              <span class="detail-value">${suggestion.skillName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Time</span>
              <span class="detail-value">${suggestion.date} ${suggestion.startHour}:00 - ${suggestion.endHour}:00</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Currently Assigned</span>
              <span class="detail-value">${suggestion.personName}</span>
            </div>
          </div>
        </div>
        
        <h4 style="margin: 20px 0 10px;">Select Replacement</h4>
        ${available.available.length === 0 ? `
          <div class="empty-state">
            <i class="fas fa-user-slash"></i>
            <p>No other qualified people available for this time slot</p>
          </div>
        ` : `
          <div class="reschedule-options">
            ${available.available.map(p => `
              <div class="reschedule-option" onclick="selectReplacement('${suggestionId}', ${p.id}, '${p.firstName} ${p.lastName}')">
                <div class="reschedule-person">
                  <div class="ai-person-avatar">${p.firstName[0]}${p.lastName[0]}</div>
                  <div>
                    <span class="person-name">${p.firstName} ${p.lastName}</span>
                    <span class="person-dept">${p.department || ''}</span>
                  </div>
                </div>
                <div class="reschedule-meta">
                  <span class="skill-level">Level ${p.proficiencyLevel}</span>
                  <span class="hours-remaining">${p.hoursRemaining}h remaining</span>
                </div>
              </div>
            `).join('')}
          </div>
        `}
        
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        </div>
      </div>
    `);
  } catch (error) {
    showToast('Failed to load available people', 'error');
  }
}

function selectReplacement(suggestionId, newPersonId, newPersonName) {
  // Update the suggestion with the new person
  for (const day of aiSuggestions) {
    const suggestion = day.suggestions.find(s => s.id === suggestionId);
    if (suggestion) {
      suggestion.personId = newPersonId;
      suggestion.personName = newPersonName;
      break;
    }
  }
  
  // Re-render the suggestions
  renderAISuggestions({ days: aiSuggestions, totalSuggestions: aiSuggestions.reduce((sum, d) => sum + d.suggestions.length, 0) });
  closeModal();
  showToast(`Reassigned to ${newPersonName}`);
}

// ===== Reports =====
async function loadReports() {
  // Set default date range (last 30 days)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  document.getElementById('export-start-date').value = startDate.toISOString().split('T')[0];
  document.getElementById('export-end-date').value = endDate.toISOString().split('T')[0];
  
  // Update UI for role
  updateRoleMessages();
  
  // Load project summary report
  loadProjectSummaryReport();
  
  // Load export history (admin only)
  if (canManageUsers()) {
    try {
      const data = await api('/exports/logs');
      const history = document.getElementById('export-history');
      
      if (data.data.length === 0) {
        history.innerHTML = '<p class="text-muted">No exports yet</p>';
        return;
      }
      
      history.innerHTML = data.data.map(e => `
        <div class="export-item">
          <div class="export-item-info">
            <div class="export-item-icon ${e.type}">${e.type === 'excel' ? '<i class="fas fa-file-excel"></i>' : '<i class="fas fa-file-pdf"></i>'}</div>
            <div>
              <span class="list-item-name">${e.filename}</span>
              <span class="list-item-sub">${new Date(e.createdAt).toLocaleString()} by ${e.exportedByName || 'Unknown'}</span>
            </div>
          </div>
          <span class="tag">${e.recordCount} records</span>
        </div>
      `).join('');
    } catch (error) {
      console.error('Reports error:', error);
    }
  } else {
    const history = document.getElementById('export-history');
    history.innerHTML = '<p class="text-muted">Export history is only visible to administrators</p>';
  }
}

async function loadProjectSummaryReport() {
  const container = document.getElementById('project-summary-report');
  if (!container) return;
  
  container.innerHTML = '<div class="loading">Loading project summary...</div>';
  
  try {
    const data = await api('/analytics/project-summary');
    
    if (data.projects.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-folder-open"></i>
          <h3>No Active Projects</h3>
          <p>There are no active projects to display</p>
        </div>
      `;
      return;
    }
    
    let html = `
      <!-- Summary Cards -->
      <div class="report-summary-cards">
        <div class="summary-card">
          <div class="summary-icon"><i class="fas fa-project-diagram"></i></div>
          <div class="summary-value">${data.summary.totalProjects}</div>
          <div class="summary-label">Active Projects</div>
        </div>
        <div class="summary-card">
          <div class="summary-icon"><i class="fas fa-users"></i></div>
          <div class="summary-value">${data.summary.totalPeopleAssigned}</div>
          <div class="summary-label">People Assigned</div>
        </div>
        <div class="summary-card">
          <div class="summary-icon"><i class="fas fa-clock"></i></div>
          <div class="summary-value">${data.summary.totalHoursAllProjects}</div>
          <div class="summary-label">Total Hours</div>
        </div>
        <div class="summary-card">
          <div class="summary-icon"><i class="fas fa-chart-line"></i></div>
          <div class="summary-value">${data.summary.averageHoursPerProject}</div>
          <div class="summary-label">Avg Hours/Project</div>
        </div>
      </div>
      
      <!-- Project List -->
      <div class="project-report-list">
    `;
    
    for (const project of data.projects) {
      html += `
        <div class="project-report-card">
          <div class="project-report-header" style="border-left-color: ${project.color}">
            <div class="project-report-info">
              <h3>${project.name}</h3>
              <div class="project-report-meta">
                ${project.code ? `<span class="tag">${project.code}</span>` : ''}
                ${project.client ? `<span class="text-muted">${project.client}</span>` : ''}
                <span class="priority-badge ${project.priority}">${project.priority}</span>
              </div>
            </div>
            <div class="project-report-stats">
              <div class="stat-item">
                <span class="stat-value">${project.totalHours}</span>
                <span class="stat-label">Hours</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">${project.peopleCount}</span>
                <span class="stat-label">People</span>
              </div>
              ${project.budgetHours ? `
                <div class="stat-item">
                  <span class="stat-value ${project.budgetUsedPercent > 100 ? 'over-budget' : ''}">${project.budgetUsedPercent}%</span>
                  <span class="stat-label">Budget Used</span>
                </div>
              ` : ''}
            </div>
          </div>
          
          ${project.requiredSkills.length > 0 ? `
            <div class="project-report-skills">
              <span class="skills-label">Required Skills:</span>
              ${project.requiredSkills.map(s => `
                <span class="skill-tag" style="background: ${s.color}20; color: ${s.color}; border: 1px solid ${s.color}40">
                  ${s.name} <small>(${s.peopleNeeded} needed, Level ${s.requiredProficiency}+)</small>
                </span>
              `).join('')}
            </div>
          ` : ''}
          
          ${project.assignedPeople.length > 0 ? `
            <div class="project-team-summary">
              <span class="team-label"><i class="fas fa-user-friends"></i> Team:</span>
              <span class="team-names">${project.assignedPeople.map(p => p.name).join(', ')}</span>
            </div>
          ` : ''}
          
          <div class="project-report-people">
            <h4><i class="fas fa-users"></i> Assigned Team (${project.assignedPeople.length})</h4>
            ${project.assignedPeople.length === 0 ? `
              <p class="text-muted">No people assigned to this project yet</p>
            ` : `
              <table class="people-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Job Title</th>
                    <th>Hours Worked</th>
                    <th>Assignments</th>
                    <th>Date Range</th>
                  </tr>
                </thead>
                <tbody>
                  ${project.assignedPeople.map(p => `
                    <tr>
                      <td>
                        <div class="person-cell">
                          <div class="mini-avatar">${p.name.split(' ').map(n => n[0]).join('')}</div>
                          <span>${p.name}</span>
                        </div>
                      </td>
                      <td>${p.department || '-'}</td>
                      <td>${p.jobTitle || '-'}</td>
                      <td><strong>${p.hoursWorked}h</strong></td>
                      <td>${p.assignmentCount}</td>
                      <td class="text-muted">${p.firstAssignment || '-'} → ${p.lastAssignment || '-'}</td>
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3"><strong>Total</strong></td>
                    <td><strong>${project.totalHours}h</strong></td>
                    <td><strong>${project.totalAssignments}</strong></td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            `}
          </div>
        </div>
      `;
    }
    
    html += '</div>';
    container.innerHTML = html;
    
  } catch (error) {
    console.error('Project summary error:', error);
    container.innerHTML = `
      <div class="error-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Failed to load report</h3>
        <p>${error.message}</p>
        <button class="btn btn-primary" onclick="loadProjectSummaryReport()">Try Again</button>
      </div>
    `;
  }
}

// ===== Report Preview =====
async function previewReport() {
  const startDate = document.getElementById('export-start-date').value;
  const endDate = document.getElementById('export-end-date').value;
  
  if (!startDate || !endDate) {
    showToast('Please select date range', 'warning');
    return;
  }
  
  const previewSection = document.getElementById('report-preview-section');
  const previewContent = document.getElementById('report-preview-content');
  
  previewSection.style.display = 'block';
  previewContent.innerHTML = '<div class="loading">Generating report preview...</div>';
  
  // Scroll to preview
  previewSection.scrollIntoView({ behavior: 'smooth' });
  
  try {
    const data = await api(`/analytics/daily-report?startDate=${startDate}&endDate=${endDate}`);
    renderReportPreview(data);
  } catch (error) {
    previewContent.innerHTML = `
      <div class="error-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Failed to generate preview</h3>
        <p>${error.message}</p>
      </div>
    `;
  }
}

function renderReportPreview(data) {
  const previewContent = document.getElementById('report-preview-content');
  const statusLabels = {
    'active': 'Active Projects',
    'planning': 'Planning',
    'on-hold': 'On Hold',
    'completed': 'Completed',
    'cancelled': 'Cancelled'
  };
  
  let html = `
    <div class="report-document" id="printable-report">
      <!-- Report Header -->
      <div class="report-header">
        <h1><i class="fas fa-calendar-alt"></i> Schedule Report</h1>
        <div class="report-meta">
          <p><strong>Date Range:</strong> ${data.dateRange.startDate} to ${data.dateRange.endDate}</p>
          <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        </div>
      </div>
      
      <!-- Summary Section -->
      <div class="report-summary">
        <div class="summary-item">
          <span class="summary-number">${data.summary.totalDays}</span>
          <span class="summary-text">Working Days</span>
        </div>
        <div class="summary-item">
          <span class="summary-number">${data.summary.projectCount}</span>
          <span class="summary-text">Projects</span>
        </div>
        <div class="summary-item">
          <span class="summary-number">${data.summary.uniquePeople}</span>
          <span class="summary-text">People</span>
        </div>
        <div class="summary-item">
          <span class="summary-number">${data.summary.totalHours}</span>
          <span class="summary-text">Total Hours</span>
        </div>
        <div class="summary-item">
          <span class="summary-number">${data.summary.totalAssignments}</span>
          <span class="summary-text">Assignments</span>
        </div>
      </div>
  `;
  
  // Render each day
  for (const day of data.days) {
    html += `
      <div class="report-day">
        <div class="day-header">
          <h2>${day.dayName}, ${day.formatted}</h2>
        </div>
        <div class="day-content">
    `;
    
    // Render each status group (Active first)
    for (const status of data.statusOrder) {
      const projects = day.statusGroups[status];
      if (!projects || projects.length === 0) continue;
      
      // Check if any project has assignments for this day
      const projectsWithWork = projects.filter(p => p.assignments.length > 0 || status === 'active');
      if (projectsWithWork.length === 0) continue;
      
      html += `
        <div class="status-group">
          <h3 class="status-title status-${status}">${statusLabels[status] || status}</h3>
          <div class="projects-list">
      `;
      
      for (const project of projectsWithWork) {
        html += `
          <div class="report-project">
            <div class="project-header" style="border-left-color: ${project.color}">
              <div class="project-title">
                <strong>${project.name}</strong>
                ${project.code ? `<span class="project-code">[${project.code}]</span>` : ''}
                ${project.client ? `<span class="project-client">- ${project.client}</span>` : ''}
              </div>
              <div class="project-badges">
                <span class="priority-tag ${project.priority}">${project.priority}</span>
                <span class="hours-tag">${project.totalHours}h today</span>
                <span class="people-tag">${project.peopleCount} people</span>
              </div>
            </div>
            
            ${project.skills.length > 0 ? `
              <div class="project-skills-row">
                <span class="label">Required Skills:</span>
                ${project.skills.map(s => `
                  <span class="skill-badge" style="background: ${s.color}20; color: ${s.color}">${s.name} (${s.peopleNeeded})</span>
                `).join('')}
              </div>
            ` : ''}
            
            ${project.assignments.length > 0 ? `
              <table class="assignments-table">
                <thead>
                  <tr>
                    <th>Person</th>
                    <th>Department</th>
                    <th>Time</th>
                    <th>Hours</th>
                    <th>Task</th>
                  </tr>
                </thead>
                <tbody>
                  ${project.assignments.map(a => `
                    <tr>
                      <td><strong>${a.personName}</strong></td>
                      <td>${a.department || '-'}</td>
                      <td>${a.startHour}:00 - ${a.endHour}:00</td>
                      <td>${a.hours}h</td>
                      <td>${a.task || '-'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : `
              <p class="no-assignments">No assignments scheduled for this day</p>
            `}
          </div>
        `;
      }
      
      html += `
          </div>
        </div>
      `;
    }
    
    html += `
        </div>
      </div>
      <div class="page-break"></div>
    `;
  }
  
  html += `
      <!-- Footer -->
      <div class="report-footer">
        <p>Generated by Resource Scheduler • ${new Date().toLocaleDateString()}</p>
      </div>
    </div>
  `;
  
  previewContent.innerHTML = html;
}

function closePreview() {
  document.getElementById('report-preview-section').style.display = 'none';
}

function printReport() {
  const printContent = document.getElementById('printable-report');
  if (!printContent) {
    showToast('No report to print', 'warning');
    return;
  }
  
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Schedule Report</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; color: #1f2937; }
        
        .report-header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb; }
        .report-header h1 { font-size: 24px; margin-bottom: 10px; }
        .report-header i { display: none; }
        .report-meta { color: #6b7280; font-size: 14px; }
        .report-meta p { margin: 4px 0; }
        
        .report-summary { display: flex; justify-content: center; gap: 40px; margin-bottom: 30px; padding: 20px; background: #f9fafb; border-radius: 8px; }
        .summary-item { text-align: center; }
        .summary-number { display: block; font-size: 28px; font-weight: 700; color: #4f46e5; }
        .summary-text { font-size: 12px; color: #6b7280; text-transform: uppercase; }
        
        .report-day { margin-bottom: 30px; page-break-inside: avoid; }
        .day-header { background: #4f46e5; color: white; padding: 12px 20px; border-radius: 8px 8px 0 0; }
        .day-header h2 { font-size: 18px; margin: 0; }
        .day-content { border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; padding: 16px; }
        
        .status-group { margin-bottom: 20px; }
        .status-title { font-size: 14px; text-transform: uppercase; margin-bottom: 12px; padding: 8px 12px; border-radius: 4px; }
        .status-title.status-active { background: #dcfce7; color: #166534; }
        .status-title.status-planning { background: #fef3c7; color: #92400e; }
        .status-title.status-on-hold { background: #fee2e2; color: #991b1b; }
        .status-title.status-completed { background: #e0e7ff; color: #3730a3; }
        
        .report-project { margin-bottom: 16px; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; }
        .project-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #f9fafb; border-left: 4px solid #4f46e5; flex-wrap: wrap; gap: 8px; }
        .project-title { font-size: 15px; }
        .project-code, .project-client { color: #6b7280; font-weight: normal; }
        .project-badges { display: flex; gap: 8px; }
        .project-badges span { padding: 2px 8px; border-radius: 10px; font-size: 11px; }
        .priority-tag.critical { background: #fee2e2; color: #991b1b; }
        .priority-tag.high { background: #fef3c7; color: #92400e; }
        .priority-tag.medium { background: #dbeafe; color: #1e40af; }
        .priority-tag.low { background: #f3f4f6; color: #374151; }
        .hours-tag { background: #dcfce7; color: #166534; }
        .people-tag { background: #e0e7ff; color: #3730a3; }
        
        .project-skills-row { padding: 8px 16px; background: #fafafa; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
        .project-skills-row .label { color: #6b7280; margin-right: 8px; }
        .skill-badge { padding: 2px 8px; border-radius: 10px; font-size: 11px; margin-right: 4px; }
        
        .assignments-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .assignments-table th, .assignments-table td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        .assignments-table th { background: #f9fafb; font-weight: 600; color: #374151; font-size: 11px; text-transform: uppercase; }
        .assignments-table tbody tr:hover { background: #f9fafb; }
        
        .no-assignments { padding: 16px; text-align: center; color: #9ca3af; font-style: italic; }
        
        .page-break { page-break-after: always; height: 1px; }
        .report-footer { text-align: center; padding: 20px; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; margin-top: 20px; }
        
        @media print {
          body { padding: 0; }
          .report-day { page-break-inside: avoid; }
          .page-break { page-break-after: always; }
        }
      </style>
    </head>
    <body>
      ${printContent.innerHTML}
    </body>
    </html>
  `);
  printWindow.document.close();
  
  // Wait for content to load then print
  setTimeout(() => {
    printWindow.print();
  }, 500);
}

async function exportExcel() {
  if (!canExport()) {
    showToast('You do not have permission to export', 'error');
    return;
  }
  
  const startDate = document.getElementById('export-start-date').value;
  const endDate = document.getElementById('export-end-date').value;
  const includeConflicts = document.getElementById('export-conflicts').checked;
  const includeSkills = document.getElementById('export-skills').checked;
  
  if (!startDate || !endDate) {
    showToast('Please select date range', 'warning');
    return;
  }
  
  try {
    showToast('Generating Excel export...');
    const url = `/api/exports/excel?startDate=${startDate}&endDate=${endDate}&includeConflicts=${includeConflicts}&includeSkills=${includeSkills}`;
    
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    
    if (!response.ok) throw new Error('Export failed');
    
    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `schedule_${startDate}_${endDate}.xlsx`;
    link.click();
    
    showToast('Excel exported successfully');
    loadReports();
  } catch (error) {
    showToast('Export failed: ' + error.message, 'error');
  }
}

async function exportPDF() {
  if (!canExport()) {
    showToast('You do not have permission to export', 'error');
    return;
  }
  
  const startDate = document.getElementById('export-start-date').value;
  const endDate = document.getElementById('export-end-date').value;
  
  if (!startDate || !endDate) {
    showToast('Please select date range', 'warning');
    return;
  }
  
  try {
    showToast('Generating PDF export...');
    const url = `/api/exports/pdf?startDate=${startDate}&endDate=${endDate}`;
    
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${state.token}` }
    });
    
    if (!response.ok) throw new Error('Export failed');
    
    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `schedule_${startDate}_${endDate}.pdf`;
    link.click();
    
    showToast('PDF exported successfully');
    loadReports();
  } catch (error) {
    showToast('Export failed: ' + error.message, 'error');
  }
}

// ===== User Management (Admin Only) =====
async function loadUsers() {
  if (!canManageUsers()) {
    showToast('Access denied', 'error');
    return;
  }
  
  try {
    const data = await api('/users');
    const table = document.getElementById('users-table');
    
    if (!table) return;
    
    if (data.data.length === 0) {
      table.innerHTML = '<div class="empty-state"><p>No users found</p></div>';
      return;
    }
    
    table.innerHTML = data.data.map(u => `
      <div class="user-row">
        <div class="user-info">
          <div class="user-avatar">${(u.firstName || u.username).charAt(0)}</div>
          <div>
            <span class="user-name">${u.firstName ? `${u.firstName} ${u.lastName}` : u.username}</span>
            <span class="user-email">${u.email}</span>
          </div>
        </div>
        <span class="role-badge role-${u.role}">${u.role}</span>
        <span class="user-status ${u.isActive ? 'active' : 'inactive'}">${u.isActive ? 'Active' : 'Inactive'}</span>
        <div class="user-actions">
          <button class="btn btn-sm btn-secondary" onclick="editUser(${u.id})">
            <i class="fas fa-edit"></i>
          </button>
          ${u.id !== state.user.id ? `
            <button class="btn btn-sm btn-danger" onclick="confirmDeleteUser(${u.id}, '${u.username}')">
              <i class="fas fa-trash"></i>
            </button>
          ` : ''}
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Load users error:', error);
    showToast('Failed to load users', 'error');
  }
}

function showAddUserModal() {
  if (!canManageUsers()) {
    showToast('Access denied', 'error');
    return;
  }
  
  showModal('Add User', `
    <form id="add-user-form" class="modal-form">
      <div class="form-group">
        <label>Username *</label>
        <input type="text" name="username" required>
      </div>
      <div class="form-group">
        <label>Email *</label>
        <input type="email" name="email" required>
      </div>
      <div class="form-group">
        <label>Password *</label>
        <input type="password" name="password" required minlength="6">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>First Name</label>
          <input type="text" name="firstName">
        </div>
        <div class="form-group">
          <label>Last Name</label>
          <input type="text" name="lastName">
        </div>
      </div>
      <div class="form-group">
        <label>Role *</label>
        <select name="role" required>
          <option value="viewer">Viewer - Read-only access</option>
          <option value="scheduler">Scheduler - Can manage schedules</option>
          <option value="admin">Admin - Full system access</option>
        </select>
      </div>
      <div class="role-descriptions">
        <div class="role-desc">
          <strong>Viewer:</strong> Can view schedules, people, and projects but cannot make changes.
        </div>
        <div class="role-desc">
          <strong>Scheduler:</strong> Can create and manage schedules, people, and projects. Can export reports.
        </div>
        <div class="role-desc">
          <strong>Admin:</strong> Full access including user management and system settings.
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Create User</button>
      </div>
    </form>
  `);
  
  document.getElementById('add-user-form').onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    try {
      await api('/users', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      closeModal();
      showToast('User created successfully');
      loadUsers();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };
}

async function editUser(id) {
  if (!canManageUsers()) {
    showToast('Access denied', 'error');
    return;
  }
  
  try {
    const user = await api(`/users/${id}`);
    
    showModal('Edit User', `
      <form id="edit-user-form" class="modal-form">
        <div class="form-group">
          <label>Username</label>
          <input type="text" value="${user.username}" disabled>
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" name="email" value="${user.email}">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>First Name</label>
            <input type="text" name="firstName" value="${user.firstName || ''}">
          </div>
          <div class="form-group">
            <label>Last Name</label>
            <input type="text" name="lastName" value="${user.lastName || ''}">
          </div>
        </div>
        <div class="form-group">
          <label>Role</label>
          <select name="role" ${user.id === state.user.id ? 'disabled' : ''}>
            <option value="viewer" ${user.role === 'viewer' ? 'selected' : ''}>Viewer</option>
            <option value="scheduler" ${user.role === 'scheduler' ? 'selected' : ''}>Scheduler</option>
            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
          </select>
          ${user.id === state.user.id ? '<small class="text-muted">Cannot change your own role</small>' : ''}
        </div>
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" name="isActive" ${user.isActive ? 'checked' : ''} ${user.id === state.user.id ? 'disabled' : ''}>
            Active Account
          </label>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
          <button type="button" class="btn btn-warning" onclick="showResetPasswordModal(${id})">Reset Password</button>
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </div>
      </form>
    `);
    
    document.getElementById('edit-user-form').onsubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = {
        email: formData.get('email'),
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        role: formData.get('role'),
        isActive: formData.get('isActive') === 'on'
      };
      
      try {
        await api(`/users/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        });
        closeModal();
        showToast('User updated successfully');
        loadUsers();
      } catch (error) {
        showToast(error.message, 'error');
      }
    };
  } catch (error) {
    showToast('Failed to load user', 'error');
  }
}

function showResetPasswordModal(userId) {
  showModal('Reset Password', `
    <form id="reset-password-form" class="modal-form">
      <div class="form-group">
        <label>New Password *</label>
        <input type="password" name="newPassword" required minlength="6">
        <small class="text-muted">Minimum 6 characters</small>
      </div>
      <div class="form-group">
        <label>Confirm Password *</label>
        <input type="password" name="confirmPassword" required>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="editUser(${userId})">Cancel</button>
        <button type="submit" class="btn btn-primary">Reset Password</button>
      </div>
    </form>
  `);
  
  document.getElementById('reset-password-form').onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');
    
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    
    try {
      await api(`/users/${userId}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ newPassword })
      });
      closeModal();
      showToast('Password reset successfully');
    } catch (error) {
      showToast(error.message, 'error');
    }
  };
}

function confirmDeleteUser(id, username) {
  showModal('Delete User', `
    <div class="confirm-delete">
      <p>Are you sure you want to delete user <strong>${username}</strong>?</p>
      <p class="text-muted">This action cannot be undone.</p>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-danger" onclick="deleteUser(${id})">Delete</button>
      </div>
    </div>
  `);
}

async function deleteUser(id) {
  try {
    await api(`/users/${id}`, { method: 'DELETE' });
    closeModal();
    showToast('User deleted successfully');
    loadUsers();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// ===== Add Assignment Modal =====
async function showAddAssignmentModal() {
  if (!canEdit()) {
    showToast('You do not have permission to create assignments', 'error');
    return;
  }
  
  try {
    const [people, projects] = await Promise.all([
      api('/people?active=true'),
      api('/projects?status=active')
    ]);
    
    showModal('Add Assignment', `
      <form id="add-assignment-form" class="modal-form">
        <div class="form-group">
          <label>Person *</label>
          <select name="personId" required>
            <option value="">Select person...</option>
            ${people.data.map(p => `<option value="${p.id}">${p.firstName} ${p.lastName}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Project *</label>
          <select name="projectId" required>
            <option value="">Select project...</option>
            ${projects.data.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Date *</label>
          <input type="date" name="date" value="${state.scheduleDate}" required>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Start Hour *</label>
            <select name="startHour" required>
              ${Array.from({length: 24}, (_, i) => `<option value="${i}" ${i === 9 ? 'selected' : ''}>${i}:00</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>End Hour *</label>
            <select name="endHour" required>
              ${Array.from({length: 24}, (_, i) => `<option value="${i + 1}" ${i === 16 ? 'selected' : ''}>${i + 1}:00</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Task Description</label>
          <textarea name="taskDescription" rows="2"></textarea>
        </div>
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" name="isRemote">
            Remote Work
          </label>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Create Assignment</button>
        </div>
      </form>
    `);
    
    document.getElementById('add-assignment-form').onsubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = {
        personId: parseInt(formData.get('personId')),
        projectId: parseInt(formData.get('projectId')),
        date: formData.get('date'),
        startHour: parseInt(formData.get('startHour')),
        endHour: parseInt(formData.get('endHour')),
        taskDescription: formData.get('taskDescription'),
        isRemote: formData.get('isRemote') === 'on'
      };
      
      try {
        await api('/assignments', {
          method: 'POST',
          body: JSON.stringify(data)
        });
        closeModal();
        showToast('Assignment created successfully');
        if (state.currentView === 'schedule') loadSchedule();
        else loadDashboard();
      } catch (error) {
        showToast(error.message, 'error');
      }
    };
  } catch (error) {
    showToast('Failed to load form data', 'error');
  }
}

// ===== Event Listeners =====
document.addEventListener('DOMContentLoaded', () => {
  // Load public branding immediately (for login page)
  loadBranding(true);
  
  // Login form
  document.getElementById('login-form').onsubmit = async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('login-error');
    
    try {
      errorDiv.classList.add('hidden');
      await login(username, password);
    } catch (error) {
      errorDiv.textContent = error.message;
      errorDiv.classList.remove('hidden');
    }
  };
  
  // Navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const view = item.dataset.view;
      if (view) switchView(view);
    });
  });
  
  // Also handle links with data-view in content area
  document.addEventListener('click', (e) => {
    if (e.target.matches('[data-view]') || e.target.closest('[data-view]')) {
      e.preventDefault();
      const el = e.target.matches('[data-view]') ? e.target : e.target.closest('[data-view]');
      switchView(el.dataset.view);
    }
  });
  
  // Logout
  document.getElementById('logout-btn').addEventListener('click', logout);
  
  // Mobile menu
  document.getElementById('mobile-menu-btn').addEventListener('click', () => {
    document.querySelector('.sidebar').classList.toggle('open');
  });
  
  // Modal close
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
  
  // Schedule navigation
  document.getElementById('prev-date').addEventListener('click', () => changeScheduleDate(-1));
  document.getElementById('next-date').addEventListener('click', () => changeScheduleDate(1));
  document.getElementById('today-btn').addEventListener('click', () => {
    state.scheduleDate = new Date().toISOString().split('T')[0];
    loadSchedule();
  });
  document.getElementById('schedule-date').addEventListener('change', (e) => {
    state.scheduleDate = e.target.value;
    loadSchedule();
  });
  
  // Schedule view toggle
  document.querySelectorAll('[data-schedule-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-schedule-view]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.scheduleViewType = btn.dataset.scheduleView;
      loadSchedule();
    });
  });
  
  // Add buttons
  document.getElementById('add-assignment-btn')?.addEventListener('click', showAddAssignmentModal);
  document.getElementById('quick-add-btn')?.addEventListener('click', showAddAssignmentModal);
  document.getElementById('add-person-btn')?.addEventListener('click', showAddPersonModal);
  document.getElementById('add-project-btn')?.addEventListener('click', showAddProjectModal);
  document.getElementById('add-skill-btn')?.addEventListener('click', showAddSkillModal);
  document.getElementById('add-user-btn')?.addEventListener('click', showAddUserModal);
  
  // AI Scheduler
  document.getElementById('generate-schedule-btn')?.addEventListener('click', generateAISuggestions);
  
  // Search handlers
  let searchTimeout;
  ['people-search', 'projects-search', 'skills-search'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        if (id === 'people-search') loadPeople();
        if (id === 'projects-search') loadProjects();
        if (id === 'skills-search') loadSkills();
      }, 300);
    });
  });
  
  // Filter handlers
  document.getElementById('people-department-filter')?.addEventListener('change', loadPeople);
  document.getElementById('projects-status-filter')?.addEventListener('change', loadProjects);
  document.getElementById('skills-category-filter')?.addEventListener('change', loadSkills);
  document.getElementById('conflicts-type-filter')?.addEventListener('change', loadConflicts);
  document.getElementById('conflicts-severity-filter')?.addEventListener('change', loadConflicts);
  document.getElementById('conflicts-show-resolved')?.addEventListener('change', loadConflicts);
  
  // Detect conflicts button
  document.getElementById('detect-conflicts-btn')?.addEventListener('click', async () => {
    if (!canEdit()) {
      showToast('You do not have permission to run conflict detection', 'error');
      return;
    }
    
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      
      await api('/conflicts/detect', {
        method: 'POST',
        body: JSON.stringify({
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        })
      });
      showToast('Conflict detection completed');
      loadConflicts();
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
  
  // Export buttons
  document.getElementById('export-excel-btn')?.addEventListener('click', exportExcel);
  document.getElementById('export-pdf-btn')?.addEventListener('click', exportPDF);
  document.getElementById('preview-report-btn')?.addEventListener('click', previewReport);
  document.getElementById('print-report-btn')?.addEventListener('click', printReport);
  
  // Branding/Settings forms
  document.getElementById('branding-form')?.addEventListener('submit', saveBranding);
  document.getElementById('system-settings-form')?.addEventListener('submit', saveSystemSettings);
  
  // Icon selector
  document.querySelectorAll('.icon-option').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.icon-option').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      updateBrandingPreview();
    });
  });
  
  // Color picker sync
  document.getElementById('setting-primary-color')?.addEventListener('input', (e) => {
    document.getElementById('setting-primary-color-hex').value = e.target.value;
    updateBrandingPreview();
  });
  
  document.getElementById('setting-primary-color-hex')?.addEventListener('input', (e) => {
    const color = e.target.value;
    if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
      document.getElementById('setting-primary-color').value = color;
      updateBrandingPreview();
    }
  });
  
  // Live preview updates
  ['setting-company-name', 'setting-logo-url', 'setting-footer-text'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updateBrandingPreview);
  });
  
  // ===== Mobile Navigation =====
  const sidebar = document.querySelector('.sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileBottomNav = document.getElementById('mobile-bottom-nav');
  const mobileMoreMenu = document.getElementById('mobile-more-menu');
  const mobileMoreBtn = document.getElementById('mobile-more-btn');
  
  // Mobile menu button (hamburger)
  mobileMenuBtn?.addEventListener('click', () => {
    sidebar?.classList.toggle('open');
    sidebarOverlay?.classList.toggle('active');
  });
  
  // Close sidebar when clicking overlay
  sidebarOverlay?.addEventListener('click', () => {
    sidebar?.classList.remove('open');
    sidebarOverlay?.classList.remove('active');
    mobileMoreMenu?.classList.remove('active');
  });
  
  // Mobile bottom navigation
  mobileBottomNav?.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const view = item.dataset.view;
      
      if (view === 'more') {
        // Toggle more menu
        mobileMoreMenu?.classList.toggle('active');
        return;
      }
      
      // Close more menu if open
      mobileMoreMenu?.classList.remove('active');
      
      // Update active state
      mobileBottomNav.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      
      if (view) switchView(view);
    });
  });
  
  // Mobile more menu items
  mobileMoreMenu?.querySelectorAll('.more-menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const view = item.dataset.view;
      
      if (view) {
        mobileMoreMenu.classList.remove('active');
        
        // Update bottom nav active state - set "more" as active
        mobileBottomNav?.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        mobileMoreBtn?.classList.add('active');
        
        switchView(view);
      }
    });
  });
  
  // Mobile logout
  document.getElementById('mobile-logout-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    mobileMoreMenu?.classList.remove('active');
    logout();
  });
  
  // Close more menu when clicking outside
  document.addEventListener('click', (e) => {
    if (mobileMoreMenu?.classList.contains('active')) {
      if (!e.target.closest('.mobile-more-menu') && !e.target.closest('#mobile-more-btn')) {
        mobileMoreMenu.classList.remove('active');
      }
    }
  });
  
  // Update mobile nav active state when switching views
  const originalSwitchView = window.switchView || switchView;
  window.switchView = function(viewName) {
    // Call original function
    if (typeof originalSwitchView === 'function') {
      originalSwitchView.call(this, viewName);
    }
    
    // Update mobile bottom nav
    const mainViews = ['dashboard', 'schedule', 'people', 'projects'];
    if (mobileBottomNav) {
      mobileBottomNav.querySelectorAll('.nav-item').forEach(item => {
        if (item.dataset.view === viewName) {
          mobileBottomNav.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
          item.classList.add('active');
        } else if (!mainViews.includes(viewName) && item.dataset.view === 'more') {
          mobileBottomNav.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
          item.classList.add('active');
        }
      });
    }
  };
  
  // Initialize
  checkAuth();
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Escape to close modal
  if (e.key === 'Escape') closeModal();
  
  // ? to show help (but not when typing in an input)
  if (e.key === '?' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
    e.preventDefault();
    showHelp();
  }
});

// Help button click
document.getElementById('help-btn')?.addEventListener('click', showHelp);
