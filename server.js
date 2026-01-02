require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Log environment
console.log(`Environment: ${NODE_ENV}`);

// ===== Rate Limiting =====
const rateLimitStore = new Map();

function rateLimit(windowMs, maxRequests, keyGenerator = null) {
  return (req, res, next) => {
    const key = keyGenerator ? keyGenerator(req) : (req.ip + ':' + req.path);
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, []);
    }
    
    const requests = rateLimitStore.get(key).filter(time => time > windowStart);
    requests.push(now);
    rateLimitStore.set(key, requests);
    
    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - requests.length));
    res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());
    
    if (requests.length > maxRequests) {
      return res.status(429).json({ 
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    next();
  };
}

// Clean up rate limit store periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, times] of rateLimitStore.entries()) {
    const filtered = times.filter(t => t > now - 60000);
    if (filtered.length === 0) {
      rateLimitStore.delete(key);
    } else {
      rateLimitStore.set(key, filtered);
    }
  }
}, 60000);

// ===== Security Headers =====
app.use((req, res, next) => {
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
  
  // Strict Transport Security (when behind HTTPS)
  if (NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
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
});

// ===== CORS Configuration =====
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
      : null;
    
    if (!allowedOrigins || allowedOrigins.includes(origin) || NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 600 // Cache preflight for 10 minutes
};
app.use(cors(corsOptions));

// ===== Body Parser with Limits =====
app.use(express.json({ 
  limit: '1mb',
  verify: (req, res, buf) => {
    // Store raw body for signature verification if needed
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ===== Rate Limiting Rules =====
// Strict limits for authentication endpoints
app.use('/api/auth/login', rateLimit(60000, 5, req => req.ip + ':login'));
app.use('/api/auth/register', rateLimit(3600000, 3, req => req.ip + ':register'));
app.use('/api/auth/forgot-password', rateLimit(3600000, 3, req => req.ip + ':forgot'));
app.use('/api/auth/reset-password', rateLimit(3600000, 5, req => req.ip + ':reset'));

// General API rate limit
app.use('/api/', rateLimit(60000, 100));

// Serve static files
app.use(express.static(path.join(__dirname, 'frontend')));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api/')) {
      console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Initialize database and then routes
async function startServer() {
  try {
    // Initialize database
    const { getDatabase } = require('./backend/database');
    const db = await getDatabase();
    
    // Make db available to routes
    app.locals.db = db;

    // Import routes (after db is ready)
    const authRoutes = require('./backend/routes/auth');
    const usersRoutes = require('./backend/routes/users');
    const peopleRoutes = require('./backend/routes/people');
    const skillsRoutes = require('./backend/routes/skills');
    const projectsRoutes = require('./backend/routes/projects');
    const assignmentsRoutes = require('./backend/routes/assignments');
    const availabilityRoutes = require('./backend/routes/availability');
    const conflictsRoutes = require('./backend/routes/conflicts');
    const matchingRoutes = require('./backend/routes/matching');
    const analyticsRoutes = require('./backend/routes/analytics');
    const exportsRoutes = require('./backend/routes/exports');
    const aiSchedulerRoutes = require('./backend/routes/ai-scheduler');
    const importRoutes = require('./backend/routes/import');

    // API Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/users', usersRoutes);
    app.use('/api/people', peopleRoutes);
    app.use('/api/skills', skillsRoutes);
    app.use('/api/projects', projectsRoutes);
    app.use('/api/assignments', assignmentsRoutes);
    app.use('/api/availability', availabilityRoutes);
    app.use('/api/conflicts', conflictsRoutes);
    app.use('/api/matching', matchingRoutes);
    app.use('/api/analytics', analyticsRoutes);
    app.use('/api/exports', exportsRoutes);
    app.use('/api/ai-scheduler', aiSchedulerRoutes);
    app.use('/api/import', importRoutes);

    // Settings endpoints - with authentication
    const { authenticateToken, requireRole } = require('./backend/middleware/auth');
    
    app.get('/api/settings', authenticateToken, (req, res) => {
      try {
        const settings = db.prepare('SELECT key, value, type FROM settings').all();
        const settingsObj = {};
        for (const s of settings) {
          if (s.type === 'number') {
            settingsObj[s.key] = parseFloat(s.value);
          } else if (s.type === 'boolean') {
            settingsObj[s.key] = s.value === '1' || s.value === 'true';
          } else {
            settingsObj[s.key] = s.value;
          }
        }
        res.json(settingsObj);
      } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ error: 'Failed to get settings' });
      }
    });

    // Only admin can update settings
    app.put('/api/settings', authenticateToken, requireRole('admin'), (req, res) => {
      try {
        const { key, value } = req.body;
        
        // Whitelist allowed setting keys to prevent arbitrary setting injection
        const allowedKeys = [
          'company_name', 'logo_url', 'logo_icon', 'primary_color', 'footer_text', 'support_email',
          'work_hours_start', 'work_hours_end', 'default_max_hours_per_day', 'default_max_projects_per_day',
          'allow_overtime', 'auto_detect_conflicts'
        ];
        
        if (!allowedKeys.includes(key)) {
          return res.status(400).json({ error: 'Invalid setting key' });
        }
        
        db.prepare('UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?').run(String(value), key);
        res.json({ message: 'Setting updated' });
      } catch (error) {
        console.error('Update setting error:', error);
        res.status(500).json({ error: 'Failed to update setting' });
      }
    });

    // Health check
    app.get('/api/health', (req, res) => {
      try {
        db.prepare('SELECT 1').get();
        res.json({ 
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        });
      } catch (error) {
        res.status(500).json({ status: 'unhealthy', error: error.message });
      }
    });

    // Serve frontend for all other routes
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
    });

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error('Unhandled error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });

    // Start server
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🗓️  Resource Scheduler v1.0.0                          ║
║                                                           ║
║   Server running on http://localhost:${PORT}                ║
║   Environment: ${NODE_ENV.padEnd(41)}║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
