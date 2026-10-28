const express = require('express');
const { asyncHandler } = require('../middleware/errors');
const { ok } = require('../utils/respond');
const schemas = require('../utils/schemas');
const { loadAll } = require('../utils/data');
const { profileCompletion } = require('../utils/readiness');

const router = express.Router();

function present(profile, user) {
  return { ...profile, account_email: user.email, completion: profileCompletion(profile) };
}

// GET /api/profile - the logged-in student's profile (created on first request if missing)
router.get('/', asyncHandler(async (req, res) => {
  const { profile } = await loadAll(req.db, req.user.id);
  return ok(res, present(profile, req.user));
}));

// PUT /api/profile - save profile fields (public-sharing settings use PUT /api/portfolio/settings)
router.put('/', asyncHandler(async (req, res) => {
  const values = schemas.profile(req.body);
  const { data, error } = await req.db.from('profiles')
    .upsert({ ...values, id: req.user.id }, { onConflict: 'id' }).select().single();
  if (error) throw error;
  return ok(res, present(data, req.user));
}));

module.exports = router;
