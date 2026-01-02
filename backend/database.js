const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'scheduler.db');

let db = null;
let SQL = null;

// Wrapper to make sql.js look like better-sqlite3 API
class Database {
  constructor(sqlDb) {
    this.sqlDb = sqlDb;
  }

  prepare(sql) {
    const self = this;
    return {
      run(...params) {
        try {
          self.sqlDb.run(sql, params);
          const result = self.sqlDb.exec("SELECT last_insert_rowid() as id, changes() as changes");
          const lastId = result.length > 0 ? result[0].values[0][0] : 0;
          const changes = result.length > 0 ? result[0].values[0][1] : 0;
          self.save();
          return { lastInsertRowid: lastId, changes };
        } catch (e) {
          console.error('SQL Run Error:', e.message, '\nSQL:', sql, '\nParams:', params);
          throw e;
        }
      },
      get(...params) {
        try {
          const stmt = self.sqlDb.prepare(sql);
          stmt.bind(params);
          if (stmt.step()) {
            const row = stmt.getAsObject();
            stmt.free();
            return row;
          }
          stmt.free();
          return undefined;
        } catch (e) {
          console.error('SQL Get Error:', e.message, '\nSQL:', sql, '\nParams:', params);
          throw e;
        }
      },
      all(...params) {
        try {
          const results = [];
          const stmt = self.sqlDb.prepare(sql);
          stmt.bind(params);
          while (stmt.step()) {
            results.push(stmt.getAsObject());
          }
          stmt.free();
          return results;
        } catch (e) {
          console.error('SQL All Error:', e.message, '\nSQL:', sql, '\nParams:', params);
          throw e;
        }
      }
    };
  }

  exec(sql) {
    try {
      this.sqlDb.run(sql);
      this.save();
    } catch (e) {
      console.error('SQL Exec Error:', e.message, '\nSQL:', sql);
      throw e;
    }
  }

  pragma(pragma) {
    try {
      this.sqlDb.run(`PRAGMA ${pragma}`);
    } catch (e) {
      // Ignore pragma errors
    }
  }

  save() {
    try {
      const data = this.sqlDb.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(dbPath, buffer);
    } catch (e) {
      console.error('Database save error:', e);
    }
  }

  close() {
    this.save();
    this.sqlDb.close();
  }
}

