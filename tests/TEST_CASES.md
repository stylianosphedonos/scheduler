# Resource Scheduler - Test Cases Documentation

## Overview
This document contains all test cases for the Resource Scheduler application, covering authentication, user management, CRUD operations, scheduling, and security.

---

## 1. Authentication Tests

| Test ID | Description | Steps | Expected Result | Priority |
|---------|-------------|-------|-----------------|----------|
| TC-AUTH-001 | Login with valid admin credentials | POST /api/auth/login with valid username/password | 200 OK, returns JWT token and user info | Critical |
| TC-AUTH-002 | Login with invalid password | POST /api/auth/login with wrong password | 401 Unauthorized | Critical |
| TC-AUTH-003 | Login with non-existent user | POST /api/auth/login with unknown username | 401 Unauthorized | High |
| TC-AUTH-004 | Login with empty credentials | POST /api/auth/login with empty fields | 400 Bad Request | High |
| TC-AUTH-005 | Login with email instead of username | POST /api/auth/login with email | 200 OK, returns token | Medium |
| TC-AUTH-006 | Register new user with valid data | POST /api/auth/register with valid data | 201 Created, returns token | Critical |
| TC-AUTH-007 | Register with weak password | POST /api/auth/register with weak password | 400 Bad Request, password error | High |
| TC-AUTH-008 | Register with duplicate username | POST /api/auth/register with existing username | 400 Bad Request | High |
| TC-AUTH-009 | Register with invalid email | POST /api/auth/register with invalid email | 400 Bad Request | Medium |
| TC-AUTH-010 | Get current user info | GET /api/auth/me with valid token | 200 OK, returns user details | High |
| TC-AUTH-011 | Access protected endpoint without token | GET /api/auth/me without Authorization header | 401 Unauthorized | Critical |
| TC-AUTH-012 | Access with invalid token | GET /api/auth/me with invalid JWT | 403 Forbidden | Critical |
| TC-AUTH-013 | Logout and invalidate token | POST /api/auth/logout | 200 OK, token blacklisted | High |
| TC-AUTH-014 | Change password with correct current password | POST /api/auth/change-password | 200 OK | High |
| TC-AUTH-015 | Change password with wrong current password | POST /api/auth/change-password | 400 Bad Request | High |

---

## 2. User Management Tests (Admin Only)

| Test ID | Description | Steps | Expected Result | Priority |
|---------|-------------|-------|-----------------|----------|
| TC-USER-001 | List all users | GET /api/users as admin | 200 OK, returns paginated user list | High |
| TC-USER-002 | Filter users by role | GET /api/users?role=admin | 200 OK, returns only admins | Medium |
| TC-USER-003 | Search users by username | GET /api/users?search=admin | 200 OK, returns matching users | Medium |
| TC-USER-004 | Paginate user results | GET /api/users?page=1&limit=5 | 200 OK, returns paginated results | Medium |
| TC-USER-005 | Create new user | POST /api/users with valid data | 201 Created, returns user ID | High |
| TC-USER-006 | Create user with duplicate email | POST /api/users with existing email | 400 Bad Request | High |
| TC-USER-007 | Get user by ID | GET /api/users/:id | 200 OK, returns user details | High |
| TC-USER-008 | Get non-existent user | GET /api/users/99999 | 404 Not Found | Medium |
| TC-USER-009 | Update user details | PUT /api/users/:id | 200 OK | High |
| TC-USER-010 | Update user role | PUT /api/users/:id with role change | 200 OK | High |
| TC-USER-011 | Deactivate user | PUT /api/users/:id with isActive=false | 200 OK | High |
| TC-USER-012 | Admin cannot deactivate self | PUT /api/users/:id (self) with isActive=false | 400 Bad Request | Critical |
| TC-USER-013 | Delete user | DELETE /api/users/:id | 200 OK | High |
| TC-USER-014 | Admin cannot delete self | DELETE /api/users/:id (self) | 400 Bad Request | Critical |

---

## 3. Skills Management Tests

