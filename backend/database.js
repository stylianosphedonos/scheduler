/**
 * Database Abstraction Layer
 * Supports both SQLite (sql.js) and PostgreSQL
 * 
 * Environment Variables:
 * - DATABASE_URL: PostgreSQL connection string (if set, uses PostgreSQL)
 * - DATABASE_PATH: SQLite file path (default: ./scheduler.db)
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATABASE_URL = process.env.DATABASE_URL;
const DATABASE_PATH = process.env.DATABASE_PATH || path.join(__dirname, '..', 'scheduler.db');

let db = null;
let dbType = DATABASE_URL ? 'postgres' : 'sqlite';

console.log(`Database type: ${dbType}`);

// ===== PostgreSQL Implementation =====
class PostgresDatabase {
  constructor(pool) {
    this.pool = pool;
  }

  prepare(sql) {
    const self = this;
    // Convert ? placeholders to $1, $2, etc. for PostgreSQL
    let paramIndex = 0;
    const pgSql = sql.replace(/\?/g, () => `$${++paramIndex}`);
    
    return {
      async run(...params) {
        try {
          const result = await self.pool.query(pgSql, params);
          return { 
            lastInsertRowid: result.rows[0]?.id || 0, 
            changes: result.rowCount 
          };
        } catch (e) {
          console.error('PG Run Error:', e.message, '\nSQL:', pgSql, '\nParams:', params);
          throw e;
        }
      },
      runSync(...params) {
        // Synchronous wrapper - not ideal but needed for compatibility
        return this.run(...params);
      },
      async get(...params) {
        try {
          const result = await self.pool.query(pgSql, params);
          return result.rows[0] || undefined;
        } catch (e) {
          console.error('PG Get Error:', e.message, '\nSQL:', pgSql, '\nParams:', params);
          throw e;
        }
      },
      getSync(...params) {
        return this.get(...params);
      },
      async all(...params) {
        try {
          const result = await self.pool.query(pgSql, params);
          return result.rows;
        } catch (e) {
          console.error('PG All Error:', e.message, '\nSQL:', pgSql, '\nParams:', params);
          throw e;
        }
      },
      allSync(...params) {
        return this.all(...params);
      }
    };
  }

  async exec(sql) {
    try {
      await this.pool.query(sql);
    } catch (e) {
      console.error('PG Exec Error:', e.message, '\nSQL:', sql);
      throw e;
    }
  }

  async query(sql, params = []) {
    const result = await this.pool.query(sql, params);
    return result.rows;
  }

  pragma(pragma) {
    // PostgreSQL doesn't use PRAGMA, ignore
  }

  async close() {
    await this.pool.end();
  }
}

// ===== SQLite Implementation =====
class SQLiteDatabase {
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
      fs.writeFileSync(DATABASE_PATH, buffer);
    } catch (e) {
      console.error('Database save error:', e);
    }
  }

  close() {
    this.save();
    this.sqlDb.close();
  }
}

// ===== Schema Definitions =====
// Using SQL that works for both SQLite and PostgreSQL where possible

function getSQLiteSchema() {
  return `
    -- Users table
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
    );

    -- People table
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
      employment_type TEXT DEFAULT 'full-time',
      start_date TEXT,
      is_active INTEGER DEFAULT 1,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Skills table
    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      category TEXT,
      description TEXT,
      color TEXT DEFAULT '#6366f1',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Person Skills junction table
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
    );

    -- Projects table
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE,
      client TEXT,
      description TEXT,
      status TEXT DEFAULT 'planning' CHECK(status IN ('planning', 'active', 'on-hold', 'completed', 'cancelled')),
      priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'critical')),
      color TEXT DEFAULT '#8b5cf6',
      start_date TEXT,
      end_date TEXT,
      budget_hours REAL,
      actual_hours REAL DEFAULT 0,
      manager_id INTEGER,
      is_billable INTEGER DEFAULT 1,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (manager_id) REFERENCES people(id) ON DELETE SET NULL
    );

    -- Project Required Skills junction table
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
    );

    -- Assignments table
    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      person_id INTEGER NOT NULL,
      project_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      start_hour INTEGER NOT NULL CHECK(start_hour BETWEEN 0 AND 23),
      end_hour INTEGER NOT NULL CHECK(end_hour BETWEEN 1 AND 24),
      status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'in-progress', 'completed', 'cancelled')),
      task_description TEXT,
      notes TEXT,
      created_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
      CHECK(end_hour > start_hour)
    );

    -- Availability Windows table
    CREATE TABLE IF NOT EXISTS availability_windows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      person_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('vacation', 'sick', 'personal', 'training', 'holiday', 'other')),
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      start_hour INTEGER DEFAULT 0,
      end_hour INTEGER DEFAULT 24,
      is_recurring INTEGER DEFAULT 0,
      recurrence_pattern TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
      approved_by INTEGER,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE,
      FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
    );

    -- Schedule Conflicts table
    CREATE TABLE IF NOT EXISTS schedule_conflicts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('overlap', 'overallocation', 'skill_gap', 'availability', 'max_hours', 'max_projects')),
      severity TEXT DEFAULT 'medium' CHECK(severity IN ('low', 'medium', 'high', 'critical')),
      person_id INTEGER,
      project_id INTEGER,
      assignment_id INTEGER,
      date TEXT,
      description TEXT NOT NULL,
      suggested_resolution TEXT,
      is_resolved INTEGER DEFAULT 0,
      resolved_by INTEGER,
      resolved_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
      FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
    );

    -- Export Log table
    CREATE TABLE IF NOT EXISTS export_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      export_type TEXT NOT NULL CHECK(export_type IN ('excel', 'pdf', 'csv')),
      file_name TEXT,
      parameters TEXT,
      record_count INTEGER,
      file_size INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Settings table
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      type TEXT DEFAULT 'string',
      description TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Audit Log table
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
    );

    CREATE TABLE IF NOT EXISTS export_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      filename TEXT NOT NULL,
      parameters TEXT,
      date_range_start TEXT,
      date_range_end TEXT,
      record_count INTEGER DEFAULT 0,
      file_size INTEGER,
      status TEXT DEFAULT 'completed',
      exported_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (exported_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS custom_translations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      language_code TEXT NOT NULL,
      translation_key TEXT NOT NULL,
      translation_value TEXT NOT NULL,
      created_by INTEGER,
      updated_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(language_code, translation_key),
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
    );
  `;
}

function getPostgresSchema() {
  return `
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(254) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) DEFAULT 'viewer' CHECK(role IN ('admin', 'manager', 'scheduler', 'viewer')),
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      avatar_url TEXT,
      is_active BOOLEAN DEFAULT true,
      last_login TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- People table
    CREATE TABLE IF NOT EXISTS people (
      id SERIAL PRIMARY KEY,
      employee_id VARCHAR(50) UNIQUE,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      email VARCHAR(254) UNIQUE NOT NULL,
      phone VARCHAR(20),
      department VARCHAR(100),
      job_title VARCHAR(100),
      avatar_url TEXT,
      max_hours_per_day INTEGER DEFAULT 8,
      max_projects_per_day INTEGER DEFAULT 3,
      hourly_rate DECIMAL(10,2),
      employment_type VARCHAR(20) DEFAULT 'full-time',
      start_date DATE,
      is_active BOOLEAN DEFAULT true,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Skills table
    CREATE TABLE IF NOT EXISTS skills (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL,
      category VARCHAR(50),
      description TEXT,
      color VARCHAR(7) DEFAULT '#6366f1',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Person Skills junction table
    CREATE TABLE IF NOT EXISTS person_skills (
      id SERIAL PRIMARY KEY,
      person_id INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
      skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
      proficiency_level INTEGER DEFAULT 3 CHECK(proficiency_level BETWEEN 1 AND 5),
      years_experience DECIMAL(4,1),
      certified BOOLEAN DEFAULT false,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(person_id, skill_id)
    );

    -- Projects table
    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      code VARCHAR(50) UNIQUE,
      client VARCHAR(200),
      description TEXT,
      status VARCHAR(20) DEFAULT 'planning' CHECK(status IN ('planning', 'active', 'on-hold', 'completed', 'cancelled')),
      priority VARCHAR(20) DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'critical')),
      color VARCHAR(7) DEFAULT '#8b5cf6',
      start_date DATE,
      end_date DATE,
      budget_hours DECIMAL(10,2),
      actual_hours DECIMAL(10,2) DEFAULT 0,
      manager_id INTEGER REFERENCES people(id) ON DELETE SET NULL,
      is_billable BOOLEAN DEFAULT true,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Project Required Skills junction table
    CREATE TABLE IF NOT EXISTS project_skills (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
      required_proficiency INTEGER DEFAULT 3 CHECK(required_proficiency BETWEEN 1 AND 5),
      is_mandatory BOOLEAN DEFAULT true,
      people_needed INTEGER DEFAULT 1,
      hours_needed DECIMAL(10,2),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(project_id, skill_id)
    );

    -- Assignments table
    CREATE TABLE IF NOT EXISTS assignments (
      id SERIAL PRIMARY KEY,
      person_id INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      start_hour INTEGER NOT NULL CHECK(start_hour BETWEEN 0 AND 23),
      end_hour INTEGER NOT NULL CHECK(end_hour BETWEEN 1 AND 24),
      status VARCHAR(20) DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'in-progress', 'completed', 'cancelled')),
      task_description TEXT,
      notes TEXT,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CHECK(end_hour > start_hour)
    );

    -- Availability Windows table
    CREATE TABLE IF NOT EXISTS availability_windows (
      id SERIAL PRIMARY KEY,
      person_id INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
      type VARCHAR(20) NOT NULL CHECK(type IN ('vacation', 'sick', 'personal', 'training', 'holiday', 'other')),
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      start_hour INTEGER DEFAULT 0,
      end_hour INTEGER DEFAULT 24,
      is_recurring BOOLEAN DEFAULT false,
      recurrence_pattern TEXT,
      status VARCHAR(20) DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
      approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Schedule Conflicts table
    CREATE TABLE IF NOT EXISTS schedule_conflicts (
      id SERIAL PRIMARY KEY,
      type VARCHAR(20) NOT NULL CHECK(type IN ('overlap', 'overallocation', 'skill_gap', 'availability', 'max_hours', 'max_projects')),
      severity VARCHAR(20) DEFAULT 'medium' CHECK(severity IN ('low', 'medium', 'high', 'critical')),
      person_id INTEGER REFERENCES people(id) ON DELETE CASCADE,
      project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
      date DATE,
      description TEXT NOT NULL,
      suggested_resolution TEXT,
      is_resolved BOOLEAN DEFAULT false,
      resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      resolved_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Export Log table
    CREATE TABLE IF NOT EXISTS export_log (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      export_type VARCHAR(10) NOT NULL CHECK(export_type IN ('excel', 'pdf', 'csv')),
      file_name VARCHAR(255),
      parameters JSONB,
      record_count INTEGER,
      file_size INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Settings table
    CREATE TABLE IF NOT EXISTS settings (
      key VARCHAR(100) PRIMARY KEY,
      value TEXT,
      type VARCHAR(20) DEFAULT 'string',
      description TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Audit Log table
    CREATE TABLE IF NOT EXISTS audit_log (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      action VARCHAR(50) NOT NULL,
      entity_type VARCHAR(50) NOT NULL,
      entity_id INTEGER,
      old_values JSONB,
      new_values JSONB,
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Export Logs table
    CREATE TABLE IF NOT EXISTS export_logs (
      id SERIAL PRIMARY KEY,
      type VARCHAR(20) NOT NULL,
      filename VARCHAR(255) NOT NULL,
      parameters JSONB,
      date_range_start DATE,
      date_range_end DATE,
      record_count INTEGER DEFAULT 0,
      file_size INTEGER,
      status VARCHAR(20) DEFAULT 'completed',
      exported_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Custom Translations table
    CREATE TABLE IF NOT EXISTS custom_translations (
      id SERIAL PRIMARY KEY,
      language_code VARCHAR(10) NOT NULL,
      translation_key VARCHAR(255) NOT NULL,
      translation_value TEXT NOT NULL,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(language_code, translation_key)
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_assignments_date ON assignments(date);
    CREATE INDEX IF NOT EXISTS idx_assignments_person ON assignments(person_id);
    CREATE INDEX IF NOT EXISTS idx_assignments_project ON assignments(project_id);
    CREATE INDEX IF NOT EXISTS idx_people_department ON people(department);
    CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
    CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
  `;
}

// ===== Database Initialization =====
async function initializeDatabase() {
  if (dbType === 'postgres') {
    return initializePostgres();
  } else {
    return initializeSQLite();
  }
}

async function initializePostgres() {
  const { Pool } = require('pg');
  
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  // Test connection
  try {
    const client = await pool.connect();
    console.log('Connected to PostgreSQL');
    client.release();
  } catch (err) {
    console.error('PostgreSQL connection error:', err);
    throw err;
  }

  db = new PostgresDatabase(pool);

  // Create schema
  const schema = getPostgresSchema();
  const statements = schema.split(';').filter(s => s.trim());
  
  for (const stmt of statements) {
    if (stmt.trim()) {
      try {
        await pool.query(stmt);
      } catch (e) {
        // Ignore errors for existing objects
        if (!e.message.includes('already exists')) {
          console.error('Schema error:', e.message);
        }
      }
    }
  }

  // Seed default data
  await seedDefaultData(db, true);

  console.log('PostgreSQL database initialized');
  return db;
}

async function initializeSQLite() {
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs();

  let sqlDb;
  
  // Try to load existing database
  try {
    if (fs.existsSync(DATABASE_PATH)) {
      const buffer = fs.readFileSync(DATABASE_PATH);
      sqlDb = new SQL.Database(buffer);
      console.log('Loaded existing SQLite database');
    } else {
      sqlDb = new SQL.Database();
      console.log('Created new SQLite database');
    }
  } catch (e) {
    console.error('Error loading database, creating new one:', e);
    sqlDb = new SQL.Database();
  }

  db = new SQLiteDatabase(sqlDb);

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Create schema
  const schema = getSQLiteSchema();
  const statements = schema.split(';').filter(s => s.trim());
  
  for (const stmt of statements) {
    if (stmt.trim()) {
      try {
        db.exec(stmt);
      } catch (e) {
        // Ignore errors for existing objects
        if (!e.message.includes('already exists')) {
          console.error('Schema error:', e.message);
        }
      }
    }
  }

  // Create indexes
  try {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_assignments_date ON assignments(date)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_assignments_person ON assignments(person_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_assignments_project ON assignments(project_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_people_department ON people(department)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)`);
  } catch (e) {
    // Indexes might already exist
  }

  // Seed default data
  await seedDefaultData(db, false);

  console.log('SQLite database initialized');
  return db;
}

async function seedDefaultData(database, isPostgres) {
  // Default users
  const defaultUsers = [
    { username: 'admin', email: 'admin@scheduler.local', password: 'admin123', role: 'admin', firstName: 'System', lastName: 'Administrator' },
    { username: 'scheduler', email: 'scheduler@scheduler.local', password: 'scheduler123', role: 'scheduler', firstName: 'Resource', lastName: 'Scheduler' },
    { username: 'viewer', email: 'viewer@scheduler.local', password: 'viewer123', role: 'viewer', firstName: 'Read', lastName: 'Only' }
  ];

  for (const user of defaultUsers) {
    const existingQuery = isPostgres 
      ? 'SELECT id FROM users WHERE username = $1'
      : 'SELECT id FROM users WHERE username = ?';
    
    const existing = isPostgres 
      ? await database.pool.query(existingQuery, [user.username])
      : database.prepare(existingQuery).get(user.username);
    
    const exists = isPostgres ? existing.rows.length > 0 : existing;
    
    if (!exists) {
      const passwordHash = bcrypt.hashSync(user.password, 12);
      
      if (isPostgres) {
        await database.pool.query(
          `INSERT INTO users (username, email, password_hash, role, first_name, last_name) VALUES ($1, $2, $3, $4, $5, $6)`,
          [user.username, user.email, passwordHash, user.role, user.firstName, user.lastName]
        );
      } else {
        database.prepare(
          `INSERT INTO users (username, email, password_hash, role, first_name, last_name) VALUES (?, ?, ?, ?, ?, ?)`
        ).run(user.username, user.email, passwordHash, user.role, user.firstName, user.lastName);
      }
      console.log(`Created default ${user.role} user: ${user.username}`);
    }
  }

  // Default settings
  const defaultSettings = [
    ['company_name', 'Resource Scheduler', 'string', 'Company name displayed in sidebar and exports'],
    ['logo_url', '', 'string', 'URL to company logo image'],
    ['logo_icon', 'fa-calendar-check', 'string', 'FontAwesome icon class for logo'],
    ['primary_color', '#6366f1', 'string', 'Primary accent color'],
    ['footer_text', '© 2026 Resource Scheduler. All rights reserved.', 'string', 'Footer text for exports'],
    ['support_email', '', 'string', 'Support contact email'],
    ['work_hours_start', '9', 'number', 'Default work day start hour'],
    ['work_hours_end', '18', 'number', 'Default work day end hour'],
    ['default_max_hours_per_day', '8', 'number', 'Default maximum hours per person per day'],
    ['default_max_projects_per_day', '3', 'number', 'Default maximum projects per person per day'],
    ['allow_overtime', '0', 'boolean', 'Allow assignments beyond max hours'],
    ['auto_detect_conflicts', '1', 'boolean', 'Automatically detect scheduling conflicts'],
    ['skill_match_threshold', '0.7', 'number', 'Minimum skill match score (0-1)']
  ];

  for (const [key, value, type, description] of defaultSettings) {
    const existingQuery = isPostgres 
      ? 'SELECT key FROM settings WHERE key = $1'
      : 'SELECT key FROM settings WHERE key = ?';
    
    const existing = isPostgres 
      ? await database.pool.query(existingQuery, [key])
      : database.prepare(existingQuery).get(key);
    
    const exists = isPostgres ? existing.rows.length > 0 : existing;
    
    if (!exists) {
      if (isPostgres) {
        await database.pool.query(
          `INSERT INTO settings (key, value, type, description) VALUES ($1, $2, $3, $4)`,
          [key, value, type, description]
        );
      } else {
        database.prepare(
          `INSERT INTO settings (key, value, type, description) VALUES (?, ?, ?, ?)`
        ).run(key, value, type, description);
      }
    }
  }
}

// ===== Exports =====
let dbPromise = null;

async function getDatabase() {
  if (db) return db;
  if (dbPromise) return dbPromise;
  
  dbPromise = initializeDatabase();
  db = await dbPromise;
  return db;
}

function getDatabaseType() {
  return dbType;
}

// Helper function to get the correct boolean value for SQL queries
function getBooleanValue(value) {
  if (dbType === 'postgres') {
    return value ? 'true' : 'false';
  }
  return value ? '1' : '0';
}

// Helper function to get the correct boolean condition for SQL queries
function getBooleanCondition(column, value) {
  if (dbType === 'postgres') {
    return `${column} = ${value ? 'true' : 'false'}`;
  }
  return `${column} = ${value ? '1' : '0'}`;
}

module.exports = {
  getDatabase,
  getDatabaseType,
  getBooleanValue,
  getBooleanCondition
};
