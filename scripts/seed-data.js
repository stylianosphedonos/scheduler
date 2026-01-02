/**
 * Seed script to populate the database with sample data
 * Run with: node scripts/seed-data.js
 */

const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Sample data
const skills = [
  { name: 'JavaScript', category: 'Programming', color: '#f7df1e' },
  { name: 'TypeScript', category: 'Programming', color: '#3178c6' },
  { name: 'Python', category: 'Programming', color: '#3776ab' },
  { name: 'React', category: 'Frontend', color: '#61dafb' },
  { name: 'Node.js', category: 'Backend', color: '#339933' },
  { name: 'SQL', category: 'Database', color: '#336791' },
  { name: 'AWS', category: 'Cloud', color: '#ff9900' },
  { name: 'Docker', category: 'DevOps', color: '#2496ed' },
  { name: 'Project Management', category: 'Management', color: '#6366f1' },
  { name: 'UI/UX Design', category: 'Design', color: '#ff69b4' },
  { name: 'Agile/Scrum', category: 'Methodology', color: '#10b981' },
  { name: 'Git', category: 'Tools', color: '#f05032' },
  { name: 'Communication', category: 'Soft Skills', color: '#8b5cf6' },
  { name: 'Leadership', category: 'Soft Skills', color: '#f59e0b' },
  { name: 'Java', category: 'Programming', color: '#007396' }
];

const people = [
  { firstName: 'Alice', lastName: 'Johnson', email: 'alice@company.com', department: 'Engineering', jobTitle: 'Senior Developer', maxHours: 8 },
  { firstName: 'Bob', lastName: 'Smith', email: 'bob@company.com', department: 'Engineering', jobTitle: 'Full Stack Developer', maxHours: 8 },
  { firstName: 'Carol', lastName: 'Williams', email: 'carol@company.com', department: 'Design', jobTitle: 'UX Designer', maxHours: 8 },
  { firstName: 'David', lastName: 'Brown', email: 'david@company.com', department: 'Engineering', jobTitle: 'Backend Developer', maxHours: 8 },
  { firstName: 'Emma', lastName: 'Davis', email: 'emma@company.com', department: 'Management', jobTitle: 'Project Manager', maxHours: 8 },
  { firstName: 'Frank', lastName: 'Miller', email: 'frank@company.com', department: 'Engineering', jobTitle: 'DevOps Engineer', maxHours: 8 },
  { firstName: 'Grace', lastName: 'Wilson', email: 'grace@company.com', department: 'Engineering', jobTitle: 'Frontend Developer', maxHours: 8 },
  { firstName: 'Henry', lastName: 'Moore', email: 'henry@company.com', department: 'QA', jobTitle: 'QA Engineer', maxHours: 8 },
  { firstName: 'Ivy', lastName: 'Taylor', email: 'ivy@company.com', department: 'Design', jobTitle: 'UI Designer', maxHours: 6 },
  { firstName: 'Jack', lastName: 'Anderson', email: 'jack@company.com', department: 'Engineering', jobTitle: 'Junior Developer', maxHours: 8 }
];

const projects = [
  { name: 'E-Commerce Platform', code: 'ECOM-001', client: 'RetailCorp', status: 'active', priority: 'high', color: '#6366f1', budgetHours: 500 },
  { name: 'Mobile App Redesign', code: 'MOB-002', client: 'TechStartup', status: 'active', priority: 'medium', color: '#10b981', budgetHours: 300 },
  { name: 'API Integration', code: 'API-003', client: 'FinanceInc', status: 'active', priority: 'critical', color: '#ef4444', budgetHours: 200 },
  { name: 'Dashboard Analytics', code: 'DASH-004', client: 'DataCo', status: 'planning', priority: 'medium', color: '#f59e0b', budgetHours: 150 },
  { name: 'Infrastructure Migration', code: 'INF-005', client: 'Internal', status: 'active', priority: 'high', color: '#8b5cf6', budgetHours: 400 },
  { name: 'Security Audit', code: 'SEC-006', client: 'BankSecure', status: 'planning', priority: 'critical', color: '#ec4899', budgetHours: 100 }
];

const tasks = [
  'Sprint planning meeting',
  'Code review session',
  'Feature development',
  'Bug fixing',
  'Documentation',
  'Client meeting',
  'Technical research',
  'Testing and QA',
  'Deployment preparation',
  'Architecture design'
];