| Test ID | Description | Steps | Expected Result | Priority |
|---------|-------------|-------|-----------------|----------|
| TC-SKILL-001 | List all skills | GET /api/skills | 200 OK, returns skill list | High |
| TC-SKILL-002 | Filter skills by category | GET /api/skills?category=Technical | 200 OK, returns filtered skills | Medium |
| TC-SKILL-003 | Search skills by name | GET /api/skills?search=JavaScript | 200 OK, returns matching skills | Medium |
| TC-SKILL-004 | Create new skill | POST /api/skills | 201 Created, returns skill ID | High |
| TC-SKILL-005 | Create duplicate skill | POST /api/skills with existing name | 400 Bad Request | High |
| TC-SKILL-006 | Create skill without name | POST /api/skills without name field | 400 Bad Request | High |
| TC-SKILL-007 | Get skill by ID | GET /api/skills/:id | 200 OK, returns skill details | Medium |
| TC-SKILL-008 | Update skill | PUT /api/skills/:id | 200 OK | Medium |
| TC-SKILL-009 | Delete skill | DELETE /api/skills/:id | 200 OK | Medium |

---

## 4. People Management Tests

| Test ID | Description | Steps | Expected Result | Priority |
|---------|-------------|-------|-----------------|----------|
| TC-PEOPLE-001 | List all people | GET /api/people | 200 OK, returns people list | High |
| TC-PEOPLE-002 | Filter by department | GET /api/people?department=Engineering | 200 OK, filtered results | Medium |
| TC-PEOPLE-003 | Filter active people | GET /api/people?active=true | 200 OK, only active people | Medium |
| TC-PEOPLE-004 | Search by name | GET /api/people?search=John | 200 OK, matching people | Medium |
| TC-PEOPLE-005 | Create new person | POST /api/people | 201 Created, returns person ID | High |
| TC-PEOPLE-006 | Create with duplicate email | POST /api/people with existing email | 400 Bad Request | High |
| TC-PEOPLE-007 | Create without required fields | POST /api/people without name | 400 Bad Request | High |
| TC-PEOPLE-008 | Get person by ID with skills | GET /api/people/:id | 200 OK, includes skills array | High |
| TC-PEOPLE-009 | Update person details | PUT /api/people/:id | 200 OK | High |
| TC-PEOPLE-010 | Deactivate person | PUT /api/people/:id with isActive=false | 200 OK | High |
| TC-PEOPLE-011 | Assign skill to person | POST /api/people/:id/skills | 201 Created | High |
| TC-PEOPLE-012 | Prevent duplicate skill assignment | POST /api/people/:id/skills (duplicate) | 400 Bad Request | Medium |
| TC-PEOPLE-013 | Remove skill from person | DELETE /api/people/:id/skills/:skillId | 200 OK | Medium |

---

## 5. Project Management Tests

| Test ID | Description | Steps | Expected Result | Priority |
|---------|-------------|-------|-----------------|----------|
| TC-PROJECT-001 | List all projects | GET /api/projects | 200 OK, returns project list | High |
| TC-PROJECT-002 | Filter by status | GET /api/projects?status=active | 200 OK, filtered results | Medium |
| TC-PROJECT-003 | Filter by priority | GET /api/projects?priority=high | 200 OK, filtered results | Medium |
| TC-PROJECT-004 | Search by name | GET /api/projects?search=Website | 200 OK, matching projects | Medium |
| TC-PROJECT-005 | Create new project | POST /api/projects | 201 Created, returns project ID | High |
| TC-PROJECT-006 | Create without name | POST /api/projects without name | 400 Bad Request | High |
| TC-PROJECT-007 | Get project by ID with skills | GET /api/projects/:id | 200 OK, includes requiredSkills | High |
| TC-PROJECT-008 | Update project | PUT /api/projects/:id | 200 OK | High |
| TC-PROJECT-009 | Add skill requirement | POST /api/projects/:id/skills | 201 Created | High |

---

## 6. Assignment/Scheduling Tests

| Test ID | Description | Steps | Expected Result | Priority |
|---------|-------------|-------|-----------------|----------|
| TC-ASSIGN-001 | List assignments | GET /api/assignments | 200 OK, returns assignment list | High |
| TC-ASSIGN-002 | Filter by date range | GET /api/assignments?startDate=...&endDate=... | 200 OK, filtered results | High |
| TC-ASSIGN-003 | Filter by person | GET /api/assignments?personId=... | 200 OK, filtered results | Medium |
| TC-ASSIGN-004 | Filter by project | GET /api/assignments?projectId=... | 200 OK, filtered results | Medium |
| TC-ASSIGN-005 | Create assignment | POST /api/assignments | 201 Created | Critical |
| TC-ASSIGN-006 | Detect time overlap | POST /api/assignments with overlap | 400/409 or warning | Critical |
| TC-ASSIGN-007 | Validate hour range | POST /api/assignments with end < start | 400 Bad Request | High |
| TC-ASSIGN-008 | Update assignment | PUT /api/assignments/:id | 200 OK | High |
| TC-ASSIGN-009 | Delete assignment | DELETE /api/assignments/:id | 200 OK | High |
| TC-ASSIGN-010 | Get daily schedule | GET /api/assignments/daily/:date | 200 OK | High |

---

## 7. Availability Management Tests

| Test ID | Description | Steps | Expected Result | Priority |
|---------|-------------|-------|-----------------|----------|
| TC-AVAIL-001 | List availability windows | GET /api/availability | 200 OK | Medium |
| TC-AVAIL-002 | Create time-off window | POST /api/availability | 201 Created | High |
| TC-AVAIL-003 | Get person availability | GET /api/availability/person/:id | 200 OK | High |

---

## 8. Conflict Detection Tests

| Test ID | Description | Steps | Expected Result | Priority |
|---------|-------------|-------|-----------------|----------|
| TC-CONFLICT-001 | List conflicts | GET /api/conflicts | 200 OK, returns conflict list | High |
| TC-CONFLICT-002 | Filter by type | GET /api/conflicts?type=overlap | 200 OK, filtered | Medium |
| TC-CONFLICT-003 | Filter by severity | GET /api/conflicts?severity=high | 200 OK, filtered | Medium |
| TC-CONFLICT-004 | Filter unresolved | GET /api/conflicts?resolved=false | 200 OK, only unresolved | Medium |
| TC-CONFLICT-005 | Run conflict detection | POST /api/conflicts/detect | 200 OK, returns detected count | High |
| TC-CONFLICT-006 | Resolve conflict | PUT /api/conflicts/:id/resolve | 200 OK | High |

---

## 9. AI Scheduler Tests

| Test ID | Description | Steps | Expected Result | Priority |
|---------|-------------|-------|-----------------|----------|
| TC-AI-001 | Generate suggestions for date | POST /api/ai-scheduler/suggest | 200 OK, returns suggestions array | High |
| TC-AI-002 | Generate for date range | POST /api/ai-scheduler/suggest with range | 200 OK | Medium |
| TC-AI-003 | Exclude specific people | POST /api/ai-scheduler/suggest with excludePeople | 200 OK, excluded not in results | Medium |
| TC-AI-004 | Apply suggestions | POST /api/ai-scheduler/apply | 200 OK | High |

---

## 10. Skill Matching Tests

| Test ID | Description | Steps | Expected Result | Priority |
|---------|-------------|-------|-----------------|----------|
| TC-MATCH-001 | Find candidates for project | GET /api/matching/candidates?projectId=... | 200 OK, returns candidates | High |
| TC-MATCH-002 | Find candidates for skill | GET /api/matching/candidates?skillId=... | 200 OK, returns candidates | High |
| TC-MATCH-003 | Filter by proficiency | GET /api/matching/candidates?minProficiency=3 | 200 OK, filtered | Medium |
| TC-MATCH-004 | Identify skill gaps | GET /api/matching/gaps?projectId=... | 200 OK, returns gaps | High |

---

## 11. Analytics & Reports Tests

