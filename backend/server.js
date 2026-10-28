// PortfolioX server: serves the frontend and the REST API.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY ||
    SUPABASE_URL.includes('YOUR-PROJECT-REF') || SUPABASE_PUBLISHABLE_KEY.includes('YOUR-PUBLISHABLE-KEY')) {
  console.error('\n[PortfolioX] Supabase is not configured.');
  console.error('Open backend/.env and set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY (see README, Step 6).\n');
  process.exit(1);
}

const { anon } = require('./utils/supabase');
const { requireAuth } = require('./middleware/auth');
const { notFoundApi, errorHandler } = require('./middleware/errors');
const { ok } = require('./utils/respond');
const C = require('./utils/constants');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');

app.disable('x-powered-by');
if (isProd) app.set('trust proxy', 1);

// Security headers. The CSP only allows our own scripts/styles, Google Fonts, and calls to our Supabase project.
app.use(helmet({
  hsts: isProd,
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", SUPABASE_URL],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
}));

app.use(express.json({ limit: '100kb' }));

// Rate limits: a general one, and a stricter one that only counts FAILED private requests
// (missing/expired tokens, invalid data) so repeated bad attempts are slowed down.
const generalLimiter = rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false,
  message: { ok: false, error: { message: 'Too many requests. Please slow down.' } } });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, skipSuccessfulRequests: true,
  standardHeaders: true, legacyHeaders: false,
  message: { ok: false, error: { message: 'Too many failed requests. Please wait a few minutes and try again.' } } });

app.use('/api', generalLimiter);
app.use('/api', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });

// ---- Public API ----
app.get('/api/health', async (req, res) => {
  let database = 'connected';
  try {
    // Calls the public SQL function with a dummy name: succeeds (returns null) only if the schema is installed.
    const { error } = await anon.rpc('get_public_portfolio', { p_username: 'health-check-probe' });
    if (error) database = 'error: schema missing or credentials wrong (see README troubleshooting)';
  } catch (e) {
    database = 'error: cannot reach Supabase';
  }
  res.status(database === 'connected' ? 200 : 503).json({
    ok: database === 'connected', status: database === 'connected' ? 'ok' : 'degraded',
    database, time: new Date().toISOString(),
  });
});

// The publishable key is meant for browsers. No secret/service-role key exists anywhere in this project.
app.get('/api/config', (req, res) => ok(res, {
  supabaseUrl: SUPABASE_URL,
  supabaseKey: SUPABASE_PUBLISHABLE_KEY,
  projectCategories: C.PROJECT_CATEGORIES,
  achievementCategories: C.ACHIEVEMENT_CATEGORIES,
}));

// ---- API routes (public portfolio GET is public; everything else needs a valid login) ----
app.use('/api', require('./routes/portfolio')(authLimiter));
app.use('/api', require('./routes/readiness')(authLimiter));
app.use('/api/profile', authLimiter, requireAuth, require('./routes/profile'));
app.use('/api/projects', authLimiter, requireAuth, require('./routes/projects'));
app.use('/api/achievements', authLimiter, requireAuth, require('./routes/achievements'));
app.use('/api/resume', authLimiter, requireAuth, require('./routes/resume'));
app.use('/api', notFoundApi);

// ---- Frontend ----
// Serve the Supabase browser library from node_modules so no CDN is needed.
app.use('/vendor', express.static(path.join(__dirname, 'node_modules', '@supabase', 'supabase-js', 'dist', 'umd')));
app.use(express.static(FRONTEND_DIR));
// Public portfolio URL: /u/<username>
app.get('/u/:username', (req, res) => res.sendFile(path.join(FRONTEND_DIR, 'portfolio.html')));
app.use((req, res) => res.status(404).sendFile(path.join(FRONTEND_DIR, '404.html')));

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`PortfolioX is running at http://localhost:${PORT}`);
  console.log(`Health check:        http://localhost:${PORT}/api/health`);
});
