// Readiness meter, checklist and dashboard summary. Mounted at /api.
const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errors');
const { ok } = require('../utils/respond');
const schemas = require('../utils/schemas');
const { loadAll } = require('../utils/data');
const { computeReadiness, profileCompletion, buildChecklist } = require('../utils/readiness');

function createRouter(authLimiter) {
  const router = express.Router();
  const guard = [authLimiter, requireAuth];

  // GET /api/readiness - score out of 100, breakdown and recommendations
  router.get('/readiness', ...guard, asyncHandler(async (req, res) => {
    const all = await loadAll(req.db, req.user.id);
    const readiness = computeReadiness(all);
    return ok(res, { ...readiness, profile_completion: profileCompletion(all.profile) });
  }));

  // GET /api/checklist - automatic tasks (derived) + manual tasks (saved)
  router.get('/checklist', ...guard, asyncHandler(async (req, res) => {
    const all = await loadAll(req.db, req.user.id);
    return ok(res, buildChecklist(computeReadiness(all), all.checklistRows));
  }));

  // PUT /api/checklist - tick or untick a manual task. Automatic tasks cannot be changed here.
  router.put('/checklist', ...guard, asyncHandler(async (req, res) => {
    const { task_key: taskKey, is_done: isDone } = schemas.checklistToggle(req.body);
    await loadAll(req.db, req.user.id); // makes sure the profile row exists
    const { error } = await req.db.from('checklist_items')
      .upsert({ user_id: req.user.id, task_key: taskKey, is_done: isDone }, { onConflict: 'user_id,task_key' });
    if (error) throw error;
    const all = await loadAll(req.db, req.user.id);
    return ok(res, buildChecklist(computeReadiness(all), all.checklistRows));
  }));

  // GET /api/dashboard - one call with everything the dashboard shows
  router.get('/dashboard', ...guard, asyncHandler(async (req, res) => {
    const all = await loadAll(req.db, req.user.id);
    const readiness = computeReadiness(all);
    const recent = [...all.projects]
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
      .slice(0, 3)
      .map((p) => ({ id: p.id, title: p.title, category: p.category, technologies: p.technologies, completed_on: p.completed_on }));
    return ok(res, {
      name: all.profile.full_name,
      completion: profileCompletion(all.profile),
      counts: { projects: all.projects.length, achievements: all.achievements.length },
      readiness: { score: readiness.score, max: 100, level: readiness.level },
      next_action: readiness.recommendations[0] || null,
      recent_projects: recent,
      checklist: buildChecklist(readiness, all.checklistRows),
    });
  }));

  return router;
}

module.exports = createRouter;
