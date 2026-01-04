const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getDatabaseType, getBooleanCondition } = require('../database');

const router = express.Router();

// Helper for database-agnostic string aggregation
const getStringAgg = () => {
  return getDatabaseType() === 'postgres' ? 'STRING_AGG' : 'GROUP_CONCAT';
};

// Helper for active condition
const getActiveCondition = (column = 'is_active') => getBooleanCondition(column, true);

router.get('/project/:projectId/candidates', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { date, minHours = 1, maxResults = 20 } = req.query;
    const { projectId } = req.params;

    const project = await db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const requiredSkills = await db.prepare('SELECT skill_id, required_proficiency, is_mandatory FROM project_skills WHERE project_id = ?').all(projectId);
    const stringAgg = getStringAgg();
    const activeCondition = getActiveCondition('p.is_active');
    const people = await db.prepare(`SELECT p.*, ${stringAgg}(ps.skill_id || ':' || ps.proficiency_level, ',') as skills_data FROM people p LEFT JOIN person_skills ps ON p.id = ps.person_id WHERE ${activeCondition} GROUP BY p.id`).all();

    const candidates = [];

    for (const person of people) {
      const personSkills = new Map();
      if (person.skills_data) {
        person.skills_data.split(',').forEach(s => {
          const [skillId, level] = s.split(':').map(Number);
          personSkills.set(skillId, level);
        });
      }

      let matchScore = 0;
      let mandatoryMet = true;
      const skillMatches = [], skillGaps = [];

      for (const req of requiredSkills) {
        const personLevel = personSkills.get(req.skill_id) || 0;
        const skill = await db.prepare('SELECT name FROM skills WHERE id = ?').get(req.skill_id);
        
        if (personLevel >= req.required_proficiency) {
          matchScore += personLevel / 5;
          skillMatches.push({ skillName: skill?.name, required: req.required_proficiency, actual: personLevel, match: true });
        } else if (personLevel > 0) {
          matchScore += (personLevel / req.required_proficiency) * 0.5;
          skillMatches.push({ skillName: skill?.name, required: req.required_proficiency, actual: personLevel, match: false, partial: true });
          if (req.is_mandatory) mandatoryMet = false;
        } else {
          skillGaps.push({ skillName: skill?.name, required: req.required_proficiency });
          if (req.is_mandatory) mandatoryMet = false;
        }
      }

      const normalizedScore = requiredSkills.length > 0 ? (matchScore / requiredSkills.length) * 100 : 100;

      let availability = null;
      if (date) {
        const bookedHoursResult = await db.prepare("SELECT COALESCE(SUM(end_hour - start_hour), 0) as hours FROM assignments WHERE person_id = ? AND date = ? AND status NOT IN ('cancelled')").get(person.id, date);
        const bookedHours = bookedHoursResult?.hours || 0;
        const unavailableResult = await db.prepare(`SELECT COUNT(*) as count FROM availability_windows WHERE person_id = ? AND start_date <= ? AND end_date >= ? AND status = 'approved' AND type NOT IN ('preferred')`).get(person.id, date, date);
        const unavailable = (unavailableResult?.count || 0) > 0;
        availability = { date, bookedHours, remainingHours: person.max_hours_per_day - bookedHours, isAvailable: !unavailable && (person.max_hours_per_day - bookedHours) >= minHours };
      }

      candidates.push({
        personId: person.id, firstName: person.first_name, lastName: person.last_name,
        department: person.department, jobTitle: person.job_title, matchScore: Math.round(normalizedScore),
        mandatorySkillsMet: mandatoryMet, skillMatches, skillGaps, availability
      });
    }

    candidates.sort((a, b) => {
      if (a.mandatorySkillsMet !== b.mandatorySkillsMet) return b.mandatorySkillsMet - a.mandatorySkillsMet;
      return b.matchScore - a.matchScore;
    });

    res.json({ projectId: parseInt(projectId), projectName: project.name, requiredSkillsCount: requiredSkills.length, candidates: candidates.slice(0, parseInt(maxResults)) });
  } catch (error) {
    console.error('Find candidates error:', error);
    res.status(500).json({ error: 'Failed to find candidates' });
  }
});