| Test ID | Description | Steps | Expected Result | Priority |
|---------|-------------|-------|-----------------|----------|
| TC-ANALYTICS-001 | Get dashboard metrics | GET /api/analytics/dashboard | 200 OK, returns metrics object | High |
| TC-ANALYTICS-002 | Get utilization report | GET /api/analytics/utilization | 200 OK | High |
| TC-ANALYTICS-003 | Get project summary | GET /api/analytics/project-summary | 200 OK | High |
| TC-ANALYTICS-004 | Get daily report | GET /api/analytics/daily-report | 200 OK | High |

---

## 12. Export Tests

| Test ID | Description | Steps | Expected Result | Priority |
|---------|-------------|-------|-----------------|----------|
| TC-EXPORT-001 | Generate Excel export | GET /api/exports/excel | 200 OK, Content-Type: spreadsheetml | High |
| TC-EXPORT-002 | Generate PDF export | GET /api/exports/pdf | 200 OK, Content-Type: pdf | High |
| TC-EXPORT-003 | Get export history | GET /api/exports/logs | 200 OK, returns logs with pagination | Medium |

---

## 13. Settings Tests

| Test ID | Description | Steps | Expected Result | Priority |
|---------|-------------|-------|-----------------|----------|
| TC-SETTINGS-001 | Get all settings (admin) | GET /api/settings | 200 OK | Medium |
| TC-SETTINGS-002 | Get public branding | GET /api/settings/public | 200 OK (no auth required) | High |
| TC-SETTINGS-003 | Update branding | PUT /api/settings | 200 OK | Medium |
| TC-SETTINGS-004 | Reject non-whitelisted keys | PUT /api/settings with bad key | 400 or ignored | Medium |

---

## 14. Role-Based Access Control Tests

| Test ID | Description | Steps | Expected Result | Priority |
|---------|-------------|-------|-----------------|----------|
| TC-RBAC-001 | Viewer cannot access users | GET /api/users as viewer | 403 Forbidden | Critical |
| TC-RBAC-002 | Viewer cannot create users | POST /api/users as viewer | 403 Forbidden | Critical |
| TC-RBAC-003 | Viewer cannot delete users | DELETE /api/users/:id as viewer | 403 Forbidden | Critical |
| TC-RBAC-004 | Scheduler can create assignments | POST /api/assignments as scheduler | 201 Created | Critical |
| TC-RBAC-005 | Scheduler can export | GET /api/exports/excel as scheduler | 200 OK | High |
| TC-RBAC-006 | Viewer can read people | GET /api/people as viewer | 200 OK | High |
| TC-RBAC-007 | Viewer can read projects | GET /api/projects as viewer | 200 OK | High |
| TC-RBAC-008 | Viewer cannot create assignments | POST /api/assignments as viewer | 403 Forbidden | Critical |
| TC-RBAC-009 | Viewer cannot export | GET /api/exports/excel as viewer | 403 Forbidden | High |

---

## 15. Import Tests

| Test ID | Description | Steps | Expected Result | Priority |
|---------|-------------|-------|-----------------|----------|
| TC-IMPORT-001 | Download people template | GET /api/import/templates/people | 200 OK, Excel file | Medium |
| TC-IMPORT-002 | Download projects template | GET /api/import/templates/projects | 200 OK, Excel file | Medium |
| TC-IMPORT-003 | Download skills template | GET /api/import/templates/skills | 200 OK, Excel file | Medium |

---

## 16. Security Tests

| Test ID | Description | Steps | Expected Result | Priority |
|---------|-------------|-------|-----------------|----------|
| TC-SEC-001 | Rate limit login attempts | Multiple failed logins rapidly | 429 Too Many Requests | Critical |
| TC-SEC-002 | Sanitize XSS input | POST with `<script>` in field | Sanitized or rejected | Critical |
| TC-SEC-003 | SQL injection protection | Login with SQL injection attempt | 401 (not crash), tables intact | Critical |
| TC-SEC-004 | No password in responses | GET /api/users | No password/hash fields | Critical |
| TC-SEC-005 | Auth required for protected | GET protected endpoints without token | 401 Unauthorized | Critical |

---

## 17. Error Handling Tests

