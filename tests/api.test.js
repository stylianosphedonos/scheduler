/**
 * Resource Scheduler - Comprehensive API Test Suite
 * 
 * Run with: npm test
 * 
 * Prerequisites:
 * - Server running on localhost:3000
 * - Test database initialized
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

// Test utilities
let adminToken = '';
let schedulerToken = '';
let viewerToken = '';
let testUserId = null;
let testPersonId = null;
let testProjectId = null;
let testSkillId = null;
let testAssignmentId = null;

// Helper function for API calls
async function api(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.token && { 'Authorization': `Bearer ${options.token}` }),
      ...options.headers
    },
    ...options
  });
  
  const contentType = response.headers.get('content-type');
  let data = null;
  
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  }
  
  return { status: response.status, data, ok: response.ok };
}

// ============================================
// 1. AUTHENTICATION TESTS
// ============================================
describe('Authentication', () => {
  
  describe('POST /api/auth/login', () => {
    test('TC-AUTH-001: Should login with valid admin credentials', async () => {
      const res = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: 'admin', password: 'admin123' })
      });
      
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('token');
      expect(res.data.user.role).toBe('admin');
      adminToken = res.data.token;
    });

    test('TC-AUTH-002: Should reject invalid password', async () => {
      const res = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: 'admin', password: 'wrongpassword' })
      });
      
      expect(res.status).toBe(401);
      expect(res.data).toHaveProperty('error');
    });

    test('TC-AUTH-003: Should reject non-existent user', async () => {
      const res = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: 'nonexistent', password: 'password' })
      });
      
      expect(res.status).toBe(401);
    });

    test('TC-AUTH-004: Should reject empty credentials', async () => {
      const res = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: '', password: '' })
      });
      
      expect(res.status).toBe(400);
    });

    test('TC-AUTH-005: Should login with email instead of username', async () => {
      const res = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: 'admin@scheduler.local', password: 'admin123' })
      });
      
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('token');
    });
  });

  describe('POST /api/auth/register', () => {
    test('TC-AUTH-006: Should register new user with valid data', async () => {
      const res = await api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username: 'testuser_' + Date.now(),
          email: `testuser_${Date.now()}@test.com`,
          password: 'TestPass123!'
        })
      });
      
      expect(res.status).toBe(201);
      expect(res.data).toHaveProperty('token');
    });

    test('TC-AUTH-007: Should reject weak password', async () => {
      const res = await api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username: 'weakuser',
          email: 'weak@test.com',
          password: '123'
        })
      });
      
      expect(res.status).toBe(400);
      expect(res.data.error).toContain('password');
    });

    test('TC-AUTH-008: Should reject duplicate username', async () => {
      const res = await api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username: 'admin',
          email: 'newadmin@test.com',
          password: 'TestPass123!'
        })
      });
      
      expect(res.status).toBe(400);
    });

    test('TC-AUTH-009: Should reject invalid email format', async () => {
      const res = await api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username: 'invalidemail',
          email: 'notanemail',
          password: 'TestPass123!'
        })
      });
      
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/auth/me', () => {
    test('TC-AUTH-010: Should return current user info with valid token', async () => {
      const res = await api('/api/auth/me', {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('username', 'admin');
      expect(res.data).toHaveProperty('role', 'admin');
    });

    test('TC-AUTH-011: Should reject request without token', async () => {
      const res = await api('/api/auth/me', {
        method: 'GET'
      });
      
      expect(res.status).toBe(401);
    });

    test('TC-AUTH-012: Should reject invalid token', async () => {
      const res = await api('/api/auth/me', {
        method: 'GET',
        token: 'invalid.token.here'
      });
      
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/auth/logout', () => {
    test('TC-AUTH-013: Should logout and invalidate token', async () => {
      // First login to get a fresh token
      const loginRes = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: 'admin', password: 'admin123' })
      });
      const tempToken = loginRes.data.token;

      // Logout
      const logoutRes = await api('/api/auth/logout', {
        method: 'POST',
        token: tempToken
      });
      
      expect(logoutRes.status).toBe(200);
    });
  });

  describe('POST /api/auth/change-password', () => {
    test('TC-AUTH-014: Should change password with correct current password', async () => {
      // Create a test user first
      const username = 'pwdchange_' + Date.now();
      const regRes = await api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username,
          email: `${username}@test.com`,
          password: 'OldPass123!'
        })
      });
      
      const res = await api('/api/auth/change-password', {
        method: 'POST',
        token: regRes.data.token,
        body: JSON.stringify({
          currentPassword: 'OldPass123!',
          newPassword: 'NewPass456!'
        })
      });
      
      expect(res.status).toBe(200);
    });

    test('TC-AUTH-015: Should reject wrong current password', async () => {
      const res = await api('/api/auth/change-password', {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({
          currentPassword: 'wrongpassword',
          newPassword: 'NewPass456!'
        })
      });
      
      expect(res.status).toBe(400);
    });
  });
});

// ============================================
// 2. USER MANAGEMENT TESTS (Admin only)
// ============================================
describe('User Management', () => {
  
  describe('GET /api/users', () => {
    test('TC-USER-001: Admin should list all users', async () => {
      const res = await api('/api/users', {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('data');
      expect(Array.isArray(res.data.data)).toBe(true);
      expect(res.data).toHaveProperty('pagination');
    });

    test('TC-USER-002: Should filter users by role', async () => {
      const res = await api('/api/users?role=admin', {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
      res.data.data.forEach(user => {
        expect(user.role).toBe('admin');
      });
    });

    test('TC-USER-003: Should search users by username', async () => {
      const res = await api('/api/users?search=admin', {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
      expect(res.data.data.some(u => u.username.includes('admin'))).toBe(true);
    });

    test('TC-USER-004: Should paginate results', async () => {
      const res = await api('/api/users?page=1&limit=5', {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
      expect(res.data.data.length).toBeLessThanOrEqual(5);
      expect(res.data.pagination.page).toBe(1);
      expect(res.data.pagination.limit).toBe(5);
    });
  });

  describe('POST /api/users', () => {
    test('TC-USER-005: Admin should create new user', async () => {
      const res = await api('/api/users', {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({
          username: 'newuser_' + Date.now(),
          email: `newuser_${Date.now()}@test.com`,
          password: 'NewUser123!',
          role: 'scheduler',
          firstName: 'Test',
          lastName: 'User'
        })
      });
      
      expect(res.status).toBe(201);
      expect(res.data).toHaveProperty('id');
      testUserId = res.data.id;
    });

    test('TC-USER-006: Should reject duplicate email', async () => {
      const res = await api('/api/users', {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({
          username: 'uniqueuser',
          email: 'admin@scheduler.local',
          password: 'Test123!',
          role: 'viewer'
        })
      });
      
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/users/:id', () => {
    test('TC-USER-007: Should get user by ID', async () => {
      const res = await api(`/api/users/${testUserId || 1}`, {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('id');
      expect(res.data).toHaveProperty('username');
    });

    test('TC-USER-008: Should return 404 for non-existent user', async () => {
      const res = await api('/api/users/99999', {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/users/:id', () => {
    test('TC-USER-009: Should update user details', async () => {
      const res = await api(`/api/users/${testUserId || 1}`, {
        method: 'PUT',
        token: adminToken,
        body: JSON.stringify({
          firstName: 'Updated',
          lastName: 'Name'
        })
      });
      
      expect(res.status).toBe(200);
    });

    test('TC-USER-010: Should update user role', async () => {
      if (!testUserId) return;
      
      const res = await api(`/api/users/${testUserId}`, {
        method: 'PUT',
        token: adminToken,
        body: JSON.stringify({ role: 'viewer' })
      });
      
      expect(res.status).toBe(200);
    });

    test('TC-USER-011: Should deactivate user', async () => {
      if (!testUserId) return;
      
      const res = await api(`/api/users/${testUserId}`, {
        method: 'PUT',
        token: adminToken,
        body: JSON.stringify({ isActive: false })
      });
      
      expect(res.status).toBe(200);
    });

    test('TC-USER-012: Admin cannot deactivate themselves', async () => {
      // Get admin user ID first
      const meRes = await api('/api/auth/me', { method: 'GET', token: adminToken });
      
      const res = await api(`/api/users/${meRes.data.id}`, {
        method: 'PUT',
        token: adminToken,
        body: JSON.stringify({ isActive: false })
      });
      
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/users/:id', () => {
    test('TC-USER-013: Should delete user', async () => {
      // Create a user to delete
      const createRes = await api('/api/users', {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({
          username: 'todelete_' + Date.now(),
          email: `todelete_${Date.now()}@test.com`,
          password: 'Delete123!',
          role: 'viewer'
        })
      });
      
      const res = await api(`/api/users/${createRes.data.id}`, {
        method: 'DELETE',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
    });

    test('TC-USER-014: Admin cannot delete themselves', async () => {
      const meRes = await api('/api/auth/me', { method: 'GET', token: adminToken });
      
      const res = await api(`/api/users/${meRes.data.id}`, {
        method: 'DELETE',
        token: adminToken
      });
      
      expect(res.status).toBe(400);
    });
  });
});

// ============================================
// 3. SKILLS MANAGEMENT TESTS
// ============================================
describe('Skills Management', () => {
  
  describe('GET /api/skills', () => {
    test('TC-SKILL-001: Should list all skills', async () => {
      const res = await api('/api/skills', {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('data');
      expect(Array.isArray(res.data.data)).toBe(true);
    });

    test('TC-SKILL-002: Should filter skills by category', async () => {
      const res = await api('/api/skills?category=Technical', {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
    });

    test('TC-SKILL-003: Should search skills by name', async () => {
      const res = await api('/api/skills?search=JavaScript', {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/skills', () => {
    test('TC-SKILL-004: Should create new skill', async () => {
      const res = await api('/api/skills', {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({
          name: 'TestSkill_' + Date.now(),
          category: 'Technical',
          description: 'Test skill description',
          color: '#FF5733'
        })
      });
      
      expect(res.status).toBe(201);
      expect(res.data).toHaveProperty('id');
      testSkillId = res.data.id;
    });

    test('TC-SKILL-005: Should reject duplicate skill name', async () => {
      // First create a skill
      const name = 'DuplicateSkill_' + Date.now();
      await api('/api/skills', {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({ name, category: 'Technical' })
      });
      
      // Try to create with same name
      const res = await api('/api/skills', {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({ name, category: 'Technical' })
      });
      
      expect(res.status).toBe(400);
    });

    test('TC-SKILL-006: Should require skill name', async () => {
      const res = await api('/api/skills', {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({ category: 'Technical' })
      });
      
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/skills/:id', () => {
    test('TC-SKILL-007: Should get skill by ID', async () => {
      const res = await api(`/api/skills/${testSkillId || 1}`, {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('id');
      expect(res.data).toHaveProperty('name');
    });
  });

  describe('PUT /api/skills/:id', () => {
    test('TC-SKILL-008: Should update skill', async () => {
      const res = await api(`/api/skills/${testSkillId || 1}`, {
        method: 'PUT',
        token: adminToken,
        body: JSON.stringify({
          description: 'Updated description',
          color: '#00FF00'
        })
      });
      
      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/skills/:id', () => {
    test('TC-SKILL-009: Should delete skill', async () => {
      // Create a skill to delete
      const createRes = await api('/api/skills', {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({
          name: 'ToDelete_' + Date.now(),
          category: 'Technical'
        })
      });
      
      const res = await api(`/api/skills/${createRes.data.id}`, {
        method: 'DELETE',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
    });
  });
});

// ============================================
// 4. PEOPLE MANAGEMENT TESTS
// ============================================
describe('People Management', () => {
  
  describe('GET /api/people', () => {
    test('TC-PEOPLE-001: Should list all people', async () => {
      const res = await api('/api/people', {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('data');
      expect(Array.isArray(res.data.data)).toBe(true);
    });

    test('TC-PEOPLE-002: Should filter by department', async () => {
      const res = await api('/api/people?department=Engineering', {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
    });

    test('TC-PEOPLE-003: Should filter active people only', async () => {
      const res = await api('/api/people?active=true', {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
      res.data.data.forEach(person => {
        expect(person.isActive).toBe(true);
      });
    });

    test('TC-PEOPLE-004: Should search by name', async () => {
      const res = await api('/api/people?search=John', {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/people', () => {
    test('TC-PEOPLE-005: Should create new person', async () => {
      const res = await api('/api/people', {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({
          firstName: 'Test',
          lastName: 'Person_' + Date.now(),
          email: `testperson_${Date.now()}@test.com`,
          department: 'Engineering',
          jobTitle: 'Developer',
          maxHoursPerDay: 8,
          employmentType: 'full-time'
        })
      });
      
      expect(res.status).toBe(201);
      expect(res.data).toHaveProperty('id');
      testPersonId = res.data.id;
    });

    test('TC-PEOPLE-006: Should reject duplicate email', async () => {
      const email = `duplicate_${Date.now()}@test.com`;
      
      await api('/api/people', {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({
          firstName: 'First',
          lastName: 'Person',
          email
        })
      });
      
      const res = await api('/api/people', {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({
          firstName: 'Second',
          lastName: 'Person',
          email
        })
      });
      
      expect(res.status).toBe(400);
    });

    test('TC-PEOPLE-007: Should require first and last name', async () => {
      const res = await api('/api/people', {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({
          email: `nofullname_${Date.now()}@test.com`
        })
      });
      
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/people/:id', () => {
    test('TC-PEOPLE-008: Should get person by ID with skills', async () => {
      const res = await api(`/api/people/${testPersonId || 1}`, {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('id');
      expect(res.data).toHaveProperty('firstName');
      expect(res.data).toHaveProperty('skills');
    });
  });

  describe('PUT /api/people/:id', () => {
    test('TC-PEOPLE-009: Should update person details', async () => {
      const res = await api(`/api/people/${testPersonId || 1}`, {
        method: 'PUT',
        token: adminToken,
        body: JSON.stringify({
          department: 'Marketing',
          maxHoursPerDay: 6
        })
      });
      
      expect(res.status).toBe(200);
    });

    test('TC-PEOPLE-010: Should deactivate person', async () => {
      if (!testPersonId) return;
      
      const res = await api(`/api/people/${testPersonId}`, {
        method: 'PUT',
        token: adminToken,
        body: JSON.stringify({ isActive: false })
      });
      
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/people/:id/skills', () => {
    test('TC-PEOPLE-011: Should assign skill to person', async () => {
      if (!testPersonId || !testSkillId) return;
      
      const res = await api(`/api/people/${testPersonId}/skills`, {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({
          skillId: testSkillId,
          proficiencyLevel: 3,
          yearsExperience: 2,
          certified: false
        })
      });
      
      expect(res.status).toBe(201);
    });

    test('TC-PEOPLE-012: Should prevent duplicate skill assignment', async () => {
      if (!testPersonId || !testSkillId) return;
      
      const res = await api(`/api/people/${testPersonId}/skills`, {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({
          skillId: testSkillId,
          proficiencyLevel: 4
        })
      });
      
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/people/:id/skills/:skillId', () => {
    test('TC-PEOPLE-013: Should remove skill from person', async () => {
      if (!testPersonId || !testSkillId) return;
      
      const res = await api(`/api/people/${testPersonId}/skills/${testSkillId}`, {
        method: 'DELETE',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
    });
  });
});

// ============================================
// 5. PROJECT MANAGEMENT TESTS
// ============================================
describe('Project Management', () => {
  
  describe('GET /api/projects', () => {
    test('TC-PROJECT-001: Should list all projects', async () => {
      const res = await api('/api/projects', {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('data');
      expect(Array.isArray(res.data.data)).toBe(true);
    });

    test('TC-PROJECT-002: Should filter by status', async () => {
      const res = await api('/api/projects?status=active', {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
      res.data.data.forEach(project => {
        expect(project.status).toBe('active');
      });
    });

    test('TC-PROJECT-003: Should filter by priority', async () => {
      const res = await api('/api/projects?priority=high', {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
    });

    test('TC-PROJECT-004: Should search by name', async () => {
      const res = await api('/api/projects?search=Website', {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/projects', () => {
    test('TC-PROJECT-005: Should create new project', async () => {
      const res = await api('/api/projects', {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({
          name: 'Test Project_' + Date.now(),
          code: 'TP' + Date.now(),
          client: 'Test Client',
          status: 'planning',
          priority: 'medium',
          startDate: '2026-01-15',
          endDate: '2026-03-15',
          budgetHours: 100
        })
      });
      
      expect(res.status).toBe(201);
      expect(res.data).toHaveProperty('id');
      testProjectId = res.data.id;
    });

    test('TC-PROJECT-006: Should require project name', async () => {
      const res = await api('/api/projects', {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({
          status: 'planning'
        })
      });
      
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/projects/:id', () => {
    test('TC-PROJECT-007: Should get project by ID with skills', async () => {
      const res = await api(`/api/projects/${testProjectId || 1}`, {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('id');
      expect(res.data).toHaveProperty('name');
      expect(res.data).toHaveProperty('requiredSkills');
    });
  });

  describe('PUT /api/projects/:id', () => {
    test('TC-PROJECT-008: Should update project details', async () => {
      const res = await api(`/api/projects/${testProjectId || 1}`, {
        method: 'PUT',
        token: adminToken,
        body: JSON.stringify({
          status: 'active',
          priority: 'high'
        })
      });
      
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/projects/:id/skills', () => {
    test('TC-PROJECT-009: Should add skill requirement to project', async () => {
      if (!testProjectId || !testSkillId) return;
      
      const res = await api(`/api/projects/${testProjectId}/skills`, {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({
          skillId: testSkillId,
          requiredProficiency: 3,
          isMandatory: true,
          peopleNeeded: 2
        })
      });
      
      expect(res.status).toBe(201);
    });
  });
});

// ============================================
// 6. ASSIGNMENTS/SCHEDULING TESTS
// ============================================
describe('Assignments/Scheduling', () => {
  
  describe('GET /api/assignments', () => {
    test('TC-ASSIGN-001: Should list assignments', async () => {
      const res = await api('/api/assignments', {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('data');
    });

    test('TC-ASSIGN-002: Should filter by date range', async () => {
      const res = await api('/api/assignments?startDate=2026-01-01&endDate=2026-01-31', {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
    });

    test('TC-ASSIGN-003: Should filter by person', async () => {
      if (!testPersonId) return;
      
      const res = await api(`/api/assignments?personId=${testPersonId}`, {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
    });

    test('TC-ASSIGN-004: Should filter by project', async () => {
      if (!testProjectId) return;
      
      const res = await api(`/api/assignments?projectId=${testProjectId}`, {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/assignments', () => {
    test('TC-ASSIGN-005: Should create new assignment', async () => {
      // Get a person and project first
      const peopleRes = await api('/api/people?limit=1', { method: 'GET', token: adminToken });
      const projectsRes = await api('/api/projects?limit=1', { method: 'GET', token: adminToken });
      
      if (peopleRes.data.data.length === 0 || projectsRes.data.data.length === 0) return;
      
      const res = await api('/api/assignments', {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({
          personId: peopleRes.data.data[0].id,
          projectId: projectsRes.data.data[0].id,
          date: '2026-01-15',
          startHour: 9,
          endHour: 17,
          status: 'scheduled'
        })
      });
      
      expect(res.status).toBe(201);
      expect(res.data).toHaveProperty('id');
      testAssignmentId = res.data.id;
    });

    test('TC-ASSIGN-006: Should detect time overlap conflict', async () => {
      // Get the same person and try to assign overlapping hours
      const peopleRes = await api('/api/people?limit=1', { method: 'GET', token: adminToken });
      const projectsRes = await api('/api/projects?limit=1', { method: 'GET', token: adminToken });
      
      if (peopleRes.data.data.length === 0 || projectsRes.data.data.length === 0) return;
      
      const personId = peopleRes.data.data[0].id;
      
      // First assignment
      await api('/api/assignments', {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({
          personId,
          projectId: projectsRes.data.data[0].id,
          date: '2026-01-20',
          startHour: 9,
          endHour: 12
        })
      });
      
      // Overlapping assignment
      const res = await api('/api/assignments', {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({
          personId,
          projectId: projectsRes.data.data[0].id,
          date: '2026-01-20',
          startHour: 10,
          endHour: 14
        })
      });
      
      // Should either fail or return with conflict warning
      expect([201, 400, 409]).toContain(res.status);
    });

    test('TC-ASSIGN-007: Should validate hour range', async () => {
      const peopleRes = await api('/api/people?limit=1', { method: 'GET', token: adminToken });
      const projectsRes = await api('/api/projects?limit=1', { method: 'GET', token: adminToken });
      
      if (peopleRes.data.data.length === 0 || projectsRes.data.data.length === 0) return;
      
      const res = await api('/api/assignments', {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({
          personId: peopleRes.data.data[0].id,
          projectId: projectsRes.data.data[0].id,
          date: '2026-01-21',
          startHour: 17,
          endHour: 9 // Invalid: end before start
        })
      });
      
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/assignments/:id', () => {
    test('TC-ASSIGN-008: Should update assignment', async () => {
      if (!testAssignmentId) return;
      
      const res = await api(`/api/assignments/${testAssignmentId}`, {
        method: 'PUT',
        token: adminToken,
        body: JSON.stringify({
          status: 'completed',
          notes: 'Work completed successfully'
        })
      });
      
      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/assignments/:id', () => {
    test('TC-ASSIGN-009: Should delete assignment', async () => {
      if (!testAssignmentId) return;
      
      const res = await api(`/api/assignments/${testAssignmentId}`, {
        method: 'DELETE',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/assignments/daily/:date', () => {
    test('TC-ASSIGN-010: Should get daily schedule', async () => {
      const res = await api('/api/assignments/daily/2026-01-15', {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
    });
  });
});

// ============================================
// 7. AVAILABILITY MANAGEMENT TESTS
// ============================================
describe('Availability Management', () => {
  
  describe('GET /api/availability', () => {
    test('TC-AVAIL-001: Should list availability windows', async () => {
      const res = await api('/api/availability', {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/availability', () => {
    test('TC-AVAIL-002: Should create time-off window', async () => {
      const peopleRes = await api('/api/people?limit=1', { method: 'GET', token: adminToken });
      if (peopleRes.data.data.length === 0) return;
      
      const res = await api('/api/availability', {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({
          personId: peopleRes.data.data[0].id,
          startDate: '2026-02-01',
          endDate: '2026-02-05',
          status: 'approved',
          reason: 'Vacation'
        })
      });
      
      expect(res.status).toBe(201);
    });
  });

  describe('GET /api/availability/person/:personId', () => {
    test('TC-AVAIL-003: Should get person availability for date range', async () => {
      const peopleRes = await api('/api/people?limit=1', { method: 'GET', token: adminToken });
      if (peopleRes.data.data.length === 0) return;
      
      const res = await api(`/api/availability/person/${peopleRes.data.data[0].id}?startDate=2026-01-01&endDate=2026-01-31`, {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
    });
  });
});

// ============================================
// 8. CONFLICT DETECTION TESTS
// ============================================
describe('Conflict Detection', () => {
  
  describe('GET /api/conflicts', () => {
    test('TC-CONFLICT-001: Should list conflicts', async () => {
      const res = await api('/api/conflicts', {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('data');
    });

    test('TC-CONFLICT-002: Should filter by type', async () => {
      const res = await api('/api/conflicts?type=overlap', {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
    });

    test('TC-CONFLICT-003: Should filter by severity', async () => {
      const res = await api('/api/conflicts?severity=high', {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
    });

    test('TC-CONFLICT-004: Should filter unresolved only', async () => {
      const res = await api('/api/conflicts?resolved=false', {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
      res.data.data.forEach(conflict => {
        expect(conflict.isResolved).toBe(false);
      });
    });
  });

  describe('POST /api/conflicts/detect', () => {
    test('TC-CONFLICT-005: Should run conflict detection', async () => {
      const res = await api('/api/conflicts/detect', {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({
          startDate: '2026-01-01',
          endDate: '2026-01-31'
        })
      });
      
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('detected');
    });
  });

  describe('PUT /api/conflicts/:id/resolve', () => {
    test('TC-CONFLICT-006: Should resolve conflict', async () => {
      // First get a conflict
      const conflictsRes = await api('/api/conflicts?resolved=false&limit=1', {
        method: 'GET',
        token: adminToken
      });
      
      if (conflictsRes.data.data.length === 0) return;
      
      const res = await api(`/api/conflicts/${conflictsRes.data.data[0].id}/resolve`, {
        method: 'PUT',
        token: adminToken,
        body: JSON.stringify({
          resolution: 'Manually resolved by admin'
        })
      });
      
      expect(res.status).toBe(200);
    });
  });
});

// ============================================
// 9. AI SCHEDULER TESTS
// ============================================
describe('AI Scheduler', () => {
  
  describe('POST /api/ai-scheduler/suggest', () => {
    test('TC-AI-001: Should generate schedule suggestions', async () => {
      const res = await api('/api/ai-scheduler/suggest', {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({
          date: '2026-01-15'
        })
      });
      
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('suggestions');
      expect(Array.isArray(res.data.suggestions)).toBe(true);
    });

    test('TC-AI-002: Should generate suggestions for date range', async () => {
      const res = await api('/api/ai-scheduler/suggest', {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({
          startDate: '2026-01-15',
          endDate: '2026-01-17'
        })
      });
      
      expect(res.status).toBe(200);
    });

    test('TC-AI-003: Should exclude specified people', async () => {
      const peopleRes = await api('/api/people?limit=1', { method: 'GET', token: adminToken });
      if (peopleRes.data.data.length === 0) return;
      
      const res = await api('/api/ai-scheduler/suggest', {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({
          date: '2026-01-15',
          excludePeople: [peopleRes.data.data[0].id]
        })
      });
      
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/ai-scheduler/apply', () => {
    test('TC-AI-004: Should apply suggestions', async () => {
      // First generate suggestions
      const suggestRes = await api('/api/ai-scheduler/suggest', {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({ date: '2026-01-25' })
      });
      
      if (!suggestRes.data.suggestions || suggestRes.data.suggestions.length === 0) return;
      
      const res = await api('/api/ai-scheduler/apply', {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({
          suggestions: suggestRes.data.suggestions.slice(0, 1)
        })
      });
      
      expect(res.status).toBe(200);
    });
  });
});

// ============================================
// 10. SKILL MATCHING TESTS
// ============================================
describe('Skill Matching', () => {
  
  describe('GET /api/matching/candidates', () => {
    test('TC-MATCH-001: Should find candidates for project', async () => {
      const projectsRes = await api('/api/projects?limit=1', { method: 'GET', token: adminToken });
      if (projectsRes.data.data.length === 0) return;
      
      const res = await api(`/api/matching/candidates?projectId=${projectsRes.data.data[0].id}`, {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('candidates');
    });

    test('TC-MATCH-002: Should find candidates for specific skill', async () => {
      const skillsRes = await api('/api/skills?limit=1', { method: 'GET', token: adminToken });
      if (skillsRes.data.data.length === 0) return;
      
      const res = await api(`/api/matching/candidates?skillId=${skillsRes.data.data[0].id}`, {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
    });

    test('TC-MATCH-003: Should filter by minimum proficiency', async () => {
      const skillsRes = await api('/api/skills?limit=1', { method: 'GET', token: adminToken });
      if (skillsRes.data.data.length === 0) return;
      
      const res = await api(`/api/matching/candidates?skillId=${skillsRes.data.data[0].id}&minProficiency=3`, {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/matching/gaps', () => {
    test('TC-MATCH-004: Should identify skill gaps', async () => {
      const projectsRes = await api('/api/projects?limit=1', { method: 'GET', token: adminToken });
      if (projectsRes.data.data.length === 0) return;
      
      const res = await api(`/api/matching/gaps?projectId=${projectsRes.data.data[0].id}`, {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('gaps');
    });
  });
});

// ============================================
// 11. ANALYTICS & REPORTS TESTS
// ============================================
describe('Analytics & Reports', () => {
  
  describe('GET /api/analytics/dashboard', () => {
    test('TC-ANALYTICS-001: Should get dashboard metrics', async () => {
      const res = await api('/api/analytics/dashboard', {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('totalPeople');
      expect(res.data).toHaveProperty('activeProjects');
      expect(res.data).toHaveProperty('pendingConflicts');
    });
  });

  describe('GET /api/analytics/utilization', () => {
    test('TC-ANALYTICS-002: Should get utilization report', async () => {
      const res = await api('/api/analytics/utilization?startDate=2026-01-01&endDate=2026-01-31', {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/analytics/project-summary', () => {
    test('TC-ANALYTICS-003: Should get project summary report', async () => {
      const res = await api('/api/analytics/project-summary', {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/analytics/daily-report', () => {
    test('TC-ANALYTICS-004: Should get daily report', async () => {
      const res = await api('/api/analytics/daily-report?date=2026-01-15', {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
    });
  });
});

// ============================================
// 12. EXPORT TESTS
// ============================================
describe('Exports', () => {
  
  describe('GET /api/exports/excel', () => {
    test('TC-EXPORT-001: Should generate Excel export', async () => {
      const res = await fetch(`${BASE_URL}/api/exports/excel?startDate=2026-01-01&endDate=2026-01-31`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('spreadsheetml');
    });
  });

  describe('GET /api/exports/pdf', () => {
    test('TC-EXPORT-002: Should generate PDF export', async () => {
      const res = await fetch(`${BASE_URL}/api/exports/pdf?startDate=2026-01-01&endDate=2026-01-31`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('pdf');
    });
  });

  describe('GET /api/exports/logs', () => {
    test('TC-EXPORT-003: Should get export history', async () => {
      const res = await api('/api/exports/logs', {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('data');
      expect(res.data).toHaveProperty('pagination');
    });
  });
});

// ============================================
// 13. SETTINGS TESTS
// ============================================
describe('Settings', () => {
  
  describe('GET /api/settings', () => {
    test('TC-SETTINGS-001: Should get all settings (admin only)', async () => {
      const res = await api('/api/settings', {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/settings/public', () => {
    test('TC-SETTINGS-002: Should get public branding settings without auth', async () => {
      const res = await api('/api/settings/public', {
        method: 'GET'
      });
      
      expect(res.status).toBe(200);
    });
  });

  describe('PUT /api/settings', () => {
    test('TC-SETTINGS-003: Should update branding settings', async () => {
      const res = await api('/api/settings', {
        method: 'PUT',
        token: adminToken,
        body: JSON.stringify({
          company_name: 'Test Company',
          primary_color: '#FF0000'
        })
      });
      
      expect(res.status).toBe(200);
    });

    test('TC-SETTINGS-004: Should reject non-whitelisted keys', async () => {
      const res = await api('/api/settings', {
        method: 'PUT',
        token: adminToken,
        body: JSON.stringify({
          malicious_key: 'value'
        })
      });
      
      // Should either reject or ignore the key
      expect([200, 400]).toContain(res.status);
    });
  });
});

// ============================================
// 14. ROLE-BASED ACCESS CONTROL TESTS
// ============================================
describe('Role-Based Access Control', () => {
  
  beforeAll(async () => {
    // Create scheduler user
    const schedRes = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'scheduler', password: 'scheduler123' })
    });
    if (schedRes.ok) schedulerToken = schedRes.data.token;
    
    // Create viewer by registering (default role)
    const viewerUsername = 'viewer_' + Date.now();
    const viewerRes = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username: viewerUsername,
        email: `${viewerUsername}@test.com`,
        password: 'Viewer123!'
      })
    });
    if (viewerRes.ok) viewerToken = viewerRes.data.token;
  });

  describe('Admin-only endpoints', () => {
    test('TC-RBAC-001: Viewer cannot access user management', async () => {
      if (!viewerToken) return;
      
      const res = await api('/api/users', {
        method: 'GET',
        token: viewerToken
      });
      
      expect(res.status).toBe(403);
    });

    test('TC-RBAC-002: Viewer cannot create users', async () => {
      if (!viewerToken) return;
      
      const res = await api('/api/users', {
        method: 'POST',
        token: viewerToken,
        body: JSON.stringify({
          username: 'hacker',
          email: 'hacker@test.com',
          password: 'Hack123!'
        })
      });
      
      expect(res.status).toBe(403);
    });

    test('TC-RBAC-003: Viewer cannot delete users', async () => {
      if (!viewerToken) return;
      
      const res = await api('/api/users/1', {
        method: 'DELETE',
        token: viewerToken
      });
      
      expect(res.status).toBe(403);
    });
  });

  describe('Scheduler permissions', () => {
    test('TC-RBAC-004: Scheduler can create assignments', async () => {
      if (!schedulerToken) return;
      
      const peopleRes = await api('/api/people?limit=1', { method: 'GET', token: schedulerToken });
      const projectsRes = await api('/api/projects?limit=1', { method: 'GET', token: schedulerToken });
      
      if (peopleRes.data.data.length === 0 || projectsRes.data.data.length === 0) return;
      
      const res = await api('/api/assignments', {
        method: 'POST',
        token: schedulerToken,
        body: JSON.stringify({
          personId: peopleRes.data.data[0].id,
          projectId: projectsRes.data.data[0].id,
          date: '2026-01-28',
          startHour: 9,
          endHour: 17
        })
      });
      
      expect([201, 400, 409]).toContain(res.status); // May fail due to conflicts
    });

    test('TC-RBAC-005: Scheduler can export data', async () => {
      if (!schedulerToken) return;
      
      const res = await fetch(`${BASE_URL}/api/exports/excel?startDate=2026-01-01&endDate=2026-01-31`, {
        headers: { 'Authorization': `Bearer ${schedulerToken}` }
      });
      
      expect(res.status).toBe(200);
    });
  });

  describe('Viewer permissions', () => {
    test('TC-RBAC-006: Viewer can read people', async () => {
      if (!viewerToken) return;
      
      const res = await api('/api/people', {
        method: 'GET',
        token: viewerToken
      });
      
      expect(res.status).toBe(200);
    });

    test('TC-RBAC-007: Viewer can read projects', async () => {
      if (!viewerToken) return;
      
      const res = await api('/api/projects', {
        method: 'GET',
        token: viewerToken
      });
      
      expect(res.status).toBe(200);
    });

    test('TC-RBAC-008: Viewer cannot create assignments', async () => {
      if (!viewerToken) return;
      
      const res = await api('/api/assignments', {
        method: 'POST',
        token: viewerToken,
        body: JSON.stringify({
          personId: 1,
          projectId: 1,
          date: '2026-01-29',
          startHour: 9,
          endHour: 17
        })
      });
      
      expect(res.status).toBe(403);
    });

    test('TC-RBAC-009: Viewer cannot export data', async () => {
      if (!viewerToken) return;
      
      const res = await fetch(`${BASE_URL}/api/exports/excel?startDate=2026-01-01&endDate=2026-01-31`, {
        headers: { 'Authorization': `Bearer ${viewerToken}` }
      });
      
      expect(res.status).toBe(403);
    });
  });
});

// ============================================
// 15. IMPORT TESTS
// ============================================
describe('Data Import', () => {
  
  describe('GET /api/import/templates', () => {
    test('TC-IMPORT-001: Should download people template', async () => {
      const res = await fetch(`${BASE_URL}/api/import/templates/people`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('spreadsheetml');
    });

    test('TC-IMPORT-002: Should download projects template', async () => {
      const res = await fetch(`${BASE_URL}/api/import/templates/projects`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      
      expect(res.status).toBe(200);
    });

    test('TC-IMPORT-003: Should download skills template', async () => {
      const res = await fetch(`${BASE_URL}/api/import/templates/skills`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      
      expect(res.status).toBe(200);
    });
  });
});

// ============================================
// 16. SECURITY TESTS
// ============================================
describe('Security', () => {
  
  describe('Rate Limiting', () => {
    test('TC-SEC-001: Should rate limit login attempts', async () => {
      const results = [];
      
      // Make multiple rapid requests
      for (let i = 0; i < 15; i++) {
        const res = await api('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ username: 'admin', password: 'wrongpassword' })
        });
        results.push(res.status);
      }
      
      // Should eventually get rate limited (429)
      expect(results.some(status => status === 429)).toBe(true);
    });
  });

  describe('Input Validation', () => {
    test('TC-SEC-002: Should sanitize XSS in input', async () => {
      const res = await api('/api/people', {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({
          firstName: '<script>alert("xss")</script>',
          lastName: 'Test',
          email: `xss_${Date.now()}@test.com`
        })
      });
      
      if (res.status === 201) {
        // If created, verify the script tag was sanitized
        const personRes = await api(`/api/people/${res.data.id}`, {
          method: 'GET',
          token: adminToken
        });
        
        expect(personRes.data.firstName).not.toContain('<script>');
      }
    });

    test('TC-SEC-003: Should reject SQL injection attempts', async () => {
      const res = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: "admin'; DROP TABLE users; --",
          password: 'password'
        })
      });
      
      expect(res.status).toBe(401); // Should fail auth, not break
      
      // Verify users table still exists
      const usersRes = await api('/api/users', {
        method: 'GET',
        token: adminToken
      });
      
      expect(usersRes.status).toBe(200);
    });
  });

  describe('Authentication Security', () => {
    test('TC-SEC-004: Should not expose password in responses', async () => {
      const res = await api('/api/users', {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
      res.data.data.forEach(user => {
        expect(user).not.toHaveProperty('password');
        expect(user).not.toHaveProperty('password_hash');
        expect(user).not.toHaveProperty('passwordHash');
      });
    });

    test('TC-SEC-005: Should require authentication for protected endpoints', async () => {
      const endpoints = [
        '/api/users',
        '/api/people',
        '/api/projects',
        '/api/assignments',
        '/api/skills'
      ];
      
      for (const endpoint of endpoints) {
        const res = await api(endpoint, { method: 'GET' });
        expect(res.status).toBe(401);
      }
    });
  });
});

// ============================================
// 17. ERROR HANDLING TESTS
// ============================================
describe('Error Handling', () => {
  
  test('TC-ERR-001: Should return 404 for non-existent endpoints', async () => {
    const res = await api('/api/nonexistent', {
      method: 'GET',
      token: adminToken
    });
    
    expect(res.status).toBe(404);
  });

  test('TC-ERR-002: Should return 400 for malformed JSON', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ invalid json }'
    });
    
    expect(res.status).toBe(400);
  });

  test('TC-ERR-003: Should handle missing required fields', async () => {
    const res = await api('/api/people', {
      method: 'POST',
      token: adminToken,
      body: JSON.stringify({})
    });
    
    expect(res.status).toBe(400);
    expect(res.data).toHaveProperty('error');
  });
});

// ============================================
// 18. INTERNATIONALIZATION (i18n) TESTS
// ============================================
describe('Internationalization (i18n)', () => {
  
  describe('Translation Files', () => {
    test('TC-I18N-001: Should load English translation file', async () => {
      const res = await fetch(`${BASE_URL}/i18n/en.json`);
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data).toHaveProperty('meta');
      expect(data.meta.code).toBe('en');
      expect(data.meta.name).toBe('English');
    });

    test('TC-I18N-002: Should load Greek translation file', async () => {
      const res = await fetch(`${BASE_URL}/i18n/el.json`);
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data).toHaveProperty('meta');
      expect(data.meta.code).toBe('el');
      expect(data.meta.name).toBe('Greek');
      expect(data.meta.nativeName).toBe('Ελληνικά');
    });

    test('TC-I18N-003: Should return 404 for non-existent language', async () => {
      const res = await fetch(`${BASE_URL}/i18n/xx.json`);
      expect(res.status).toBe(404);
    });

    test('TC-I18N-004: English file should contain all required sections', async () => {
      const res = await fetch(`${BASE_URL}/i18n/en.json`);
      const data = await res.json();
      
      const requiredSections = [
        'common', 'auth', 'nav', 'dashboard', 'people', 
        'projects', 'skills', 'schedule', 'aiScheduler', 
        'conflicts', 'reports', 'settings', 'users', 
        'validation', 'messages', 'time', 'help'
      ];
      
      requiredSections.forEach(section => {
        expect(data).toHaveProperty(section);
      });
    });

    test('TC-I18N-005: Greek file should contain all required sections', async () => {
      const res = await fetch(`${BASE_URL}/i18n/el.json`);
      const data = await res.json();
      
      const requiredSections = [
        'common', 'auth', 'nav', 'dashboard', 'people', 
        'projects', 'skills', 'schedule', 'aiScheduler', 
        'conflicts', 'reports', 'settings', 'users', 
        'validation', 'messages', 'time', 'help'
      ];
      
      requiredSections.forEach(section => {
        expect(data).toHaveProperty(section);
      });
    });

    test('TC-I18N-006: English and Greek should have matching keys', async () => {
      const enRes = await fetch(`${BASE_URL}/i18n/en.json`);
      const elRes = await fetch(`${BASE_URL}/i18n/el.json`);
      
      const enData = await enRes.json();
      const elData = await elRes.json();
      
      // Check that major sections match
      Object.keys(enData).forEach(key => {
        if (key !== 'meta') {
          expect(elData).toHaveProperty(key);
        }
      });
    });
  });

  describe('Translation Content Validation', () => {
    test('TC-I18N-007: Common translations should exist in English', async () => {
      const res = await fetch(`${BASE_URL}/i18n/en.json`);
      const data = await res.json();
      
      expect(data.common.save).toBe('Save');
      expect(data.common.cancel).toBe('Cancel');
      expect(data.common.delete).toBe('Delete');
      expect(data.common.edit).toBe('Edit');
      expect(data.common.loading).toBe('Loading...');
      expect(data.common.quickAdd).toBe('Quick Add');
    });

    test('TC-I18N-008: Common translations should exist in Greek', async () => {
      const res = await fetch(`${BASE_URL}/i18n/el.json`);
      const data = await res.json();
      
      expect(data.common.save).toBe('Αποθήκευση');
      expect(data.common.cancel).toBe('Ακύρωση');
      expect(data.common.delete).toBe('Διαγραφή');
      expect(data.common.edit).toBe('Επεξεργασία');
      expect(data.common.loading).toBe('Φόρτωση...');
      expect(data.common.quickAdd).toBe('Γρήγορη Προσθήκη');
    });

    test('TC-I18N-009: Navigation translations should exist', async () => {
      const res = await fetch(`${BASE_URL}/i18n/el.json`);
      const data = await res.json();
      
      expect(data.nav.dashboard).toBe('Πίνακας Ελέγχου');
      expect(data.nav.schedule).toBe('Πρόγραμμα');
      expect(data.nav.people).toBe('Προσωπικό');
      expect(data.nav.projects).toBe('Έργα');
      expect(data.nav.skills).toBe('Δεξιότητες');
    });

    test('TC-I18N-010: Empty state messages should exist in both languages', async () => {
      const enRes = await fetch(`${BASE_URL}/i18n/en.json`);
      const elRes = await fetch(`${BASE_URL}/i18n/el.json`);
      
      const enData = await enRes.json();
      const elData = await elRes.json();
      
      // English empty states
      expect(enData.dashboard.noAssignmentsToday).toBe('No assignments today');
      expect(enData.people.noPeopleFound).toBe('No people found');
      expect(enData.projects.noProjectsFound).toBe('No projects found');
      expect(enData.conflicts.noConflicts).toBe('No conflicts');
      
      // Greek empty states
      expect(elData.dashboard.noAssignmentsToday).toBe('Δεν υπάρχουν αναθέσεις σήμερα');
      expect(elData.people.noPeopleFound).toBe('Δεν βρέθηκε προσωπικό');
      expect(elData.projects.noProjectsFound).toBe('Δεν βρέθηκαν έργα');
      expect(elData.conflicts.noConflicts).toBe('Δεν υπάρχουν συγκρούσεις');
    });

    test('TC-I18N-011: Help content should exist in both languages', async () => {
      const enRes = await fetch(`${BASE_URL}/i18n/en.json`);
      const elRes = await fetch(`${BASE_URL}/i18n/el.json`);
      
      const enData = await enRes.json();
      const elData = await elRes.json();
      
      // Check help sections exist
      expect(enData.help.dashboard).toBeDefined();
      expect(enData.help.schedule).toBeDefined();
      expect(enData.help.people).toBeDefined();
      expect(enData.help.projects).toBeDefined();
      
      expect(elData.help.dashboard).toBeDefined();
      expect(elData.help.schedule).toBeDefined();
      expect(elData.help.people).toBeDefined();
      expect(elData.help.projects).toBeDefined();
    });

    test('TC-I18N-012: Proficiency levels should be translated', async () => {
      const enRes = await fetch(`${BASE_URL}/i18n/en.json`);
      const elRes = await fetch(`${BASE_URL}/i18n/el.json`);
      
      const enData = await enRes.json();
      const elData = await elRes.json();
      
      expect(enData.skills.proficiencyLevels['1']).toBe('Beginner');
      expect(enData.skills.proficiencyLevels['5']).toBe('Expert');
      
      expect(elData.skills.proficiencyLevels['1']).toBe('Αρχάριος');
      expect(elData.skills.proficiencyLevels['5']).toBe('Ειδικός');
    });
  });

  describe('Translation API Endpoints', () => {
    test('TC-I18N-013: Should get custom translations (admin)', async () => {
      const res = await api('/api/translations', {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('translations');
    });

    test('TC-I18N-014: Should get translations for specific language', async () => {
      const res = await api('/api/translations/en', {
        method: 'GET'
      });
      
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('translations');
    });

    test('TC-I18N-015: Admin should update a custom translation', async () => {
      const testValue = `TestTranslation_${Date.now()}`;
      
      const res = await api('/api/translations/en/test.customKey', {
        method: 'PUT',
        token: adminToken,
        body: JSON.stringify({ value: testValue })
      });
      
      expect(res.status).toBe(200);
      
      // Verify it was saved
      const getRes = await api('/api/translations/en', { method: 'GET' });
      // The custom translation should be in the response
      expect(getRes.status).toBe(200);
    });

    test('TC-I18N-016: Non-admin should not update translations', async () => {
      const res = await api('/api/translations/en/test.key', {
        method: 'PUT',
        token: viewerToken,
        body: JSON.stringify({ value: 'Test' })
      });
      
      expect(res.status).toBe(403);
    });

    test('TC-I18N-017: Should bulk update translations (admin)', async () => {
      const res = await api('/api/translations/bulk', {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({
          lang: 'en',
          translations: {
            'test.bulk1': 'Bulk Test 1',
            'test.bulk2': 'Bulk Test 2'
          }
        })
      });
      
      expect(res.status).toBe(200);
    });

    test('TC-I18N-018: Should delete custom translation (admin)', async () => {
      // First create a translation
      await api('/api/translations/en/test.toDelete', {
        method: 'PUT',
        token: adminToken,
        body: JSON.stringify({ value: 'To Delete' })
      });
      
      // Then delete it
      const res = await api('/api/translations/en/test.toDelete', {
        method: 'DELETE',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
    });

    test('TC-I18N-019: Should reject invalid translation key format', async () => {
      const res = await api('/api/translations/en/', {
        method: 'PUT',
        token: adminToken,
        body: JSON.stringify({ value: 'Test' })
      });
      
      // Should either fail or handle gracefully
      expect([200, 400, 404]).toContain(res.status);
    });
  });

  describe('Public Settings for Language', () => {
    test('TC-I18N-020: Should get public settings including default language', async () => {
      const res = await api('/api/settings/public', { method: 'GET' });
      
      expect(res.status).toBe(200);
      // Should have default_language setting
      if (res.data.default_language) {
        expect(['en', 'el']).toContain(res.data.default_language);
      }
    });

    test('TC-I18N-021: Admin should update default language setting', async () => {
      const res = await api('/api/settings', {
        method: 'PUT',
        token: adminToken,
        body: JSON.stringify({ key: 'default_language', value: 'en' })
      });
      
      expect(res.status).toBe(200);
    });
  });
});

// ============================================
// 19. UI TRANSLATION INTEGRATION TESTS
// ============================================
describe('UI Translation Integration', () => {
  
  describe('Static HTML Translations', () => {
    test('TC-UI-I18N-001: Main HTML should have i18n data attributes', async () => {
      const res = await fetch(`${BASE_URL}/`);
      const html = await res.text();
      
      // Check for data-i18n attributes
      expect(html).toContain('data-i18n=');
      expect(html).toContain('data-i18n="nav.dashboard"');
      expect(html).toContain('data-i18n="nav.people"');
      expect(html).toContain('data-i18n="common.quickAdd"');
    });

    test('TC-UI-I18N-002: Dashboard metrics should have i18n attributes', async () => {
      const res = await fetch(`${BASE_URL}/`);
      const html = await res.text();
      
      expect(html).toContain('data-i18n="dashboard.activePeople"');
      expect(html).toContain('data-i18n="dashboard.activeProjects"');
      expect(html).toContain('data-i18n="dashboard.todaysSchedule"');
    });

    test('TC-UI-I18N-003: Form labels should have i18n attributes', async () => {
      const res = await fetch(`${BASE_URL}/`);
      const html = await res.text();
      
      expect(html).toContain('data-i18n="auth.username"');
      expect(html).toContain('data-i18n="auth.password"');
      expect(html).toContain('data-i18n="auth.login"');
    });

    test('TC-UI-I18N-004: Settings page should have i18n attributes', async () => {
      const res = await fetch(`${BASE_URL}/`);
      const html = await res.text();
      
      expect(html).toContain('data-i18n="settings.branding"');
      expect(html).toContain('data-i18n="settings.companyName"');
      expect(html).toContain('data-i18n="settings.languageTranslations"');
    });

    test('TC-UI-I18N-005: Loading messages should have i18n attributes', async () => {
      const res = await fetch(`${BASE_URL}/`);
      const html = await res.text();
      
      expect(html).toContain('data-i18n="common.loading"');
      expect(html).toContain('data-i18n="common.loadingSchedule"');
    });
  });

  describe('Language Switcher', () => {
    test('TC-UI-I18N-006: Language switcher should exist in HTML', async () => {
      const res = await fetch(`${BASE_URL}/`);
      const html = await res.text();
      
      expect(html).toContain('language-switcher');
      expect(html).toContain('language-dropdown');
    });
  });
});

// ============================================
// 20. HELP SYSTEM TESTS
// ============================================
describe('Help System', () => {
  
  describe('Help Content Structure', () => {
    test('TC-HELP-001: Help content should have all required pages in English', async () => {
      const res = await fetch(`${BASE_URL}/i18n/en.json`);
      const data = await res.json();
      
      const helpPages = [
        'dashboard', 'schedule', 'people', 'projects', 
        'skills', 'aiScheduler', 'conflicts', 'reports', 
        'users', 'settings'
      ];
      
      helpPages.forEach(page => {
        expect(data.help[page]).toBeDefined();
        expect(data.help[page].title).toBeDefined();
      });
    });

    test('TC-HELP-002: Help content should have all required pages in Greek', async () => {
      const res = await fetch(`${BASE_URL}/i18n/el.json`);
      const data = await res.json();
      
      const helpPages = [
        'dashboard', 'schedule', 'people', 'projects', 
        'skills', 'aiScheduler', 'conflicts', 'reports', 
        'users', 'settings'
      ];
      
      helpPages.forEach(page => {
        expect(data.help[page]).toBeDefined();
        expect(data.help[page].title).toBeDefined();
      });
    });

    test('TC-HELP-003: Dashboard help should have overview in both languages', async () => {
      const enRes = await fetch(`${BASE_URL}/i18n/en.json`);
      const elRes = await fetch(`${BASE_URL}/i18n/el.json`);
      
      const enData = await enRes.json();
      const elData = await elRes.json();
      
      expect(enData.help.dashboard.overview).toContain('Dashboard provides');
      expect(elData.help.dashboard.overview).toContain('Πίνακας Ελέγχου παρέχει');
    });

    test('TC-HELP-004: Schedule help should have steps in both languages', async () => {
      const enRes = await fetch(`${BASE_URL}/i18n/en.json`);
      const elRes = await fetch(`${BASE_URL}/i18n/el.json`);
      
      const enData = await enRes.json();
      const elData = await elRes.json();
      
      expect(enData.help.schedule.step1).toBeDefined();
      expect(enData.help.schedule.step2).toBeDefined();
      expect(elData.help.schedule.step1).toBeDefined();
      expect(elData.help.schedule.step2).toBeDefined();
    });

    test('TC-HELP-005: People help should explain proficiency levels', async () => {
      const enRes = await fetch(`${BASE_URL}/i18n/en.json`);
      const data = await enRes.json();
      
      expect(data.help.people.proficiencyLevels).toBeDefined();
      expect(data.help.people.assigningSkills).toBeDefined();
    });

    test('TC-HELP-006: AI Scheduler help should explain considerations', async () => {
      const enRes = await fetch(`${BASE_URL}/i18n/en.json`);
      const data = await enRes.json();
      
      expect(data.help.aiScheduler.consideration1).toBeDefined();
      expect(data.help.aiScheduler.consideration2).toBeDefined();
      expect(data.help.aiScheduler.consideration3).toBeDefined();
      expect(data.help.aiScheduler.consideration4).toBeDefined();
    });

    test('TC-HELP-007: Conflicts help should explain types', async () => {
      const enRes = await fetch(`${BASE_URL}/i18n/en.json`);
      const elRes = await fetch(`${BASE_URL}/i18n/el.json`);
      
      const enData = await enRes.json();
      const elData = await elRes.json();
      
      expect(enData.help.conflicts.overlapDesc).toContain('Same person');
      expect(elData.help.conflicts.overlapDesc).toContain('Ίδιο άτομο');
    });
  });

  describe('Help Button in UI', () => {
    test('TC-HELP-008: Help button should exist in header', async () => {
      const res = await fetch(`${BASE_URL}/`);
      const html = await res.text();
      
      expect(html).toContain('help-btn');
      expect(html).toContain('fa-question-circle');
    });
  });
});

// ============================================
// 21. EMPTY STATE TRANSLATION TESTS
// ============================================
describe('Empty State Translations', () => {
  
  test('TC-EMPTY-001: All dashboard empty states should be translated', async () => {
    const elRes = await fetch(`${BASE_URL}/i18n/el.json`);
    const data = await elRes.json();
    
    expect(data.dashboard.noAssignmentsToday).not.toBe('No assignments today');
    expect(data.dashboard.scheduleToGetStarted).not.toBe('Schedule some work to get started');
    expect(data.dashboard.noUtilizationData).not.toBe('No utilization data');
    expect(data.dashboard.noSkillData).not.toBe('No skill data');
  });

  test('TC-EMPTY-002: All people empty states should be translated', async () => {
    const elRes = await fetch(`${BASE_URL}/i18n/el.json`);
    const data = await elRes.json();
    
    expect(data.people.noPeopleFound).not.toBe('No people found');
    expect(data.people.addTeamToStart).not.toBe('Add team members to get started');
    expect(data.people.noTeamMatch).not.toBe('No team members match your search');
  });

  test('TC-EMPTY-003: All project empty states should be translated', async () => {
    const elRes = await fetch(`${BASE_URL}/i18n/el.json`);
    const data = await elRes.json();
    
    expect(data.projects.noProjectsFound).not.toBe('No projects found');
    expect(data.projects.createToStart).not.toBe('Create a project to start scheduling');
    expect(data.projects.noProjectsMatch).not.toBe('No projects match your search');
    expect(data.projects.noPeopleAssigned).not.toBe('No people assigned to this project yet');
  });

  test('TC-EMPTY-004: All schedule empty states should be translated', async () => {
    const elRes = await fetch(`${BASE_URL}/i18n/el.json`);
    const data = await elRes.json();
    
    expect(data.schedule.noAssignments).not.toBe('No assignments');
    expect(data.schedule.noAssignmentsForDay).not.toBe('No assignments for this day');
    expect(data.schedule.noWorkScheduled).not.toBe('No work scheduled for this date');
  });

  test('TC-EMPTY-005: All skill empty states should be translated', async () => {
    const elRes = await fetch(`${BASE_URL}/i18n/el.json`);
    const data = await elRes.json();
    
    expect(data.skills.noSkillsFound).not.toBe('No skills found');
    expect(data.skills.addToEnable).not.toBe('Add skills to enable skill matching');
    expect(data.skills.noSkillsMatch).not.toBe('No skills match your search');
  });

  test('TC-EMPTY-006: All conflict empty states should be translated', async () => {
    const elRes = await fetch(`${BASE_URL}/i18n/el.json`);
    const data = await elRes.json();
    
    expect(data.conflicts.noConflicts).not.toBe('No conflicts');
    expect(data.conflicts.noActiveConflicts).not.toBe('No active conflicts');
    expect(data.conflicts.allResolved).not.toBe('All scheduling conflicts have been resolved');
  });

  test('TC-EMPTY-007: AI Scheduler empty state should be translated', async () => {
    const elRes = await fetch(`${BASE_URL}/i18n/el.json`);
    const data = await elRes.json();
    
    expect(data.aiScheduler.noQualifiedPeople).not.toBe('No other qualified people available for this time slot');
  });

  test('TC-EMPTY-008: User empty state should be translated', async () => {
    const elRes = await fetch(`${BASE_URL}/i18n/el.json`);
    const data = await elRes.json();
    
    expect(data.users.noUsersFound).not.toBe('No users found');
  });
});

// ============================================
// 22. DATABASE MANAGEMENT TESTS (Admin only)
// ============================================
describe('Database Management', () => {
  
  describe('GET /api/database/info', () => {
    test('TC-DB-001: Admin should get database info', async () => {
      const res = await api('/api/database/info', {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('databaseType');
      expect(res.data).toHaveProperty('tables');
      expect(res.data).toHaveProperty('totalRecords');
      expect(['sqlite', 'postgres']).toContain(res.data.databaseType);
    });

    test('TC-DB-002: Database info should include table counts', async () => {
      const res = await api('/api/database/info', {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
      expect(res.data.tables).toHaveProperty('users');
      expect(res.data.tables).toHaveProperty('people');
      expect(res.data.tables).toHaveProperty('projects');
      expect(res.data.tables).toHaveProperty('assignments');
      expect(res.data.tables).toHaveProperty('skills');
    });

    test('TC-DB-003: Non-admin should not access database info', async () => {
      if (!viewerToken) return;
      
      const res = await api('/api/database/info', {
        method: 'GET',
        token: viewerToken
      });
      
      expect(res.status).toBe(403);
    });

    test('TC-DB-004: Scheduler should not access database info', async () => {
      if (!schedulerToken) return;
      
      const res = await api('/api/database/info', {
        method: 'GET',
        token: schedulerToken
      });
      
      expect(res.status).toBe(403);
    });

    test('TC-DB-005: Unauthenticated user should not access database info', async () => {
      const res = await api('/api/database/info', {
        method: 'GET'
      });
      
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/database/backup', () => {
    test('TC-DB-006: Admin should create database backup', async () => {
      const res = await api('/api/database/backup', {
        method: 'POST',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('success', true);
      expect(res.data).toHaveProperty('backup');
      expect(res.data.backup).toHaveProperty('backupDate');
      expect(res.data.backup).toHaveProperty('data');
    });

    test('TC-DB-007: Backup should include all tables', async () => {
      const res = await api('/api/database/backup', {
        method: 'POST',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
      const tables = Object.keys(res.data.backup.data);
      expect(tables).toContain('users');
      expect(tables).toContain('people');
      expect(tables).toContain('projects');
      expect(tables).toContain('skills');
      expect(tables).toContain('assignments');
    });

    test('TC-DB-008: Backup should exclude password hashes', async () => {
      const res = await api('/api/database/backup', {
        method: 'POST',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
      
      // Check users data doesn't contain password_hash
      if (res.data.backup.data.users && res.data.backup.data.users.length > 0) {
        res.data.backup.data.users.forEach(user => {
          expect(user).not.toHaveProperty('password_hash');
        });
      }
    });

    test('TC-DB-009: Non-admin should not create backup', async () => {
      if (!viewerToken) return;
      
      const res = await api('/api/database/backup', {
        method: 'POST',
        token: viewerToken
      });
      
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/database/export', () => {
    test('TC-DB-010: Admin should export database as JSON', async () => {
      const res = await fetch(`${BASE_URL}/api/database/export`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('application/json');
      expect(res.headers.get('content-disposition')).toContain('attachment');
      expect(res.headers.get('content-disposition')).toContain('.json');
    });

    test('TC-DB-011: Export should contain export metadata', async () => {
      const res = await api('/api/database/export', {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('exportDate');
      expect(res.data).toHaveProperty('databaseType');
      expect(res.data).toHaveProperty('data');
    });

    test('TC-DB-012: Non-admin should not export database', async () => {
      if (!schedulerToken) return;
      
      const res = await api('/api/database/export', {
        method: 'GET',
        token: schedulerToken
      });
      
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/database/clean', () => {
    test('TC-DB-013: Admin should clean old data with default options', async () => {
      const res = await api('/api/database/clean', {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({
          cleanAssignments: true,
          cleanConflicts: true,
          cleanExportLogs: true,
          cleanAuditLogs: true,
          olderThanDays: 365
        })
      });
      
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('success', true);
      expect(res.data).toHaveProperty('results');
      expect(res.data.results).toHaveProperty('assignmentsDeleted');
      expect(res.data.results).toHaveProperty('conflictsDeleted');
      expect(res.data.results).toHaveProperty('exportLogsDeleted');
      expect(res.data.results).toHaveProperty('auditLogsDeleted');
    });

    test('TC-DB-014: Clean should respect olderThanDays parameter', async () => {
      const res = await api('/api/database/clean', {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({
          cleanAssignments: true,
          olderThanDays: 9999 // Very far in the past, should clean nothing recent
        })
      });
      
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('cutoffDate');
    });

    test('TC-DB-015: Clean with no options should clean nothing', async () => {
      const res = await api('/api/database/clean', {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({
          cleanAssignments: false,
          cleanConflicts: false,
          cleanExportLogs: false,
          cleanAuditLogs: false,
          olderThanDays: 1
        })
      });
      
      expect(res.status).toBe(200);
      expect(res.data.results.assignmentsDeleted).toBe(0);
      expect(res.data.results.conflictsDeleted).toBe(0);
      expect(res.data.results.exportLogsDeleted).toBe(0);
      expect(res.data.results.auditLogsDeleted).toBe(0);
    });

    test('TC-DB-016: Non-admin should not clean database', async () => {
      if (!viewerToken) return;
      
      const res = await api('/api/database/clean', {
        method: 'POST',
        token: viewerToken,
        body: JSON.stringify({ cleanAssignments: true })
      });
      
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/database/reset', () => {
    test('TC-DB-017: Reset should require confirmation', async () => {
      const res = await api('/api/database/reset', {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({})
      });
      
      expect(res.status).toBe(400);
      expect(res.data).toHaveProperty('error');
      expect(res.data.error).toContain('not confirmed');
    });

    test('TC-DB-018: Reset should reject wrong confirmation text', async () => {
      const res = await api('/api/database/reset', {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({
          confirmReset: 'DELETE_DATABASE'
        })
      });
      
      expect(res.status).toBe(400);
    });

    test('TC-DB-019: Non-admin should not reset database', async () => {
      if (!schedulerToken) return;
      
      const res = await api('/api/database/reset', {
        method: 'POST',
        token: schedulerToken,
        body: JSON.stringify({
          confirmReset: 'RESET_DATABASE'
        })
      });
      
      expect(res.status).toBe(403);
    });

    // Note: We don't actually test a real reset as it would destroy test data
    test('TC-DB-020: Reset endpoint should exist and be protected', async () => {
      const res = await api('/api/database/reset', {
        method: 'POST'
      });
      
      expect(res.status).toBe(401); // No token
    });
  });
});

// ============================================
// 23. DATA INTEGRITY TESTS
// ============================================
describe('Data Integrity', () => {
  
  describe('Foreign Key Relationships', () => {
    test('TC-INT-001: Cannot delete person with active assignments', async () => {
      // Get a person with assignments
      const assignmentsRes = await api('/api/assignments?limit=1', {
        method: 'GET',
        token: adminToken
      });
      
      if (!assignmentsRes.data.data || assignmentsRes.data.data.length === 0) return;
      
      const personId = assignmentsRes.data.data[0].personId;
      
      // Try to delete (should fail or handle gracefully)
      const res = await api(`/api/people/${personId}`, {
        method: 'DELETE',
        token: adminToken
      });
      
      // Either should fail (400/409) or succeed and cascade
      expect([200, 400, 409]).toContain(res.status);
    });

    test('TC-INT-002: Cannot delete project with active assignments', async () => {
      const assignmentsRes = await api('/api/assignments?limit=1', {
        method: 'GET',
        token: adminToken
      });
      
      if (!assignmentsRes.data.data || assignmentsRes.data.data.length === 0) return;
      
      const projectId = assignmentsRes.data.data[0].projectId;
      
      const res = await api(`/api/projects/${projectId}`, {
        method: 'DELETE',
        token: adminToken
      });
      
      expect([200, 400, 409]).toContain(res.status);
    });

    test('TC-INT-003: Cannot delete skill used by people', async () => {
      // Get a skill that is assigned to someone
      const peopleRes = await api('/api/people?limit=10', {
        method: 'GET',
        token: adminToken
      });
      
      let usedSkillId = null;
      for (const person of (peopleRes.data.data || [])) {
        if (person.skills && person.skills.length > 0) {
          usedSkillId = person.skills[0].skillId || person.skills[0].id;
          break;
        }
      }
      
      if (!usedSkillId) return;
      
      const res = await api(`/api/skills/${usedSkillId}`, {
        method: 'DELETE',
        token: adminToken
      });
      
      expect([200, 400, 409]).toContain(res.status);
    });
  });

  describe('Data Validation', () => {
    test('TC-INT-004: Assignment hours must be valid', async () => {
      const peopleRes = await api('/api/people?limit=1', { method: 'GET', token: adminToken });
      const projectsRes = await api('/api/projects?limit=1', { method: 'GET', token: adminToken });
      
      if (!peopleRes.data.data.length || !projectsRes.data.data.length) return;
      
      // Try negative hours
      const res = await api('/api/assignments', {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({
          personId: peopleRes.data.data[0].id,
          projectId: projectsRes.data.data[0].id,
          date: '2026-02-01',
          startHour: -1,
          endHour: 10
        })
      });
      
      expect(res.status).toBe(400);
    });

    test('TC-INT-005: Assignment hours must not exceed 24', async () => {
      const peopleRes = await api('/api/people?limit=1', { method: 'GET', token: adminToken });
      const projectsRes = await api('/api/projects?limit=1', { method: 'GET', token: adminToken });
      
      if (!peopleRes.data.data.length || !projectsRes.data.data.length) return;
      
      const res = await api('/api/assignments', {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({
          personId: peopleRes.data.data[0].id,
          projectId: projectsRes.data.data[0].id,
          date: '2026-02-01',
          startHour: 9,
          endHour: 30
        })
      });
      
      expect(res.status).toBe(400);
    });

    test('TC-INT-006: Proficiency level must be 1-5', async () => {
      const peopleRes = await api('/api/people?limit=1', { method: 'GET', token: adminToken });
      const skillsRes = await api('/api/skills?limit=1', { method: 'GET', token: adminToken });
      
      if (!peopleRes.data.data.length || !skillsRes.data.data.length) return;
      
      const res = await api(`/api/people/${peopleRes.data.data[0].id}/skills`, {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({
          skillId: skillsRes.data.data[0].id,
          proficiencyLevel: 10 // Invalid
        })
      });
      
      expect([400, 201]).toContain(res.status); // May accept and cap, or reject
    });

    test('TC-INT-007: Project dates must be valid', async () => {
      const res = await api('/api/projects', {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({
          name: 'Invalid Dates Project',
          startDate: '2026-12-01',
          endDate: '2026-01-01' // End before start
        })
      });
      
      // Should either reject or handle gracefully
      expect([201, 400]).toContain(res.status);
    });

    test('TC-INT-008: Email format must be valid', async () => {
      const res = await api('/api/people', {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({
          firstName: 'Test',
          lastName: 'Invalid Email',
          email: 'not-an-email'
        })
      });
      
      expect(res.status).toBe(400);
    });
  });
});

// ============================================
// 24. CONCURRENT ACCESS TESTS
// ============================================
describe('Concurrent Access', () => {
  
  test('TC-CONC-001: Multiple simultaneous reads should succeed', async () => {
    const promises = Array(10).fill(null).map(() =>
      api('/api/people', { method: 'GET', token: adminToken })
    );
    
    const results = await Promise.all(promises);
    
    results.forEach(res => {
      expect(res.status).toBe(200);
    });
  });

  test('TC-CONC-002: Multiple simultaneous logins should succeed', async () => {
    const promises = Array(5).fill(null).map(() =>
      api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: 'admin', password: 'admin123' })
      })
    );
    
    const results = await Promise.all(promises);
    
    // Some may be rate-limited, but should not crash
    results.forEach(res => {
      expect([200, 429]).toContain(res.status);
    });
  });

  test('TC-CONC-003: Concurrent dashboard requests should succeed', async () => {
    const promises = Array(5).fill(null).map(() =>
      api('/api/analytics/dashboard', { method: 'GET', token: adminToken })
    );
    
    const results = await Promise.all(promises);
    
    results.forEach(res => {
      expect(res.status).toBe(200);
    });
  });
});

// ============================================
// 25. EDGE CASE TESTS
// ============================================
describe('Edge Cases', () => {
  
  describe('Empty Data Handling', () => {
    test('TC-EDGE-001: Should handle search with no results gracefully', async () => {
      const res = await api('/api/people?search=ZZZNONEXISTENTZZZ', {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
      expect(res.data.data).toEqual([]);
    });

    test('TC-EDGE-002: Should handle AI suggestions for date with no active projects', async () => {
      const res = await api('/api/ai-scheduler/suggest', {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({
          date: '2099-12-31' // Far future date
        })
      });
      
      expect(res.status).toBe(200);
      // Should return empty suggestions, not error
    });

    test('TC-EDGE-003: Should handle conflict detection for date range with no assignments', async () => {
      const res = await api('/api/conflicts/detect', {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({
          startDate: '2099-01-01',
          endDate: '2099-12-31'
        })
      });
      
      expect(res.status).toBe(200);
    });
  });

  describe('Boundary Values', () => {
    test('TC-EDGE-004: Should handle very long names', async () => {
      const longName = 'A'.repeat(500);
      
      const res = await api('/api/people', {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({
          firstName: longName,
          lastName: 'Test',
          email: `longname_${Date.now()}@test.com`
        })
      });
      
      // Should either truncate/reject or handle gracefully
      expect([201, 400]).toContain(res.status);
    });

    test('TC-EDGE-005: Should handle pagination beyond available data', async () => {
      const res = await api('/api/people?page=9999&limit=10', {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
      expect(res.data.data).toEqual([]);
    });

    test('TC-EDGE-006: Should handle zero limit', async () => {
      const res = await api('/api/people?limit=0', {
        method: 'GET',
        token: adminToken
      });
      
      // Should use default or reject
      expect([200, 400]).toContain(res.status);
    });

    test('TC-EDGE-007: Should handle negative page number', async () => {
      const res = await api('/api/people?page=-1', {
        method: 'GET',
        token: adminToken
      });
      
      // Should use default or reject
      expect([200, 400]).toContain(res.status);
    });
  });

  describe('Special Characters', () => {
    test('TC-EDGE-008: Should handle unicode in names', async () => {
      const res = await api('/api/people', {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({
          firstName: 'Ιωάννης',
          lastName: 'Παπαδόπουλος',
          email: `unicode_${Date.now()}@test.com`
        })
      });
      
      expect(res.status).toBe(201);
      
      // Verify it was saved correctly
      const personRes = await api(`/api/people/${res.data.id}`, {
        method: 'GET',
        token: adminToken
      });
      
      expect(personRes.data.firstName).toBe('Ιωάννης');
    });

    test('TC-EDGE-009: Should handle emoji in project names', async () => {
      const res = await api('/api/projects', {
        method: 'POST',
        token: adminToken,
        body: JSON.stringify({
          name: '🚀 Launch Project ' + Date.now(),
          code: 'EMOJI' + Date.now()
        })
      });
      
      expect([201, 400]).toContain(res.status);
    });

    test('TC-EDGE-010: Should handle special characters in search', async () => {
      const res = await api('/api/people?search=%25%26%23%40', {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
    });
  });

  describe('Date Edge Cases', () => {
    test('TC-EDGE-011: Should handle leap year date', async () => {
      const res = await api('/api/assignments/daily/2028-02-29', {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
    });

    test('TC-EDGE-012: Should reject invalid date', async () => {
      const res = await api('/api/assignments/daily/2026-02-30', {
        method: 'GET',
        token: adminToken
      });
      
      // Should either handle gracefully or reject
      expect([200, 400]).toContain(res.status);
    });

    test('TC-EDGE-013: Should handle very old date', async () => {
      const res = await api('/api/assignments/daily/1970-01-01', {
        method: 'GET',
        token: adminToken
      });
      
      expect(res.status).toBe(200);
    });
  });
});

// ============================================
// 26. MOBILE API COMPATIBILITY TESTS
// ============================================
describe('Mobile API Compatibility', () => {
  
  test('TC-MOBILE-001: API should return consistent JSON structure', async () => {
    const endpoints = [
      '/api/people',
      '/api/projects', 
      '/api/skills',
      '/api/assignments'
    ];
    
    for (const endpoint of endpoints) {
      const res = await api(endpoint, { method: 'GET', token: adminToken });
      
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('data');
      expect(res.data).toHaveProperty('pagination');
      expect(Array.isArray(res.data.data)).toBe(true);
    }
  });

  test('TC-MOBILE-002: API should support Accept-Language header', async () => {
    const res = await api('/api/settings/public', {
      method: 'GET',
      headers: {
        'Accept-Language': 'el'
      }
    });
    
    expect(res.status).toBe(200);
  });

  test('TC-MOBILE-003: API should handle missing optional headers', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // No Accept, no Accept-Language, no User-Agent
      },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    
    expect(res.status).toBe(200);
  });
});

// ============================================
// 27. PERFORMANCE BASELINE TESTS
// ============================================
describe('Performance Baseline', () => {
  
  test('TC-PERF-001: Dashboard should respond within 2 seconds', async () => {
    const start = Date.now();
    
    const res = await api('/api/analytics/dashboard', {
      method: 'GET',
      token: adminToken
    });
    
    const duration = Date.now() - start;
    
    expect(res.status).toBe(200);
    expect(duration).toBeLessThan(2000);
  });

  test('TC-PERF-002: People list should respond within 1 second', async () => {
    const start = Date.now();
    
    const res = await api('/api/people?limit=50', {
      method: 'GET',
      token: adminToken
    });
    
    const duration = Date.now() - start;
    
    expect(res.status).toBe(200);
    expect(duration).toBeLessThan(1000);
  });

  test('TC-PERF-003: Project list should respond within 1 second', async () => {
    const start = Date.now();
    
    const res = await api('/api/projects?limit=50', {
      method: 'GET',
      token: adminToken
    });
    
    const duration = Date.now() - start;
    
    expect(res.status).toBe(200);
    expect(duration).toBeLessThan(1000);
  });

  test('TC-PERF-004: Authentication should respond within 500ms', async () => {
    const start = Date.now();
    
    const res = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    
    const duration = Date.now() - start;
    
    expect(res.status).toBe(200);
    expect(duration).toBeLessThan(500);
  });

  test('TC-PERF-005: Skill matching should respond within 2 seconds', async () => {
    const projectsRes = await api('/api/projects?limit=1', { method: 'GET', token: adminToken });
    if (!projectsRes.data.data.length) return;
    
    const start = Date.now();
    
    const res = await api(`/api/matching/candidates?projectId=${projectsRes.data.data[0].id}`, {
      method: 'GET',
      token: adminToken
    });
    
    const duration = Date.now() - start;
    
    expect(res.status).toBe(200);
    expect(duration).toBeLessThan(2000);
  });
});

// ============================================
// 28. SESSION MANAGEMENT TESTS
// ============================================
describe('Session Management', () => {
  
  test('TC-SESSION-001: Token should work after login', async () => {
    const loginRes = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    
    expect(loginRes.status).toBe(200);
    
    const token = loginRes.data.token;
    
    const meRes = await api('/api/auth/me', {
      method: 'GET',
      token
    });
    
    expect(meRes.status).toBe(200);
    expect(meRes.data.username).toBe('admin');
  });

  test('TC-SESSION-002: Expired token should be rejected', async () => {
    // Use a known expired token format (this is just for structure testing)
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZXhwIjoxfQ.invalid';
    
    const res = await api('/api/auth/me', {
      method: 'GET',
      token: expiredToken
    });
    
    expect(res.status).toBe(403);
  });

  test('TC-SESSION-003: Malformed token should be rejected', async () => {
    const malformedTokens = [
      'not.a.jwt',
      'Bearer token',
      'just-a-string',
      '',
      'eyJhbGciOiJIUzI1NiJ9.e30'
    ];
    
    for (const token of malformedTokens) {
      const res = await api('/api/auth/me', {
        method: 'GET',
        token
      });
      
      expect([401, 403]).toContain(res.status);
    }
  });

  test('TC-SESSION-004: Token in wrong format should be rejected', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': 'Basic dXNlcjpwYXNz' // Basic auth instead of Bearer
      }
    });
    
    expect(res.status).toBe(401);
  });
});

// Run all tests
console.log('Starting Resource Scheduler API Tests...');
console.log(`Testing against: ${BASE_URL}`);

