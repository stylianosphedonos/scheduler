/**
 * Security Middleware & Helpers
 * Provides CSRF protection, input sanitization, and security utilities
 */

const crypto = require('crypto');

// ===== CSRF Protection =====
const csrfTokens = new Map(); // In production, use Redis

function generateCsrfToken(sessionId) {
  const token = crypto.randomBytes(32).toString('hex');
  csrfTokens.set(sessionId, {
    token,
    expires: Date.now() + 3600000 // 1 hour
  });
  return token;
}

function validateCsrfToken(sessionId, token) {
  const stored = csrfTokens.get(sessionId);
  if (!stored) return false;
  if (Date.now() > stored.expires) {
    csrfTokens.delete(sessionId);
    return false;
  }
  return crypto.timingSafeEqual(
    Buffer.from(stored.token),
    Buffer.from(token)
  );
}

// Clean up expired CSRF tokens
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of csrfTokens.entries()) {
    if (now > value.expires) {
      csrfTokens.delete(key);
    }
  }
}, 300000); // Every 5 minutes

// ===== Account Lockout =====
const loginAttempts = new Map(); // In production, store in database

const LOCKOUT_CONFIG = {
  maxAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  attemptWindow: 5 * 60 * 1000 // 5 minutes
};

function recordFailedLogin(identifier) {
  const now = Date.now();
  if (!loginAttempts.has(identifier)) {
    loginAttempts.set(identifier, { attempts: [], lockedUntil: null });
  }
  
  const record = loginAttempts.get(identifier);
  
  // Clean old attempts outside the window
  record.attempts = record.attempts.filter(t => t > now - LOCKOUT_CONFIG.attemptWindow);
  record.attempts.push(now);
  
  // Check if should lock
  if (record.attempts.length >= LOCKOUT_CONFIG.maxAttempts) {
    record.lockedUntil = now + LOCKOUT_CONFIG.lockoutDuration;
  }
  
  loginAttempts.set(identifier, record);
  return record;
}

function isAccountLocked(identifier) {
  const record = loginAttempts.get(identifier);
  if (!record) return { locked: false, remainingAttempts: LOCKOUT_CONFIG.maxAttempts };
  
  const now = Date.now();
  
  // Check if locked
  if (record.lockedUntil && now < record.lockedUntil) {
    const remainingTime = Math.ceil((record.lockedUntil - now) / 60000);
    return { 
      locked: true, 
      remainingTime,
      message: `Account locked. Try again in ${remainingTime} minutes.`
    };
  }
  
  // Clear lockout if expired
  if (record.lockedUntil && now >= record.lockedUntil) {
    record.lockedUntil = null;
    record.attempts = [];
    loginAttempts.set(identifier, record);
  }
  
  // Clean old attempts and count remaining
  record.attempts = record.attempts.filter(t => t > now - LOCKOUT_CONFIG.attemptWindow);
  const remainingAttempts = LOCKOUT_CONFIG.maxAttempts - record.attempts.length;
  
  return { locked: false, remainingAttempts };
}

function clearLoginAttempts(identifier) {
  loginAttempts.delete(identifier);
}

// ===== Input Sanitization =====
function sanitizeInput(str, options = {}) {
  if (typeof str !== 'string') return str;
  
  const { maxLength = 1000, allowHtml = false } = options;
  
  let sanitized = str.trim().slice(0, maxLength);
  
  if (!allowHtml) {
    sanitized = sanitized
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/data:/gi, '') // Remove data: protocol
      .replace(/vbscript:/gi, ''); // Remove vbscript: protocol
  }
  
  return sanitized;
}

