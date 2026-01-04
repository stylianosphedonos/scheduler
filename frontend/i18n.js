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
    
    // Trigger UI update
    document.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: langCode } }));
    
    return true;
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

