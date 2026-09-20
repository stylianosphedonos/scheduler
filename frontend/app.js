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
function getHelpContent() {
  return {
    dashboard: {
      title: t('help.dashboard.title'),
      content: `
        <h4>${t('help.overview')}</h4>
        <p>${t('help.dashboard.overview')}</p>
        
        <h4>${t('help.dashboard.keyMetrics')}</h4>
        <ul>
          <li><strong>${t('dashboard.activePeople')}:</strong> ${t('help.dashboard.activePeopleDesc')}</li>
          <li><strong>${t('dashboard.activeProjects')}:</strong> ${t('help.dashboard.activeProjectsDesc')}</li>
          <li><strong>${t('dashboard.todaysSchedule')}:</strong> ${t('help.dashboard.todayAssignmentsDesc')}</li>
          <li><strong>${t('conflicts.title')}:</strong> ${t('help.dashboard.conflictsDesc')}</li>
        </ul>
        
        <h4>${t('help.tips')}</h4>
        <ul>
          <li>${t('help.dashboard.tip1')}</li>
          <li>${t('help.dashboard.tip2')}</li>
          <li>${t('help.dashboard.tip3')}</li>
        </ul>
      `
    },
    schedule: {
      title: t('help.schedule.title'),
      content: `
        <h4>${t('help.overview')}</h4>
        <p>${t('help.schedule.overview')}</p>
        
        <h4>${t('help.navigation')}</h4>
        <ul>
          <li><strong>← / →:</strong> ${t('help.schedule.prevNext')}</li>
          <li><strong>${t('schedule.today')}:</strong> ${t('help.schedule.jumpToToday')}</li>
          <li><strong>${t('schedule.day')}/${t('schedule.week')}:</strong> ${t('help.schedule.toggleView')}</li>
        </ul>
        
        <h4>${t('help.schedule.creatingAssignments')}</h4>
        <ol>
          <li>${t('help.schedule.step1')}</li>
          <li>${t('help.schedule.step2')}</li>
          <li>${t('help.schedule.step3')}</li>
          <li>${t('help.schedule.step4')}</li>
        </ol>
        
        <h4>${t('help.tips')}</h4>
        <ul>
          <li>${t('help.schedule.tip1')}</li>
          <li>${t('help.schedule.tip2')}</li>
          <li>${t('help.schedule.tip3')}</li>
        </ul>
      `
    },
    people: {
      title: t('help.people.title'),
      content: `
        <h4>${t('help.overview')}</h4>
        <p>${t('help.people.overview')}</p>
        
        <h4>${t('help.people.addingPerson')}</h4>
        <ol>
          <li>${t('help.people.step1')}</li>
          <li>${t('help.people.step2')}</li>
          <li>${t('help.people.step3')}</li>
          <li>${t('help.people.step4')}</li>
        </ol>
        
        <h4>${t('people.workHours') || 'Work Hours'} <span style="color:#10b981;font-size:0.8em;">(NEW)</span></h4>
        <p>${t('help.people.workHoursDesc') || 'Define individual work schedules for each employee:'}</p>
        <ul>
          <li><strong>${t('people.workStartTime') || 'Work Start Time'}:</strong> ${t('help.people.startTimeDesc') || 'When the workday begins (e.g., 09:00)'}</li>
          <li><strong>${t('people.workEndTime') || 'Work End Time'}:</strong> ${t('help.people.endTimeDesc') || 'When the workday ends (e.g., 17:00)'}</li>
          <li>${t('help.people.workHoursTip') || 'AI scheduler respects these hours when creating assignments'}</li>
        </ul>
        
        <h4>${t('help.people.assigningSkills')}</h4>
        <ol>
          <li>${t('help.people.skillStep1')}</li>
          <li>${t('help.people.skillStep2')}</li>
          <li>${t('help.people.skillStep3')}</li>
          <li>${t('help.people.skillStep4')}</li>
        </ol>
        
        <h4>${t('help.people.proficiencyLevels')}</h4>
        <ul>
          <li><strong>1:</strong> ${t('skills.proficiencyLevels.1')}</li>
          <li><strong>2:</strong> ${t('skills.proficiencyLevels.2')}</li>
          <li><strong>3:</strong> ${t('skills.proficiencyLevels.3')}</li>
          <li><strong>4:</strong> ${t('skills.proficiencyLevels.4')}</li>
          <li><strong>5:</strong> ${t('skills.proficiencyLevels.5')}</li>
        </ul>
      `
    },
    projects: {
      title: t('help.projects.title'),
      content: `
        <h4>${t('help.overview')}</h4>
        <p>${t('help.projects.overview')}</p>
        
        <h4>${t('help.projects.creating')}</h4>
        <ol>
          <li>${t('help.projects.step1')}</li>
          <li>${t('help.projects.step2')}</li>
          <li>${t('help.projects.step3')}</li>
          <li>${t('help.projects.step4')}</li>
        </ol>
        
        <h4>${t('projects.location') || 'Location'} <span style="color:#10b981;font-size:0.8em;">(NEW)</span></h4>
        <p>${t('help.projects.locationDesc') || 'Projects can have a physical location. Paste a Google Maps link and coordinates are extracted automatically.'}</p>
        <ul>
          <li><strong>${t('projects.locationName') || 'Location Name'}:</strong> ${t('help.projects.locationNameDesc') || 'Name of the site (e.g., Main Office)'}</li>
          <li><strong>${t('projects.locationUrl') || 'Google Maps Link'}:</strong> ${t('help.projects.locationUrlDesc') || 'Paste link to auto-extract coordinates'}</li>
          <li><strong>${t('help.projects.locationAI') || 'AI Integration'}:</strong> ${t('help.projects.locationAIDesc') || 'AI scheduler prefers nearby locations to minimize travel'}</li>
        </ul>
        
        <h4>${t('help.projects.skillReqs')}</h4>
        <p>${t('help.projects.skillReqsDesc')}</p>
        <ul>
          <li><strong>${t('projects.peopleNeeded')}:</strong> ${t('help.projects.peopleNeededDesc')}</li>
          <li><strong>${t('help.projects.minLevel')}:</strong> ${t('help.projects.minLevelDesc')}</li>
          <li><strong>${t('common.required')}:</strong> ${t('help.projects.requiredDesc')}</li>
        </ul>
        
        <h4>${t('help.projects.findCandidates')}</h4>
        <p>${t('help.projects.findCandidatesDesc')}</p>
      `
    },
    skills: {
      title: t('help.skills.title'),
      content: `
        <h4>${t('help.overview')}</h4>
        <p>${t('help.skills.overview')}</p>
        
        <h4>${t('help.skills.adding')}</h4>
        <ol>
          <li>${t('help.skills.step1')}</li>
          <li>${t('help.skills.step2')}</li>
          <li>${t('help.skills.step3')}</li>
          <li>${t('help.skills.step4')}</li>
          <li>${t('help.skills.step5')}</li>
        </ol>
        
        <h4>${t('help.skills.statistics')}</h4>
        <p>${t('help.skills.statisticsDesc')}</p>
        <ul>
          <li>${t('help.skills.stat1')}</li>
          <li>${t('help.skills.stat2')}</li>
        </ul>
        
        <h4>${t('help.skills.skillGaps')}</h4>
        <p>${t('help.skills.skillGapsDesc')}</p>
      `
    },
    groups: {
      title: t('help.groups.title') || 'Groups Help',
      content: `
        <h4>${t('help.overview')}</h4>
        <p>${t('help.groups.overview') || 'Groups allow you to organize people into teams and assign projects to groups for better coordination.'}</p>
        
        <h4>${t('help.groups.creating') || 'Creating a Group'}</h4>
        <ol>
          <li>${t('help.groups.step1') || 'Click "Add Group" button'}</li>
          <li>${t('help.groups.step2') || 'Enter group name and description'}</li>
          <li>${t('help.groups.step3') || 'Choose a color for visual identification'}</li>
          <li>${t('help.groups.step4') || 'Optionally select a team leader'}</li>
          <li>${t('help.groups.step5') || 'Save the group'}</li>
        </ol>
        
        <h4>${t('help.groups.members') || 'Managing Members'}</h4>
        <ul>
          <li>${t('help.groups.members1') || 'Add people to groups from the group details view'}</li>
          <li>${t('help.groups.members2') || 'Assign "Leader" or "Member" roles'}</li>
          <li>${t('help.groups.members3') || 'Remove members without deleting them from the system'}</li>
        </ul>
        
        <h4>${t('help.groups.projects') || 'Assigning Projects'}</h4>
        <ul>
          <li>${t('help.groups.projects1') || 'Link projects to groups from group details'}</li>
          <li>${t('help.groups.projects2') || 'Track which team is responsible for each project'}</li>
          <li>${t('help.groups.projects3') || 'Help distribute work across teams'}</li>
        </ul>
        
        <h4>${t('help.tips')}</h4>
        <ul>
          <li>${t('help.groups.tip1') || 'Use groups to organize by department or skill set'}</li>
          <li>${t('help.groups.tip2') || 'Click on a group card to see full details'}</li>
          <li>${t('help.groups.tip3') || 'Filter groups by status to find active teams'}</li>
        </ul>
      `
    },
    'ai-scheduler': {
      title: t('help.aiScheduler.title'),
      content: `
        <h4>${t('help.overview')}</h4>
        <p>${t('help.aiScheduler.overview')}</p>
        
        <h4>${t('help.aiScheduler.howToUse')}</h4>
        <ol>
          <li>${t('help.aiScheduler.step1')}</li>
          <li>${t('help.aiScheduler.step2')}</li>
          <li>${t('help.aiScheduler.step3')}</li>
          <li>${t('help.aiScheduler.step4')}</li>
        </ol>
        
        <h4>${t('help.aiScheduler.actions')}</h4>
        <ul>
          <li><strong>✓ ${t('help.aiScheduler.accept')}:</strong> ${t('help.aiScheduler.acceptDesc')}</li>
          <li><strong>↔ ${t('help.aiScheduler.reschedule')}:</strong> ${t('help.aiScheduler.rescheduleDesc')}</li>
          <li><strong>✗ ${t('aiScheduler.remove')}:</strong> ${t('help.aiScheduler.removeDesc')}</li>
        </ul>
        
        <h4>${t('help.aiScheduler.considerations')}</h4>
        <ul>
          <li>${t('help.aiScheduler.consideration1')}</li>
          <li>${t('help.aiScheduler.consideration2')}</li>
          <li>${t('help.aiScheduler.consideration3')}</li>
          <li>${t('help.aiScheduler.consideration4')}</li>
          <li>${t('help.aiScheduler.consideration5') || 'Location proximity - prefers assigning people to nearby projects'}</li>
        </ul>
        
        <h4>${t('help.aiScheduler.locationAware') || 'Location-Aware Scheduling'} <span style="color:#10b981;font-size:0.8em;">(NEW)</span></h4>
        <p>${t('help.aiScheduler.locationAwareDesc') || 'The AI considers project locations when making assignments:'}</p>
        <ul>
          <li>${t('help.aiScheduler.location1') || 'Same location (< 0.5 km): +20 points'}</li>
          <li>${t('help.aiScheduler.location2') || 'Very close (< 2 km): +15 points'}</li>
          <li>${t('help.aiScheduler.location3') || 'Close (< 5 km): +10 points'}</li>
          <li>${t('help.aiScheduler.location4') || 'Moderate (< 15 km): +5 points'}</li>
        </ul>
      `
    },
    conflicts: {
      title: t('help.conflicts.title'),
      content: `
        <h4>${t('help.overview')}</h4>
        <p>${t('help.conflicts.overview')}</p>
        
        <h4>${t('help.conflicts.types')}</h4>
        <ul>
          <li><strong>${t('conflicts.overlap')}:</strong> ${t('help.conflicts.overlapDesc')}</li>
          <li><strong>${t('conflicts.overallocation')}:</strong> ${t('help.conflicts.overallocationDesc')}</li>
          <li><strong>${t('conflicts.skillGap')}:</strong> ${t('help.conflicts.skillGapDesc')}</li>
          <li><strong>${t('conflicts.unavailable')}:</strong> ${t('help.conflicts.unavailableDesc')}</li>
        </ul>
        
        <h4>${t('help.conflicts.severityLevels')}</h4>
        <ul>
          <li><span style="color:#ef4444">●</span> <strong>${t('projects.critical')}:</strong> ${t('help.conflicts.criticalDesc')}</li>
          <li><span style="color:#f59e0b">●</span> <strong>${t('common.warning')}:</strong> ${t('help.conflicts.warningDesc')}</li>
          <li><span style="color:#64748b">●</span> <strong>${t('common.info')}:</strong> ${t('help.conflicts.infoDesc')}</li>
        </ul>
        
        <h4>${t('help.conflicts.resolving')}</h4>
        <ol>
          <li>${t('help.conflicts.resolveStep1')}</li>
          <li>${t('help.conflicts.resolveStep2')}</li>
          <li>${t('help.conflicts.resolveStep3')}</li>
        </ol>
      `
    },
    reports: {
      title: t('help.reports.title'),
      content: `
        <h4>${t('help.overview')}</h4>
        <p>${t('help.reports.overview')}</p>
        
        <h4>${t('reports.projectSummary')}</h4>
        <p>${t('help.reports.summaryDesc')}</p>
        <ul>
          <li>${t('help.reports.item1')}</li>
          <li>${t('help.reports.item2')}</li>
          <li>${t('help.reports.item3')}</li>
        </ul>
        
        <h4>${t('reports.preview')}</h4>
        <ol>
          <li>${t('help.reports.previewStep1')}</li>
          <li>${t('help.reports.previewStep2')}</li>
          <li>${t('help.reports.previewStep3')}</li>
        </ol>
        
        <h4>${t('help.reports.exporting')}</h4>
        <ul>
          <li><strong>Excel:</strong> ${t('help.reports.excelDesc')}</li>
          <li><strong>PDF:</strong> ${t('help.reports.pdfDesc')}</li>
        </ul>
        
        <h4>${t('help.reports.structure')}</h4>
        <p>${t('help.reports.structureDesc')}</p>
      `
    },
    users: {
      title: t('help.users.title'),
      content: `
        <h4>${t('help.overview')}</h4>
        <p>${t('help.users.overview')}</p>
        
        <h4>${t('help.users.adding')}</h4>
        <ol>
          <li>${t('help.users.step1')}</li>
          <li>${t('help.users.step2')}</li>
          <li>${t('help.users.step3')}</li>
          <li>${t('help.users.step4')}</li>
        </ol>
        
        <h4>${t('help.users.roles')}</h4>
        <ul>
          <li><strong>${t('users.admin')}:</strong> ${t('help.users.adminDesc')}</li>
          <li><strong>${t('users.manager')}:</strong> ${t('help.users.managerDesc')}</li>
          <li><strong>${t('users.scheduler')}:</strong> ${t('help.users.schedulerDesc')}</li>
          <li><strong>${t('users.viewer')}:</strong> ${t('help.users.viewerDesc')}</li>
        </ul>
        
        <h4>${t('common.actions')}</h4>
        <ul>
          <li>${t('help.users.action1')}</li>
          <li>${t('help.users.action2')}</li>
          <li>${t('help.users.action3')}</li>
        </ul>
      `
    },
    settings: {
      title: t('help.settings.title'),
      content: `
        <h4>${t('settings.branding')}</h4>
        <p>${t('help.settings.brandingDesc')}</p>
        <ul>
          <li><strong>${t('settings.companyName')}:</strong> ${t('settings.companyNameHint')}</li>
          <li><strong>${t('settings.logo')}:</strong> ${t('help.settings.logoDesc')}</li>
          <li><strong>${t('settings.primaryColor')}:</strong> ${t('settings.primaryColorHint')}</li>
          <li><strong>${t('settings.footerText')}:</strong> ${t('settings.footerTextHint')}</li>
        </ul>
        
        <h4>${t('settings.languageTranslations')}</h4>
        <p>${t('help.settings.langDesc')}</p>
        <ul>
          <li><strong>${t('settings.defaultLanguage')}:</strong> ${t('settings.defaultLanguageHint')}</li>
          <li><strong>${t('settings.yourLanguage')}:</strong> ${t('settings.yourLanguageHint')}</li>
          <li><strong>${t('settings.translationManagement')}:</strong> ${t('help.settings.transDesc')}</li>
        </ul>
        <p>${t('help.settings.transManager')}</p>
        
        <h4>${t('help.settings.preview')}</h4>
        <p>${t('help.settings.previewDesc')}</p>
      `
    }
  };
}