function sanitizeObject(obj, schema = {}) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    const fieldSchema = schema[key] || {};
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value, fieldSchema);
    } else if (typeof value === 'number') {
      sanitized[key] = isNaN(value) ? 0 : value;
    } else if (typeof value === 'boolean') {
      sanitized[key] = Boolean(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(v => typeof v === 'string' ? sanitizeInput(v) : v);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

// ===== Validation Helpers =====
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === 'string' && emailRegex.test(email) && email.length <= 254;
}

function isValidUsername(username) {
  const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
  return typeof username === 'string' && 
         usernameRegex.test(username) && 
         username.length >= 3 && 
         username.length <= 50;
}

function isStrongPassword(password) {
  if (typeof password !== 'string' || password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  // Check for common passwords
  const commonPasswords = ['password', '12345678', 'qwerty123', 'admin123'];
  if (commonPasswords.some(cp => password.toLowerCase().includes(cp))) {
    return { valid: false, message: 'Password is too common' };
  }
  return { valid: true };
}

function isValidId(id) {
  const numId = parseInt(id);
  return !isNaN(numId) && numId > 0 && numId < Number.MAX_SAFE_INTEGER;
}

function isValidDate(dateStr) {
  if (typeof dateStr !== 'string') return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}/.test(dateStr);
}

// ===== Password Reset Tokens =====
const passwordResetTokens = new Map();

function generatePasswordResetToken(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  passwordResetTokens.set(hashedToken, {
    userId,
    expires: Date.now() + 3600000 // 1 hour
  });
  
  return token; // Return unhashed token to send to user
}

function validatePasswordResetToken(token) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const record = passwordResetTokens.get(hashedToken);
  
  if (!record) return { valid: false, message: 'Invalid or expired token' };
  if (Date.now() > record.expires) {
    passwordResetTokens.delete(hashedToken);
    return { valid: false, message: 'Token has expired' };
  }
  
  return { valid: true, userId: record.userId };
}

function invalidatePasswordResetToken(token) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  passwordResetTokens.delete(hashedToken);
}

// Clean up expired password reset tokens
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of passwordResetTokens.entries()) {
    if (now > value.expires) {
      passwordResetTokens.delete(key);
    }
  }
}, 300000);

// ===== Session Invalidation =====
const invalidatedTokens = new Set(); // Blacklisted JWTs

function invalidateToken(token) {
  // Store token hash to save memory
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  invalidatedTokens.add(tokenHash);
  
  // Auto-cleanup after 24 hours (JWT expiry time)
  setTimeout(() => {
    invalidatedTokens.delete(tokenHash);
  }, 24 * 60 * 60 * 1000);
}

function isTokenInvalidated(token) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  return invalidatedTokens.has(tokenHash);
}

// ===== Audit Logging Helper =====
function createAuditLog(db, { userId, action, entityType, entityId, oldValues, newValues, ipAddress, userAgent }) {
  try {
    db.prepare(`
      INSERT INTO audit_log (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      action,
      entityType,
      entityId,
      oldValues ? JSON.stringify(oldValues) : null,
      newValues ? JSON.stringify(newValues) : null,
      ipAddress || null,
      userAgent || null
    );
  } catch (error) {
    console.error('Audit log error:', error);
  }
}

// ===== Security Headers Middleware =====
function securityHeaders(req, res, next) {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // XSS protection (legacy browsers)
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com",
    "font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self'",
    "frame-ancestors 'none'"
  ].join('; '));
  
  // Remove server identification
  res.removeHeader('X-Powered-By');
  
  next();
}

// ===== Request Sanitization Middleware =====
function sanitizeRequest(req, res, next) {
  // Sanitize body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  
  // Sanitize query params
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  
  // Sanitize params
  if (req.params && typeof req.params === 'object') {
    for (const [key, value] of Object.entries(req.params)) {
      if (typeof value === 'string') {
        req.params[key] = sanitizeInput(value, { maxLength: 100 });
      }
    }
  }
  
  next();
}

module.exports = {
  // CSRF
  generateCsrfToken,
  validateCsrfToken,
  
  // Account Lockout
  recordFailedLogin,
  isAccountLocked,
  clearLoginAttempts,
  LOCKOUT_CONFIG,
  
  // Sanitization
  sanitizeInput,
  sanitizeObject,
  sanitizeRequest,
  
  // Validation
  isValidEmail,
  isValidUsername,
  isStrongPassword,
  isValidId,
  isValidDate,
  
  // Password Reset
  generatePasswordResetToken,
  validatePasswordResetToken,
  invalidatePasswordResetToken,
  
  // Session Management
  invalidateToken,
  isTokenInvalidated,
  
  // Audit
  createAuditLog,
  
  // Middleware
  securityHeaders
};