| Test ID | Description | Steps | Expected Result | Priority |
|---------|-------------|-------|-----------------|----------|
| TC-ERR-001 | 404 for non-existent endpoint | GET /api/nonexistent | 404 Not Found | Medium |
| TC-ERR-002 | 400 for malformed JSON | POST with invalid JSON | 400 Bad Request | High |
| TC-ERR-003 | Handle missing required fields | POST without required fields | 400 Bad Request with error message | High |

---

## Test Summary

| Category | Total Tests | Critical | High | Medium |
|----------|-------------|----------|------|--------|
| Authentication | 15 | 5 | 7 | 3 |
| User Management | 14 | 2 | 10 | 2 |
| Skills | 9 | 0 | 4 | 5 |
| People | 13 | 0 | 9 | 4 |
| Projects | 9 | 0 | 6 | 3 |
| Assignments | 10 | 2 | 7 | 1 |
| Availability | 3 | 0 | 2 | 1 |
| Conflicts | 6 | 0 | 4 | 2 |
| AI Scheduler | 4 | 0 | 2 | 2 |
| Skill Matching | 4 | 0 | 3 | 1 |
| Analytics | 4 | 0 | 4 | 0 |
| Exports | 3 | 0 | 2 | 1 |
| Settings | 4 | 0 | 1 | 3 |
| RBAC | 9 | 4 | 4 | 1 |
| Import | 3 | 0 | 0 | 3 |
| Security | 5 | 5 | 0 | 0 |
| Error Handling | 3 | 0 | 2 | 1 |
| **TOTAL** | **118** | **18** | **67** | **33** |

---

## Running Tests

### Prerequisites
1. Node.js 18+ installed
2. Server running on localhost:3000
3. Test database initialized

### Install Dependencies
```bash
npm install --save-dev jest jest-html-reporter node-fetch
```

