/**
 * Internationalization (i18n) Module for Resource Scheduler
 * Supports English and Greek with dynamic translation management
 */

const i18n = {
  // Available languages
  languages: {
    en: { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
    el: { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷' }
  },
  
  // Current language
  currentLanguage: 'en',
  
  // Loaded translations
  translations: {},
  
  // Custom translations (overrides)
  customTranslations: {},
  
  // Default language from settings
  defaultLanguage: 'en',
  
  /**
   * Initialize the i18n system
   */
  async init() {
    // Load default language from settings
    try {
      const response = await fetch('/api/settings/public');
      if (response.ok) {
        const settings = await response.json();
        this.defaultLanguage = settings.default_language || 'en';
      }
    } catch (error) {
      console.log('Using default language: en');
    }
    
    // Check user preference (localStorage) or use default
    const savedLanguage = localStorage.getItem('scheduler_language');
    this.currentLanguage = savedLanguage || this.defaultLanguage;
    
    // Load translations
    await this.loadLanguage(this.currentLanguage);
    
    // Load custom translations
    await this.loadCustomTranslations();
    
    // Update UI
    this.updateDocumentLanguage();
  },
  
  /**
   * Load a language file
   */
  async loadLanguage(langCode) {
    if (!this.languages[langCode]) {
      console.warn(`Language ${langCode} not supported, falling back to English`);
      langCode = 'en';
    }
    
    try {
      const response = await fetch(`/i18n/${langCode}.json`);
      if (response.ok) {
        this.translations[langCode] = await response.json();
      } else {
        throw new Error(`Failed to load ${langCode}.json`);
      }
    } catch (error) {
      console.error(`Error loading language ${langCode}:`, error);
      // Try to load English as fallback
      if (langCode !== 'en') {
        await this.loadLanguage('en');
        this.currentLanguage = 'en';
      }
    }
  },
  
  /**
   * Load custom translations from server
   */
  async loadCustomTranslations() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch('/api/translations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.customTranslations = data.translations || {};
      }
    } catch (error) {
      console.log('No custom translations loaded');
    }
  },
  
  /**
   * Change the current language
   */
  async setLanguage(langCode) {
    if (!this.languages[langCode]) {
      console.warn(`Language ${langCode} not supported`);
      return false;
    }
    
    // Load language if not already loaded
    if (!this.translations[langCode]) {
      await this.loadLanguage(langCode);
    }
    
    this.currentLanguage = langCode;
    localStorage.setItem('scheduler_language', langCode);
    this.updateDocumentLanguage();
    
    // Apply translations to UI
    this.applyTranslations();
    
    // Trigger UI update
    document.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: langCode } }));
    
    return true;
  },
  
  /**
   * Apply translations to all UI elements
   */
  applyTranslations() {
    // Translate elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const translated = this.t(key);
      if (translated && translated !== key) {
        el.textContent = translated;
      }
    });
    
    // Translate placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.dataset.i18nPlaceholder;
      const translated = this.t(key);
      if (translated && translated !== key) {
        el.placeholder = translated;
      }
    });
    
    // Translate titles
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.dataset.i18nTitle;
      const translated = this.t(key);
      if (translated && translated !== key) {
        el.title = translated;
      }
    });
    
    // Update navigation items
    this.translateNavigation();
    
    // Update common buttons
    this.translateButtons();
    
    // Update page titles
    this.translatePageElements();
  },
  
  /**
   * Translate navigation menu items
   */
  translateNavigation() {
    const navMappings = {
      'dashboard': 'nav.dashboard',
      'schedule': 'nav.schedule',
      'people': 'nav.people',
      'projects': 'nav.projects',
      'skills': 'nav.skills',
      'reports': 'nav.reports',
      'settings': 'nav.settings',
      'users': 'nav.users',
      'ai-scheduler': 'nav.aiScheduler'
    };
    
    document.querySelectorAll('.nav-item[data-view]').forEach(item => {
      const view = item.dataset.view;
      if (navMappings[view]) {
        const textSpan = item.querySelector('.nav-text') || item;
        const translated = this.t(navMappings[view]);
        if (translated) {
          if (item.querySelector('.nav-text')) {
            item.querySelector('.nav-text').textContent = translated;
          } else {
            // Keep the icon, update text
            const icon = item.querySelector('i');
            if (icon) {
              item.innerHTML = '';
              item.appendChild(icon);
              item.appendChild(document.createTextNode(' ' + translated));
            }
          }
        }
      }
    });
    
    // Mobile navigation
    document.querySelectorAll('.mobile-bottom-nav .nav-item[data-view]').forEach(item => {
      const view = item.dataset.view;
      if (navMappings[view]) {
        const label = item.querySelector('.nav-label');
        if (label) {
          label.textContent = this.t(navMappings[view]);
        }
      }
    });
  },
  
  /**
   * Translate common buttons
   */
  translateButtons() {
    // Save buttons
    document.querySelectorAll('button[type="submit"], .btn-save').forEach(btn => {
      if (btn.textContent.includes('Save') || btn.textContent.includes('Αποθήκευση')) {
        const icon = btn.querySelector('i');
        btn.innerHTML = icon ? icon.outerHTML + ' ' + this.t('common.save') : this.t('common.save');
      }
    });
    
    // Cancel buttons
    document.querySelectorAll('.btn-cancel, .close-btn').forEach(btn => {
      if (btn.textContent.trim() === 'Cancel' || btn.textContent.trim() === 'Ακύρωση') {
        btn.textContent = this.t('common.cancel');
      }
    });
    
    // Delete buttons
    document.querySelectorAll('.btn-danger').forEach(btn => {
      if (btn.textContent.includes('Delete') || btn.textContent.includes('Διαγραφή')) {
        const icon = btn.querySelector('i');
        btn.innerHTML = icon ? icon.outerHTML + ' ' + this.t('common.delete') : this.t('common.delete');
      }
    });
    
    // Add buttons
    document.querySelectorAll('.btn-primary').forEach(btn => {
      const text = btn.textContent.trim();
      if (text.startsWith('Add ') || text.startsWith('Προσθήκη')) {
        // Keep specific add text, don't generalize
      }
    });
  },
  
  /**
   * Translate page-specific elements
   */
  translatePageElements() {
    // Login page
    const loginTitle = document.querySelector('.login-title');
    if (loginTitle) loginTitle.textContent = this.t('auth.loginTitle');
    
    const loginSubtitle = document.querySelector('.login-subtitle');
    if (loginSubtitle) loginSubtitle.textContent = this.t('auth.loginSubtitle');
    
    const loginBtn = document.querySelector('#login-form button[type="submit"]');
    if (loginBtn) loginBtn.textContent = this.t('auth.login');
    
    // Login form labels
    const usernameLabel = document.querySelector('label[for="login-username"]');
    if (usernameLabel) usernameLabel.textContent = this.t('auth.username');
    
    const passwordLabel = document.querySelector('label[for="login-password"]');
    if (passwordLabel) passwordLabel.textContent = this.t('auth.password');
    
    // Dashboard metrics
    const metricLabels = {
      'Total People': 'dashboard.totalPeople',
      'Active Projects': 'dashboard.activeProjects',
      'Today\'s Assignments': 'dashboard.todayAssignments',
      'Pending Conflicts': 'dashboard.pendingConflicts'
    };
    
    document.querySelectorAll('.metric-card .metric-label').forEach(label => {
      const text = label.textContent.trim();
      if (metricLabels[text]) {
        label.textContent = this.t(metricLabels[text]);
      }
    });
    
    // Common labels
    document.querySelectorAll('.card-header h2, .card-header h3').forEach(header => {
      const text = header.textContent.trim();
      const icon = header.querySelector('i');
      
      const mappings = {
        'Branding': 'settings.branding',
        'System Settings': 'settings.title',
        'Language & Translations': 'settings.translations'
      };
      
      if (mappings[text]) {
        header.innerHTML = icon ? icon.outerHTML + ' ' + this.t(mappings[text]) : this.t(mappings[text]);
      }
    });
  },
  
  /**
   * Update document language attribute
   */
  updateDocumentLanguage() {
    document.documentElement.lang = this.currentLanguage;
    const meta = this.translations[this.currentLanguage]?.meta;
    if (meta?.direction) {
      document.documentElement.dir = meta.direction;
    }
  },
  
  /**
   * Get a translation by key path (e.g., 'common.save', 'auth.login')
   */
  t(key, params = {}) {
    // Check custom translations first
    const customValue = this.getNestedValue(this.customTranslations[this.currentLanguage], key);
    if (customValue) {
      return this.interpolate(customValue, params);
    }
    
    // Then check loaded translations
    const value = this.getNestedValue(this.translations[this.currentLanguage], key);
    if (value) {
      return this.interpolate(value, params);
    }
    
    // Fallback to English
    if (this.currentLanguage !== 'en') {
      const enValue = this.getNestedValue(this.translations['en'], key);
      if (enValue) {
        return this.interpolate(enValue, params);
      }
    }
    
    // Return key if not found
    console.warn(`Translation not found: ${key}`);
    return key;
  },
  
  /**
   * Get nested value from object using dot notation
   */
  getNestedValue(obj, path) {
    if (!obj || !path) return null;
    return path.split('.').reduce((current, part) => current?.[part], obj);
  },
  
  /**
   * Interpolate parameters into string
   * Supports {0}, {1}, {name} format
   */
  interpolate(str, params) {
    if (typeof str !== 'string') return str;
    
    // Handle array params ({0}, {1}, etc.)
    if (Array.isArray(params)) {
      return str.replace(/\{(\d+)\}/g, (match, index) => {
        return params[index] !== undefined ? params[index] : match;
      });
    }
    
    // Handle object params ({name}, etc.)
    return str.replace(/\{(\w+)\}/g, (match, key) => {
      return params[key] !== undefined ? params[key] : match;
    });
  },
  
  /**
   * Get all available languages
   */
  getLanguages() {
    return Object.values(this.languages);
  },
  
  /**
   * Get current language info
   */
  getCurrentLanguage() {
    return this.languages[this.currentLanguage];
  },
  
  /**
   * Get all translations for current language (for translation editor)
   */
  getAllTranslations() {
    return {
      base: this.translations[this.currentLanguage] || {},
      custom: this.customTranslations[this.currentLanguage] || {}
    };
  },
  
  /**
   * Flatten nested object to dot notation keys
   */
  flattenTranslations(obj, prefix = '') {
    const result = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(result, this.flattenTranslations(value, fullKey));
      } else {
        result[fullKey] = value;
      }
    }
    
    return result;
  },
  
  /**
   * Convert flat object back to nested
   */
  unflattenTranslations(flat) {
    const result = {};
    
    for (const [key, value] of Object.entries(flat)) {
      const parts = key.split('.');
      let current = result;
      
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
          current[parts[i]] = {};
        }
        current = current[parts[i]];
      }
      
      current[parts[parts.length - 1]] = value;
    }
    
    return result;
  }
};

// Export for use in other modules
window.i18n = i18n;

// Shorthand translation function
window.t = (key, params) => i18n.t(key, params);

