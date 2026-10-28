// Public portfolio + sharing settings. Mounted at /api.
const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errors');
const { ok, fail } = require('../utils/respond');
const schemas = require('../utils/schemas');
const { USERNAME_RE, ValidationError } = require('../utils/validate');
const { anon } = require('../utils/supabase');
const { loadAll } = require('../utils/data');

function createRouter(authLimiter) {
  const router = express.Router();
  const guard = [authLimiter, requireAuth];

  // PUT /api/portfolio/settings - username, publish on/off and what is shown
  router.put('/portfolio/settings', ...guard, asyncHandler(async (req, res) => {
    const settings = schemas.portfolioSettings(req.body);
    const { profile } = await loadAll(req.db, req.user.id);
    if (settings.is_public) {
      if (!settings.username) throw new ValidationError({ username: 'Choose a username before publishing.' });
      if (!profile.full_name || !profile.headline) {
        throw new ValidationError({ is_public: 'Add your name and headline on the Profile page before publishing.' });
      }
    }
    const { data, error } = await req.db.from('profiles')
      .update(settings).eq('id', req.user.id).select().single();
    if (error) {
      if (error.code === '23505') throw new ValidationError({ username: 'That username is already taken. Try another.' });
      throw error;
    }
    return ok(res, data);
  }));

  // GET /api/portfolio-preview - the logged-in student's own portfolio as visitors would see it
  // (works even before publishing; respects the same visibility choices)
  router.get('/portfolio-preview', ...guard, asyncHandler(async (req, res) => {
    await loadAll(req.db, req.user.id);
    const { data, error } = await req.db.rpc('get_my_portfolio_preview');
    if (error) throw error;
    return ok(res, data);
  }));

  // GET /api/portfolio/:username - PUBLIC. Returns only fields the student chose to publish.
  router.get('/portfolio/:username', asyncHandler(async (req, res) => {
    const username = String(req.params.username || '').toLowerCase();
    const unavailable = 'This portfolio is unavailable. It may be private, or the link may be incorrect.';
    if (!USERNAME_RE.test(username)) return fail(res, 404, unavailable);
    const { data, error } = await anon.rpc('get_public_portfolio', { p_username: username });
    if (error) throw error;
    if (!data) return fail(res, 404, unavailable); // same message for "private" and "does not exist"
    return ok(res, data);
  }));

  return router;
}

module.exports = createRouter;
