const { fail } = require('../utils/respond');
const { ValidationError } = require('../utils/validate');

// Wraps async route handlers so thrown errors reach the error handler (Express 4 needs this).
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function notFoundApi(req, res) {
  return fail(res, 404, 'That API endpoint does not exist.');
}

// Central error handler: logs details on the server, sends only a safe message to the browser.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof ValidationError) return fail(res, 400, err.message, err.fields);
  if (err && err.type === 'entity.parse.failed') return fail(res, 400, 'The request body is not valid JSON.');
  if (err && err.type === 'entity.too.large') return fail(res, 413, 'The request is too large.');

  const code = err && err.code;
  console.error('[error]', req.method, req.originalUrl, code || '', err && err.message);

  if (code === '23505') return fail(res, 409, 'That value is already in use.');
  if (code === '23514' || code === '22P02' || code === '23502') return fail(res, 400, 'Some of the submitted values are not allowed.');
  if (code === '42501') return fail(res, 403, 'You are not allowed to do that.');
  if (code === '42P01' || code === 'PGRST205' || code === 'PGRST202') {
    return fail(res, 500, 'The database is not set up correctly. Run database/schema.sql in Supabase (see README troubleshooting).');
  }
  return fail(res, 500, 'Something went wrong on the server. Please try again.');
}

module.exports = { asyncHandler, notFoundApi, errorHandler };