async function seedDatabase() {
  console.log('🌱 Seeding database with sample data...\n');
  
  // Initialize sql.js
  const SQL = await initSqlJs();
  
  // Check if database file exists
  const dbPath = path.join(__dirname, '..', 'scheduler.db');
  let db;
  
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
    console.log('📂 Opened existing database');
  } else {
    console.log('❌ Database file not found. Please run the server first to create the database.');
    process.exit(1);
  }
  
  try {
    // Create the three user roles
    console.log('Creating users with different roles...');
    
    const adminHash = bcrypt.hashSync('admin123', 10);
    const schedulerHash = bcrypt.hashSync('scheduler123', 10);
    const viewerHash = bcrypt.hashSync('viewer123', 10);
    
    // Admin user
    db.run(`
      INSERT OR IGNORE INTO users (username, email, password_hash, role, first_name, last_name)
      VALUES (?, ?, ?, ?, ?, ?)
    `, ['admin', 'admin@scheduler.local', adminHash, 'admin', 'System', 'Administrator']);
    
    // Scheduler user
    db.run(`
      INSERT OR IGNORE INTO users (username, email, password_hash, role, first_name, last_name)
      VALUES (?, ?, ?, ?, ?, ?)
    `, ['scheduler', 'scheduler@scheduler.local', schedulerHash, 'scheduler', 'Resource', 'Scheduler']);
    
    // Viewer user
    db.run(`
      INSERT OR IGNORE INTO users (username, email, password_hash, role, first_name, last_name)
      VALUES (?, ?, ?, ?, ?, ?)
    `, ['viewer', 'viewer@scheduler.local', viewerHash, 'viewer', 'Read', 'Only']);
    
    console.log('✓ Created 3 users (admin, scheduler, viewer)');
    
    // Insert skills
    console.log('Adding skills...');
    for (const skill of skills) {
      db.run(`
        INSERT OR IGNORE INTO skills (name, category, color, description)
        VALUES (?, ?, ?, ?)
      `, [skill.name, skill.category, skill.color, `${skill.name} expertise`]);
    }
    console.log(`✓ Added ${skills.length} skills`);
    
    // Insert people
    console.log('Adding people...');
    for (const person of people) {
      db.run(`
        INSERT OR IGNORE INTO people (first_name, last_name, email, department, job_title, max_hours_per_day, employment_type)
        VALUES (?, ?, ?, ?, ?, ?, 'full-time')
      `, [person.firstName, person.lastName, person.email, person.department, person.jobTitle, person.maxHours]);
    }
    console.log(`✓ Added ${people.length} people`);
    
    // Get all people and skills
    const allPeople = db.exec('SELECT id FROM people');
    const allSkills = db.exec('SELECT id FROM skills');
    
    if (allPeople[0] && allSkills[0]) {
      const peopleIds = allPeople[0].values.map(row => row[0]);
      const skillIds = allSkills[0].values.map(row => row[0]);
      
      // Assign skills to people
      console.log('Assigning skills to people...');
      for (const personId of peopleIds) {
        const numSkills = 3 + Math.floor(Math.random() * 4);
        const shuffledSkills = [...skillIds].sort(() => Math.random() - 0.5).slice(0, numSkills);
        
        for (const skillId of shuffledSkills) {
          const proficiency = 2 + Math.floor(Math.random() * 4);
          const years = 1 + Math.floor(Math.random() * 8);
          try {
            db.run(`
              INSERT OR IGNORE INTO person_skills (person_id, skill_id, proficiency_level, years_experience)
              VALUES (?, ?, ?, ?)
            `, [personId, skillId, proficiency, years]);
          } catch (e) {}
        }
      }
      console.log('✓ Assigned skills to people');
    }
    
    // Insert projects
    console.log('Adding projects...');
    for (const project of projects) {
      db.run(`
        INSERT OR IGNORE INTO projects (name, code, client, status, priority, color, budget_hours, start_date, end_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, date('now'), date('now', '+90 days'))
      `, [project.name, project.code, project.client, project.status, project.priority, project.color, project.budgetHours]);
    }
    console.log(`✓ Added ${projects.length} projects`);
    
    // Assign required skills to projects
    const allProjects = db.exec('SELECT id FROM projects');
    if (allProjects[0] && allSkills[0]) {
      console.log('Assigning required skills to projects...');
      const projectIds = allProjects[0].values.map(row => row[0]);
      const skillIds = allSkills[0].values.map(row => row[0]);
      
      for (const projectId of projectIds) {
        const numSkills = 2 + Math.floor(Math.random() * 3);
        const shuffledSkills = [...skillIds].sort(() => Math.random() - 0.5).slice(0, numSkills);
        
        for (let i = 0; i < shuffledSkills.length; i++) {
          const proficiency = 2 + Math.floor(Math.random() * 3);
          const mandatory = i === 0 ? 1 : (Math.random() > 0.5 ? 1 : 0);
          try {
            db.run(`
              INSERT OR IGNORE INTO project_skills (project_id, skill_id, required_proficiency, is_mandatory)
              VALUES (?, ?, ?, ?)
            `, [projectId, shuffledSkills[i], proficiency, mandatory]);
          } catch (e) {}
        }
      }
      console.log('✓ Assigned required skills to projects');
    }
    
    // Create sample assignments
    console.log('Creating sample assignments...');
    const activeProjects = db.exec("SELECT id, name FROM projects WHERE status = 'active'");
    const activePeople = db.exec('SELECT id FROM people WHERE is_active = 1');
    
    if (activeProjects[0] && activePeople[0]) {
      const activeProjectIds = activeProjects[0].values.map(row => row[0]);
      const activePeopleIds = activePeople[0].values.map(row => row[0]);
      
      let assignmentCount = 0;
      for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
        const date = new Date();
        date.setDate(date.getDate() + dayOffset);
        
        // Skip weekends
        if (date.getDay() === 0 || date.getDay() === 6) continue;
        
        const dateStr = date.toISOString().split('T')[0];
        const numAssignments = 5 + Math.floor(Math.random() * 6);
        
        for (let i = 0; i < numAssignments; i++) {
          const personId = activePeopleIds[Math.floor(Math.random() * activePeopleIds.length)];
          const projectId = activeProjectIds[Math.floor(Math.random() * activeProjectIds.length)];
          const startHour = 8 + Math.floor(Math.random() * 8);
          const duration = 2 + Math.floor(Math.random() * 4);
          const endHour = Math.min(startHour + duration, 18);
          const task = tasks[Math.floor(Math.random() * tasks.length)];
          
          try {
            db.run(`
              INSERT INTO assignments (person_id, project_id, date, start_hour, end_hour, status, task_description)
              VALUES (?, ?, ?, ?, ?, 'scheduled', ?)
            `, [personId, projectId, dateStr, startHour, endHour, task]);
            assignmentCount++;
          } catch (e) {}
        }
      }
      console.log(`✓ Created ${assignmentCount} assignments`);
    }
    
    // Create sample availability windows
    console.log('Creating sample availability windows...');
    if (activePeople[0]) {
      const activePeopleIds = activePeople[0].values.map(row => row[0]);
      const vacationPersonId = activePeopleIds[Math.floor(Math.random() * activePeopleIds.length)];
      
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekEnd = new Date(nextWeek);
      nextWeekEnd.setDate(nextWeekEnd.getDate() + 4);
      
      db.run(`
        INSERT INTO availability_windows (person_id, type, start_date, end_date, reason, status)
        VALUES (?, ?, ?, ?, ?, 'approved')
      `, [vacationPersonId, 'vacation', nextWeek.toISOString().split('T')[0], nextWeekEnd.toISOString().split('T')[0], 'Annual leave']);
      
      console.log('✓ Created availability windows');
    }
    
    // Save the database
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
    
    console.log('\n✅ Database seeded successfully!');
    console.log('\n📋 User Accounts:');
    console.log('┌──────────────┬────────────────┬────────────────────────────────────────┐');
    console.log('│ Role         │ Credentials    │ Permissions                            │');
    console.log('├──────────────┼────────────────┼────────────────────────────────────────┤');
    console.log('│ Administrator│ admin/admin123 │ Full access + User management          │');
    console.log('│ Scheduler    │ scheduler/     │ Manage schedules, people, projects     │');
    console.log('│              │ scheduler123   │ Can export reports                     │');
    console.log('│ Viewer       │ viewer/viewer123│ Read-only access to all data          │');
    console.log('└──────────────┴────────────────┴────────────────────────────────────────┘');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    db.close();
  }
}

seedDatabase();