async function initializeDatabase() {
  SQL = await initSqlJs();

  // Load existing database or create new one
  let sqlDb;
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    sqlDb = new SQL.Database(fileBuffer);
  } else {
    sqlDb = new SQL.Database();
  }

  db = new Database(sqlDb);

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Users table (RBAC)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'viewer' CHECK(role IN ('admin', 'manager', 'scheduler', 'viewer')),
      first_name TEXT,
      last_name TEXT,
      avatar_url TEXT,
      is_active INTEGER DEFAULT 1,
      last_login TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Skills table
  db.exec(`
    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      category TEXT,
      description TEXT,
      color TEXT DEFAULT '#6366f1',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // People (Employees) table
  db.exec(`
    CREATE TABLE IF NOT EXISTS people (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id TEXT UNIQUE,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      department TEXT,
      job_title TEXT,
      avatar_url TEXT,
      max_hours_per_day INTEGER DEFAULT 8,
      max_projects_per_day INTEGER DEFAULT 3,
      hourly_rate REAL,
      employment_type TEXT DEFAULT 'full-time' CHECK(employment_type IN ('full-time', 'part-time', 'contractor', 'intern')),
      start_date TEXT,
      is_active INTEGER DEFAULT 1,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Person Skills junction table (with proficiency)
  db.exec(`
    CREATE TABLE IF NOT EXISTS person_skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      person_id INTEGER NOT NULL,
      skill_id INTEGER NOT NULL,
      proficiency_level INTEGER DEFAULT 3 CHECK(proficiency_level BETWEEN 1 AND 5),
      years_experience REAL,
      certified INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE,
      FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
      UNIQUE(person_id, skill_id)
    )
  `);

  // Projects table
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE,
      client TEXT,
      description TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('planning', 'active', 'on-hold', 'completed', 'cancelled')),
      priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'critical')),
      color TEXT DEFAULT '#8b5cf6',
      start_date TEXT,
      end_date TEXT,
      budget_hours REAL,
      manager_id INTEGER,
      is_billable INTEGER DEFAULT 1,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (manager_id) REFERENCES people(id) ON DELETE SET NULL
    )
  `);

  // Project Required Skills junction table
  db.exec(`
    CREATE TABLE IF NOT EXISTS project_skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      skill_id INTEGER NOT NULL,
      required_proficiency INTEGER DEFAULT 3 CHECK(required_proficiency BETWEEN 1 AND 5),
      is_mandatory INTEGER DEFAULT 1,
      people_needed INTEGER DEFAULT 1,
      hours_needed REAL,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
      UNIQUE(project_id, skill_id)
    )
  `);

  // Add people_needed column if it doesn't exist (migration for existing DBs)
  try {
    db.exec(`ALTER TABLE project_skills ADD COLUMN people_needed INTEGER DEFAULT 1`);
  } catch (e) {
    // Column already exists
  }

  // Assignments table (Core scheduling unit - hourly slots)
  db.exec(`
    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      person_id INTEGER NOT NULL,
      project_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      start_hour INTEGER NOT NULL CHECK(start_hour BETWEEN 0 AND 23),
      end_hour INTEGER NOT NULL CHECK(end_hour BETWEEN 1 AND 24),
      status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled')),
      task_description TEXT,
      location TEXT,
      is_remote INTEGER DEFAULT 0,
      notes TEXT,
      created_by INTEGER,
      approved_by INTEGER,
      approved_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
      CHECK(end_hour > start_hour)
    )
  `);

  // Availability Windows (Time-off, vacation, blocking)
  db.exec(`
    CREATE TABLE IF NOT EXISTS availability_windows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      person_id INTEGER NOT NULL,
      type TEXT DEFAULT 'time-off' CHECK(type IN ('vacation', 'sick', 'time-off', 'training', 'holiday', 'blocked', 'preferred')),
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      start_hour INTEGER DEFAULT 0,
      end_hour INTEGER DEFAULT 24,
      is_recurring INTEGER DEFAULT 0,
      recurrence_pattern TEXT,
      status TEXT DEFAULT 'approved' CHECK(status IN ('pending', 'approved', 'rejected')),
      reason TEXT,
      approved_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE,
      FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Schedule Conflicts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS schedule_conflicts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('overlap', 'overallocation', 'skill_gap', 'availability', 'max_hours', 'max_projects')),
      severity TEXT DEFAULT 'warning' CHECK(severity IN ('info', 'warning', 'error', 'critical')),
      date TEXT NOT NULL,
      person_id INTEGER,
      assignment_id INTEGER,
      project_id INTEGER,
      description TEXT NOT NULL,
      suggested_resolution TEXT,
      is_resolved INTEGER DEFAULT 0,
      resolved_by INTEGER,
      resolved_at TEXT,
      resolution_notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE,
      FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Export Logs (Audit trail)
  db.exec(`
    CREATE TABLE IF NOT EXISTS export_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('excel', 'pdf', 'csv', 'json')),
      filename TEXT NOT NULL,
      parameters TEXT,
      date_range_start TEXT,
      date_range_end TEXT,
      record_count INTEGER,
      file_size INTEGER,
      exported_by INTEGER,
      status TEXT DEFAULT 'completed' CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
      error_message TEXT,
      download_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (exported_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Audit Log for all changes
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER,
      old_values TEXT,
      new_values TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      type TEXT DEFAULT 'string',
      description TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes for performance
  try {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_assignments_date ON assignments(date)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_assignments_person ON assignments(person_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_assignments_project ON assignments(project_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_availability_person ON availability_windows(person_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_conflicts_date ON schedule_conflicts(date)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_conflicts_resolved ON schedule_conflicts(is_resolved)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_people_active ON people(is_active)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)`);
  } catch (e) {
    // Indexes might already exist
  }

  // Insert default users if they don't exist
  const defaultUsers = [
    { username: 'admin', email: 'admin@scheduler.local', password: 'admin123', role: 'admin', firstName: 'System', lastName: 'Administrator' },
    { username: 'scheduler', email: 'scheduler@scheduler.local', password: 'scheduler123', role: 'scheduler', firstName: 'Resource', lastName: 'Scheduler' },
    { username: 'viewer', email: 'viewer@scheduler.local', password: 'viewer123', role: 'viewer', firstName: 'Read', lastName: 'Only' }
  ];

  for (const user of defaultUsers) {
    const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(user.username);
    if (!exists) {
      const passwordHash = bcrypt.hashSync(user.password, 10);
      db.prepare(`
        INSERT INTO users (username, email, password_hash, role, first_name, last_name)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(user.username, user.email, passwordHash, user.role, user.firstName, user.lastName);
      console.log(`Created default ${user.role} user: ${user.username}`);
    }
  }

  // Insert default settings
  const defaultSettings = [
    // Branding
    ['company_name', 'Resource Scheduler', 'string', 'Company name displayed in sidebar and exports'],
    ['logo_url', '', 'string', 'URL to company logo image'],
    ['logo_icon', 'fa-calendar-check', 'string', 'FontAwesome icon class for logo'],
    ['primary_color', '#6366f1', 'string', 'Primary accent color'],
    ['footer_text', '© 2026 Resource Scheduler. All rights reserved.', 'string', 'Footer text for exports'],
    ['support_email', '', 'string', 'Support contact email'],
    // System
    ['work_hours_start', '9', 'number', 'Default work day start hour'],
    ['work_hours_end', '18', 'number', 'Default work day end hour'],
    ['default_max_hours_per_day', '8', 'number', 'Default maximum hours per person per day'],
    ['default_max_projects_per_day', '3', 'number', 'Default maximum projects per person per day'],
    ['timezone', 'UTC', 'string', 'System timezone'],
    ['date_format', 'YYYY-MM-DD', 'string', 'Date display format'],
    ['allow_overtime', '0', 'boolean', 'Allow assignments beyond max hours'],
    ['auto_detect_conflicts', '1', 'boolean', 'Automatically detect scheduling conflicts'],
    ['skill_match_threshold', '0.7', 'number', 'Minimum skill match score (0-1)']
  ];

  for (const [key, value, type, description] of defaultSettings) {
    const exists = db.prepare('SELECT key FROM settings WHERE key = ?').get(key);
    if (!exists) {
      db.prepare(`INSERT INTO settings (key, value, type, description) VALUES (?, ?, ?, ?)`).run(key, value, type, description);
    }
  }

  console.log('Database initialized successfully');
  return db;
}

// Export a promise that resolves to the database
let dbPromise = null;

function getDatabase() {
  if (!dbPromise) {
    dbPromise = initializeDatabase();
  }
  return dbPromise;
}

module.exports = { getDatabase };