### Run Tests
```bash
# Run all tests
npm test

# Run specific category
npm test -- --testNamePattern="Authentication"

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

### Environment Variables
```bash
TEST_URL=http://localhost:3000  # Default test server
```

---

## 18. Internationalization (i18n) Tests

| Test ID | Description | Steps | Expected Result | Priority |
|---------|-------------|-------|-----------------|----------|
| TC-I18N-001 | Load English translation file | GET /i18n/en.json | 200 OK, JSON with meta.code='en' | Critical |
| TC-I18N-002 | Load Greek translation file | GET /i18n/el.json | 200 OK, JSON with meta.code='el' | Critical |
| TC-I18N-003 | Request non-existent language | GET /i18n/xx.json | 404 Not Found | Medium |
| TC-I18N-004 | English file has required sections | GET /i18n/en.json | Contains common, auth, nav, dashboard, etc. | High |
| TC-I18N-005 | Greek file has required sections | GET /i18n/el.json | Contains common, auth, nav, dashboard, etc. | High |
| TC-I18N-006 | English and Greek have matching keys | Compare both files | All major sections match | High |
| TC-I18N-007 | Common translations exist in English | GET /i18n/en.json | save='Save', cancel='Cancel', etc. | High |
| TC-I18N-008 | Common translations exist in Greek | GET /i18n/el.json | save='Αποθήκευση', cancel='Ακύρωση', etc. | High |
| TC-I18N-009 | Navigation translations exist | GET /i18n/el.json | nav.dashboard='Πίνακας Ελέγχου' | High |
| TC-I18N-010 | Empty state messages in both languages | Compare both files | All empty states have translations | High |
| TC-I18N-011 | Help content exists in both languages | Compare both files | help.dashboard, help.schedule exist | High |
| TC-I18N-012 | Proficiency levels are translated | Compare both files | 1=Beginner/Αρχάριος, 5=Expert/Ειδικός | Medium |
| TC-I18N-013 | Get custom translations (admin) | GET /api/translations with admin token | 200 OK, translations object | High |
| TC-I18N-014 | Get translations for language | GET /api/translations/en | 200 OK, translations object | High |
| TC-I18N-015 | Admin updates custom translation | PUT /api/translations/en/test.key | 200 OK | High |
| TC-I18N-016 | Non-admin cannot update translations | PUT /api/translations/en/test.key as viewer | 403 Forbidden | Critical |
| TC-I18N-017 | Bulk update translations | POST /api/translations/bulk as admin | 200 OK | Medium |
| TC-I18N-018 | Delete custom translation | DELETE /api/translations/en/test.key as admin | 200 OK | Medium |
| TC-I18N-019 | Reject invalid translation key | PUT /api/translations/en/ with invalid key | 400 or 404 | Low |
| TC-I18N-020 | Get public settings with language | GET /api/settings/public | 200 OK, includes default_language | High |
| TC-I18N-021 | Admin updates default language | PUT /api/settings with default_language | 200 OK | High |

---

## 19. UI Translation Integration Tests

| Test ID | Description | Steps | Expected Result | Priority |
|---------|-------------|-------|-----------------|----------|
| TC-UI-I18N-001 | HTML has i18n data attributes | GET / (main page) | Contains data-i18n attributes | High |
| TC-UI-I18N-002 | Dashboard metrics have i18n | GET / | data-i18n="dashboard.activePeople" exists | High |
| TC-UI-I18N-003 | Form labels have i18n | GET / | data-i18n="auth.username" exists | High |
| TC-UI-I18N-004 | Settings page has i18n | GET / | data-i18n="settings.branding" exists | High |
| TC-UI-I18N-005 | Loading messages have i18n | GET / | data-i18n="common.loading" exists | Medium |
| TC-UI-I18N-006 | Language switcher exists | GET / | language-switcher element exists | High |

---

## 20. Help System Tests

| Test ID | Description | Steps | Expected Result | Priority |
|---------|-------------|-------|-----------------|----------|
| TC-HELP-001 | English help has all pages | GET /i18n/en.json | help.dashboard, schedule, people, etc. | High |
| TC-HELP-002 | Greek help has all pages | GET /i18n/el.json | help.dashboard, schedule, people, etc. | High |
| TC-HELP-003 | Dashboard help has overview | GET translations | English and Greek overview exists | High |
| TC-HELP-004 | Schedule help has steps | GET translations | step1, step2, etc. in both languages | High |
| TC-HELP-005 | People help explains proficiency | GET translations | proficiencyLevels section exists | Medium |
| TC-HELP-006 | AI Scheduler help explains considerations | GET translations | consideration1-4 exist | Medium |
| TC-HELP-007 | Conflicts help explains types | GET translations | overlapDesc exists in both languages | High |
| TC-HELP-008 | Help button exists in header | GET / | help-btn and fa-question-circle exist | High |

---

## 21. Empty State Translation Tests

| Test ID | Description | Steps | Expected Result | Priority |
|---------|-------------|-------|-----------------|----------|
| TC-EMPTY-001 | Dashboard empty states translated | Check el.json | noAssignmentsToday is Greek | High |
| TC-EMPTY-002 | People empty states translated | Check el.json | noPeopleFound is Greek | High |
| TC-EMPTY-003 | Project empty states translated | Check el.json | noProjectsFound is Greek | High |
| TC-EMPTY-004 | Schedule empty states translated | Check el.json | noAssignments is Greek | High |
| TC-EMPTY-005 | Skill empty states translated | Check el.json | noSkillsFound is Greek | High |
| TC-EMPTY-006 | Conflict empty states translated | Check el.json | noConflicts is Greek | High |
| TC-EMPTY-007 | AI Scheduler empty state translated | Check el.json | noQualifiedPeople is Greek | Medium |
| TC-EMPTY-008 | User empty state translated | Check el.json | noUsersFound is Greek | Medium |

---

## Test Data Setup

Before running tests, ensure the database has:
- Admin user: `admin` / `admin123`
- Scheduler user: `scheduler` / `scheduler123`
- At least one person, project, and skill

The test suite will create additional test data as needed.

---

## i18n Test Coverage Summary

| Category | Tests | Status |
|----------|-------|--------|
| Translation Files | 12 | ✅ |
| Translation API | 9 | ✅ |
| UI Integration | 6 | ✅ |
| Help System | 8 | ✅ |
| Empty States | 8 | ✅ |
| **Total i18n Tests** | **43** | ✅ |

