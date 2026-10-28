const express = require('express');
const { asyncHandler } = require('../middleware/errors');
const { ok } = require('../utils/respond');
const schemas = require('../utils/schemas');
const { loadAll } = require('../utils/data');

const router = express.Router();

// GET /api/resume - everything the resume preview needs.
// Saved resume-only fields live in resume_details; the rest is generated from profile/projects/achievements.
router.get('/', asyncHandler(async (req, res) => {
  const all = await loadAll(req.db, req.user.id);
  return ok(res, {
    resume: all.resume,
    profile: all.profile,
    projects: all.projects,
    achievements: all.achievements,
    account_email: req.user.email,
  });
}));

// PUT /api/resume - save the resume-only fields
router.put('/', asyncHandler(async (req, res) => {
  const values = schemas.resume(req.body);
  // Make sure the profile row exists (resume_details references it).
  await loadAll(req.db, req.user.id);
  const { data, error } = await req.db.from('resume_details')
    .upsert({ ...values, user_id: req.user.id }, { onConflict: 'user_id' }).select().single();
  if (error) throw error;
  return ok(res, data);
}));

module.exports = router;