function showHelp() {
  const view = state.currentView;
  const helpContent = getHelpContent();
  const help = helpContent[view] || {
    title: t('help.title'),
    content: `<p>${t('help.notAvailable')}</p>`
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
  
  // Load database info (admin only) - silent load, no toast
  if (canManageUsers()) {
    loadDatabaseInfo(false);
  }
  
  // Load dashboard configuration UI
  loadDashboardConfigUI();
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
  
  // Update language switcher UI
  updateLanguageSwitcherUI(langCode);
  
  // Update settings dropdown if visible
  const settingsDropdown = document.getElementById('setting-user-language');
  if (settingsDropdown) {
    settingsDropdown.value = langCode;
  }
  
  showToast(`Language changed to ${langCode === 'el' ? 'Greek (Ελληνικά)' : 'English'}. Some text will update on next page load.`);
}

// ===== Database Management Functions =====
async function loadDatabaseInfo(showNotification = true) {
  try {
    // Check if elements exist first (settings view might not be active)
    const dbTypeEl = document.getElementById('db-type');
    const dbTotalEl = document.getElementById('db-total-records');
    const infoContent = document.getElementById('db-info-content');
    
    // Only proceed if at least one element exists (settings view is visible)
    if (!dbTypeEl && !dbTotalEl && !infoContent) {
      return; // Settings view not visible, skip silently
    }
    
    const info = await api('/database/info');
    
    if (dbTypeEl) dbTypeEl.textContent = info.databaseType || 'Unknown';
    if (dbTotalEl) dbTotalEl.textContent = info.totalRecords?.toLocaleString() || '0';
    
    // Show table breakdown
    if (infoContent && info.tables) {
      let html = `
        <div class="db-info-item">
          <span class="db-info-label">Type:</span>
          <span class="db-info-value">${info.databaseType}</span>
        </div>
        <div class="db-info-item">
          <span class="db-info-label">Total Records:</span>
          <span class="db-info-value">${info.totalRecords?.toLocaleString()}</span>
        </div>
      `;
      
      // Add table counts
      for (const [table, count] of Object.entries(info.tables)) {
        html += `
          <div class="db-info-item">
            <span class="db-info-label">${table}:</span>
            <span class="db-info-value">${count?.toLocaleString()}</span>
          </div>
        `;
      }
      
      infoContent.innerHTML = html;
    }
    
    if (showNotification) {
      showToast('Database info refreshed', 'success');
    }
  } catch (error) {
    if (showNotification) {
      showToast('Failed to load database info: ' + error.message, 'error');
    }
  }
}

async function createDatabaseBackup() {
  try {
    showToast('Creating backup...', 'info');
    
    const response = await api('/database/backup', {
      method: 'POST'
    });
    
    if (response.success && response.backup) {
      // Create downloadable file
      const blob = new Blob([JSON.stringify(response.backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scheduler_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showToast('Backup created and downloaded successfully', 'success');
    }
  } catch (error) {
    showToast('Failed to create backup: ' + error.message, 'error');
  }
}

async function exportDatabase() {
  try {
    showToast('Exporting database...', 'info');
    
    // Use fetch directly for download
    const response = await fetch('/api/database/export', {
      headers: {
        'Authorization': `Bearer ${state.token}`
      }
    });
    
    if (!response.ok) throw new Error('Export failed');
    
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scheduler_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Database exported successfully', 'success');
  } catch (error) {
    showToast('Failed to export database: ' + error.message, 'error');
  }
}

async function cleanDatabase() {
  const olderThanDays = parseInt(document.getElementById('clean-older-than').value) || 90;
  
  const confirmed = confirm(`This will delete:\n\n• Completed/cancelled assignments older than ${olderThanDays} days\n• Resolved conflicts older than ${olderThanDays} days\n• Export logs older than ${olderThanDays} days\n• Audit logs older than ${olderThanDays} days\n\nContinue?`);
  
  if (!confirmed) return;
  
  try {
    showToast('Cleaning database...', 'info');
    
    const response = await api('/database/clean', {
      method: 'POST',
      body: JSON.stringify({
        cleanAssignments: true,
        cleanConflicts: true,
        cleanExportLogs: true,
        cleanAuditLogs: true,
        olderThanDays
      })
    });
    
    if (response.success) {
      const total = (response.results.assignmentsDeleted || 0) + 
                   (response.results.conflictsDeleted || 0) + 
                   (response.results.exportLogsDeleted || 0) +
                   (response.results.auditLogsDeleted || 0);
      
      showToast(`Database cleaned! ${total} records removed.`, 'success');
      loadDatabaseInfo(); // Refresh stats
    }
  } catch (error) {
    showToast('Failed to clean database: ' + error.message, 'error');
  }
}

function confirmResetDatabase() {
  // First confirmation
  const confirmed1 = confirm('⚠️ WARNING: This will DELETE ALL DATA!\n\nOnly admin user accounts will be preserved.\n\nAre you absolutely sure?');
  if (!confirmed1) return;
  
  // Second confirmation with typed input
  const confirmText = prompt('Type "RESET_DATABASE" to confirm this action:');
  if (confirmText !== 'RESET_DATABASE') {
    showToast('Reset cancelled - confirmation text did not match', 'warning');
    return;
  }
  
  resetDatabase();
}

async function resetDatabase() {
  try {
    showToast('Resetting database...', 'info');
    
    const response = await api('/database/reset', {
      method: 'POST',
      body: JSON.stringify({
        confirmReset: 'RESET_DATABASE'
      })
    });
    
    if (response.success) {
      showToast('Database reset successfully! Admin users preserved.', 'success');
      loadDatabaseInfo(); // Refresh stats
      
      // Reload the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  } catch (error) {
    showToast('Failed to reset database: ' + error.message, 'error');
  }
}

// Language Switcher Functions
async function initLanguageSwitcher() {
  // Initialize i18n system
  if (window.i18n) {
    await window.i18n.init();
    // Apply translations after init
    window.i18n.applyTranslations();
  }
  
  const currentLang = localStorage.getItem('scheduler_language') || 'en';
  updateLanguageSwitcherUI(currentLang);
  
  // Toggle dropdown
  const toggleBtn = document.getElementById('lang-toggle-btn');
  const switcher = document.getElementById('language-switcher');
  
  if (toggleBtn && switcher) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      switcher.classList.toggle('open');
    });
    
    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!switcher.contains(e.target)) {
        switcher.classList.remove('open');
      }
    });
  }
  
  // Listen for language changes
  document.addEventListener('languageChanged', () => {
    if (window.i18n) {
      window.i18n.applyTranslations();
    }
  });
}

function updateLanguageSwitcherUI(langCode) {
  const flag = document.getElementById('current-lang-flag');
  if (flag) {
    flag.textContent = langCode === 'el' ? '🇬🇷' : '🇬🇧';
  }
  
  // Update active state in dropdown
  document.querySelectorAll('.lang-option').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.lang === langCode);
  });
}

