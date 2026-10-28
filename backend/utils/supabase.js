const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;

const baseOptions = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };

// Client for anonymous (not logged-in) calls. Only used for the public portfolio function and health check.
const anon = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, baseOptions);

// Client that acts AS the logged-in student: every query carries the student's access token,
// so PostgreSQL Row Level Security decides which rows are visible.
function userClient(accessToken) {
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    ...baseOptions,
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

module.exports = { anon, userClient, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY };
