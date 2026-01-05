const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getBooleanCondition } = require('../database');

const router = express.Router();

// Helper for active condition
const getActiveCondition = (column = 'is_active') => getBooleanCondition(column, true);
const getResolvedCondition = (column = 'is_resolved', value = false) => getBooleanCondition(column, value);

router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Fetch counts separately to handle async properly
    const activeCondPeople = getActiveCondition('is_active');
    const activeCondSkills = getActiveCondition('is_active');
    const unresolvedCond = getResolvedCondition('is_resolved', false);
    
    const totalPeopleResult = await db.prepare(`SELECT COUNT(*) as count FROM people WHERE ${activeCondPeople}`).get();
    const totalProjectsResult = await db.prepare("SELECT COUNT(*) as count FROM projects WHERE status = 'active'").get();
    const totalSkillsResult = await db.prepare(`SELECT COUNT(*) as count FROM skills WHERE ${activeCondSkills}`).get();
    const todayAssignmentsResult = await db.prepare('SELECT COUNT(*) as count FROM assignments WHERE date = ?').get(today);
    const weekAssignmentsResult = await db.prepare('SELECT COUNT(*) as count FROM assignments WHERE date >= ?').get(weekAgo);
    const unresolvedConflictsResult = await db.prepare(`SELECT COUNT(*) as count FROM schedule_conflicts WHERE ${unresolvedCond}`).get();
    const pendingAvailabilityResult = await db.prepare("SELECT COUNT(*) as count FROM availability_windows WHERE status = 'pending'").get();

    const metrics = {
      totalPeople: totalPeopleResult?.count || 0,
      totalProjects: totalProjectsResult?.count || 0,
      totalSkills: totalSkillsResult?.count || 0,
      todayAssignments: todayAssignmentsResult?.count || 0,
      weekAssignments: weekAssignmentsResult?.count || 0,
      unresolvedConflicts: unresolvedConflictsResult?.count || 0,
      pendingAvailability: pendingAvailabilityResult?.count || 0
    };

    const todayStats = await db.prepare(`SELECT COUNT(DISTINCT person_id) as people_scheduled, SUM(end_hour - start_hour) as total_hours, COUNT(DISTINCT project_id) as projects_active FROM assignments WHERE date = ? AND status NOT IN ('cancelled')`).get(today);
    const conflictsByType = await db.prepare('SELECT type, COUNT(*) as count FROM schedule_conflicts WHERE is_resolved = false GROUP BY type').all();
    const weeklyHours = await db.prepare(`SELECT date, SUM(end_hour - start_hour) as hours, COUNT(*) as assignments FROM assignments WHERE date >= ? AND date <= ? GROUP BY date ORDER BY date`).all(weekAgo, today);
    const topUtilized = await db.prepare(`SELECT p.id, p.first_name, p.last_name, p.department, SUM(a.end_hour - a.start_hour) as total_hours, COUNT(*) as assignment_count FROM people p JOIN assignments a ON p.id = a.person_id WHERE a.date >= ? AND a.status NOT IN ('cancelled') GROUP BY p.id ORDER BY total_hours DESC LIMIT 10`).all(weekAgo);
    const projectWorkload = await db.prepare(`SELECT pr.id, pr.name, pr.color, SUM(a.end_hour - a.start_hour) as total_hours, COUNT(DISTINCT a.person_id) as people_assigned FROM projects pr JOIN assignments a ON pr.id = a.project_id WHERE a.date >= ? AND a.status NOT IN ('cancelled') GROUP BY pr.id ORDER BY total_hours DESC LIMIT 10`).all(weekAgo);
    const skillDemand = await db.prepare(`SELECT s.id, s.name, s.color, COUNT(ps.project_id) as projects_requiring, (SELECT COUNT(*) FROM person_skills WHERE skill_id = s.id) as people_with_skill FROM skills s JOIN project_skills ps ON s.id = ps.skill_id JOIN projects pr ON ps.project_id = pr.id WHERE pr.status = 'active' GROUP BY s.id ORDER BY projects_requiring DESC LIMIT 10`).all();

    res.json({
      metrics,
      today: { 
        people_scheduled: todayStats?.people_scheduled || 0,
        total_hours: todayStats?.total_hours || 0,
        projects_active: todayStats?.projects_active || 0,
        utilizationRate: metrics.totalPeople > 0 ? Math.round(((todayStats?.people_scheduled || 0) / metrics.totalPeople) * 100) : 0 
      },
      conflictsByType,
      weeklyHours,
      topUtilized: topUtilized.map(p => ({ id: p.id, name: `${p.first_name} ${p.last_name}`, department: p.department, totalHours: p.total_hours, assignmentCount: p.assignment_count })),
      projectWorkload: projectWorkload.map(p => ({ id: p.id, name: p.name, color: p.color, totalHours: p.total_hours, peopleAssigned: p.people_assigned })),
      skillDemand: skillDemand.map(s => ({ id: s.id, name: s.name, color: s.color, projectsRequiring: s.projects_requiring, peopleWithSkill: s.people_with_skill, gap: s.projects_requiring > s.people_with_skill }))
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

// Get employees with available hours for a specific date
router.get('/available-employees', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const activeCondition = getActiveCondition('p.is_active');
    
    // Get all active employees with their scheduled hours for the date
    const employees = await db.prepare(`
      SELECT 
        p.id,
        p.first_name,
        p.last_name,
        p.department,
        p.job_title,
        p.max_hours_per_day,
        COALESCE(
          (SELECT SUM(end_hour - start_hour) 
           FROM assignments 
           WHERE person_id = p.id 
           AND date = ? 
           AND status != 'cancelled'), 0
        ) as hours_scheduled
      FROM people p
      WHERE ${activeCondition}
      AND p.id NOT IN (
        SELECT person_id FROM availability_windows 
        WHERE ? >= start_date AND ? <= end_date AND status = 'approved'
      )
      ORDER BY p.first_name, p.last_name
    `).all(targetDate, targetDate, targetDate);
    
    // Get skills for each employee
    const employeesWithAvailability = [];
    
    for (const emp of employees) {
      const hoursAvailable = emp.max_hours_per_day - (emp.hours_scheduled || 0);
      
      // Only include employees with available hours
      if (hoursAvailable > 0) {
        // Get employee's skills
        const skills = await db.prepare(`
          SELECT s.id, s.name, s.color, ps.proficiency_level
          FROM skills s
          JOIN person_skills ps ON s.id = ps.skill_id
          WHERE ps.person_id = ?
          ORDER BY ps.proficiency_level DESC, s.name
        `).all(emp.id);
        
        employeesWithAvailability.push({
          id: emp.id,
          firstName: emp.first_name,
          lastName: emp.last_name,
          department: emp.department,
          jobTitle: emp.job_title,
          maxHoursPerDay: emp.max_hours_per_day,
          hoursScheduled: emp.hours_scheduled || 0,
          hoursAvailable: hoursAvailable,
          skills: skills.map(s => ({
            id: s.id,
            name: s.name,
            color: s.color,
            proficiency: s.proficiency_level
          }))
        });
      }
    }
    
    // Sort by hours available (most available first)
    employeesWithAvailability.sort((a, b) => b.hoursAvailable - a.hoursAvailable);
    
    res.json({
      date: targetDate,
      totalEmployees: employees.length,
      availableCount: employeesWithAvailability.length,
      totalAvailableHours: employeesWithAvailability.reduce((sum, e) => sum + e.hoursAvailable, 0),
      employees: employeesWithAvailability
    });
    
  } catch (error) {
    console.error('Available employees error:', error);
    res.status(500).json({ error: 'Failed to get available employees' });
  }
});

