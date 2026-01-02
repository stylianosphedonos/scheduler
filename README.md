# 📅 Resource Scheduler

A comprehensive enterprise resource scheduling system with skill matching, conflict detection, and multi-format exports.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

### Core Scheduling
- **Daily Scheduling** with hourly time slots
- **Weekly View** for team planning
- **Drag & drop** assignment management (coming soon)
- **Visual timeline** for schedule overview

### People Management
- Employee profiles with contact information
- Skill profiles with proficiency levels (1-5)
- Availability windows (vacation, time-off, blocked time)
- Employment type tracking (full-time, part-time, contractor)
- Maximum hours/projects per day constraints

### Project Management
- Project lifecycle tracking (planning, active, on-hold, completed)
- Required skills with proficiency requirements
- Budget hours tracking and utilization
- Client and priority management

### Skill Matching Engine
- Auto-suggest best candidates for projects
- Skill gap analysis across organization
- Match score calculation based on proficiency
- Mandatory vs optional skill handling

### Conflict Detection
- **Overlap detection** - Same person, same time slot
- **Overallocation** - Exceeding max hours/day
- **Max projects** - Too many projects per person per day
- **Skill gaps** - Missing required skills
- **Availability conflicts** - Assignments during time-off

### Analytics Dashboard
- Key metrics at a glance
- Weekly utilization trends
- Top utilized team members
- Active conflict summary
- Skill demand analysis

### Export Capabilities
- **Excel Export** with multiple sheets:
  - Daily Schedule
  - Person Summary
  - Project Summary
  - Conflicts Report
  - Skills Matrix
  - Metadata
- **PDF Export** with formatted reports

### Security & Access Control
- Role-based access (Admin, Manager, Scheduler, Viewer)
- JWT authentication
- Audit trail for all changes
- Session management

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Navigate to project directory
cd Scheduler

# Install dependencies
npm install

# Seed sample data (optional but recommended)
npm run seed

# Start the server
npm start
```

### Access
Open your browser and navigate to: **http://localhost:3000**

### Default Credentials
| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Manager | manager | manager123 |
| Scheduler | scheduler | scheduler123 |

## 📊 Data Model

### Core Entities

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    Person    │────▶│  Assignment  │◀────│   Project    │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │
       ▼                    ▼                    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│PersonSkills  │     │  Conflict    │     │ProjectSkills │
└──────────────┘     └──────────────┘     └──────────────┘
       │                                         │
       └────────────────┐     ┌─────────────────┘
                        ▼     ▼
                   ┌──────────────┐
                   │    Skill     │
                   └──────────────┘
```

### Entity Details

| Entity | Description |
|--------|-------------|
| **Person** | Employees with skills, availability, and constraints |
| **Skill** | Reusable skills with categories and proficiency levels |
| **Project** | Projects with required skills, timelines, and budgets |
| **Assignment** | Core scheduling unit (person → project → hourly slot) |
| **AvailabilityWindow** | Time-off, vacation, blocked periods |
| **ScheduleConflict** | Detected scheduling issues |
| **ExportLog** | Audit trail of all exports |

## 🔌 API Reference

### Authentication
```
POST /api/auth/login        - Login and get JWT token
GET  /api/auth/me           - Get current user
POST /api/auth/change-password - Change password
```

### People
```
GET    /api/people          - List all people
GET    /api/people/:id      - Get person details
POST   /api/people          - Create person
PUT    /api/people/:id      - Update person
DELETE /api/people/:id      - Delete person
PUT    /api/people/:id/skills - Update person skills
POST   /api/people/bulk-import - Bulk import
```

### Projects
```
GET    /api/projects        - List all projects
GET    /api/projects/:id    - Get project details
POST   /api/projects        - Create project
PUT    /api/projects/:id    - Update project
DELETE /api/projects/:id    - Delete project
PUT    /api/projects/:id/skills - Update required skills
```