async function switchLanguage(langCode) {
  // Close dropdown
  const switcher = document.getElementById('language-switcher');
  if (switcher) {
    switcher.classList.remove('open');
  }
  
  // Change language
  await changeUserLanguage(langCode);
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

// ===== Location Utilities =====
function extractCoordinates(input) {
  setTimeout(() => {
    const url = input.value;
    if (!url) return;
    
    // Try to extract coordinates from various Google Maps URL formats
    let lat, lng;
    
    // Format: @lat,lng,zoom
    let match = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (match) {
      lat = parseFloat(match[1]);
      lng = parseFloat(match[2]);
    }
    
    // Format: ?q=lat,lng or place/lat,lng
    if (!lat) {
      match = url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (match) {
        lat = parseFloat(match[1]);
        lng = parseFloat(match[2]);
      }
    }
    
    // Format: ll=lat,lng
    if (!lat) {
      match = url.match(/ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (match) {
        lat = parseFloat(match[1]);
        lng = parseFloat(match[2]);
      }
    }
    
    // Format: /place/.../@lat,lng or maps/place/.../@lat,lng
    if (!lat) {
      match = url.match(/place\/[^@]*@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (match) {
        lat = parseFloat(match[1]);
        lng = parseFloat(match[2]);
      }
    }
    
    if (lat && lng) {
      // Find the form and update lat/lng fields
      const form = input.closest('form');
      if (form) {
        const latInput = form.querySelector('[name="locationLat"]');
        const lngInput = form.querySelector('[name="locationLng"]');
        if (latInput) latInput.value = lat;
        if (lngInput) lngInput.value = lng;
        showToast(t('projects.coordinatesExtracted') || 'Coordinates extracted from link', 'success');
      }
    }
  }, 100);
}

// Calculate distance between two coordinates in km (Haversine formula)
function calculateDistance(lat1, lng1, lat2, lng2) {
  if (!lat1 || !lng1 || !lat2 || !lng2) return null;
  
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
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

// ===== Utilities =====
// Format date to yyyy-MM-dd for HTML date inputs
function formatDateForInput(dateString) {
  if (!dateString) return '';
  // Handle ISO format with time (e.g., "2026-01-04T00:00:00.000Z")
  if (dateString.includes('T')) {
    return dateString.split('T')[0];
  }
  // Already in correct format
  return dateString;
}

// ===== Modal =====
function showModal(title, content, className = '') {
  const modal = document.getElementById('modal');
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = content;
  modal.className = className ? `modal ${className}` : 'modal';
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  const modal = document.getElementById('modal');
  if (modal) modal.className = 'modal';
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
  
  // Initialize language switcher
  initLanguageSwitcher();
  
  loadDashboard();
  updateWebRequestBadge();
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
  
  // Update title with translation
  const titleKeys = {
    dashboard: 'nav.dashboard',
    schedule: 'nav.schedule',
    people: 'nav.people',
    projects: 'nav.projects',
    skills: 'nav.skills',
    conflicts: 'nav.conflicts',
    'ai-scheduler': 'aiScheduler.title',
    reports: 'nav.reports',
    users: 'users.title',
    settings: 'settings.title'
  };
  const titleKey = titleKeys[viewName];
  const translatedTitle = window.t ? window.t(titleKey) : viewName;
  document.getElementById('page-title').textContent = translatedTitle || viewName;
  
  // Load view data
  switch (viewName) {
    case 'dashboard': loadDashboard(); break;
    case 'schedule': loadSchedule(); break;
    case 'people': loadPeople(); break;
    case 'projects': loadProjects(); break;
    case 'skills': loadSkills(); break;
    case 'groups': loadGroups(); break;
    case 'conflicts': loadConflicts(); break;
    case 'ai-scheduler': loadAIScheduler(); break;
    case 'reports': loadReports(); break;
    case 'users': loadUsers(); break;
    case 'settings': loadSettings(); break;
  }
}

// ===== Dashboard =====
// Render schedule grouped by projects
function renderScheduleByProjects(container, schedule) {
  if (!schedule || schedule.length === 0) {
    container.innerHTML = `
      <div class="schedule-empty">
        <i class="fas fa-folder-open"></i>
        <p>${t('dashboard.noAssignmentsToday')}</p>
      </div>
    `;
    return;
  }
  
  // Group assignments by project
  const byProject = {};
  schedule.forEach(person => {
    person.assignments.forEach(a => {
      if (!byProject[a.projectId]) {
        byProject[a.projectId] = {
          id: a.projectId,
          name: a.projectName,
          color: a.projectColor,
          assignments: [],
          totalHours: 0
        };
      }
      byProject[a.projectId].assignments.push({
        ...a,
        personName: `${person.firstName} ${person.lastName}`
      });
      byProject[a.projectId].totalHours += (a.endHour - a.startHour);
    });
  });
  
  const projects = Object.values(byProject).sort((a, b) => b.totalHours - a.totalHours);
  
  container.innerHTML = projects.map(project => `
    <div class="schedule-group">
      <div class="schedule-group-header">
        <div class="schedule-group-icon" style="background: ${project.color}">
          ${project.name.substring(0, 2).toUpperCase()}
        </div>
        <div class="schedule-group-info">
          <div class="schedule-group-name">${project.name}</div>
          <div class="schedule-group-meta">${project.assignments.length} ${t('schedule.assignments')}</div>
        </div>
        <div class="schedule-group-hours">
          <div class="hours-value">${project.totalHours}h</div>
          <div class="hours-label">${t('common.total')}</div>
        </div>
      </div>
      <div class="schedule-group-items">
        ${project.assignments.map(a => `
          <div class="schedule-item">
            <span class="schedule-item-time">${String(a.startHour).padStart(2, '0')}:00 - ${String(a.endHour).padStart(2, '0')}:00</span>
            <span class="schedule-item-badge" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white;">
              ${a.personName}
            </span>
            <span class="schedule-item-task">${a.taskDescription || '-'}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

// Render schedule grouped by employees
function renderScheduleByEmployees(container, schedule) {
  if (!schedule || schedule.length === 0) {
    container.innerHTML = `
      <div class="schedule-empty">
        <i class="fas fa-users"></i>
        <p>${t('dashboard.noAssignmentsToday')}</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = schedule.map(person => {
    const totalHours = person.assignments.reduce((sum, a) => sum + (a.endHour - a.startHour), 0);
    return `
      <div class="schedule-group">
        <div class="schedule-group-header">
          <div class="schedule-group-icon" style="background: linear-gradient(135deg, #6366f1, #8b5cf6)">
            ${person.firstName.charAt(0)}${person.lastName.charAt(0)}
          </div>
          <div class="schedule-group-info">
            <div class="schedule-group-name">${person.firstName} ${person.lastName}</div>
            <div class="schedule-group-meta">${person.assignments.length} ${t('schedule.assignments')}</div>
          </div>
          <div class="schedule-group-hours">
            <div class="hours-value">${totalHours}h</div>
            <div class="hours-label">${t('common.total')}</div>
          </div>
        </div>
        <div class="schedule-group-items">
          ${person.assignments.map(a => `
            <div class="schedule-item">
              <span class="schedule-item-time">${String(a.startHour).padStart(2, '0')}:00 - ${String(a.endHour).padStart(2, '0')}:00</span>
              <span class="schedule-item-badge" style="background: ${a.projectColor}20; color: ${a.projectColor}; border: 1px solid ${a.projectColor};">
                ${a.projectName}
              </span>
              <span class="schedule-item-task">${a.taskDescription || '-'}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

async function loadDashboard() {
  try {
    const data = await api('/analytics/dashboard');
    
    // Update stats
    document.getElementById('stat-people').textContent = data.metrics.totalPeople;
    document.getElementById('stat-projects').textContent = data.metrics.totalProjects;
    document.getElementById('stat-hours').textContent = data.today.total_hours || 0;
    document.getElementById('stat-conflicts').textContent = data.metrics.unresolvedConflicts;
    const webRequestCount = data.metrics.webRequests || 0;
    const webRequestsStat = document.getElementById('stat-web-requests');
    if (webRequestsStat) webRequestsStat.textContent = webRequestCount;
    
    // Update conflict badge
    const conflictBadge = document.getElementById('conflict-badge');
    if (data.metrics.unresolvedConflicts > 0) {
      conflictBadge.textContent = data.metrics.unresolvedConflicts;
      conflictBadge.classList.remove('hidden');
    } else {
      conflictBadge.classList.add('hidden');
    }

    // Update web request badges + dashboard list
    updateWebRequestBadge();
    renderDashboardWebRequests(data.webRequests || [], webRequestCount);
    
    // Today's schedules
    const today = new Date().toISOString().split('T')[0];
    const todaySchedule = await api(`/assignments/daily/${today}`);
    
    // Schedule by Projects
    const projectsContainer = document.getElementById('today-by-projects');
    renderScheduleByProjects(projectsContainer, todaySchedule.schedule);
    
    // Schedule by Employees
    const employeesContainer = document.getElementById('today-by-employees');
    renderScheduleByEmployees(employeesContainer, todaySchedule.schedule);
    
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
      chartContainer.innerHTML = `<div class="empty-state"><p>${t('common.noData')}</p></div>`;
    }
    
    // Top utilized
    const topList = document.getElementById('top-utilized-list');
    if (data.topUtilized.length === 0) {
      topList.innerHTML = `<div class="empty-state"><p>${t('dashboard.noUtilizationData')}</p></div>`;
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
          <p>${t('conflicts.noActiveConflicts')}</p>
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
    
    // Available employees
    const availableList = document.getElementById('available-employees-list');
    try {
      const availableData = await api(`/analytics/available-employees?date=${today}`);
      
      if (!availableData.employees || availableData.employees.length === 0) {
        availableList.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-calendar-check"></i>
            <p>${t('dashboard.allEmployeesBusy')}</p>
          </div>
        `;
      } else {
        availableList.innerHTML = availableData.employees.slice(0, 8).map(emp => `
          <div class="list-item available-employee-item">
            <div class="list-item-left">
              <div class="list-item-avatar" style="background: linear-gradient(135deg, #10b981, #34d399);">
                ${emp.firstName.charAt(0)}${emp.lastName.charAt(0)}
              </div>
              <div class="employee-info">
                <span class="list-item-name">${emp.firstName} ${emp.lastName}</span>
                <div class="employee-skills">
                  ${emp.skills && emp.skills.length > 0 
                    ? emp.skills.slice(0, 3).map(s => `
                        <span class="skill-mini-tag" style="background: ${s.color}20; color: ${s.color}; border: 1px solid ${s.color}40;">
                          ${s.name}
                        </span>
                      `).join('') + (emp.skills.length > 3 ? `<span class="skill-more">+${emp.skills.length - 3}</span>` : '')
                    : `<span class="no-skills">${t('common.noSkills')}</span>`
                  }
                </div>
              </div>
            </div>
            <div class="availability-badge">
              <span class="hours-available">${emp.hoursAvailable}h</span>
              <span class="hours-label">${t('dashboard.available')}</span>
            </div>
          </div>
        `).join('');
      }
    } catch (err) {
      availableList.innerHTML = `<div class="empty-state"><p>${t('common.loadError')}</p></div>`;
    }
    
    // Skill demand
    const skillList = document.getElementById('skill-demand-list');
    if (data.skillDemand.length === 0) {
      skillList.innerHTML = `<div class="empty-state"><p>${t('dashboard.noSkillData')}</p></div>`;
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

function renderDashboardWebRequests(requests, count) {
  const list = document.getElementById('web-requests-list');
  const badge = document.getElementById('web-requests-count-badge');
  if (!list) return;

  if (badge) {
    if (count > 0) {
      badge.textContent = count;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  if (!requests.length) {
    list.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-inbox"></i>
        <p>${t('dashboard.noWebRequests') || 'No new web requests'}</p>
      </div>
    `;
    return;
  }

  list.innerHTML = requests.slice(0, 8).map(r => {
    const category = r.serviceCategory || 'custom';
    const contact = r.contactPhone || r.contactEmail || '-';
    const when = r.createdAt ? new Date(r.createdAt).toLocaleString() : '';
    return `
      <div class="list-item web-request-item" onclick="showProjectDetails(${r.id})" style="cursor:pointer;">
        <div class="list-item-left">
          <div class="list-item-avatar" style="background: ${r.color || '#c45c26'}">${(r.client || r.name || '?').charAt(0).toUpperCase()}</div>
          <div>
            <span class="list-item-name">${r.name}</span>
            <span class="list-item-sub">
              <span class="web-request-pill"><i class="fas fa-globe"></i> ${t('projects.webRequest') || 'From web'}</span>
              ${r.client ? ` · ${r.client}` : ''}
              ${r.locationName ? ` · ${r.locationName}` : ''}
            </span>
            <span class="list-item-sub">${contact}${when ? ` · ${when}` : ''}</span>
          </div>
        </div>
        <div class="web-request-actions">
          <span class="status-badge requested">${t('projects.requested') || 'Web Request'}</span>
          <span class="tag">${r.priority || 'medium'}</span>
          ${canEdit() ? `<button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); acceptWebRequest(${r.id})"><i class="fas fa-check"></i></button>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function viewWebRequestsFromDashboard() {
  switchView('projects');
  setTimeout(() => {
    const filter = document.getElementById('projects-status-filter');
    if (filter) {
      filter.value = 'requested';
      loadProjects();
    }
  }, 50);
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
            <h3>${t('schedule.noAssignmentsForDay')}</h3>
            <p>${canEdit() ? t('schedule.clickAddAssignment') : t('schedule.noWorkScheduled')}</p>
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
              ${day.assignments.length === 0 ? `<p class="text-muted">${t('schedule.noAssignments')}</p>` : 
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
          <h3>${t('people.noPeopleFound')}</h3>
          <p>${canEdit() ? t('people.addTeamToStart') : t('people.noTeamMatch')}</p>
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
            <span class="grid-card-stat-value">${String(p.work_start_hour || 9).padStart(2, '0')}:00 - ${String(p.work_end_hour || 17).padStart(2, '0')}:00</span>
            <span class="grid-card-stat-label">${t('people.workHours') || 'Work Hours'}</span>
          </div>
          <div class="grid-card-stat">
            <span class="grid-card-stat-value">${p.employmentType || 'full-time'}</span>
            <span class="grid-card-stat-label">${t('people.type') || 'Type'}</span>
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
          <span class="detail-label">${t('people.employmentType') || 'Employment Type'}</span>
          <span class="detail-value">${person.employmentType || 'full-time'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${t('people.maxHoursPerDay') || 'Max Hours/Day'}</span>
          <span class="detail-value">${person.maxHoursPerDay || 8}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${t('people.workHours') || 'Work Hours'}</span>
          <span class="detail-value">${String(person.work_start_hour || 9).padStart(2, '0')}:00 - ${String(person.work_end_hour || 17).padStart(2, '0')}:00</span>
        </div>
        <h4 style="margin: 20px 0 10px;">${t('people.skills') || 'Skills'}</h4>
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
          ${canEdit() ? `
            <button class="btn btn-danger" onclick="deletePerson(${id})"><i class="fas fa-trash"></i> Delete</button>
            <button class="btn btn-primary" onclick="editPerson(${id})"><i class="fas fa-edit"></i> Edit</button>
          ` : ''}
        </div>
      </div>
    `);
  } catch (error) {
    showToast('Failed to load person details', 'error');
  }
}

async function showAddPersonModal() {
  if (!canEdit()) {
    showToast('You do not have permission to add people', 'error');
    return;
  }
  
  // Fetch available skills
  let allSkills = [];
  try {
    const skillsData = await api('/skills?active=true');
    allSkills = skillsData.data || [];
  } catch (error) {
    console.error('Failed to load skills:', error);
  }
  
  // Group skills by category
  const skillsByCategory = {};
  allSkills.forEach(skill => {
    const category = skill.category || 'Other';
    if (!skillsByCategory[category]) {
      skillsByCategory[category] = [];
    }
    skillsByCategory[category].push(skill);
  });
  
  showModal(t('people.addPerson') || 'Add Person', `
    <form id="add-person-form" class="modal-form">
      <div class="form-row">
        <div class="form-group">
          <label>${t('people.firstName') || 'First Name'} *</label>
          <input type="text" name="firstName" required>
        </div>
        <div class="form-group">
          <label>${t('people.lastName') || 'Last Name'} *</label>
          <input type="text" name="lastName" required>
        </div>
      </div>
      <div class="form-group">
        <label>${t('people.email') || 'Email'} *</label>
        <input type="email" name="email" required>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>${t('people.department') || 'Department'}</label>
          <input type="text" name="department">
        </div>
        <div class="form-group">
          <label>${t('people.jobTitle') || 'Job Title'}</label>
          <input type="text" name="jobTitle">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>${t('people.maxHoursPerDay') || 'Max Hours/Day'}</label>
          <input type="number" name="maxHoursPerDay" value="8" min="1" max="24">
        </div>
        <div class="form-group">
          <label>${t('people.employmentType') || 'Employment Type'}</label>
          <select name="employmentType">
            <option value="full-time">${t('people.fullTime') || 'Full Time'}</option>
            <option value="part-time">${t('people.partTime') || 'Part Time'}</option>
            <option value="contractor">${t('people.contractor') || 'Contractor'}</option>
            <option value="intern">${t('people.intern') || 'Intern'}</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>${t('people.workStartTime') || 'Work Start Time'}</label>
          <select name="workStartHour">
            ${Array.from({length: 24}, (_, i) => `<option value="${i}" ${i === 9 ? 'selected' : ''}>${String(i).padStart(2, '0')}:00</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>${t('people.workEndTime') || 'Work End Time'}</label>
          <select name="workEndHour">
            ${Array.from({length: 24}, (_, i) => `<option value="${i}" ${i === 17 ? 'selected' : ''}>${String(i).padStart(2, '0')}:00</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="checkbox-label">
          <input type="checkbox" name="hasTransportation">
          <i class="fas fa-car"></i> ${t('people.hasTransportation') || 'Has Transportation (Car)'}
        </label>
        <small class="text-muted">${t('people.transportationHint') || 'Check if this person has their own transportation for traveling between project sites'}</small>
      </div>
      
      ${allSkills.length > 0 ? `
        <div class="form-section">
          <h4><i class="fas fa-star"></i> ${t('people.skills') || 'Skills'}</h4>
          <p class="text-muted">${t('people.selectSkillsHint') || 'Select skills and proficiency level (1-5)'}</p>
          <div class="skills-selection-grid">
            ${Object.entries(skillsByCategory).map(([category, skills]) => `
              <div class="skill-category-group">
                <div class="skill-category-title">${category}</div>
                ${skills.map(skill => `
                  <div class="skill-selection-item">
                    <label class="skill-checkbox">
                      <input type="checkbox" name="skill_${skill.id}" value="${skill.id}">
                      <span class="skill-name" style="color: ${skill.color}">${skill.name}</span>
                    </label>
                    <select name="level_${skill.id}" class="skill-level-select" disabled>
                      <option value="1">1 - ${t('skills.beginner') || 'Beginner'}</option>
                      <option value="2">2 - ${t('skills.elementary') || 'Elementary'}</option>
                      <option value="3" selected>3 - ${t('skills.intermediate') || 'Intermediate'}</option>
                      <option value="4">4 - ${t('skills.advanced') || 'Advanced'}</option>
                      <option value="5">5 - ${t('skills.expert') || 'Expert'}</option>
                    </select>
                  </div>
                `).join('')}
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">${t('common.cancel') || 'Cancel'}</button>
        <button type="submit" class="btn btn-primary">${t('people.addPerson') || 'Add Person'}</button>
      </div>
    </form>
  `);
  
  // Add event listeners to enable/disable level selects based on checkbox
  document.querySelectorAll('.skill-selection-item input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      const skillId = checkbox.value;
      const levelSelect = document.querySelector(`select[name="level_${skillId}"]`);
      if (levelSelect) {
        levelSelect.disabled = !checkbox.checked;
      }
    });
  });
  
  document.getElementById('add-person-form').onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // Extract person data
    const data = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      email: formData.get('email'),
      department: formData.get('department'),
      jobTitle: formData.get('jobTitle'),
      maxHoursPerDay: parseInt(formData.get('maxHoursPerDay')) || 8,
      workStartHour: parseInt(formData.get('workStartHour')) || 9,
      workEndHour: parseInt(formData.get('workEndHour')) || 17,
      hasTransportation: formData.get('hasTransportation') === 'on',
      employmentType: formData.get('employmentType')
    };
    
    // Extract selected skills
    const selectedSkills = [];
    allSkills.forEach(skill => {
      if (formData.get(`skill_${skill.id}`)) {
        selectedSkills.push({
          skillId: skill.id,
          proficiencyLevel: parseInt(formData.get(`level_${skill.id}`)) || 3
        });
      }
    });
    
    try {
      // Create person
      const newPerson = await api('/people', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      // If skills were selected, add them
      if (selectedSkills.length > 0 && newPerson.id) {
        await api(`/people/${newPerson.id}/skills`, {
          method: 'PUT',
          body: JSON.stringify({ skills: selectedSkills })
        });
      }
      
      closeModal();
      showToast(t('people.personAdded') || 'Person added successfully');
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
            <label>${t('people.maxHoursPerDay') || 'Max Hours/Day'}</label>
            <input type="number" name="maxHoursPerDay" value="${person.maxHoursPerDay || 8}" min="1" max="24">
          </div>
          <div class="form-group">
            <label>${t('people.employmentType') || 'Employment Type'}</label>
            <select name="employmentType">
              <option value="full-time" ${person.employmentType === 'full-time' ? 'selected' : ''}>${t('people.fullTime') || 'Full Time'}</option>
              <option value="part-time" ${person.employmentType === 'part-time' ? 'selected' : ''}>${t('people.partTime') || 'Part Time'}</option>
              <option value="contractor" ${person.employmentType === 'contractor' ? 'selected' : ''}>${t('people.contractor') || 'Contractor'}</option>
              <option value="intern" ${person.employmentType === 'intern' ? 'selected' : ''}>${t('people.intern') || 'Intern'}</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>${t('people.workStartTime') || 'Work Start Time'}</label>
            <select name="workStartHour">
              ${Array.from({length: 24}, (_, i) => `<option value="${i}" ${i === (person.work_start_hour || 9) ? 'selected' : ''}>${String(i).padStart(2, '0')}:00</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>${t('people.workEndTime') || 'Work End Time'}</label>
            <select name="workEndHour">
              ${Array.from({length: 24}, (_, i) => `<option value="${i}" ${i === (person.work_end_hour || 17) ? 'selected' : ''}>${String(i).padStart(2, '0')}:00</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" name="hasTransportation" ${person.has_transportation ? 'checked' : ''}>
            <i class="fas fa-car"></i> ${t('people.hasTransportation') || 'Has Transportation (Car)'}
          </label>
          <small class="text-muted">${t('people.transportationHint') || 'Check if this person has their own transportation'}</small>
        </div>
        <div class="form-group">
          <label>${t('people.phone') || 'Phone'}</label>
          <input type="tel" name="phone" value="${person.phone || ''}">
        </div>
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" name="isActive" ${person.isActive ? 'checked' : ''}>
            ${t('people.activeEmployee') || 'Active Employee'}
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
        maxHoursPerDay: parseInt(formData.get('maxHoursPerDay')) || 8,
        workStartHour: parseInt(formData.get('workStartHour')) || 9,
        workEndHour: parseInt(formData.get('workEndHour')) || 17,
        hasTransportation: formData.get('hasTransportation') === 'on',
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
          <h3>${t('projects.noProjectsFound')}</h3>
          <p>${canEdit() ? t('projects.createToStart') : t('projects.noProjectsMatch')}</p>
        </div>
      `;
      return;
    }
    
    grid.innerHTML = data.data.map(p => `
      <div class="grid-card ${p.status === 'requested' || p.source === 'web' ? 'web-request' : ''}" onclick="showProjectDetails(${p.id})">
        <div class="grid-card-header">
          <div class="grid-card-avatar" style="background: ${p.color}">${p.name.substring(0, 2).toUpperCase()}</div>
          <div>
            <div class="grid-card-title">${p.name}</div>
            <div class="grid-card-subtitle">${p.client || 'No client'}</div>
          </div>
        </div>
        <div class="grid-card-body">
          <span class="status-badge ${p.status}">${p.status === 'requested' ? (t('projects.requested') || 'Web Request') : p.status}</span>
          ${p.source === 'web' ? `<span class="web-request-pill"><i class="fas fa-globe"></i> ${t('projects.webRequest') || 'From web customer'}</span>` : ''}
          <span class="tag" style="margin-left: 8px;">${p.priority} ${t('projects.priorityLabel') || 'priority'}</span>
          ${(p.locationName || p.location_name) ? `<span class="tag" style="margin-left: 8px;"><i class="fas fa-map-marker-alt"></i> ${p.locationName || p.location_name}</span>` : ''}
        </div>
        <div class="grid-card-footer">
          <div class="grid-card-stat">
            <span class="grid-card-stat-value">${p.assignedPeople}</span>
            <span class="grid-card-stat-label">${t('common.people') || 'People'}</span>
          </div>
          <div class="grid-card-stat">
            <span class="grid-card-stat-value">${p.assignmentCount}</span>
            <span class="grid-card-stat-label">${t('nav.assignments') || 'Assignments'}</span>
          </div>
        </div>
      </div>
    `).join('');
    updateWebRequestBadge();
  } catch (error) {
    console.error('Projects error:', error);
    showToast('Failed to load projects', 'error');
  }
}

async function updateWebRequestBadge() {
  try {
    const data = await api('/projects?status=requested&limit=1');
    const count = data.pagination?.total || 0;
    const badge = document.getElementById('web-request-badge');
    if (!badge) return;
    if (count > 0) {
      badge.textContent = count;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  } catch (_) {}
}

async function showProjectDetails(id) {
  try {
    const project = await api(`/projects/${id}`);
    
    showModal(project.name, `
      <div class="project-details">
        ${project.source === 'web' || project.status === 'requested' ? `
          <div class="detail-row detail-row-tags" style="margin-bottom: 12px;">
            <span class="web-request-pill"><i class="fas fa-globe"></i> ${t('projects.webRequest') || 'From web customer'}</span>
            ${project.code ? `<span class="tag">${project.code}</span>` : ''}
          </div>
        ` : ''}
        <div class="detail-row">
          <span class="detail-label">${t('projects.status') || 'Status'}</span>
          <span class="status-badge ${project.status}">${project.status === 'requested' ? (t('projects.requested') || 'Web Request') : project.status}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${t('projects.priority') || 'Priority'}</span>
          <span class="detail-value">${project.priority}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${t('projects.client') || 'Client'}</span>
          <span class="detail-value">${project.client || '-'}</span>
        </div>
        ${project.contactEmail ? `
          <div class="detail-row">
            <span class="detail-label">${t('projects.contactEmail') || 'Customer email'}</span>
            <span class="detail-value"><a href="mailto:${project.contactEmail}">${project.contactEmail}</a></span>
          </div>
        ` : ''}
        ${project.contactPhone ? `
          <div class="detail-row">
            <span class="detail-label">${t('projects.contactPhone') || 'Customer phone'}</span>
            <span class="detail-value"><a href="tel:${project.contactPhone}">${project.contactPhone}</a></span>
          </div>
        ` : ''}
        ${project.serviceCategory ? `
          <div class="detail-row">
            <span class="detail-label">${t('projects.serviceCategory') || 'Service category'}</span>
            <span class="detail-value">${project.serviceCategory}</span>
          </div>
        ` : ''}
        ${project.description ? `
          <div class="detail-row" style="display:block; margin-top: 12px;">
            <span class="detail-label">${t('projects.description') || 'Description'}</span>
            <div class="detail-value" style="white-space: pre-wrap; margin-top: 6px;">${project.description}</div>
          </div>
        ` : ''}
        <div class="detail-row">
          <span class="detail-label">${t('projects.budgetHours') || 'Budget Hours'}</span>
          <span class="detail-value">${project.budgetHours || '-'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">${t('projects.hoursUsed') || 'Hours Used'}</span>
          <span class="detail-value">${project.statistics?.totalHours || 0}</span>
        </div>
        ${project.location_name ? `
          <h4 style="margin: 20px 0 10px;"><i class="fas fa-map-marker-alt"></i> ${t('projects.location') || 'Location'}</h4>
          <div class="detail-row">
            <span class="detail-label">${t('projects.locationName') || 'Location Name'}</span>
            <span class="detail-value">${project.location_name}</span>
          </div>
          ${project.location_url ? `
            <div class="detail-row">
              <a href="${project.location_url}" target="_blank" class="btn btn-secondary btn-sm">
                <i class="fas fa-map-marker-alt"></i> ${t('projects.viewOnMap') || 'View on Google Maps'}
              </a>
            </div>
          ` : ''}
        ` : ''}
        <h4 style="margin: 20px 0 10px;"><i class="fas fa-users"></i> ${t('projects.requiredSkillsStaffing') || 'Required Skills & Staffing'}</h4>
        ${!project.skills || project.skills.length === 0 ? `<p class="text-muted">${t('projects.noSkillRequirements')}</p>` : `
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
        <div class="modal-footer project-details-footer">
          <div class="project-details-actions">
            <button class="btn btn-secondary" onclick="closeModal()">${t('common.close') || 'Close'}</button>
            ${canEdit() ? `
              ${(project.status === 'requested' || project.source === 'web') ? `
                <button class="btn btn-secondary" onclick="prepareQuotation(${id})"><i class="fas fa-file-invoice-dollar"></i> ${t('projects.prepareQuotation') || 'Prepare Quotation'}</button>
              ` : ''}
              ${project.status === 'requested' ? `
                <button class="btn btn-primary" onclick="acceptWebRequest(${id})"><i class="fas fa-check"></i> ${t('projects.acceptRequest') || 'Accept into planning'}</button>
              ` : ''}
              <button class="btn btn-secondary" onclick="editProject(${id})"><i class="fas fa-edit"></i> ${t('common.edit') || 'Edit'}</button>
              <button class="btn btn-danger" onclick="deleteProject(${id})"><i class="fas fa-trash"></i> ${t('common.delete') || 'Delete'}</button>
            ` : ''}
            <button class="btn btn-primary" onclick="findCandidates(${id})">${t('projects.findCandidates') || 'Find Candidates'}</button>
          </div>
        </div>
      </div>
    `, (project.status === 'requested' || project.source === 'web') ? 'project-details-modal' : '');
  } catch (error) {
    showToast('Failed to load project details', 'error');
  }
}

async function acceptWebRequest(id) {
  if (!canEdit()) return;
  try {
    await api(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'planning' })
    });
    showToast('Request accepted into planning');
    closeModal();
    loadProjects();
    updateWebRequestBadge();
    if (document.getElementById('dashboard-view')?.classList.contains('active')) {
      loadDashboard();
    }
  } catch (error) {
    showToast(error.message || 'Failed to accept request', 'error');
  }
}

function defaultQuotationValidUntil(days = 30) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatQuotationMoney(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return '€0.00';
  try {
    return new Intl.NumberFormat('en-CY', { style: 'currency', currency: 'EUR' }).format(value);
  } catch (_) {
    return `€${value.toFixed(2)}`;
  }
}

function formatQuotationDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return escapeHtml(String(value));
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

function getQuotationNumber(projectId) {
  const today = new Date();
  return `QT-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-${String(projectId).padStart(4, '0')}`;
}

function buildQuotationPreviewHtml(project, opts = {}) {
  const amount = Number(opts.amount) || 0;
  const taxRate = Number(opts.taxRate);
  const vatRate = Number.isFinite(taxRate) ? taxRate : 19;
  const notes = opts.notes || '';
  const validUntil = opts.validUntil || '';
  const subtotal = amount;
  const tax = subtotal * (vatRate / 100);
  const total = subtotal + tax;
  const quoteNo = getQuotationNumber(project.id);
  const accent = branding.primaryColor || '#1f4b3f';
  const company = escapeHtml(branding.companyName || 'Resource Scheduler');
  const scope = escapeHtml(project.description || project.name || '').replace(/\n/g, '<br>');

  return `
    <article class="quotation-doc" style="--quote-accent: ${accent}">
      <header class="quotation-doc-header">
        <div class="quotation-doc-brand">
          <div class="quotation-doc-logo">
            ${branding.logoUrl
              ? `<img src="${escapeHtml(branding.logoUrl)}" alt="">`
              : `<i class="fas ${escapeHtml(branding.logoIcon || 'fa-calendar-check')}"></i>`}
          </div>
          <div>
            <div class="quotation-doc-company">${company}</div>
            <div class="quotation-doc-label">${t('projects.quotation') || 'Quotation'}</div>
          </div>
        </div>
        <div class="quotation-doc-meta">
          <div><span>${t('projects.quoteNumber') || 'Quote No.'}</span><strong>${quoteNo}</strong></div>
          <div><span>${t('common.date') || 'Date'}</span><strong>${formatQuotationDate(new Date().toISOString())}</strong></div>
          ${validUntil ? `<div><span>${t('projects.validUntil') || 'Valid until'}</span><strong>${formatQuotationDate(validUntil)}</strong></div>` : ''}
        </div>
      </header>

      <div class="quotation-doc-grid">
        <section>
          <h4>${t('projects.preparedFor') || 'Prepared for'}</h4>
          <p class="quotation-doc-name">${escapeHtml(project.client || project.name || 'Customer')}</p>
          ${project.contactEmail ? `<p>${escapeHtml(project.contactEmail)}</p>` : ''}
          ${project.contactPhone ? `<p>${escapeHtml(project.contactPhone)}</p>` : ''}
          ${(project.location_name || project.locationName) ? `<p>${escapeHtml(project.location_name || project.locationName)}</p>` : ''}
        </section>
        <section>
          <h4>${t('projects.requestDetails') || 'Request details'}</h4>
          <p><strong>${t('projects.projectCode') || 'Code'}:</strong> ${escapeHtml(project.code || String(project.id))}</p>
          <p><strong>${t('projects.serviceCategory') || 'Service'}:</strong> ${escapeHtml(project.serviceCategory || 'Custom')}</p>
          <p><strong>${t('projects.priority') || 'Priority'}:</strong> ${escapeHtml(project.priority || 'medium')}</p>
          ${project.startDate ? `<p><strong>${t('projects.startDate') || 'Preferred date'}:</strong> ${formatQuotationDate(project.startDate)}</p>` : ''}
        </section>
      </div>

      <section class="quotation-doc-scope">
        <h4>${t('projects.scopeOfWork') || 'Scope of work'}</h4>
        <div class="quotation-doc-scope-body">${scope || '—'}</div>
      </section>

      <table class="quotation-doc-table">
        <thead>
          <tr>
            <th>${t('projects.description') || 'Description'}</th>
            <th class="num">${t('projects.quotationAmount') || 'Amount'}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${escapeHtml(project.name || 'Requested service')}</td>
            <td class="num">${formatQuotationMoney(subtotal)}</td>
          </tr>
        </tbody>
      </table>

      <div class="quotation-doc-totals">
        <div class="quotation-doc-total-row">
          <span>${t('projects.subtotal') || 'Subtotal'}</span>
          <strong>${formatQuotationMoney(subtotal)}</strong>
        </div>
        <div class="quotation-doc-total-row">
          <span>${t('projects.vat') || 'VAT'} (${vatRate}%)</span>
          <strong>${formatQuotationMoney(tax)}</strong>
        </div>
        <div class="quotation-doc-total-row grand">
          <span>${t('common.total') || 'Total'}</span>
          <strong>${formatQuotationMoney(total)}</strong>
        </div>
      </div>

      ${notes ? `
        <section class="quotation-doc-notes">
          <h4>${t('projects.quotationNotes') || 'Notes'}</h4>
          <p>${escapeHtml(notes).replace(/\n/g, '<br>')}</p>
        </section>
      ` : ''}

      <section class="quotation-doc-terms">
        <h4>${t('projects.quotationTerms') || 'Terms'}</h4>
        <p>${t('projects.quotationTermsText') || 'This quotation is an estimate based on the details provided in the web request. Final pricing may be adjusted after an on-site assessment. Payment terms and scheduling will be confirmed upon acceptance.'}</p>
      </section>

      <footer class="quotation-doc-footer">
        <div class="quotation-sign">
          <span>${t('projects.preparedBy') || 'Prepared by'}</span>
          <div class="quotation-sign-line"></div>
          <small>${escapeHtml(state.user?.firstName || state.user?.username || '')}</small>
        </div>
        <div class="quotation-sign">
          <span>${t('projects.customerAcceptance') || 'Customer acceptance'}</span>
          <div class="quotation-sign-line"></div>
          <small>${t('projects.signatureDate') || 'Signature / Date'}</small>
        </div>
      </footer>
      ${branding.footerText ? `<p class="quotation-doc-legal">${escapeHtml(branding.footerText)}</p>` : ''}
    </article>
  `;
}

let quotationProjectCache = null;

function refreshQuotationPreview() {
  const preview = document.getElementById('quotation-preview');
  if (!preview || !quotationProjectCache) return;
  preview.innerHTML = buildQuotationPreviewHtml(quotationProjectCache, {
    amount: document.getElementById('quotation-amount')?.value,
    taxRate: document.getElementById('quotation-tax-rate')?.value,
    notes: document.getElementById('quotation-notes')?.value,
    validUntil: document.getElementById('quotation-valid-until')?.value
  });
}

async function prepareQuotation(id) {
  if (!canEdit()) {
    showToast(t('common.noPermission') || 'You do not have permission', 'error');
    return;
  }

  try {
    const project = await api(`/projects/${id}`);
    quotationProjectCache = {
      id: project.id,
      name: project.name,
      code: project.code,
      client: project.client,
      description: project.description,
      contactEmail: project.contactEmail,
      contactPhone: project.contactPhone,
      location_name: project.location_name || project.locationName,
      locationName: project.locationName || project.location_name,
      serviceCategory: project.serviceCategory,
      priority: project.priority,
      startDate: project.startDate
    };
    const amountValue = project.quotationAmount != null ? Number(project.quotationAmount) : '';
    const taxRateValue = project.quotationTaxRate != null ? Number(project.quotationTaxRate) : 19;
    const validUntilValue = project.quotationValidUntil || defaultQuotationValidUntil(30);
    const notesValue = project.quotationNotes || '';

    showModal(t('projects.prepareQuotation') || 'Prepare Quotation', `
      <div class="quotation-builder">
        <div class="quotation-builder-intro">
          <div>
            <h3><i class="fas fa-file-invoice-dollar"></i> ${t('projects.quotationPrototype') || 'Quotation prototype'}</h3>
            <p>${t('projects.quotationPrototypeDesc') || 'Review the request details, set your price, then export a polished PDF for the customer.'}</p>
          </div>
          <span class="quotation-ref-pill">${escapeHtml(project.code || `ID ${project.id}`)}</span>
        </div>

        <div class="quotation-builder-layout">
          <form id="quotation-form" class="quotation-form" onsubmit="return false;">
            <div class="form-group">
              <label>${t('projects.quotationAmount') || 'Quotation amount'} (€) *</label>
              <div class="quotation-amount-input">
                <span class="currency-prefix">€</span>
                <input type="number" id="quotation-amount" min="0" step="0.01" value="${amountValue}" placeholder="0.00" required>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>${t('projects.vatRate') || 'VAT rate'} (%)</label>
                <input type="number" id="quotation-tax-rate" min="0" max="100" step="0.01" value="${taxRateValue}">
              </div>
              <div class="form-group">
                <label>${t('projects.validUntil') || 'Valid until'}</label>
                <input type="date" id="quotation-valid-until" value="${validUntilValue}">
              </div>
            </div>
            <div class="form-group">
              <label>${t('projects.quotationNotes') || 'Notes for customer'}</label>
              <textarea id="quotation-notes" rows="4" placeholder="${t('projects.quotationNotesPlaceholder') || 'Optional terms, inclusions, or site visit notes'}">${escapeHtml(notesValue)}</textarea>
            </div>

            <div class="quotation-request-summary">
              <h4>${t('projects.requestDetails') || 'Request details'}</h4>
              <div class="detail-row"><span class="detail-label">${t('projects.client') || 'Client'}</span><span class="detail-value">${escapeHtml(project.client || '-')}</span></div>
              ${project.contactEmail ? `<div class="detail-row"><span class="detail-label">${t('projects.contactEmail') || 'Email'}</span><span class="detail-value">${escapeHtml(project.contactEmail)}</span></div>` : ''}
              ${project.contactPhone ? `<div class="detail-row"><span class="detail-label">${t('projects.contactPhone') || 'Phone'}</span><span class="detail-value">${escapeHtml(project.contactPhone)}</span></div>` : ''}
              ${project.serviceCategory ? `<div class="detail-row"><span class="detail-label">${t('projects.serviceCategory') || 'Service'}</span><span class="detail-value">${escapeHtml(project.serviceCategory)}</span></div>` : ''}
              ${(project.location_name || project.locationName) ? `<div class="detail-row"><span class="detail-label">${t('projects.location') || 'Location'}</span><span class="detail-value">${escapeHtml(project.location_name || project.locationName)}</span></div>` : ''}
              ${project.description ? `<div class="detail-row" style="display:block;"><span class="detail-label">${t('projects.description') || 'Description'}</span><div class="detail-value" style="white-space:pre-wrap;margin-top:6px;">${escapeHtml(project.description)}</div></div>` : ''}
            </div>
          </form>

          <div class="quotation-preview-pane">
            <div class="quotation-preview-label"><i class="fas fa-eye"></i> ${t('projects.livePreview') || 'Live preview'}</div>
            <div id="quotation-preview" class="quotation-preview-scroll"></div>
          </div>
        </div>

        <div class="modal-footer quotation-footer">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">${t('common.close') || 'Close'}</button>
          <button type="button" class="btn btn-secondary" onclick="saveQuotationDraft(${id})">
            <i class="fas fa-save"></i> ${t('projects.saveQuotation') || 'Save quotation'}
          </button>
          <button type="button" class="btn btn-primary" onclick="exportQuotationPdf(${id})">
            <i class="fas fa-file-pdf"></i> ${t('projects.exportQuotationPdf') || 'Export PDF'}
          </button>
        </div>
      </div>
    `, 'quotation-modal');

    ['quotation-amount', 'quotation-tax-rate', 'quotation-notes', 'quotation-valid-until'].forEach(fieldId => {
      document.getElementById(fieldId)?.addEventListener('input', refreshQuotationPreview);
    });
    refreshQuotationPreview();
  } catch (error) {
    showToast(error.message || 'Failed to open quotation', 'error');
  }
}

function getQuotationFormPayload() {
  const amount = document.getElementById('quotation-amount')?.value;
  const taxRate = document.getElementById('quotation-tax-rate')?.value;
  const notes = document.getElementById('quotation-notes')?.value || '';
  const validUntil = document.getElementById('quotation-valid-until')?.value || null;

  if (amount === '' || amount == null || Number.isNaN(Number(amount)) || Number(amount) < 0) {
    throw new Error(t('projects.quotationAmountRequired') || 'Please enter a valid quotation amount');
  }

  return {
    amount: Number(amount),
    taxRate: taxRate === '' ? 19 : Number(taxRate),
    notes,
    validUntil,
    quotationAmount: Number(amount),
    quotationTaxRate: taxRate === '' ? 19 : Number(taxRate),
    quotationNotes: notes,
    quotationValidUntil: validUntil
  };
}

async function saveQuotationDraft(id) {
  try {
    const payload = getQuotationFormPayload();
    await api(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        quotationAmount: payload.quotationAmount,
        quotationTaxRate: payload.quotationTaxRate,
        quotationNotes: payload.quotationNotes,
        quotationValidUntil: payload.quotationValidUntil
      })
    });
    showToast(t('projects.quotationSaved') || 'Quotation saved');
  } catch (error) {
    showToast(error.message || 'Failed to save quotation', 'error');
  }
}

async function exportQuotationPdf(id) {
  try {
    const payload = getQuotationFormPayload();
    showToast(t('projects.generatingQuotation') || 'Generating quotation PDF...');

    const response = await fetch(`/api/exports/quotation/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.token}`
      },
      body: JSON.stringify({
        amount: payload.amount,
        taxRate: payload.taxRate,
        notes: payload.notes,
        validUntil: payload.validUntil,
        save: true
      })
    });

    if (!response.ok) {
      let message = 'Failed to export quotation PDF';
      try {
        const err = await response.json();
        message = err.error || message;
      } catch (_) {}
      throw new Error(message);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `quotation_${id}_${stamp}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    showToast(t('projects.quotationExported') || 'Quotation PDF exported');
  } catch (error) {
    showToast(error.message || 'Failed to export quotation PDF', 'error');
  }
}

// Delete project
async function deleteProject(id) {
  if (!canEdit()) {
    showToast('You do not have permission to delete projects', 'error');
    return;
  }
  
  if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
    return;
  }
  
  try {
    await api(`/projects/${id}`, { method: 'DELETE' });
    closeModal();
    showToast('Project deleted successfully');
    loadProjects();
  } catch (error) {
    showToast(error.message || 'Failed to delete project', 'error');
  }
}

async function findCandidates(projectId) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const data = await api(`/matching/project/${projectId}/candidates?date=${today}`);
    
    showModal(`Best Candidates for ${data.projectName}`, `
      <div class="candidates-list">
        ${data.candidates.length === 0 ? `<p>${t('projects.noCandidatesFound')}</p>` :
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
    showToast(t('common.noPermission') || 'You do not have permission to add projects', 'error');
    return;
  }
  
  try {
    const allSkills = await api('/skills?active=true');
    
    showModal(t('projects.addProject') || 'Add Project', `
      <form id="add-project-form" class="modal-form">
        <div class="form-group">
          <label>${t('projects.projectName') || 'Project Name'} *</label>
          <input type="text" name="name" required>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>${t('projects.projectCode') || 'Code'}</label>
            <input type="text" name="code" placeholder="${t('projects.codePlaceholder') || 'e.g., PRJ-001'}">
          </div>
          <div class="form-group">
            <label>${t('projects.client') || 'Client'}</label>
            <input type="text" name="client">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>${t('projects.status') || 'Status'}</label>
            <select name="status">
              <option value="planning">${t('projects.planning') || 'Planning'}</option>
              <option value="active" selected>${t('projects.active') || 'Active'}</option>
              <option value="on-hold">${t('projects.onHold') || 'On Hold'}</option>
            </select>
          </div>
          <div class="form-group">
            <label>${t('projects.priority') || 'Priority'}</label>
            <select name="priority">
              <option value="low">${t('projects.low') || 'Low'}</option>
              <option value="medium" selected>${t('projects.medium') || 'Medium'}</option>
              <option value="high">${t('projects.high') || 'High'}</option>
              <option value="critical">${t('projects.critical') || 'Critical'}</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>${t('common.startDate') || 'Start Date'}</label>
            <input type="date" name="startDate">
          </div>
          <div class="form-group">
            <label>${t('common.endDate') || 'End Date'}</label>
            <input type="date" name="endDate">
          </div>
        </div>
        <div class="form-group">
          <label>${t('projects.budgetHours') || 'Budget Hours'}</label>
          <input type="number" name="budgetHours" min="0">
        </div>
        
        <h4 style="margin: 20px 0 10px; border-top: 1px solid var(--border-color); padding-top: 20px;">
          <i class="fas fa-map-marker-alt"></i> ${t('projects.location') || 'Location'}
        </h4>
        <div class="form-group">
          <label>${t('projects.locationName') || 'Location Name'}</label>
          <input type="text" name="locationName" placeholder="${t('projects.locationNamePlaceholder') || 'e.g., Main Office, Client Site A'}">
        </div>
        <div class="form-group">
          <label>${t('projects.locationUrl') || 'Google Maps Link'}</label>
          <input type="url" name="locationUrl" placeholder="${t('projects.locationUrlPlaceholder') || 'Paste Google Maps link here'}" onpaste="extractCoordinates(this)">
          <small class="text-muted">${t('projects.locationUrlHint') || 'Paste a Google Maps link - coordinates will be extracted automatically'}</small>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>${t('projects.latitude') || 'Latitude'}</label>
            <input type="number" name="locationLat" step="0.0000001" placeholder="e.g., 35.1856">
          </div>
          <div class="form-group">
            <label>${t('projects.longitude') || 'Longitude'}</label>
            <input type="number" name="locationLng" step="0.0000001" placeholder="e.g., 33.3823">
          </div>
        </div>
        
        <h4 style="margin: 20px 0 10px; border-top: 1px solid var(--border-color); padding-top: 20px;">
          <i class="fas fa-clock"></i> ${t('projects.timeSlot') || 'Time Slot Restriction'}
        </h4>
        <p class="text-muted" style="margin-bottom: 15px; font-size: 0.85rem;">
          ${t('projects.timeSlotHint') || 'If this project can only be worked during specific hours, set the allowed time window'}
        </p>
        <div class="form-row">
          <div class="form-group">
            <label>${t('projects.timeSlotStart') || 'Earliest Start'}</label>
            <select name="timeSlotStart">
              <option value="">${t('projects.anyTime') || 'Any time'}</option>
              ${Array.from({length: 24}, (_, i) => `<option value="${i}">${String(i).padStart(2, '0')}:00</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>${t('projects.timeSlotEnd') || 'Latest End'}</label>
            <select name="timeSlotEnd">
              <option value="">${t('projects.anyTime') || 'Any time'}</option>
              ${Array.from({length: 24}, (_, i) => `<option value="${i}">${String(i).padStart(2, '0')}:00</option>`).join('')}
            </select>
          </div>
        </div>
        
        <h4 style="margin: 20px 0 10px; border-top: 1px solid var(--border-color); padding-top: 20px;">
          <i class="fas fa-users"></i> ${t('projects.skillRequirements') || 'Skill Requirements'}
        </h4>
        <p class="text-muted" style="margin-bottom: 15px; font-size: 0.85rem;">
          ${t('projects.skillRequirementsHint') || 'Specify which skills are needed and how many people with each skill'}
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
                  <label>${t('projects.peopleNeeded') || 'People'}:</label>
                  <input type="number" class="skill-people-needed" min="1" value="1" disabled>
                </div>
                <div class="skill-input-group">
                  <label>${t('projects.minLevel') || 'Min Level'}:</label>
                  <select class="skill-level" disabled>
                    ${[1,2,3,4,5].map(l => `<option value="${l}" ${l === 3 ? 'selected' : ''}>${l}</option>`).join('')}
                  </select>
                </div>
                <div class="skill-input-group">
                  <label class="checkbox-label">
                    <input type="checkbox" class="skill-mandatory" disabled checked>
                    ${t('projects.required') || 'Required'}
                  </label>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">${t('common.cancel') || 'Cancel'}</button>
          <button type="submit" class="btn btn-primary">${t('projects.createProject') || 'Create Project'}</button>
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
        locationName: formData.get('locationName'),
        locationUrl: formData.get('locationUrl'),
        locationLat: formData.get('locationLat') ? parseFloat(formData.get('locationLat')) : null,
        locationLng: formData.get('locationLng') ? parseFloat(formData.get('locationLng')) : null,
        timeSlotStart: formData.get('timeSlotStart') ? parseInt(formData.get('timeSlotStart')) : null,
        timeSlotEnd: formData.get('timeSlotEnd') ? parseInt(formData.get('timeSlotEnd')) : null,
        skills
      };
      
      try {
        await api('/projects', {
          method: 'POST',
          body: JSON.stringify(data)
        });
        closeModal();
        showToast(t('projects.projectCreated') || 'Project created successfully');
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
    if (project.skills && Array.isArray(project.skills)) {
      project.skills.forEach(s => projectSkillsMap.set(s.id, s));
    }
    
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
              <option value="requested" ${project.status === 'requested' ? 'selected' : ''}>${t('projects.requested') || 'Web Request'}</option>
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
            <input type="date" name="startDate" value="${formatDateForInput(project.startDate)}">
          </div>
          <div class="form-group">
            <label>End Date</label>
            <input type="date" name="endDate" value="${formatDateForInput(project.endDate)}">
          </div>
        </div>
        <div class="form-group">
          <label>${t('projects.budgetHours') || 'Budget Hours'}</label>
          <input type="number" name="budgetHours" value="${project.budgetHours || ''}" min="0">
        </div>
        
        <h4 style="margin: 20px 0 10px; border-top: 1px solid var(--border-color); padding-top: 20px;">
          <i class="fas fa-map-marker-alt"></i> ${t('projects.location') || 'Location'}
        </h4>
        <div class="form-group">
          <label>${t('projects.locationName') || 'Location Name'}</label>
          <input type="text" name="locationName" value="${project.location_name || ''}" placeholder="${t('projects.locationNamePlaceholder') || 'e.g., Main Office, Client Site A'}">
        </div>
        <div class="form-group">
          <label>${t('projects.locationUrl') || 'Google Maps Link'}</label>
          <input type="url" name="locationUrl" value="${project.location_url || ''}" placeholder="${t('projects.locationUrlPlaceholder') || 'Paste Google Maps link here'}" onpaste="extractCoordinates(this)">
          <small class="text-muted">${t('projects.locationUrlHint') || 'Paste a Google Maps link - coordinates will be extracted automatically'}</small>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>${t('projects.latitude') || 'Latitude'}</label>
            <input type="number" name="locationLat" value="${project.location_lat || ''}" step="0.0000001" placeholder="e.g., 35.1856">
          </div>
          <div class="form-group">
            <label>${t('projects.longitude') || 'Longitude'}</label>
            <input type="number" name="locationLng" value="${project.location_lng || ''}" step="0.0000001" placeholder="e.g., 33.3823">
          </div>
        </div>
        ${project.location_url ? `
          <div class="form-group">
            <a href="${project.location_url}" target="_blank" class="btn btn-secondary btn-sm">
              <i class="fas fa-map-marker-alt"></i> ${t('projects.viewOnMap') || 'View on Google Maps'}
            </a>
          </div>
        ` : ''}
        
        <h4 style="margin: 20px 0 10px; border-top: 1px solid var(--border-color); padding-top: 20px;">
          <i class="fas fa-clock"></i> ${t('projects.timeSlot') || 'Time Slot Restriction'}
        </h4>
        <p class="text-muted" style="margin-bottom: 15px; font-size: 0.85rem;">
          ${t('projects.timeSlotHint') || 'If this project can only be worked during specific hours, set the allowed time window'}
        </p>
        <div class="form-row">
          <div class="form-group">
            <label>${t('projects.timeSlotStart') || 'Earliest Start'}</label>
            <select name="timeSlotStart">
              <option value="">${t('projects.anyTime') || 'Any time'}</option>
              ${Array.from({length: 24}, (_, i) => `<option value="${i}" ${project.time_slot_start === i ? 'selected' : ''}>${String(i).padStart(2, '0')}:00</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>${t('projects.timeSlotEnd') || 'Latest End'}</label>
            <select name="timeSlotEnd">
              <option value="">${t('projects.anyTime') || 'Any time'}</option>
              ${Array.from({length: 24}, (_, i) => `<option value="${i}" ${project.time_slot_end === i ? 'selected' : ''}>${String(i).padStart(2, '0')}:00</option>`).join('')}
            </select>
          </div>
        </div>
        
        <h4 style="margin: 20px 0 10px; border-top: 1px solid var(--border-color); padding-top: 20px;">
          <i class="fas fa-users"></i> ${t('projects.skillRequirements') || 'Skill Requirements'}
        </h4>
        <p class="text-muted" style="margin-bottom: 15px; font-size: 0.85rem;">
          ${t('projects.skillRequirementsHint') || 'Specify which skills are needed and how many people with each skill'}
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
          <div class="project-details-actions">
            <button type="button" class="btn btn-secondary" onclick="closeModal()">${t('common.cancel') || 'Cancel'}</button>
            ${(project.status === 'requested' || project.source === 'web') ? `
              <button type="button" class="btn btn-secondary" onclick="prepareQuotation(${id})">
                <i class="fas fa-file-invoice-dollar"></i> ${t('projects.prepareQuotation') || 'Prepare Quotation'}
              </button>
            ` : ''}
            <button type="submit" class="btn btn-primary">${t('common.saveChanges') || 'Save Changes'}</button>
          </div>
        </div>
      </form>
    `, (project.status === 'requested' || project.source === 'web') ? 'project-details-modal' : '');
    
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
        code: formData.get('code') || null,
        client: formData.get('client') || null,
        status: formData.get('status'),
        priority: formData.get('priority'),
        startDate: formData.get('startDate') || null,
        endDate: formData.get('endDate') || null,
        budgetHours: formData.get('budgetHours') ? parseFloat(formData.get('budgetHours')) : null,
        locationName: formData.get('locationName') || null,
        locationUrl: formData.get('locationUrl') || null,
        locationLat: formData.get('locationLat') ? parseFloat(formData.get('locationLat')) : null,
        locationLng: formData.get('locationLng') ? parseFloat(formData.get('locationLng')) : null,
        timeSlotStart: formData.get('timeSlotStart') ? parseInt(formData.get('timeSlotStart')) : null,
        timeSlotEnd: formData.get('timeSlotEnd') ? parseInt(formData.get('timeSlotEnd')) : null
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
          <h3>${t('skills.noSkillsFound')}</h3>
          <p>${canEdit() ? t('skills.addToEnable') : t('skills.noSkillsMatch')}</p>
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
          ${canEdit() ? `
            <button class="btn btn-danger" onclick="deleteSkill(${id})"><i class="fas fa-trash"></i> Delete</button>
            <button class="btn btn-primary" onclick="editSkill(${id})"><i class="fas fa-edit"></i> Edit</button>
          ` : ''}
        </div>
      </div>
    `);
  } catch (error) {
    showToast('Failed to load skill details', 'error');
  }
}

// Edit skill
async function editSkill(id) {
  if (!canEdit()) {
    showToast('You do not have permission to edit skills', 'error');
    return;
  }
  
  try {
    const skill = await api(`/skills/${id}`);
    
    showModal(`Edit ${skill.name}`, `
      <form id="edit-skill-form" class="modal-form">
        <div class="form-group">
          <label>Skill Name *</label>
          <input type="text" name="name" value="${skill.name}" required>
        </div>
        <div class="form-group">
          <label>Category</label>
          <input type="text" name="category" value="${skill.category || ''}" placeholder="e.g., Programming, Design, Management">
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea name="description" rows="3" placeholder="Brief description of this skill">${skill.description || ''}</textarea>
        </div>
        <div class="form-group">
          <label>Color</label>
          <input type="color" name="color" value="${skill.color || '#6366f1'}">
        </div>
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" name="isActive" ${skill.isActive ? 'checked' : ''}>
            Active Skill
          </label>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </div>
      </form>
    `);
    
    document.getElementById('edit-skill-form').onsubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      
      const data = {
        name: formData.get('name'),
        category: formData.get('category') || null,
        description: formData.get('description') || null,
        color: formData.get('color'),
        isActive: formData.get('isActive') === 'on'
      };
      
      try {
        await api(`/skills/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        });
        
        closeModal();
        showToast('Skill updated successfully');
        loadSkills();
      } catch (error) {
        showToast(error.message || 'Failed to update skill', 'error');
      }
    };
  } catch (error) {
    showToast('Failed to load skill details', 'error');
  }
}

// Delete skill
async function deleteSkill(id) {
  if (!canEdit()) {
    showToast('You do not have permission to delete skills', 'error');
    return;
  }
  
  if (!confirm('Are you sure you want to delete this skill? This will remove it from all people and projects.')) {
    return;
  }
  
  try {
    await api(`/skills/${id}`, { method: 'DELETE' });
    closeModal();
    showToast('Skill deleted successfully');
    loadSkills();
  } catch (error) {
    showToast(error.message || 'Failed to delete skill. It may be in use by people or projects.', 'error');
  }
}

// Delete person
async function deletePerson(id) {
  if (!canEdit()) {
    showToast('You do not have permission to delete people', 'error');
    return;
  }
  
  if (!confirm('Are you sure you want to delete this person? This will also remove all their assignments.')) {
    return;
  }
  
  try {
    await api(`/people/${id}`, { method: 'DELETE' });
    closeModal();
    showToast('Person deleted successfully');
    loadPeople();
  } catch (error) {
    showToast(error.message || 'Failed to delete person', 'error');
  }
}

function showAddSkillModal() {
  if (!canEdit()) {
    showToast(t('common.noPermission') || 'You do not have permission to add skills', 'error');
    return;
  }
  
  showModal(t('skills.addSkill') || 'Add Skill', `
    <form id="add-skill-form" class="modal-form">
      <div class="form-group">
        <label>${t('skills.skillName') || 'Skill Name'} *</label>
        <input type="text" name="name" required>
      </div>
      <div class="form-group">
        <label>${t('skills.category') || 'Category'}</label>
        <input type="text" name="category" placeholder="${t('skills.categoryPlaceholder') || 'e.g., Programming, Design, Management'}">
      </div>
      <div class="form-group">
        <label>${t('skills.description') || 'Description'}</label>
        <textarea name="description" rows="3"></textarea>
      </div>
      <div class="form-group">
        <label>${t('skills.color') || 'Color'}</label>
        <input type="color" name="color" value="#6366f1">
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="closeModal()">${t('common.cancel') || 'Cancel'}</button>
        <button type="submit" class="btn btn-primary">${t('skills.addSkill') || 'Add Skill'}</button>
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
      showToast(t('skills.skillAdded') || 'Skill added successfully');
      loadSkills();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };
}

// ===== Groups =====
async function loadGroups() {
  try {
    const search = document.getElementById('groups-search')?.value || '';
    
    let url = '/groups?';
    if (search) url += `search=${encodeURIComponent(search)}&`;
    
    const response = await api(url);
    renderGroups(response.data || []);
  } catch (error) {
    console.error('Error loading groups:', error);
    showToast(t('common.error') || 'Error loading groups', 'error');
    renderGroups([]);
  }
}

function renderGroups(groups) {
  const grid = document.getElementById('groups-grid');
  if (!grid) return;
  
  if (!groups || !Array.isArray(groups) || groups.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-users-cog"></i>
        <h3>${t('groups.noGroupsFound') || 'No groups found'}</h3>
        <p>${t('groups.createToStart') || 'Create groups to organize your teams'}</p>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = groups.map(group => `
    <div class="grid-card group-card" onclick="showGroupDetails(${group.id})">
      <div class="card-header" style="border-left: 4px solid ${group.color || '#6366f1'}">
        <h3>${group.name}</h3>
        <span class="badge ${group.is_active ? 'badge-success' : 'badge-secondary'}">
          ${group.is_active ? t('common.active') || 'Active' : t('common.inactive') || 'Inactive'}
        </span>
      </div>
      <div class="card-body">
        ${group.description ? `<p class="group-description">${group.description}</p>` : ''}
        <div class="group-stats">
          <div class="stat">
            <i class="fas fa-users"></i>
            <span>${group.member_count || 0} ${t('groups.members') || 'members'}</span>
          </div>
          <div class="stat">
            <i class="fas fa-project-diagram"></i>
            <span>${group.project_count || 0} ${t('groups.projects') || 'projects'}</span>
          </div>
        </div>
      </div>
      <div class="card-actions">
        <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); editGroup(${group.id})">
          <i class="fas fa-edit"></i> ${t('common.edit') || 'Edit'}
        </button>
        <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); deleteGroup(${group.id})">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `).join('');
}

async function showGroupDetails(groupId) {
  try {
    const group = await api(`/groups/${groupId}`);
    
    showModal(group.name, `
      <div class="group-details">
        <div class="detail-section">
          <h4><i class="fas fa-info-circle"></i> ${t('groups.details') || 'Details'}</h4>
          <div class="detail-row">
            <span class="detail-label">${t('groups.description') || 'Description'}</span>
            <span class="detail-value">${group.description || '-'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">${t('groups.color') || 'Color'}</span>
            <span class="detail-value"><span class="color-swatch" style="background: ${group.color}"></span> ${group.color}</span>
          </div>
        </div>
        
        <div class="detail-section">
          <h4><i class="fas fa-users"></i> ${t('groups.members') || 'Members'} (${group.members?.length || 0})</h4>
          ${group.members && group.members.length > 0 ? `
            <div class="members-list">
              ${group.members.map(m => `
                <div class="member-item">
                  <div class="member-info">
                    <span class="member-name">${m.first_name} ${m.last_name}</span>
                    <span class="member-position">${m.position || m.department || ''}</span>
                  </div>
                  <span class="badge ${m.group_role === 'leader' ? 'badge-primary' : 'badge-secondary'}">${m.group_role}</span>
                </div>
              `).join('')}
            </div>
          ` : `<p class="text-muted">${t('groups.noMembers') || 'No members in this group'}</p>`}
        </div>
        
        <div class="detail-section">
          <h4><i class="fas fa-project-diagram"></i> ${t('groups.assignedProjects') || 'Assigned Projects'} (${group.projects?.length || 0})</h4>
          ${group.projects && group.projects.length > 0 ? `
            <div class="projects-list">
              ${group.projects.map(p => `
                <div class="project-item">
                  <span class="project-name">${p.name}</span>
                  <span class="badge badge-${p.status === 'active' ? 'success' : 'secondary'}">${p.status}</span>
                </div>
              `).join('')}
            </div>
          ` : `<p class="text-muted">${t('groups.noProjects') || 'No projects assigned to this group'}</p>`}
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal()">${t('common.close') || 'Close'}</button>
          <button class="btn btn-primary" onclick="closeModal(); editGroup(${group.id})">
            <i class="fas fa-edit"></i> ${t('common.edit') || 'Edit'}
          </button>
        </div>
      </div>
    `);
  } catch (error) {
    showToast(t('common.error') || 'Error loading group details', 'error');
  }
}

async function showAddGroupModal() {
  if (!canEdit()) {
    showToast(t('common.noPermission') || 'You do not have permission to add groups', 'error');
    return;
  }
  
  try {
    const [people, projects] = await Promise.all([
      api('/people?active=true'),
      api('/projects?status=active')
    ]);
    
    showModal(t('groups.addGroup') || 'Add Group', `
      <form id="add-group-form" class="modal-form">
        <div class="form-group">
          <label>${t('groups.groupName') || 'Group Name'} *</label>
          <input type="text" name="name" required>
        </div>
        <div class="form-group">
          <label>${t('groups.description') || 'Description'}</label>
          <textarea name="description" rows="2"></textarea>
        </div>
        <div class="form-group">
          <label>${t('groups.color') || 'Color'}</label>
          <input type="color" name="color" value="#6366f1">
        </div>
        <div class="form-group">
          <label>${t('groups.leader') || 'Group Leader'}</label>
          <select name="leaderId">
            <option value="">${t('groups.selectLeader') || 'Select a leader...'}</option>
            ${people.data.map(p => `<option value="${p.id}">${p.firstName} ${p.lastName}</option>`).join('')}
          </select>
        </div>
        
        <h4 style="margin: 20px 0 10px; border-top: 1px solid var(--border-color); padding-top: 20px;">
          <i class="fas fa-users"></i> ${t('groups.addMembers') || 'Add Members'}
        </h4>
        <div class="form-group">
          <div class="members-checkbox-list" style="max-height: 200px; overflow-y: auto;">
            ${people.data.map(p => `
              <label class="checkbox-label">
                <input type="checkbox" name="members" value="${p.id}">
                ${p.firstName} ${p.lastName} <small class="text-muted">(${p.department || p.position || ''})</small>
              </label>
            `).join('')}
          </div>
        </div>
        
        <h4 style="margin: 20px 0 10px; border-top: 1px solid var(--border-color); padding-top: 20px;">
          <i class="fas fa-project-diagram"></i> ${t('groups.assignProjects') || 'Assign Projects'}
        </h4>
        <div class="form-group">
          <div class="projects-checkbox-list" style="max-height: 200px; overflow-y: auto;">
            ${projects.data.map(p => `
              <label class="checkbox-label">
                <input type="checkbox" name="projects" value="${p.id}">
                ${p.name} <small class="text-muted">(${p.status})</small>
              </label>
            `).join('')}
          </div>
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">${t('common.cancel') || 'Cancel'}</button>
          <button type="submit" class="btn btn-primary">${t('groups.createGroup') || 'Create Group'}</button>
        </div>
      </form>
    `);
    
    document.getElementById('add-group-form').onsubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      
      // Get selected members
      const members = [];
      document.querySelectorAll('input[name="members"]:checked').forEach(cb => {
        members.push(parseInt(cb.value));
      });
      
      // Get selected projects
      const projects = [];
      document.querySelectorAll('input[name="projects"]:checked').forEach(cb => {
        projects.push(parseInt(cb.value));
      });
      
      const data = {
        name: formData.get('name'),
        description: formData.get('description') || null,
        color: formData.get('color'),
        leaderId: formData.get('leaderId') ? parseInt(formData.get('leaderId')) : null
      };
      
      try {
        const newGroup = await api('/groups', {
          method: 'POST',
          body: JSON.stringify(data)
        });
        
        // Add members
        for (const personId of members) {
          await api(`/groups/${newGroup.id}/members`, {
            method: 'POST',
            body: JSON.stringify({ personId, role: personId === data.leaderId ? 'leader' : 'member' })
          });
        }
        
        // Add projects
        for (const projectId of projects) {
          await api(`/groups/${newGroup.id}/projects`, {
            method: 'POST',
            body: JSON.stringify({ projectId })
          });
        }
        
        closeModal();
        showToast(t('groups.groupCreated') || 'Group created successfully');
        loadGroups();
      } catch (error) {
        showToast(error.message, 'error');
      }
    };
  } catch (error) {
    showToast(t('common.error') || 'Error loading data', 'error');
  }
}

async function editGroup(groupId) {
  if (!canEdit()) {
    showToast(t('common.noPermission') || 'You do not have permission to edit groups', 'error');
    return;
  }
  
  try {
    const [group, people, projects] = await Promise.all([
      api(`/groups/${groupId}`),
      api('/people?active=true'),
      api('/projects?status=active')
    ]);
    
    const memberIds = group.members?.map(m => m.id) || [];
    const projectIds = group.projects?.map(p => p.id) || [];
    
    showModal(t('groups.editGroup') || 'Edit Group', `
      <form id="edit-group-form" class="modal-form">
        <div class="form-group">
          <label>${t('groups.groupName') || 'Group Name'} *</label>
          <input type="text" name="name" value="${group.name}" required>
        </div>
        <div class="form-group">
          <label>${t('groups.description') || 'Description'}</label>
          <textarea name="description" rows="2">${group.description || ''}</textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>${t('groups.color') || 'Color'}</label>
            <input type="color" name="color" value="${group.color || '#6366f1'}">
          </div>
          <div class="form-group">
            <label>${t('common.status') || 'Status'}</label>
            <select name="isActive">
              <option value="true" ${group.is_active ? 'selected' : ''}>${t('common.active') || 'Active'}</option>
              <option value="false" ${!group.is_active ? 'selected' : ''}>${t('common.inactive') || 'Inactive'}</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>${t('groups.leader') || 'Group Leader'}</label>
          <select name="leaderId">
            <option value="">${t('groups.selectLeader') || 'Select a leader...'}</option>
            ${people.data.map(p => `<option value="${p.id}" ${group.leader_id === p.id ? 'selected' : ''}>${p.firstName} ${p.lastName}</option>`).join('')}
          </select>
        </div>
        
        <h4 style="margin: 20px 0 10px; border-top: 1px solid var(--border-color); padding-top: 20px;">
          <i class="fas fa-users"></i> ${t('groups.members') || 'Members'}
        </h4>
        <div class="form-group">
          <div class="members-checkbox-list" style="max-height: 200px; overflow-y: auto;">
            ${people.data.map(p => `
              <label class="checkbox-label">
                <input type="checkbox" name="members" value="${p.id}" ${memberIds.includes(p.id) ? 'checked' : ''}>
                ${p.firstName} ${p.lastName} <small class="text-muted">(${p.department || p.position || ''})</small>
              </label>
            `).join('')}
          </div>
        </div>
        
        <h4 style="margin: 20px 0 10px; border-top: 1px solid var(--border-color); padding-top: 20px;">
          <i class="fas fa-project-diagram"></i> ${t('groups.assignedProjects') || 'Assigned Projects'}
        </h4>
        <div class="form-group">
          <div class="projects-checkbox-list" style="max-height: 200px; overflow-y: auto;">
            ${projects.data.map(p => `
              <label class="checkbox-label">
                <input type="checkbox" name="projects" value="${p.id}" ${projectIds.includes(p.id) ? 'checked' : ''}>
                ${p.name} <small class="text-muted">(${p.status})</small>
              </label>
            `).join('')}
          </div>
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">${t('common.cancel') || 'Cancel'}</button>
          <button type="submit" class="btn btn-primary">${t('common.saveChanges') || 'Save Changes'}</button>
        </div>
      </form>
    `);
    
    document.getElementById('edit-group-form').onsubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      
      // Get selected members
      const newMembers = [];
      document.querySelectorAll('input[name="members"]:checked').forEach(cb => {
        newMembers.push(parseInt(cb.value));
      });
      
      // Get selected projects
      const newProjects = [];
      document.querySelectorAll('input[name="projects"]:checked').forEach(cb => {
        newProjects.push(parseInt(cb.value));
      });
      
      const data = {
        name: formData.get('name'),
        description: formData.get('description') || null,
        color: formData.get('color'),
        leaderId: formData.get('leaderId') ? parseInt(formData.get('leaderId')) : null,
        isActive: formData.get('isActive') === 'true'
      };
      
      try {
        await api(`/groups/${groupId}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        });
        
        // Update members - remove old ones and add new ones
        for (const oldMemberId of memberIds) {
          if (!newMembers.includes(oldMemberId)) {
            await api(`/groups/${groupId}/members/${oldMemberId}`, { method: 'DELETE' });
          }
        }
        for (const newMemberId of newMembers) {
          if (!memberIds.includes(newMemberId)) {
            await api(`/groups/${groupId}/members`, {
              method: 'POST',
              body: JSON.stringify({ personId: newMemberId, role: newMemberId === data.leaderId ? 'leader' : 'member' })
            });
          }
        }
        
        // Update projects - remove old ones and add new ones
        for (const oldProjectId of projectIds) {
          if (!newProjects.includes(oldProjectId)) {
            await api(`/groups/${groupId}/projects/${oldProjectId}`, { method: 'DELETE' });
          }
        }
        for (const newProjectId of newProjects) {
          if (!projectIds.includes(newProjectId)) {
            await api(`/groups/${groupId}/projects`, {
              method: 'POST',
              body: JSON.stringify({ projectId: newProjectId })
            });
          }
        }
        
        closeModal();
        showToast(t('groups.groupUpdated') || 'Group updated successfully');
        loadGroups();
      } catch (error) {
        showToast(error.message, 'error');
      }
    };
  } catch (error) {
    showToast(t('common.error') || 'Error loading group', 'error');
  }
}

async function deleteGroup(groupId) {
  if (!canEdit()) {
    showToast(t('common.noPermission') || 'You do not have permission to delete groups', 'error');
    return;
  }
  
  if (!confirm(t('groups.confirmDelete') || 'Are you sure you want to delete this group?')) {
    return;
  }
  
  try {
    await api(`/groups/${groupId}`, { method: 'DELETE' });
    showToast(t('groups.groupDeleted') || 'Group deleted successfully');
    loadGroups();
  } catch (error) {
    showToast(error.message, 'error');
  }
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
          <h3>${t('conflicts.noConflicts')}</h3>
          <p>${t('conflicts.allResolved')}</p>
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
  // Set default dates to current day
  const today = new Date().toISOString().split('T')[0];
  
  document.getElementById('ai-start-date').value = today;
  document.getElementById('ai-end-date').value = today;
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
            <p>${t('aiScheduler.noQualifiedPeople')}</p>
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
              <p class="text-muted">${t('projects.noPeopleAssigned')}</p>
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
              <p class="no-assignments">${t('schedule.noAssignmentsScheduled')}</p>
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
      table.innerHTML = `<div class="empty-state"><p>${t('users.noUsersFound')}</p></div>`;
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
    showToast(t('common.noPermission') || 'You do not have permission to create assignments', 'error');
    return;
  }
  
  try {
    const [people, projects] = await Promise.all([
      api('/people?active=true'),
      api('/projects?status=active')
    ]);
    
    showModal(t('schedule.addAssignment') || 'Add Assignment', `
      <form id="add-assignment-form" class="modal-form">
        <div class="form-group">
          <label>${t('common.person') || 'Person'} *</label>
          <select name="personId" required>
            <option value="">${t('schedule.selectPerson') || 'Select person...'}</option>
            ${people.data.map(p => `<option value="${p.id}">${p.firstName} ${p.lastName}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>${t('common.project') || 'Project'} *</label>
          <select name="projectId" required>
            <option value="">${t('schedule.selectProject') || 'Select project...'}</option>
            ${projects.data.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>${t('common.date') || 'Date'} *</label>
          <input type="date" name="date" value="${state.scheduleDate}" required>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>${t('schedule.startHour') || 'Start Hour'} *</label>
            <select name="startHour" required>
              ${Array.from({length: 24}, (_, i) => `<option value="${i}" ${i === 9 ? 'selected' : ''}>${i}:00</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>${t('schedule.endHour') || 'End Hour'} *</label>
            <select name="endHour" required>
              ${Array.from({length: 24}, (_, i) => `<option value="${i + 1}" ${i === 16 ? 'selected' : ''}>${i + 1}:00</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>${t('schedule.taskDescription') || 'Task Description'}</label>
          <textarea name="taskDescription" rows="2"></textarea>
        </div>
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" name="isRemote">
            ${t('schedule.remoteWork') || 'Remote Work'}
          </label>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">${t('common.cancel') || 'Cancel'}</button>
          <button type="submit" class="btn btn-primary">${t('schedule.createAssignment') || 'Create Assignment'}</button>
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

// ===== Login Language Switcher =====
function toggleLoginLangMenu() {
  const menu = document.getElementById('login-lang-menu');
  if (menu) {
    menu.classList.toggle('open');
  }
}

async function switchLoginLanguage(langCode) {
  // Close menu
  const menu = document.getElementById('login-lang-menu');
  if (menu) menu.classList.remove('open');
  
  // Save preference
  localStorage.setItem('scheduler_language', langCode);
  
  // Update flag
  const flag = document.getElementById('login-lang-flag');
  if (flag) flag.textContent = langCode === 'el' ? '🇬🇷' : '🇬🇧';
  
  // Initialize/update i18n
  if (window.i18n) {
    await window.i18n.setLanguage(langCode);
  }
}

// Initialize language on page load (for login screen)
async function initLoginLanguage() {
  const savedLang = localStorage.getItem('scheduler_language') || 'en';
  
  // Update login page flag
  const flag = document.getElementById('login-lang-flag');
  if (flag) flag.textContent = savedLang === 'el' ? '🇬🇷' : '🇬🇧';
  
  // Initialize i18n
  if (window.i18n) {
    await window.i18n.init();
    window.i18n.applyTranslations();
  }
  
  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    const switcher = document.querySelector('.login-lang-switcher');
    const menu = document.getElementById('login-lang-menu');
    if (switcher && menu && !switcher.contains(e.target)) {
      menu.classList.remove('open');
    }
  });
}

// ===== Event Listeners =====
document.addEventListener('DOMContentLoaded', () => {
  // Initialize language for login page
  initLoginLanguage();
  
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
  document.getElementById('add-group-btn')?.addEventListener('click', showAddGroupModal);
  document.getElementById('add-user-btn')?.addEventListener('click', showAddUserModal);
  
  // AI Scheduler
  document.getElementById('generate-schedule-btn')?.addEventListener('click', generateAISuggestions);
  
  // Search handlers
  let searchTimeout;
  ['people-search', 'projects-search', 'skills-search', 'groups-search'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        if (id === 'people-search') loadPeople();
        if (id === 'projects-search') loadProjects();
        if (id === 'skills-search') loadSkills();
        if (id === 'groups-search') loadGroups();
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

// ===== Enhanced Keyboard Shortcuts =====
document.addEventListener('keydown', (e) => {
  const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
  const isModalOpen = document.getElementById('modal-overlay')?.classList.contains('active');
  
  // Escape to close modal or search
  if (e.key === 'Escape') {
    if (document.getElementById('global-search-modal')?.classList.contains('active')) {
      closeGlobalSearch();
    } else {
      closeModal();
    }
    return;
  }
  
  // Don't trigger shortcuts when typing
  if (isTyping) return;
  
  // ? to show help
  if (e.key === '?') {
    e.preventDefault();
    showHelp();
    return;
  }
  
  // Ctrl/Cmd + K for global search
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    openGlobalSearch();
    return;
  }
  
  // Navigation shortcuts (when not in modal)
  if (!isModalOpen) {
    // G then key for "Go to" navigation
    if (e.key === 'g') {
      window.pendingGoTo = true;
      setTimeout(() => { window.pendingGoTo = false; }, 1000);
      return;
    }
    
    if (window.pendingGoTo) {
      window.pendingGoTo = false;
      e.preventDefault();
      switch (e.key) {
        case 'd': switchView('dashboard'); break;
        case 's': switchView('schedule'); break;
        case 'p': switchView('people'); break;
        case 'j': switchView('projects'); break;
        case 'k': switchView('skills'); break;
        case 'r': switchView('reports'); break;
        case 'a': switchView('ai-scheduler'); break;
        case 'c': switchView('conflicts'); break;
      }
      return;
    }
    
    // N for new (context-aware)
    if (e.key === 'n' && canEdit()) {
      e.preventDefault();
      switch (state.currentView) {
        case 'schedule': showAddAssignmentModal(); break;
        case 'people': showAddPersonModal(); break;
        case 'projects': showAddProjectModal(); break;
        case 'skills': showAddSkillModal(); break;
      }
      return;
    }
    
    // Arrow keys for date navigation in schedule
    if (state.currentView === 'schedule') {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        document.getElementById('prev-date')?.click();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        document.getElementById('next-date')?.click();
      } else if (e.key === 't') {
        e.preventDefault();
        document.getElementById('today-btn')?.click();
      }
    }
  }
});

// ===== Global Search =====
function openGlobalSearch() {
  let modal = document.getElementById('global-search-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'global-search-modal';
    modal.className = 'global-search-modal';
    modal.innerHTML = `
      <div class="global-search-content">
        <div class="global-search-header">
          <i class="fas fa-search"></i>
          <input type="text" id="global-search-input" placeholder="${t('common.search')}... (${t('common.people')}, ${t('common.projects')}, ${t('common.skills')})" autocomplete="off">
          <kbd>ESC</kbd>
        </div>
        <div id="global-search-results" class="global-search-results">
          <div class="search-hint">
            <p><kbd>↑</kbd><kbd>↓</kbd> ${t('common.navigate')} • <kbd>Enter</kbd> ${t('common.select')} • <kbd>ESC</kbd> ${t('common.close')}</p>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeGlobalSearch();
    });
    
    // Search input handler
    const input = document.getElementById('global-search-input');
    let debounceTimer;
    input.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => performGlobalSearch(e.target.value), 300);
    });
    
    // Keyboard navigation in results
    input.addEventListener('keydown', (e) => {
      const results = document.querySelectorAll('.search-result-item');
      const active = document.querySelector('.search-result-item.active');
      let index = Array.from(results).indexOf(active);
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (index < results.length - 1) {
          active?.classList.remove('active');
          results[index + 1].classList.add('active');
          results[index + 1].scrollIntoView({ block: 'nearest' });
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (index > 0) {
          active?.classList.remove('active');
          results[index - 1].classList.add('active');
          results[index - 1].scrollIntoView({ block: 'nearest' });
        }
      } else if (e.key === 'Enter' && active) {
        e.preventDefault();
        active.click();
      }
    });
  }
  
  modal.classList.add('active');
  document.getElementById('global-search-input').value = '';
  document.getElementById('global-search-input').focus();
  document.getElementById('global-search-results').innerHTML = `
    <div class="search-hint">
      <p><kbd>↑</kbd><kbd>↓</kbd> to navigate • <kbd>Enter</kbd> to select • <kbd>ESC</kbd> to close</p>
      <div class="search-shortcuts">
        <span><kbd>G</kbd> then <kbd>D</kbd> Dashboard</span>
        <span><kbd>G</kbd> then <kbd>S</kbd> Schedule</span>
        <span><kbd>G</kbd> then <kbd>P</kbd> People</span>
        <span><kbd>G</kbd> then <kbd>J</kbd> Projects</span>
        <span><kbd>N</kbd> New item</span>
      </div>
    </div>
  `;
}

function closeGlobalSearch() {
  document.getElementById('global-search-modal')?.classList.remove('active');
}

async function performGlobalSearch(query) {
  const resultsDiv = document.getElementById('global-search-results');
  
  if (!query || query.length < 2) {
    resultsDiv.innerHTML = `
      <div class="search-hint">
        <p>Type at least 2 characters to search...</p>
      </div>
    `;
    return;
  }
  
  resultsDiv.innerHTML = '<div class="search-loading"><i class="fas fa-spinner fa-spin"></i> Searching...</div>';
  
  try {
    const [people, projects, skills] = await Promise.all([
      api(`/people?search=${encodeURIComponent(query)}&limit=5`),
      api(`/projects?search=${encodeURIComponent(query)}&limit=5`),
      api(`/skills?search=${encodeURIComponent(query)}&limit=5`)
    ]);
    
    let html = '';
    
    if (people.data?.length > 0) {
      html += `<div class="search-category"><h4><i class="fas fa-users"></i> ${t('common.people')}</h4>`;
      html += people.data.map(p => `
        <div class="search-result-item" onclick="closeGlobalSearch(); switchView('people'); setTimeout(() => showPersonDetails(${p.id}), 100);">
          <div class="result-avatar">${p.firstName.charAt(0)}${p.lastName.charAt(0)}</div>
          <div class="result-info">
            <span class="result-name">${p.firstName} ${p.lastName}</span>
            <span class="result-sub">${p.department || p.email}</span>
          </div>
        </div>
      `).join('');
      html += '</div>';
    }
    
    if (projects.data?.length > 0) {
      html += `<div class="search-category"><h4><i class="fas fa-folder"></i> ${t('common.projects')}</h4>`;
      html += projects.data.map(p => `
        <div class="search-result-item" onclick="closeGlobalSearch(); switchView('projects'); setTimeout(() => showProjectDetails(${p.id}), 100);">
          <div class="result-avatar" style="background: ${p.color}">${p.name.substring(0, 2).toUpperCase()}</div>
          <div class="result-info">
            <span class="result-name">${p.name}</span>
            <span class="result-sub">${p.client || p.status}</span>
          </div>
        </div>
      `).join('');
      html += '</div>';
    }
    
    if (skills.data?.length > 0) {
      html += `<div class="search-category"><h4><i class="fas fa-star"></i> ${t('common.skills')}</h4>`;
      html += skills.data.map(s => `
        <div class="search-result-item" onclick="closeGlobalSearch(); switchView('skills'); setTimeout(() => showSkillDetails(${s.id}), 100);">
          <div class="result-avatar" style="background: ${s.color}20; color: ${s.color}">${s.name.charAt(0)}</div>
          <div class="result-info">
            <span class="result-name">${s.name}</span>
            <span class="result-sub">${s.category || 'No category'} • ${s.personCount} people</span>
          </div>
        </div>
      `).join('');
      html += '</div>';
    }
    
    if (!html) {
      html = `<div class="search-empty"><i class="fas fa-search"></i><p>No results found for "${query}"</p></div>`;
    } else {
      // Add active class to first result
      html = html.replace('search-result-item"', 'search-result-item active"');
    }
    
    resultsDiv.innerHTML = html;
  } catch (error) {
    resultsDiv.innerHTML = `<div class="search-error"><i class="fas fa-exclamation-circle"></i> Search failed</div>`;
  }
}

// ===== Calendar Export (.ics) =====
// ===== PDF Export with Preview =====
async function showPdfExportPreview(viewType = 'all') {
  try {
    const today = new Date().toISOString().split('T')[0];
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Fetch schedule data
    const data = await api(`/assignments?startDate=${today}&endDate=${endDateStr}`);
    const assignments = data.data || [];
    
    // Group assignments by date
    const byDate = {};
    assignments.forEach(a => {
      if (!byDate[a.date]) byDate[a.date] = [];
      byDate[a.date].push(a);
    });
    
    // Sort dates
    const sortedDates = Object.keys(byDate).sort();
    
    // Determine title based on view type
    const viewTitles = {
      'projects': t('dashboard.scheduleByProjects') || 'Schedule by Projects',
      'employees': t('dashboard.scheduleByEmployees') || 'Schedule by Employees',
      'all': t('dashboard.exportPdf') || 'Export Schedule to PDF'
    };
    
    // Build preview HTML
    let previewHtml = `
      <div class="pdf-preview-container">
        <div class="pdf-preview-header">
          <h3><i class="fas fa-file-pdf"></i> ${viewTitles[viewType]}</h3>
          <p>${t('dashboard.pdfPreviewDesc') || 'Preview your schedule before exporting'}</p>
        </div>
        
        <div class="pdf-date-range">
          <label>${t('common.startDate') || 'Start Date'}:</label>
          <input type="date" id="pdf-start-date" value="${today}">
          <label>${t('common.endDate') || 'End Date'}:</label>
          <input type="date" id="pdf-end-date" value="${endDateStr}">
          <input type="hidden" id="pdf-view-type" value="${viewType}">
          <button class="btn btn-secondary btn-sm" onclick="refreshPdfPreview()">
            <i class="fas fa-sync-alt"></i> ${t('common.refresh') || 'Refresh'}
          </button>
        </div>
        
        <div class="pdf-preview-document" id="pdf-preview-content">
          ${generatePdfPreviewContent(sortedDates, byDate, viewType)}
        </div>
        
        <div class="pdf-preview-actions">
          <button class="btn btn-secondary" onclick="closeModal()">
            <i class="fas fa-times"></i> ${t('common.cancel') || 'Cancel'}
          </button>
          <button class="btn btn-primary" onclick="downloadSchedulePdf()">
            <i class="fas fa-download"></i> ${t('common.download') || 'Download'} PDF
          </button>
        </div>
      </div>
    `;
    
    showModal(viewTitles[viewType], previewHtml, 'pdf-export-modal');
  } catch (error) {
    showToast(t('common.loadError') || 'Failed to load data', 'error');
  }
}

function generatePdfPreviewContent(sortedDates, byDate, viewType = 'all') {
  if (sortedDates.length === 0) {
    return `
      <div class="pdf-empty">
        <i class="fas fa-calendar-times"></i>
        <p>${t('schedule.noAssignments') || 'No assignments for this period'}</p>
      </div>
    `;
  }
  
  // Determine title based on view type
  const titleMap = {
    'projects': t('dashboard.scheduleByProjects') || 'Schedule by Projects',
    'employees': t('dashboard.scheduleByEmployees') || 'Schedule by Employees',
    'all': t('nav.schedule') || 'Work Schedule'
  };
  
  let html = `
    <div class="pdf-document">
      <div class="pdf-title">
        <h1>${titleMap[viewType]}</h1>
        <p>${t('common.generatedOn') || 'Generated on'}: ${new Date().toLocaleDateString()}</p>
      </div>
  `;
  
  if (viewType === 'projects') {
    // Group all assignments by project across all dates
    const byProject = {};
    for (const date of sortedDates) {
      for (const a of byDate[date]) {
        if (!byProject[a.projectId]) {
          byProject[a.projectId] = {
            name: a.projectName,
            color: a.projectColor,
            assignments: []
          };
        }
        byProject[a.projectId].assignments.push({ ...a, date });
      }
    }
    
    for (const projectId of Object.keys(byProject)) {
      const project = byProject[projectId];
      const totalHours = project.assignments.reduce((sum, a) => sum + (a.endHour - a.startHour), 0);
      
      html += `
        <div class="pdf-day-section">
          <h2 class="pdf-day-header" style="border-left-color: ${project.color}">
            <span style="color: ${project.color}">●</span> ${project.name} 
            <span style="float: right; font-size: 14px; color: #666;">${totalHours}h total</span>
          </h2>
          <table class="pdf-schedule-table">
            <thead>
              <tr>
                <th>${t('common.date') || 'Date'}</th>
                <th>${t('common.person') || 'Person'}</th>
                <th>${t('common.time') || 'Time'}</th>
                <th>${t('schedule.hours') || 'Hours'}</th>
                <th>${t('schedule.task') || 'Task'}</th>
              </tr>
            </thead>
            <tbody>
      `;
      
      for (const a of project.assignments.sort((x, y) => x.date.localeCompare(y.date))) {
        const hours = a.endHour - a.startHour;
        const dateStr = new Date(a.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
        html += `
          <tr>
            <td>${dateStr}</td>
            <td>${a.personName}</td>
            <td>${String(a.startHour).padStart(2, '0')}:00 - ${String(a.endHour).padStart(2, '0')}:00</td>
            <td>${hours}h</td>
            <td>${a.taskDescription || '-'}</td>
          </tr>
        `;
      }
      
      html += `</tbody></table></div>`;
    }
  } else if (viewType === 'employees') {
    // Group all assignments by employee across all dates
    const byEmployee = {};
    for (const date of sortedDates) {
      for (const a of byDate[date]) {
        if (!byEmployee[a.personId]) {
          byEmployee[a.personId] = {
            name: a.personName,
            assignments: []
          };
        }
        byEmployee[a.personId].assignments.push({ ...a, date });
      }
    }
    
    for (const personId of Object.keys(byEmployee)) {
      const employee = byEmployee[personId];
      const totalHours = employee.assignments.reduce((sum, a) => sum + (a.endHour - a.startHour), 0);
      
      html += `
        <div class="pdf-day-section">
          <h2 class="pdf-day-header">
            👤 ${employee.name}
            <span style="float: right; font-size: 14px; color: #666;">${totalHours}h total</span>
          </h2>
          <table class="pdf-schedule-table">
            <thead>
              <tr>
                <th>${t('common.date') || 'Date'}</th>
                <th>${t('common.project') || 'Project'}</th>
                <th>${t('common.time') || 'Time'}</th>
                <th>${t('schedule.hours') || 'Hours'}</th>
                <th>${t('schedule.task') || 'Task'}</th>
              </tr>
            </thead>
            <tbody>
      `;
      
      for (const a of employee.assignments.sort((x, y) => x.date.localeCompare(y.date))) {
        const hours = a.endHour - a.startHour;
        const dateStr = new Date(a.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
        html += `
          <tr>
            <td>${dateStr}</td>
            <td><span class="pdf-project-badge" style="background: ${a.projectColor}20; color: ${a.projectColor}; border: 1px solid ${a.projectColor}">${a.projectName}</span></td>
            <td>${String(a.startHour).padStart(2, '0')}:00 - ${String(a.endHour).padStart(2, '0')}:00</td>
            <td>${hours}h</td>
            <td>${a.taskDescription || '-'}</td>
          </tr>
        `;
      }
      
      html += `</tbody></table></div>`;
    }
  } else {
    // Default: by date (original behavior)
    for (const date of sortedDates) {
      const dayName = new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const dayAssignments = byDate[date];
      
      html += `
        <div class="pdf-day-section">
          <h2 class="pdf-day-header">${dayName}</h2>
          <table class="pdf-schedule-table">
            <thead>
              <tr>
                <th>${t('common.person') || 'Person'}</th>
                <th>${t('common.project') || 'Project'}</th>
                <th>${t('common.time') || 'Time'}</th>
                <th>${t('schedule.hours') || 'Hours'}</th>
                <th>${t('schedule.task') || 'Task'}</th>
              </tr>
            </thead>
            <tbody>
      `;
      
      for (const a of dayAssignments) {
        const hours = a.endHour - a.startHour;
        html += `
          <tr>
            <td>${a.personName}</td>
            <td><span class="pdf-project-badge" style="background: ${a.projectColor}20; color: ${a.projectColor}; border: 1px solid ${a.projectColor}">${a.projectName}</span></td>
            <td>${String(a.startHour).padStart(2, '0')}:00 - ${String(a.endHour).padStart(2, '0')}:00</td>
            <td>${hours}h</td>
            <td>${a.taskDescription || '-'}</td>
          </tr>
        `;
      }
      
      html += `</tbody></table></div>`;
    }
  }
  
  html += '</div>';
  return html;
}

async function refreshPdfPreview() {
  const startDate = document.getElementById('pdf-start-date').value;
  const endDate = document.getElementById('pdf-end-date').value;
  const viewType = document.getElementById('pdf-view-type')?.value || 'all';
  
  if (!startDate || !endDate) {
    showToast('Please select both dates', 'error');
    return;
  }
  
  try {
    const data = await api(`/assignments?startDate=${startDate}&endDate=${endDate}`);
    const assignments = data.data || [];
    
    const byDate = {};
    assignments.forEach(a => {
      if (!byDate[a.date]) byDate[a.date] = [];
      byDate[a.date].push(a);
    });
    
    const sortedDates = Object.keys(byDate).sort();
    document.getElementById('pdf-preview-content').innerHTML = generatePdfPreviewContent(sortedDates, byDate, viewType);
  } catch (error) {
    showToast('Failed to refresh preview', 'error');
  }
}

function downloadSchedulePdf() {
  const content = document.getElementById('pdf-preview-content');
  const startDate = document.getElementById('pdf-start-date').value;
  const endDate = document.getElementById('pdf-end-date').value;
  
  // Create a printable window
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Schedule ${startDate} to ${endDate}</title>
      <style>
        * { box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 20px;
          color: #1a1a1a;
          line-height: 1.5;
        }
        .pdf-document { max-width: 800px; margin: 0 auto; }
        .pdf-title { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .pdf-title h1 { margin: 0 0 10px; font-size: 28px; }
        .pdf-title p { margin: 0; color: #666; }
        .pdf-day-section { margin-bottom: 30px; page-break-inside: avoid; }
        .pdf-day-header { 
          font-size: 16px; 
          background: #f5f5f5; 
          padding: 10px 15px; 
          margin: 0 0 15px;
          border-left: 4px solid #6366f1;
        }
        .pdf-schedule-table { 
          width: 100%; 
          border-collapse: collapse; 
          font-size: 13px;
        }
        .pdf-schedule-table th { 
          background: #f9fafb; 
          padding: 10px; 
          text-align: left; 
          border: 1px solid #e5e7eb;
          font-weight: 600;
        }
        .pdf-schedule-table td { 
          padding: 10px; 
          border: 1px solid #e5e7eb;
          vertical-align: top;
        }
        .pdf-project-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }
        .pdf-empty { text-align: center; padding: 60px; color: #666; }
        .pdf-empty i { font-size: 48px; margin-bottom: 15px; display: block; }
        @media print {
          body { padding: 0; }
          .pdf-day-section { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      ${content.innerHTML}
      <script>
        window.onload = function() {
          window.print();
          setTimeout(function() { window.close(); }, 500);
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
  
  showToast(t('common.exportSuccess') || 'PDF export ready');
  closeModal();
}

// ===== Auto-refresh for real-time updates =====
let autoRefreshInterval = null;

function startAutoRefresh(intervalMs = 60000) {
  stopAutoRefresh();
  autoRefreshInterval = setInterval(() => {
    if (document.visibilityState === 'visible' && state.token) {
      switch (state.currentView) {
        case 'dashboard': loadDashboard(); break;
        case 'schedule': loadSchedule(); break;
        case 'conflicts': loadConflicts(); break;
      }
    }
  }, intervalMs);
}

function stopAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
  }
}

// Start auto-refresh when logged in
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && state.token) {
    // Refresh current view when tab becomes visible
    switchView(state.currentView);
  }
});

// ===== Smart Confirmation Dialogs =====
const confirmPreferences = JSON.parse(localStorage.getItem('scheduler_confirm_prefs') || '{}');

function showSmartConfirm(options) {
  return new Promise((resolve) => {
    const {
      title = 'Confirm Action',
      message = 'Are you sure?',
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      type = 'warning', // warning, danger, info
      rememberKey = null, // Key to remember preference
      dangerous = false
    } = options;
    
    // Check if user has remembered preference
    if (rememberKey && confirmPreferences[rememberKey]) {
      resolve(true);
      return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'smart-confirm-overlay';
    modal.innerHTML = `
      <div class="smart-confirm-dialog ${type}">
        <div class="smart-confirm-icon">
          <i class="fas fa-${type === 'danger' ? 'exclamation-triangle' : type === 'warning' ? 'question-circle' : 'info-circle'}"></i>
        </div>
        <h3>${title}</h3>
        <p>${message}</p>
        ${rememberKey ? `
          <label class="smart-confirm-remember">
            <input type="checkbox" id="confirm-remember">
            <span>${t('common.dontAskAgain') || "Don't ask me again"}</span>
          </label>
        ` : ''}
        <div class="smart-confirm-actions">
          <button class="btn btn-secondary cancel-btn">${cancelText}</button>
          <button class="btn ${dangerous ? 'btn-danger' : 'btn-primary'} confirm-btn">${confirmText}</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Animate in
    requestAnimationFrame(() => modal.classList.add('active'));
    
    const cleanup = (result) => {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 200);
      resolve(result);
    };
    
    modal.querySelector('.cancel-btn').onclick = () => cleanup(false);
    modal.querySelector('.confirm-btn').onclick = () => {
      if (rememberKey && document.getElementById('confirm-remember')?.checked) {
        confirmPreferences[rememberKey] = true;
        localStorage.setItem('scheduler_confirm_prefs', JSON.stringify(confirmPreferences));
      }
      cleanup(true);
    };
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) cleanup(false);
    });
    
    // Close on Escape
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        cleanup(false);
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  });
}

// Function to reset confirmation preferences
function resetConfirmPreferences() {
  localStorage.removeItem('scheduler_confirm_prefs');
  Object.keys(confirmPreferences).forEach(key => delete confirmPreferences[key]);
  showToast('Confirmation preferences reset');
}

// ===== Sidebar Mobile Functions =====
function closeSidebar() {
  document.querySelector('.sidebar')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('active');
}

function toggleSidebarLanguage() {
  const menu = document.getElementById('sidebar-lang-menu');
  menu?.classList.toggle('hidden');
}

function closeSidebarLangMenu() {
  document.getElementById('sidebar-lang-menu')?.classList.add('hidden');
  updateSidebarLangValue();
}

function updateSidebarLangValue() {
  const currentLang = localStorage.getItem('scheduler_language') || 'en';
  const langValue = document.getElementById('sidebar-lang-value');
  if (langValue) {
    langValue.textContent = currentLang === 'el' ? 'Ελληνικά' : 'English';
  }
}

// Update sidebar language value on load and language change
document.addEventListener('DOMContentLoaded', updateSidebarLangValue);
document.addEventListener('languageChanged', updateSidebarLangValue);

// ===== Dashboard Configuration =====
const DEFAULT_DASHBOARD_CONFIG = [
  { id: 'web-requests-card', name: 'Web Requests', icon: 'fa-globe', color: '#c45c26', visible: true, size: 'full' },
  { id: 'schedule-by-projects', name: 'Schedule by Projects', icon: 'fa-folder-open', color: '#10b981', visible: true, size: 'full' },
  { id: 'schedule-by-employees', name: 'Schedule by Employees', icon: 'fa-users', color: '#6366f1', visible: true, size: 'large' },
  { id: 'quick-actions-card', name: 'Quick Actions', icon: 'fa-bolt', color: '#f59e0b', visible: true, size: 'small' },
  { id: 'utilization-card', name: 'Weekly Utilization', icon: 'fa-chart-bar', color: '#8b5cf6', visible: true, size: 'small' },
  { id: 'top-utilized', name: 'Top Utilized', icon: 'fa-trophy', color: '#ec4899', visible: true, size: 'small' },
  { id: 'available-employees', name: 'Available Employees', icon: 'fa-user-clock', color: '#14b8a6', visible: true, size: 'small' },
  { id: 'active-conflicts', name: 'Active Conflicts', icon: 'fa-exclamation-circle', color: '#ef4444', visible: true, size: 'medium' },
  { id: 'skill-demand', name: 'Skill Demand', icon: 'fa-star', color: '#f97316', visible: true, size: 'medium' }
];

function getDashboardConfig() {
  const saved = localStorage.getItem('dashboard_config');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      const ids = new Set(parsed.map(c => c.id));
      // Merge in any new default cards (e.g. web requests) for existing users
      const missing = DEFAULT_DASHBOARD_CONFIG.filter(c => !ids.has(c.id));
      return missing.length ? [...missing, ...parsed] : parsed;
    } catch (e) {
      return [...DEFAULT_DASHBOARD_CONFIG];
    }
  }
  return [...DEFAULT_DASHBOARD_CONFIG];
}

function saveDashboardConfig() {
  const items = document.querySelectorAll('.dashboard-config-item');
  const config = [];
  
  items.forEach(item => {
    config.push({
      id: item.dataset.cardId,
      name: item.querySelector('.config-card-name').textContent,
      icon: item.dataset.icon,
      color: item.dataset.color,
      visible: item.querySelector('.config-visibility input').checked,
      size: item.querySelector('.config-size-select').value
    });
  });
  
  localStorage.setItem('dashboard_config', JSON.stringify(config));
  applyDashboardConfig();
  showToast(t('settings.dashboardSaved') || 'Dashboard configuration saved');
}

function resetDashboardConfig() {
  localStorage.removeItem('dashboard_config');
  loadDashboardConfigUI();
  applyDashboardConfig();
  showToast(t('settings.dashboardReset') || 'Dashboard reset to default');
}

function loadDashboardConfigUI() {
  const container = document.getElementById('dashboard-config-list');
  if (!container) return;
  
  const config = getDashboardConfig();
  
  container.innerHTML = config.map(card => `
    <div class="dashboard-config-item ${card.visible ? '' : 'disabled'}" 
         data-card-id="${card.id}" 
         data-icon="${card.icon}"
         data-color="${card.color}"
         draggable="true">
      <div class="config-drag-handle">
        <i class="fas fa-grip-vertical"></i>
      </div>
      <div class="config-visibility">
        <input type="checkbox" ${card.visible ? 'checked' : ''} onchange="this.closest('.dashboard-config-item').classList.toggle('disabled', !this.checked)">
      </div>
      <div class="config-card-icon" style="background: ${card.color}">
        <i class="fas ${card.icon}"></i>
      </div>
      <div class="config-card-info">
        <span class="config-card-name">${card.name}</span>
        <span class="config-card-desc">${t('settings.size')}: ${card.size}</span>
      </div>
      <select class="config-size-select" onchange="this.closest('.dashboard-config-item').querySelector('.config-card-desc').textContent = '${t('settings.size')}: ' + this.value">
        <option value="small" ${card.size === 'small' ? 'selected' : ''}>${t('settings.sizeSmall') || 'Small (4 cols)'}</option>
        <option value="medium" ${card.size === 'medium' ? 'selected' : ''}>${t('settings.sizeMedium') || 'Medium (6 cols)'}</option>
        <option value="large" ${card.size === 'large' ? 'selected' : ''}>${t('settings.sizeLarge') || 'Large (8 cols)'}</option>
        <option value="full" ${card.size === 'full' ? 'selected' : ''}>${t('settings.sizeFull') || 'Full (12 cols)'}</option>
      </select>
    </div>
  `).join('');
  
  // Add drag and drop handlers
  initDashboardConfigDragDrop();
}

function initDashboardConfigDragDrop() {
  const container = document.getElementById('dashboard-config-list');
  const items = container.querySelectorAll('.dashboard-config-item');
  
  items.forEach(item => {
    item.addEventListener('dragstart', (e) => {
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    
    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      items.forEach(i => i.classList.remove('drag-over'));
    });
    
    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      const dragging = container.querySelector('.dragging');
      if (dragging !== item) {
        item.classList.add('drag-over');
      }
    });
    
    item.addEventListener('dragleave', () => {
      item.classList.remove('drag-over');
    });
    
    item.addEventListener('drop', (e) => {
      e.preventDefault();
      const dragging = container.querySelector('.dragging');
      if (dragging !== item) {
        const allItems = [...container.querySelectorAll('.dashboard-config-item')];
        const dragIdx = allItems.indexOf(dragging);
        const dropIdx = allItems.indexOf(item);
        
        if (dragIdx < dropIdx) {
          item.after(dragging);
        } else {
          item.before(dragging);
        }
      }
      item.classList.remove('drag-over');
    });
  });
}

function applyDashboardConfig() {
  const config = getDashboardConfig();
  const grid = document.querySelector('.dashboard-grid');
  if (!grid) return;
  
  // Size mapping
  const sizeMap = {
    'small': 'span 4',
    'medium': 'span 6',
    'large': 'span 8',
    'full': 'span 12'
  };
  
  config.forEach((card, index) => {
    const element = document.getElementById(card.id) || document.querySelector(`.${card.id}`);
    if (element) {
      // Apply visibility
      element.style.display = card.visible ? '' : 'none';
      
      // Apply size
      element.style.gridColumn = sizeMap[card.size] || 'span 4';
      
      // Apply order
      element.style.order = index;
    }
  });
}

// Apply config on page load
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(applyDashboardConfig, 100);
});

// Help button click
document.getElementById('help-btn')?.addEventListener('click', showHelp);