router.get('/utilization', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { startDate, endDate, department, groupBy = 'person' } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });

    const start = new Date(startDate), end = new Date(endDate);
    let workingDays = 0;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) { if (d.getDay() !== 0 && d.getDay() !== 6) workingDays++; }

    let whereClause = 'a.date >= ? AND a.date <= ? AND a.status NOT IN ("cancelled")';
    const params = [startDate, endDate];
    if (department) { whereClause += ' AND p.department = ?'; params.push(department); }

    if (groupBy === 'person') {
      const activeCondUtil = getActiveCondition('p.is_active');
      const data = await db.prepare(`SELECT p.id, p.first_name, p.last_name, p.department, p.max_hours_per_day, SUM(a.end_hour - a.start_hour) as actual_hours, COUNT(DISTINCT a.date) as days_worked, COUNT(DISTINCT a.project_id) as projects_worked FROM people p LEFT JOIN assignments a ON p.id = a.person_id AND ${whereClause} WHERE ${activeCondUtil} ${department ? 'AND p.department = ?' : ''} GROUP BY p.id ORDER BY actual_hours DESC`).all(...params, ...(department ? [department] : []));
      res.json({ startDate, endDate, workingDays, groupBy, data: data.map(p => ({ id: p.id, name: `${p.first_name} ${p.last_name}`, department: p.department, maxHours: p.max_hours_per_day * workingDays, actualHours: p.actual_hours || 0, utilizationRate: (p.max_hours_per_day * workingDays) > 0 ? Math.round(((p.actual_hours || 0) / (p.max_hours_per_day * workingDays)) * 100) : 0, daysWorked: p.days_worked || 0, projectsWorked: p.projects_worked || 0 })) });
    } else if (groupBy === 'project') {
      const data = await db.prepare(`SELECT pr.id, pr.name, pr.code, pr.client, pr.budget_hours, SUM(a.end_hour - a.start_hour) as actual_hours, COUNT(DISTINCT a.person_id) as people_assigned, COUNT(DISTINCT a.date) as active_days FROM projects pr LEFT JOIN assignments a ON pr.id = a.project_id AND ${whereClause} GROUP BY pr.id ORDER BY actual_hours DESC`).all(...params);
      res.json({ startDate, endDate, workingDays, groupBy, data: data.map(p => ({ id: p.id, name: p.name, code: p.code, client: p.client, budgetHours: p.budget_hours, actualHours: p.actual_hours || 0, budgetUsed: p.budget_hours ? Math.round(((p.actual_hours || 0) / p.budget_hours) * 100) : null, peopleAssigned: p.people_assigned || 0, activeDays: p.active_days || 0 })) });
    } else {
      res.status(400).json({ error: 'Invalid groupBy parameter' });
    }
  } catch (error) {
    console.error('Utilization error:', error);
    res.status(500).json({ error: 'Failed to get utilization report' });
  }
});

router.get('/efficiency', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });

    const totalAssignmentsResult = await db.prepare('SELECT COUNT(*) as count FROM assignments WHERE date >= ? AND date <= ?').get(startDate, endDate);
    const totalAssignments = totalAssignmentsResult?.count || 0;
    const totalConflictsResult = await db.prepare('SELECT COUNT(*) as count FROM schedule_conflicts WHERE date >= ? AND date <= ?').get(startDate, endDate);
    const totalConflicts = totalConflictsResult?.count || 0;

    res.json({
      period: { startDate, endDate },
      metrics: {
        totalAssignments,
        conflictRate: totalAssignments > 0 ? Math.round((totalConflicts / totalAssignments) * 100) / 100 : 0,
        skillMatchRate: 85, // Placeholder
        utilizationRate: 75 // Placeholder
      },
      targets: { conflictRate: '< 2%', skillMatchRate: '> 85%', utilizationRate: '> 75%' }
    });
  } catch (error) {
    console.error('Efficiency error:', error);
    res.status(500).json({ error: 'Failed to get efficiency metrics' });
  }
});

// Project Summary Report - All active projects with assigned people and total hours
router.get('/project-summary', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;

    // Get all active projects with their statistics
    const projects = await db.prepare(`
      SELECT p.id, p.name, p.code, p.client, p.status, p.priority, p.color,
        p.budget_hours, p.start_date, p.end_date,
        COALESCE(SUM(a.end_hour - a.start_hour), 0) as total_hours,
        COUNT(DISTINCT a.id) as total_assignments
      FROM projects p
      LEFT JOIN assignments a ON p.id = a.project_id AND a.status != 'cancelled'
      WHERE p.status = 'active'
      GROUP BY p.id
      ORDER BY p.priority DESC, p.name
    `).all();

    // For each project, get assigned people with their hours
    const projectsWithPeople = await Promise.all(projects.map(async project => {
      const people = await db.prepare(`
        SELECT 
          pe.id, pe.first_name, pe.last_name, pe.department, pe.job_title,
          SUM(a.end_hour - a.start_hour) as hours_worked,
          COUNT(a.id) as assignment_count,
          MIN(a.date) as first_assignment,
          MAX(a.date) as last_assignment
        FROM people pe
        JOIN assignments a ON pe.id = a.person_id
        WHERE a.project_id = ? AND a.status != 'cancelled'
        GROUP BY pe.id
        ORDER BY hours_worked DESC
      `).all(project.id);

      // Get required skills for this project
      const requiredSkills = await db.prepare(`
        SELECT s.id, s.name, s.color, ps.people_needed, ps.required_proficiency
        FROM project_skills ps
        JOIN skills s ON ps.skill_id = s.id
        WHERE ps.project_id = ?
        ORDER BY ps.people_needed DESC
      `).all(project.id);

      return {
        id: project.id,
        name: project.name,
        code: project.code,
        client: project.client,
        status: project.status,
        priority: project.priority,
        color: project.color,
        budgetHours: project.budget_hours,
        startDate: project.start_date,
        endDate: project.end_date,
        totalHours: project.total_hours || 0,
        totalAssignments: project.total_assignments || 0,
        budgetUsedPercent: project.budget_hours ? Math.round((project.total_hours / project.budget_hours) * 100) : null,
        assignedPeople: people.map(p => ({
          id: p.id,
          name: `${p.first_name} ${p.last_name}`,
          department: p.department,
          jobTitle: p.job_title,
          hoursWorked: p.hours_worked || 0,
          assignmentCount: p.assignment_count || 0,
          firstAssignment: p.first_assignment,
          lastAssignment: p.last_assignment
        })),
        requiredSkills: requiredSkills.map(s => ({
          id: s.id,
          name: s.name,
          color: s.color,
          peopleNeeded: s.people_needed || 1,
          requiredProficiency: s.required_proficiency
        })),
        peopleCount: people.length
      };
    }));

    // Calculate summary statistics
    const totalProjects = projectsWithPeople.length;
    const totalHoursAllProjects = projectsWithPeople.reduce((sum, p) => sum + p.totalHours, 0);
    const totalPeopleAssigned = new Set(projectsWithPeople.flatMap(p => p.assignedPeople.map(pe => pe.id))).size;

    res.json({
      summary: {
        totalProjects,
        totalHoursAllProjects,
        totalPeopleAssigned,
        averageHoursPerProject: totalProjects > 0 ? Math.round(totalHoursAllProjects / totalProjects) : 0
      },
      projects: projectsWithPeople
    });
  } catch (error) {
    console.error('Project summary error:', error);
    res.status(500).json({ error: 'Failed to get project summary' });
  }
});

// Daily Schedule Report - Projects by status with people for each day
router.get('/daily-report', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start and end dates are required' });
    }

    // Get all projects grouped by status
    const projects = await db.prepare(`
      SELECT p.id, p.name, p.code, p.client, p.status, p.priority, p.color,
        p.budget_hours, p.start_date, p.end_date, p.description
      FROM projects p
      ORDER BY 
        CASE p.status 
          WHEN 'active' THEN 1 
          WHEN 'planning' THEN 2 
          WHEN 'on-hold' THEN 3 
          WHEN 'completed' THEN 4 
          ELSE 5 
        END,
        CASE p.priority 
          WHEN 'critical' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'medium' THEN 3 
          ELSE 4 
        END,
        p.name
    `).all();

    // Get all dates in range (excluding weekends)
    const dates = [];
    const currentDate = new Date(startDate);
    const lastDate = new Date(endDate);
    
    while (currentDate <= lastDate) {
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        dates.push({
          date: currentDate.toISOString().split('T')[0],
          dayName: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
          dayShort: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
          formatted: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Build report data
    const reportData = [];
    
    for (const dateInfo of dates) {
      const dayReport = {
        ...dateInfo,
        statusGroups: {}
      };

      // Get assignments for this date
      const assignments = await db.prepare(`
        SELECT a.id, a.project_id, a.person_id, a.start_hour, a.end_hour,
          a.status as assignment_status, a.task_description,
          p.first_name, p.last_name, p.department, p.job_title
        FROM assignments a
        JOIN people p ON a.person_id = p.id
        WHERE a.date = ? AND a.status != 'cancelled'
        ORDER BY a.start_hour
      `).all(dateInfo.date);

      // Create a map of project_id -> assignments
      const projectAssignments = new Map();
      for (const a of assignments) {
        if (!projectAssignments.has(a.project_id)) {
          projectAssignments.set(a.project_id, []);
        }
        projectAssignments.get(a.project_id).push({
          id: a.id,
          personId: a.person_id,
          personName: `${a.first_name} ${a.last_name}`,
          department: a.department,
          jobTitle: a.job_title,
          startHour: a.start_hour,
          endHour: a.end_hour,
          hours: a.end_hour - a.start_hour,
          status: a.assignment_status,
          task: a.task_description
        });
      }

      // Group projects by status
      for (const project of projects) {
        const status = project.status;
        if (!dayReport.statusGroups[status]) {
          dayReport.statusGroups[status] = [];
        }

        const projectAssigns = projectAssignments.get(project.id) || [];
        const totalHours = projectAssigns.reduce((sum, a) => sum + a.hours, 0);

        // Get project skills
        const skills = await db.prepare(`
          SELECT s.name, s.color, ps.people_needed, ps.required_proficiency
          FROM project_skills ps
          JOIN skills s ON ps.skill_id = s.id
          WHERE ps.project_id = ?
        `).all(project.id);

        dayReport.statusGroups[status].push({
          id: project.id,
          name: project.name,
          code: project.code,
          client: project.client,
          priority: project.priority,
          color: project.color,
          budgetHours: project.budget_hours,
          description: project.description,
          skills: skills.map(s => ({
            name: s.name,
            color: s.color,
            peopleNeeded: s.people_needed,
            requiredProficiency: s.required_proficiency
          })),
          assignments: projectAssigns,
          totalHours,
          peopleCount: new Set(projectAssigns.map(a => a.personId)).size
        });
      }

      reportData.push(dayReport);
    }

    // Calculate summary statistics
    const totalAssignments = reportData.reduce((sum, day) => {
      return sum + Object.values(day.statusGroups).flat().reduce((s, p) => s + p.assignments.length, 0);
    }, 0);

    const totalHours = reportData.reduce((sum, day) => {
      return sum + Object.values(day.statusGroups).flat().reduce((s, p) => s + p.totalHours, 0);
    }, 0);

    const uniquePeople = new Set();
    reportData.forEach(day => {
      Object.values(day.statusGroups).flat().forEach(p => {
        p.assignments.forEach(a => uniquePeople.add(a.personId));
      });
    });

    res.json({
      dateRange: { startDate, endDate },
      summary: {
        totalDays: reportData.length,
        totalAssignments,
        totalHours,
        uniquePeople: uniquePeople.size,
        projectCount: projects.length
      },
      days: reportData,
      statusOrder: ['active', 'planning', 'on-hold', 'completed', 'cancelled']
    });
  } catch (error) {
    console.error('Daily report error:', error);
    res.status(500).json({ error: 'Failed to generate daily report' });
  }
});

module.exports = router;
