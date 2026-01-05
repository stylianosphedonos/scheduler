const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { getDatabaseType, getBooleanCondition } = require('../database');

const router = express.Router();

// Helper for active condition
const getActiveCondition = (column = 'is_active') => getBooleanCondition(column, true);
const getMandatoryCondition = (column = 'is_mandatory') => getBooleanCondition(column, true);

/**
 * AI SCHEDULING MODULE
 * Analyzes projects, skills, and availability to generate optimal schedule suggestions
 */

// Generate AI schedule suggestions for a date range
router.post('/suggest', authenticateToken, requireRole('admin', 'scheduler'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { startDate, endDate, projectIds, prioritizeBy = 'priority' } = req.body;

    if (!startDate) {
      return res.status(400).json({ error: 'Start date is required' });
    }

    const targetEndDate = endDate || startDate;
    const suggestions = [];

    // Get active projects with their skill requirements, location, and time slot restrictions
    let projectQuery = `
      SELECT p.id, p.name, p.code, p.priority, p.color, p.budget_hours,
        p.location_name, p.location_url, p.location_lat, p.location_lng,
        p.time_slot_start, p.time_slot_end,
        (SELECT SUM(end_hour - start_hour) FROM assignments WHERE project_id = p.id AND status != 'cancelled') as hours_used
      FROM projects p 
      WHERE p.status = 'active'
    `;
    
    if (projectIds && projectIds.length > 0) {
      projectQuery += ` AND p.id IN (${projectIds.join(',')})`;
    }
    
    projectQuery += ` ORDER BY 
      CASE p.priority 
        WHEN 'critical' THEN 1 
        WHEN 'high' THEN 2 
        WHEN 'medium' THEN 3 
        ELSE 4 
      END`;

    const projects = await db.prepare(projectQuery).all();

    // For each date in the range
    const currentDate = new Date(startDate);
    const lastDate = new Date(targetEndDate);

    while (currentDate <= lastDate) {
      // Skip weekends
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dailySuggestions = await generateDailySuggestions(db, dateStr, projects, prioritizeBy);
        suggestions.push({
          date: dateStr,
          dayName: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
          suggestions: dailySuggestions.suggestions,
          warnings: dailySuggestions.warnings,
          coverage: dailySuggestions.coverage,
          remainingAvailability: dailySuggestions.remainingAvailability
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate summary
    const totalHoursScheduled = suggestions.reduce((sum, d) => 
      sum + d.suggestions.reduce((s, sug) => s + sug.duration, 0), 0);
    
    const projectsSummary = {};
    for (const day of suggestions) {
      for (const [projectId, cov] of Object.entries(day.coverage)) {
        if (!projectsSummary[projectId]) {
          projectsSummary[projectId] = {
            projectName: cov.projectName,
            budgetHours: cov.budgetHours || 0,
            hoursUsedBefore: cov.hoursUsed || 0,
            hoursScheduled: 0,
            budgetStatus: 'pending'
          };
        }
        projectsSummary[projectId].hoursScheduled += cov.hoursScheduledToday || 0;
        if (cov.budgetStatus === 'completed') {
          projectsSummary[projectId].budgetStatus = 'completed';
        } else if (cov.budgetStatus === 'partial' && projectsSummary[projectId].budgetStatus !== 'completed') {
          projectsSummary[projectId].budgetStatus = 'partial';
        }
      }
    }

    res.json({
      success: true,
      dateRange: { startDate, endDate: targetEndDate },
      totalSuggestions: suggestions.reduce((sum, d) => sum + d.suggestions.length, 0),
      totalHoursScheduled,
      projectsSummary,
      days: suggestions
    });

  } catch (error) {
    console.error('AI Scheduler error:', error);
    res.status(500).json({ error: 'Failed to generate schedule suggestions' });
  }
});

// Apply suggested schedule
router.post('/apply', authenticateToken, requireRole('admin', 'scheduler'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { suggestions } = req.body;

    if (!suggestions || !Array.isArray(suggestions) || suggestions.length === 0) {
      return res.status(400).json({ error: 'Suggestions array is required' });
    }

    let created = 0;
    let skipped = 0;
    const errors = [];

    for (const suggestion of suggestions) {
      try {
        // Check for conflicts
        const conflicts = await db.prepare(`
          SELECT id FROM assignments 
          WHERE person_id = ? AND date = ? 
          AND ((start_hour < ? AND end_hour > ?) OR (start_hour < ? AND end_hour > ?) OR (start_hour >= ? AND end_hour <= ?))
          AND status != 'cancelled'
        `).all(
          suggestion.personId, suggestion.date,
          suggestion.endHour, suggestion.startHour,
          suggestion.endHour, suggestion.startHour,
          suggestion.startHour, suggestion.endHour
        );

        if (conflicts.length > 0) {
          skipped++;
          errors.push({
            suggestion,
            error: 'Time slot conflict with existing assignment'
          });
          continue;
        }

        // Create the assignment
        await db.prepare(`
          INSERT INTO assignments (person_id, project_id, date, start_hour, end_hour, status, task_description, created_by)
          VALUES (?, ?, ?, ?, ?, 'scheduled', ?, ?)
        `).run(
          suggestion.personId,
          suggestion.projectId,
          suggestion.date,
          suggestion.startHour,
          suggestion.endHour,
          suggestion.taskDescription || `AI scheduled: ${suggestion.skillName} work`,
          req.user.id
        );

        created++;
      } catch (err) {
        skipped++;
        errors.push({ suggestion, error: err.message });
      }
    }

    res.json({
      success: true,
      created,
      skipped,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Apply suggestions error:', error);
    res.status(500).json({ error: 'Failed to apply suggestions' });
  }
});

// Get available people for rescheduling
router.get('/available', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { date, skillId, startHour, endHour, excludePersonId } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    const start = parseInt(startHour) || 9;
    const end = parseInt(endHour) || 17;

    // Get people with the required skill who are available
    let query = `
      SELECT DISTINCT p.id, p.first_name, p.last_name, p.department, p.max_hours_per_day,
        ps.proficiency_level,
        (SELECT SUM(end_hour - start_hour) FROM assignments 
         WHERE person_id = p.id AND date = ? AND status != 'cancelled') as hours_scheduled
      FROM people p
    `;

    const params = [date];

    if (skillId) {
      query += ` JOIN person_skills ps ON p.id = ps.person_id AND ps.skill_id = ?`;
      params.push(skillId);
    } else {
      query += ` LEFT JOIN person_skills ps ON p.id = ps.person_id`;
    }

    const activeCondition = getActiveCondition('p.is_active');
    query += ` WHERE ${activeCondition}`;

    if (excludePersonId) {
      query += ` AND p.id != ?`;
      params.push(excludePersonId);
    }

    // Exclude people on leave
    query += `
      AND p.id NOT IN (
        SELECT person_id FROM availability_windows 
        WHERE ? >= start_date AND ? <= end_date AND status = 'approved'
      )
    `;
    params.push(date, date);

    // Exclude people with conflicting assignments
    query += `
      AND p.id NOT IN (
        SELECT person_id FROM assignments 
        WHERE date = ? 
        AND ((start_hour < ? AND end_hour > ?) OR (start_hour < ? AND end_hour > ?) OR (start_hour >= ? AND end_hour <= ?))
        AND status != 'cancelled'
      )
    `;
    params.push(date, end, start, end, start, start, end);

    query += ` ORDER BY ps.proficiency_level DESC, p.last_name`;

    const available = await db.prepare(query).all(...params);

    res.json({
      date,
      timeSlot: { startHour: start, endHour: end },
      skillId: skillId ? parseInt(skillId) : null,
      available: available.map(p => ({
        id: p.id,
        firstName: p.first_name,
        lastName: p.last_name,
        department: p.department,
        proficiencyLevel: p.proficiency_level || 0,
        hoursScheduled: p.hours_scheduled || 0,
        maxHoursPerDay: p.max_hours_per_day,
        hoursRemaining: p.max_hours_per_day - (p.hours_scheduled || 0)
      }))
    });

  } catch (error) {
    console.error('Get available error:', error);
    res.status(500).json({ error: 'Failed to get available people' });
  }
});

// Reschedule an assignment to a different person
router.post('/reschedule', authenticateToken, requireRole('admin', 'scheduler'), async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { assignmentId, newPersonId, reason } = req.body;

    if (!assignmentId || !newPersonId) {
      return res.status(400).json({ error: 'Assignment ID and new person ID are required' });
    }

    // Get the original assignment
    const assignment = await db.prepare('SELECT * FROM assignments WHERE id = ?').get(assignmentId);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Check new person is available
    const conflicts = await db.prepare(`
      SELECT id FROM assignments 
      WHERE person_id = ? AND date = ? 
      AND ((start_hour < ? AND end_hour > ?) OR (start_hour < ? AND end_hour > ?) OR (start_hour >= ? AND end_hour <= ?))
      AND status != 'cancelled'
    `).all(
      newPersonId, assignment.date,
      assignment.end_hour, assignment.start_hour,
      assignment.end_hour, assignment.start_hour,
      assignment.start_hour, assignment.end_hour
    );

    if (conflicts.length > 0) {
      return res.status(400).json({ error: 'New person has a conflicting assignment at this time' });
    }

    // Get person names for notes
    const oldPerson = await db.prepare('SELECT first_name, last_name FROM people WHERE id = ?').get(assignment.person_id);
    const newPerson = await db.prepare('SELECT first_name, last_name FROM people WHERE id = ?').get(newPersonId);

    // Update the assignment
    const notes = `Rescheduled from ${oldPerson.first_name} ${oldPerson.last_name} to ${newPerson.first_name} ${newPerson.last_name}. ${reason || ''}`;
    
    await db.prepare(`
      UPDATE assignments 
      SET person_id = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newPersonId, notes.trim(), assignmentId);

    res.json({
      success: true,
      message: 'Assignment rescheduled successfully',
      assignmentId,
      oldPersonId: assignment.person_id,
      newPersonId,
      notes
    });

  } catch (error) {
    console.error('Reschedule error:', error);
    res.status(500).json({ error: 'Failed to reschedule assignment' });
  }
});

// Get scheduling analytics
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { startDate, endDate } = req.query;

    const start = startDate || new Date().toISOString().split('T')[0];
    const end = endDate || start;

    // Skill coverage analysis
    const activeCondSkill = getActiveCondition('per.is_active');
    const skillCoverage = await db.prepare(`
      SELECT s.id, s.name, s.color,
        ps.people_needed as needed,
        (SELECT COUNT(DISTINCT per.id) 
         FROM people per 
         JOIN person_skills psk ON per.id = psk.person_id 
         WHERE psk.skill_id = s.id AND ${activeCondSkill}) as available_people,
        (SELECT COUNT(DISTINCT a.person_id) 
         FROM assignments a 
         JOIN person_skills psk ON a.person_id = psk.person_id AND psk.skill_id = s.id
         WHERE a.date >= ? AND a.date <= ? AND a.status != 'cancelled') as assigned_people
      FROM project_skills ps
      JOIN skills s ON ps.skill_id = s.id
      JOIN projects p ON ps.project_id = p.id
      WHERE p.status = 'active'
      GROUP BY s.id
      ORDER BY ps.people_needed DESC
    `).all(start, end);

    // Utilization by person
    const activeCondUtil = getActiveCondition('p.is_active');
    const utilization = await db.prepare(`
      SELECT p.id, p.first_name || ' ' || p.last_name as name, p.department,
        p.max_hours_per_day,
        COALESCE(SUM(a.end_hour - a.start_hour), 0) as hours_scheduled,
        COUNT(DISTINCT a.date) as days_with_assignments
      FROM people p
      LEFT JOIN assignments a ON p.id = a.person_id 
        AND a.date >= ? AND a.date <= ? AND a.status != 'cancelled'
      WHERE ${activeCondUtil}
      GROUP BY p.id
      ORDER BY hours_scheduled DESC
    `).all(start, end);

    // Unmet skill requirements
    const activeCondUnmet = getActiveCondition('per.is_active');
    const mandatoryCond = getMandatoryCondition('ps.is_mandatory');
    const unmetRequirements = await db.prepare(`
      SELECT p.id as project_id, p.name as project_name, p.priority,
        s.id as skill_id, s.name as skill_name, s.color,
        ps.people_needed,
        ps.required_proficiency,
        (SELECT COUNT(DISTINCT per.id) 
         FROM people per 
         JOIN person_skills psk ON per.id = psk.person_id 
         WHERE psk.skill_id = s.id 
         AND psk.proficiency_level >= ps.required_proficiency
         AND ${activeCondUnmet}) as qualified_people
      FROM project_skills ps
      JOIN projects p ON ps.project_id = p.id
      JOIN skills s ON ps.skill_id = s.id
      WHERE p.status = 'active' AND ${mandatoryCond}
      HAVING qualified_people < ps.people_needed
      ORDER BY p.priority, p.name
    `).all();

    res.json({
      dateRange: { startDate: start, endDate: end },
      skillCoverage: skillCoverage.map(s => ({
        ...s,
        coveragePercent: s.needed > 0 ? Math.round((s.assigned_people / s.needed) * 100) : 100
      })),
      utilization: utilization.map(u => ({
        ...u,
        utilizationPercent: Math.round((u.hours_scheduled / (u.max_hours_per_day * u.days_with_assignments || 1)) * 100)
      })),
      unmetRequirements,
      summary: {
        totalPeopleAvailable: utilization.length,
        averageUtilization: Math.round(utilization.reduce((sum, u) => sum + u.hours_scheduled, 0) / utilization.length) || 0,
        criticalGaps: unmetRequirements.filter(r => r.priority === 'critical').length
      }
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to get scheduling analytics' });
  }
});

/**
 * Generate daily schedule suggestions
 */
async function generateDailySuggestions(db, date, projects, prioritizeBy) {
  const suggestions = [];
  const warnings = [];
  const coverage = {};

  // Get all available people for this date
  const activeCondAvail = getActiveCondition('p.is_active');
  const availablePeople = await db.prepare(`
    SELECT p.id, p.first_name, p.last_name, p.department, p.max_hours_per_day, p.max_projects_per_day,
      p.work_start_hour, p.work_end_hour, p.has_transportation,
      (SELECT SUM(end_hour - start_hour) FROM assignments 
       WHERE person_id = p.id AND date = ? AND status != 'cancelled') as hours_scheduled,
      (SELECT COUNT(DISTINCT project_id) FROM assignments 
       WHERE person_id = p.id AND date = ? AND status != 'cancelled') as projects_assigned
    FROM people p
    WHERE ${activeCondAvail}
    AND p.id NOT IN (
      SELECT person_id FROM availability_windows 
      WHERE ? >= start_date AND ? <= end_date AND status = 'approved'
    )
  `).all(date, date, date, date);

  // Create a map of person availability
  const personAvailability = new Map();
  for (const person of availablePeople) {
    const hoursRemaining = person.max_hours_per_day - (person.hours_scheduled || 0);
    const projectsRemaining = person.max_projects_per_day - (person.projects_assigned || 0);
    
    if (hoursRemaining > 0 && projectsRemaining > 0) {
      // Get person's skills
      const skills = await db.prepare(`
        SELECT skill_id, proficiency_level 
        FROM person_skills WHERE person_id = ?
      `).all(person.id);
      
      // Get person's assigned locations for the day (from existing assignments)
      const assignedLocations = await getAssignedLocations(db, person.id, date);
      
      personAvailability.set(person.id, {
        ...person,
        hoursRemaining,
        maxHoursPerDay: person.max_hours_per_day,
        projectsRemaining,
        skills: new Map(skills.map(s => [s.skill_id, s.proficiency_level])),
        assignedHours: await getAssignedHours(db, person.id, date),
        assignedLocations: assignedLocations // Track locations person is already assigned to
      });
    }
  }

  // Track remaining budget hours for each project
  const projectBudgetRemaining = new Map();
  for (const project of projects) {
    const budgetHours = project.budget_hours || 0;
    const hoursUsed = project.hours_used || 0;
    const remaining = Math.max(0, budgetHours - hoursUsed);
    projectBudgetRemaining.set(project.id, remaining);
  }

  // Process each project
  for (const project of projects) {
    // Skip project if budget is already met
    const budgetRemaining = projectBudgetRemaining.get(project.id);
    if (project.budget_hours && budgetRemaining <= 0) {
      coverage[project.id] = {
        projectName: project.name,
        projectColor: project.color,
        budgetHours: project.budget_hours,
        hoursUsed: project.hours_used || 0,
        budgetStatus: 'completed',
        skills: {}
      };
      continue;
    }

    const projectSkills = await db.prepare(`
      SELECT ps.skill_id, ps.required_proficiency, ps.people_needed, ps.is_mandatory,
        s.name as skill_name, s.color
      FROM project_skills ps
      JOIN skills s ON ps.skill_id = s.id
      WHERE ps.project_id = ?
      ORDER BY ps.is_mandatory DESC, ps.people_needed DESC
    `).all(project.id);

    coverage[project.id] = {
      projectName: project.name,
      projectColor: project.color,
      budgetHours: project.budget_hours,
      hoursUsed: project.hours_used || 0,
      hoursScheduledToday: 0,
      budgetStatus: 'in_progress',
      skills: {}
    };

    let projectHoursScheduledToday = 0;

    // For each skill requirement
    for (const skillReq of projectSkills) {
      const peopleNeeded = skillReq.people_needed || 1;
      let peopleFilled = 0;
      
      coverage[project.id].skills[skillReq.skill_id] = {
        skillName: skillReq.skill_name,
        needed: peopleNeeded,
        filled: 0
      };

      // Find qualified people
      const qualifiedPeople = [];
      const projectLocation = {
        lat: project.location_lat,
        lng: project.location_lng,
        name: project.location_name
      };
      
      for (const [personId, person] of personAvailability) {
        const proficiency = person.skills.get(skillReq.skill_id);
        if (proficiency && proficiency >= skillReq.required_proficiency) {
          qualifiedPeople.push({
            personId,
            person,
            proficiency,
            score: calculateMatchScore(person, skillReq, proficiency, projectLocation)
          });
        }
      }

      // Sort by score (best matches first)
      qualifiedPeople.sort((a, b) => b.score - a.score);

      // Assign people up to the needed count
      for (const match of qualifiedPeople) {
        if (peopleFilled >= peopleNeeded) break;
        
        // Check if project budget is already met
        const currentBudgetRemaining = projectBudgetRemaining.get(project.id);
        if (project.budget_hours && currentBudgetRemaining <= 0) break;
        
        const person = personAvailability.get(match.personId);
        if (!person || person.hoursRemaining < 1) continue;

        // Calculate how many hours to schedule (respect budget)
        let hoursToSchedule = Math.min(4, person.hoursRemaining);
        if (project.budget_hours && currentBudgetRemaining > 0) {
          hoursToSchedule = Math.min(hoursToSchedule, currentBudgetRemaining);
        }
        if (hoursToSchedule < 1) continue;

        // Find available time slot (considering person's work hours and project's time slot restriction)
        const slot = findAvailableSlot(
          person.assignedHours, 
          hoursToSchedule,
          person.work_start_hour || 9,
          person.work_end_hour || 17,
          project.time_slot_start,
          project.time_slot_end
        );
        if (!slot) continue;

        const duration = slot.end - slot.start;

        suggestions.push({
          id: `${date}-${project.id}-${match.personId}-${skillReq.skill_id}`,
          date,
          projectId: project.id,
          projectName: project.name,
          projectCode: project.code,
          projectColor: project.color,
          projectPriority: project.priority,
          projectLocation: project.location_name,
          projectLocationUrl: project.location_url,
          personId: match.personId,
          personName: `${person.first_name} ${person.last_name}`,
          department: person.department,
          skillId: skillReq.skill_id,
          skillName: skillReq.skill_name,
          skillColor: skillReq.color,
          proficiencyLevel: match.proficiency,
          requiredProficiency: skillReq.required_proficiency,
          startHour: slot.start,
          endHour: slot.end,
          duration: duration,
          matchScore: match.score,
          isMandatory: !!skillReq.is_mandatory,
          reason: generateReason(match, skillReq, project, projectLocation, person)
        });

        // Update person availability
        person.hoursRemaining -= duration;
        person.projectsRemaining--;
        person.assignedHours.push({ start: slot.start, end: slot.end });
        
        // Track this location for the person (for location-based scheduling)
        if (projectLocation.lat && projectLocation.lng) {
          person.assignedLocations.push(projectLocation);
        }
        
        // Update project budget tracking
        projectBudgetRemaining.set(project.id, currentBudgetRemaining - duration);
        projectHoursScheduledToday += duration;
        
        peopleFilled++;
        coverage[project.id].skills[skillReq.skill_id].filled++;
      }

      // Generate warning if not enough people found
      if (peopleFilled < peopleNeeded && skillReq.is_mandatory) {
        warnings.push({
          type: 'insufficient_coverage',
          severity: 'warning',
          projectId: project.id,
          projectName: project.name,
          skillId: skillReq.skill_id,
          skillName: skillReq.skill_name,
          needed: peopleNeeded,
          filled: peopleFilled,
          message: `Only ${peopleFilled}/${peopleNeeded} ${skillReq.skill_name} specialists available for ${project.name}`
        });
      }
    }

    coverage[project.id].hoursScheduledToday = projectHoursScheduledToday;
    
    // Update budget status
    const finalBudgetRemaining = projectBudgetRemaining.get(project.id);
    if (project.budget_hours) {
      if (finalBudgetRemaining <= 0) {
        coverage[project.id].budgetStatus = 'completed';
      } else if (projectHoursScheduledToday > 0) {
        coverage[project.id].budgetStatus = 'partial';
        coverage[project.id].budgetRemaining = finalBudgetRemaining;
      }
    }
  }

  // Calculate remaining availability for people
  const remainingAvailability = [];
  for (const [personId, person] of personAvailability) {
    if (person.hoursRemaining > 0) {
      remainingAvailability.push({
        personId,
        personName: `${person.first_name} ${person.last_name}`,
        department: person.department,
        hoursRemaining: person.hoursRemaining,
        maxHoursPerDay: person.maxHoursPerDay,
        projectsRemaining: person.projectsRemaining
      });
    }
  }

  return { suggestions, warnings, coverage, remainingAvailability };
}

/**
 * Calculate match score for a person-skill-project combination
 * Considers proficiency, availability, project diversity, location proximity, and transportation
 */
function calculateMatchScore(person, skillReq, proficiency, projectLocation) {
  let score = 0;
  
  // Proficiency bonus (0-40 points)
  score += (proficiency - skillReq.required_proficiency + 1) * 10;
  score = Math.min(score, 40);
  
  // Availability bonus (0-25 points) - prefer people with more hours remaining
  score += Math.min(person.hoursRemaining * 5, 25);
  
  // Project diversity bonus (0-15 points) - prefer people with fewer projects
  score += (person.max_projects_per_day - person.projects_assigned) * 5;
  score = Math.min(score, 15);
  
  // Transportation bonus (0-15 points)
  // Valuable for replacement assignments and multi-location projects
  if (person.has_transportation) {
    score += 15;
  }
  
  // Location proximity bonus (0-20 points)
  // Strongly prefer people already assigned to nearby locations
  if (projectLocation && projectLocation.lat && projectLocation.lng && person.assignedLocations && person.assignedLocations.length > 0) {
    let minDistance = Infinity;
    
    for (const loc of person.assignedLocations) {
      if (loc.lat && loc.lng) {
        const distance = calculateDistance(projectLocation.lat, projectLocation.lng, loc.lat, loc.lng);
        if (distance < minDistance) {
          minDistance = distance;
        }
      }
    }
    
    // Score based on distance:
    // Same location (< 0.5 km): 20 points
    // Very close (< 2 km): 15 points  
    // Close (< 5 km): 10 points
    // Moderate (< 15 km): 5 points
    // Far: 0 points (but if has transportation, already got 15 points)
    if (minDistance < 0.5) {
      score += 20;
    } else if (minDistance < 2) {
      score += 15;
    } else if (minDistance < 5) {
      score += 10;
    } else if (minDistance < 15) {
      score += 5;
    }
  } else if (!person.assignedLocations || person.assignedLocations.length === 0) {
    // Person has no location assignments yet - neutral score (10 points)
    score += 10;
  }
  
  return Math.round(score);
}

/**
 * Calculate distance between two coordinates in km (Haversine formula)
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  if (!lat1 || !lng1 || !lat2 || !lng2) return Infinity;
  
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Find an available time slot for a person
 * @param {Array} assignedHours - Array of existing assignments {start, end}
 * @param {number} duration - Hours needed
 * @param {number} personWorkStart - Person's work start hour (default 9)
 * @param {number} personWorkEnd - Person's work end hour (default 17)
 * @param {number|null} projectSlotStart - Project's earliest allowed start (null = any)
 * @param {number|null} projectSlotEnd - Project's latest allowed end (null = any)
 */
function findAvailableSlot(assignedHours, duration, personWorkStart = 9, personWorkEnd = 17, projectSlotStart = null, projectSlotEnd = null) {
  // Determine effective work window
  let workStart = personWorkStart || 9;
  let workEnd = personWorkEnd || 17;
  
  // Apply project time slot restrictions if specified
  if (projectSlotStart !== null && projectSlotStart !== undefined) {
    workStart = Math.max(workStart, projectSlotStart);
  }
  if (projectSlotEnd !== null && projectSlotEnd !== undefined) {
    workEnd = Math.min(workEnd, projectSlotEnd);
  }
  
  // If the restricted window is too small, return null
  if (workEnd - workStart < duration) {
    return null;
  }
  
  // Sort existing assignments
  const sorted = [...assignedHours].sort((a, b) => a.start - b.start);
  
  // Try to find a slot
  let currentHour = workStart;
  
  for (const slot of sorted) {
    if (slot.start - currentHour >= duration && slot.start >= workStart) {
      const proposedEnd = currentHour + duration;
      if (proposedEnd <= workEnd) {
        return { start: currentHour, end: proposedEnd };
      }
    }
    currentHour = Math.max(currentHour, slot.end);
  }
  
  // Check if there's room at the end
  if (workEnd - currentHour >= duration) {
    return { start: currentHour, end: currentHour + duration };
  }
  
  return null;
}

/**
 * Get assigned hours for a person on a date
 */
async function getAssignedHours(db, personId, date) {
  const assignments = await db.prepare(`
    SELECT start_hour, end_hour 
    FROM assignments 
    WHERE person_id = ? AND date = ? AND status != 'cancelled'
  `).all(personId, date);
  
  return assignments.map(a => ({ start: a.start_hour, end: a.end_hour }));
}

/**
 * Get assigned locations for a person on a date (from existing assignments)
 */
async function getAssignedLocations(db, personId, date) {
  const assignments = await db.prepare(`
    SELECT DISTINCT p.location_name, p.location_lat, p.location_lng
    FROM assignments a
    JOIN projects p ON a.project_id = p.id
    WHERE a.person_id = ? AND a.date = ? AND a.status != 'cancelled'
    AND p.location_lat IS NOT NULL AND p.location_lng IS NOT NULL
  `).all(personId, date);
  
  return assignments.map(a => ({ 
    name: a.location_name,
    lat: a.location_lat, 
    lng: a.location_lng 
  }));
}

/**
 * Generate human-readable reason for the suggestion
 */
function generateReason(match, skillReq, project, projectLocation, person) {
  const reasons = [];
  
  if (match.proficiency > skillReq.required_proficiency) {
    reasons.push(`Exceeds required skill level (${match.proficiency}/${skillReq.required_proficiency})`);
  } else {
    reasons.push(`Meets skill requirement (Level ${match.proficiency})`);
  }
  
  if (project.priority === 'critical' || project.priority === 'high') {
    reasons.push(`High priority project`);
  }
  
  // Add location-based reasoning
  if (projectLocation && projectLocation.lat && projectLocation.lng && person.assignedLocations && person.assignedLocations.length > 0) {
    let minDistance = Infinity;
    let closestLocation = null;
    
    for (const loc of person.assignedLocations) {
      if (loc.lat && loc.lng) {
        const distance = calculateDistance(projectLocation.lat, projectLocation.lng, loc.lat, loc.lng);
        if (distance < minDistance) {
          minDistance = distance;
          closestLocation = loc.name;
        }
      }
    }
    
    if (minDistance < 0.5) {
      reasons.push(`Same location${closestLocation ? ` (${closestLocation})` : ''}`);
    } else if (minDistance < 5) {
      reasons.push(`Near other assignment (${minDistance.toFixed(1)} km away)`);
    }
  }
  
  if (match.score >= 70) {
    reasons.push('Excellent match');
  } else if (match.score >= 50) {
    reasons.push('Good match');
  }
  
  return reasons.join('. ');
}

module.exports = router;