router.get('/person/:personId/projects', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { status = 'active', maxResults = 20 } = req.query;
    const { personId } = req.params;

    const person = await db.prepare('SELECT * FROM people WHERE id = ?').get(personId);
    if (!person) return res.status(404).json({ error: 'Person not found' });

    const personSkills = await db.prepare('SELECT skill_id, proficiency_level FROM person_skills WHERE person_id = ?').all(personId);
    const personSkillMap = new Map(personSkills.map(s => [s.skill_id, s.proficiency_level]));

    const stringAgg = getStringAgg();
    const projects = await db.prepare(`SELECT p.*, ${stringAgg}(ps.skill_id || ':' || ps.required_proficiency || ':' || ps.is_mandatory, ',') as skills_data FROM projects p LEFT JOIN project_skills ps ON p.id = ps.project_id WHERE status = ? GROUP BY p.id`).all(status);

    // Pre-fetch all skills for efficiency
    const allSkills = await db.prepare('SELECT id, name FROM skills').all();
    const skillNameMap = new Map(allSkills.map(s => [s.id, s.name]));

    const matches = projects.map(project => {
      const requiredSkills = [];
      if (project.skills_data) {
        project.skills_data.split(',').forEach(s => {
          const [skillId, level, mandatory] = s.split(':').map(Number);
          requiredSkills.push({ skillId, level, mandatory: !!mandatory });
        });
      }

      let matchScore = 0, mandatoryMet = true;
      const matchedSkills = [], missingSkills = [];

      for (const req of requiredSkills) {
        const personLevel = personSkillMap.get(req.skillId) || 0;
        const skillName = skillNameMap.get(req.skillId);
        if (personLevel >= req.level) { matchScore++; matchedSkills.push(skillName); }
        else { missingSkills.push({ name: skillName, required: req.level, current: personLevel }); if (req.mandatory) mandatoryMet = false; }
      }

      const normalizedScore = requiredSkills.length > 0 ? (matchScore / requiredSkills.length) * 100 : 100;
      return { projectId: project.id, projectName: project.name, projectCode: project.code, client: project.client, status: project.status, priority: project.priority, matchScore: Math.round(normalizedScore), mandatorySkillsMet: mandatoryMet, matchedSkills, missingSkills };
    });

    matches.sort((a, b) => { if (a.mandatorySkillsMet !== b.mandatorySkillsMet) return b.mandatorySkillsMet - a.mandatorySkillsMet; return b.matchScore - a.matchScore; });

    res.json({ personId: parseInt(personId), personName: `${person.first_name} ${person.last_name}`, skillsCount: personSkills.length, matches: matches.slice(0, parseInt(maxResults)) });
  } catch (error) {
    console.error('Find projects error:', error);
    res.status(500).json({ error: 'Failed to find projects' });
  }
});

router.get('/skill-gaps', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { projectId } = req.query;

    let projects;
    if (projectId) projects = await db.prepare('SELECT * FROM projects WHERE id = ?').all(projectId);
    else projects = await db.prepare("SELECT * FROM projects WHERE status = 'active'").all();

    const gaps = [];

    for (const project of projects) {
      const requiredSkills = await db.prepare('SELECT ps.*, s.name as skill_name, s.category FROM project_skills ps JOIN skills s ON ps.skill_id = s.id WHERE ps.project_id = ?').all(project.id);

      for (const skill of requiredSkills) {
        const activeCondition = getActiveCondition('is_active');
        const qualified = await db.prepare(`SELECT COUNT(*) as count FROM person_skills WHERE skill_id = ? AND proficiency_level >= ? AND person_id IN (SELECT id FROM people WHERE ${activeCondition})`).get(skill.skill_id, skill.required_proficiency);
        const partiallyQualified = await db.prepare(`SELECT COUNT(*) as count FROM person_skills WHERE skill_id = ? AND proficiency_level < ? AND proficiency_level > 0 AND person_id IN (SELECT id FROM people WHERE ${activeCondition})`).get(skill.skill_id, skill.required_proficiency);

        if (qualified.count < 3) {
          gaps.push({
            projectId: project.id, projectName: project.name, skillId: skill.skill_id, skillName: skill.skill_name,
            skillCategory: skill.category, requiredProficiency: skill.required_proficiency, isMandatory: !!skill.is_mandatory,
            qualifiedCount: qualified.count, partiallyQualifiedCount: partiallyQualified.count,
            severity: qualified.count === 0 ? 'critical' : qualified.count < 2 ? 'high' : 'medium'
          });
        }
      }
    }

    gaps.sort((a, b) => { const order = { critical: 1, high: 2, medium: 3 }; return (order[a.severity] || 4) - (order[b.severity] || 4); });

    res.json({
      gaps, summary: { totalGaps: gaps.length, criticalGaps: gaps.filter(g => g.severity === 'critical').length, highGaps: gaps.filter(g => g.severity === 'high').length, projectsAffected: new Set(gaps.map(g => g.projectId)).size }
    });
  } catch (error) {
    console.error('Skill gaps error:', error);
    res.status(500).json({ error: 'Failed to analyze skill gaps' });
  }
});

module.exports = router;
