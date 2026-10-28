const { userClient } = require('../utils/supabase');
const { fail } = require('../utils/respond');

// Verifies the Supabase access token sent by the browser ("Authorization: Bearer <token>").
// On success: req.user = verified Supabase user, req.db = Supabase client acting as that user.
// The user id ALWAYS comes from the verified token - never from the request body or URL.
async function requireAuth(req, res, next) {
  try {
    const match = (req.headers.authorization || '').match(/^Bearer\s+(\S+)$/i);
    if (!match) return fail(res, 401, 'Please log in to continue.');
    const token = match[1];
    const db = userClient(token);
    const { data, error } = await db.auth.getUser(token);
    if (error || !data || !data.user) {
      return fail(res, 401, 'Your session has expired. Please log in again.');
    }
    req.user = data.user;
    req.db = db;
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = { requireAuth };