### Assignments
```
GET    /api/assignments     - List assignments (with filters)
GET    /api/assignments/daily/:date - Daily schedule view
GET    /api/assignments/weekly/:date - Weekly schedule view
POST   /api/assignments     - Create assignment
PUT    /api/assignments/:id - Update assignment
DELETE /api/assignments/:id - Delete assignment
POST   /api/assignments/bulk - Bulk create
```

### Skill Matching
```
GET /api/matching/project/:id/candidates - Find candidates for project
GET /api/matching/person/:id/projects    - Find matching projects for person
GET /api/matching/suggest/:date          - Auto-suggest assignments
GET /api/matching/skill-gaps             - Analyze skill gaps
```

### Conflicts
```
GET  /api/conflicts         - List all conflicts
POST /api/conflicts/:id/resolve - Resolve a conflict
POST /api/conflicts/detect  - Re-run conflict detection
POST /api/conflicts/bulk-resolve - Bulk resolve
```

### Analytics
```
GET /api/analytics/dashboard  - Dashboard overview
GET /api/analytics/utilization - Utilization report
GET /api/analytics/efficiency - Efficiency metrics
GET /api/analytics/trends     - Historical trends
```

### Exports
```
GET /api/exports/excel      - Export to Excel
GET /api/exports/pdf        - Export to PDF
GET /api/exports/logs       - Export history
```

## 🎯 Role Permissions

| Feature | Admin | Manager | Scheduler | Viewer |
|---------|-------|---------|-----------|--------|
| View Schedules | ✓ | ✓ | ✓ | ✓ |
| Create Assignments | ✓ | ✓ | ✓ | ✗ |
| Manage People | ✓ | ✓ | ✓ | ✗ |
| Manage Projects | ✓ | ✓ | ✗ | ✗ |
| Manage Skills | ✓ | ✓ | ✗ | ✗ |
| Manage Users | ✓ | ✗ | ✗ | ✗ |
| Export Data | ✓ | ✓ | ✓ | ✗ |
| View Analytics | ✓ | ✓ | ✓ | ✓ |
| Resolve Conflicts | ✓ | ✓ | ✓ | ✗ |

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server
PORT=3000

# Database
DATABASE_PATH=./scheduler.db

# Authentication
JWT_SECRET=your-super-secret-key-change-in-production

# Settings
WORK_HOURS_START=9
WORK_HOURS_END=18
DEFAULT_MAX_HOURS_PER_DAY=8
DEFAULT_MAX_PROJECTS_PER_DAY=3
```

## 📈 Success Metrics (Targets)

| Metric | Target |
|--------|--------|
| Scheduling time | < 15 min (down from 4 hours) |
| Conflict rate | < 2% |
| Skill match rate | > 85% |
| Page load time | < 2 seconds |
| Export time | < 30 seconds |

## 🛠️ Development

### Project Structure
```
Scheduler/
├── backend/
│   ├── database.js          # SQLite database setup
│   ├── middleware/
│   │   └── auth.js          # JWT authentication
│   └── routes/
│       ├── analytics.js     # Dashboard & reports
│       ├── assignments.js   # Schedule management
│       ├── auth.js          # Authentication
│       ├── availability.js  # Time-off management
│       ├── conflicts.js     # Conflict detection
│       ├── exports.js       # Excel/PDF exports
│       ├── matching.js      # Skill matching engine
│       ├── people.js        # Employee management
│       ├── projects.js      # Project management
│       ├── skills.js        # Skill management
│       └── users.js         # User management
├── frontend/
│   ├── index.html           # Main HTML
│   ├── styles.css           # Styles
│   └── app.js               # Frontend logic
├── scripts/
│   └── seed-data.js         # Sample data seeder
├── server.js                # Express server
├── package.json
└── README.md
```

### Tech Stack
- **Backend**: Node.js, Express.js
- **Database**: SQLite (better-sqlite3)
- **Auth**: JWT (jsonwebtoken)
- **Export**: ExcelJS, PDFKit
- **Frontend**: Vanilla JS, CSS3

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Support

For support, please open an issue on the repository or contact the development team.

---

Built with ❤️ by Playtech OPS


