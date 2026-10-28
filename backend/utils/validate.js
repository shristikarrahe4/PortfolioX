// Small validation helper. Usage:
//   const data = validator(req.body).text('title', { required: true, max: 100 }).result();
// result() throws a ValidationError (HTTP 400) listing every problem field.
class ValidationError extends Error {
  constructor(fields) {
    super('Please correct the highlighted fields.');
    this.name = 'ValidationError';
    this.status = 400;
    this.fields = fields;
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const USERNAME_RE = /^[a-z0-9][a-z0-9_-]{2,29}$/;

function isUuid(value) {
  return typeof value === 'string' && UUID_RE.test(value);
}

function validator(body) {
  const src = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const out = {};
  const errors = {};
  const fail = (key, message) => { if (!errors[key]) errors[key] = message; };
  const asText = (key) => {
    const raw = src[key];
    if (raw === undefined || raw === null) return '';
    if (typeof raw !== 'string') { fail(key, 'This value must be text.'); return ''; }
    return raw.trim();
  };

  const api = {
    text(key, { required = false, min = 0, max = 200 } = {}) {
      const v = asText(key);
      if (!v) { if (required) fail(key, 'This field is required.'); }
      else if (v.length < min) fail(key, `Please write at least ${min} characters.`);
      else if (v.length > max) fail(key, `Please keep this under ${max} characters.`);
      out[key] = v || null;
      return api;
    },
    url(key, { required = false, host } = {}) {
      const v = asText(key);
      out[key] = v || null;
      if (!v) { if (required) fail(key, 'This field is required.'); return api; }
      if (v.length > 300) return fail(key, 'This link is too long.'), api;
      let u;
      try { u = new URL(v); } catch (e) { return fail(key, 'Enter a full link starting with https://'), api; }
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return fail(key, 'Links must start with http:// or https://'), api;
      if (host && !(u.hostname === host || u.hostname.endsWith('.' + host))) fail(key, `This should be a ${host} link.`);
      return api;
    },
    email(key, { required = false } = {}) {
      const v = asText(key);
      out[key] = v || null;
      if (!v) { if (required) fail(key, 'This field is required.'); }
      else if (v.length > 200 || !EMAIL_RE.test(v)) fail(key, 'Enter a valid email address.');
      return api;
    },
    date(key, { required = false } = {}) {
      const v = asText(key);
      out[key] = v || null;
      if (!v) { if (required) fail(key, 'This field is required.'); return api; }
      const d = new Date(v + 'T00:00:00Z');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v) {
        fail(key, 'Enter a valid date.');
      }
      return api;
    },
    int(key, { required = false, min = 0, max = 1000 } = {}) {
      const raw = src[key];
      out[key] = null;
      if (raw === undefined || raw === null || raw === '') { if (required) fail(key, 'This field is required.'); return api; }
      const n = Number(raw);
      if (!Number.isInteger(n) || n < min || n > max) fail(key, `Choose a whole number from ${min} to ${max}.`);
      else out[key] = n;
      return api;
    },
    list(key, { required = false, maxItems = 20, maxLen = 40 } = {}) {
      const raw = src[key];
      let items = [];
      if (Array.isArray(raw)) items = raw;
      else if (typeof raw === 'string') items = raw.split(',');
      else if (raw !== undefined && raw !== null) fail(key, 'This value must be a list.');
      const seen = new Set();
      const clean = [];
      for (const item of items) {
        if (typeof item !== 'string') { fail(key, 'Each item must be text.'); break; }
        const t = item.trim();
        if (!t || seen.has(t.toLowerCase())) continue;
        if (t.length > maxLen) { fail(key, `Each item must be under ${maxLen} characters.`); break; }
        seen.add(t.toLowerCase());
        clean.push(t);
      }
      if (clean.length > maxItems) fail(key, `Please list at most ${maxItems} items.`);
      if (required && clean.length === 0) fail(key, 'Add at least one item (separate items with commas).');
      out[key] = clean;
      return api;
    },
    bool(key, defaultValue = false) {
      const raw = src[key];
      if (raw === undefined || raw === null) out[key] = defaultValue;
      else if (typeof raw === 'boolean') out[key] = raw;
      else fail(key, 'This value must be true or false.');
      return api;
    },
    oneOf(key, options, { required = true } = {}) {
      const v = asText(key);
      out[key] = v || null;
      if (!v) { if (required) fail(key, 'Please choose an option.'); }
      else if (!options.includes(v)) fail(key, 'Please choose one of the listed options.');
      return api;
    },
    username(key, { required = false } = {}) {
      const v = asText(key).toLowerCase();
      out[key] = v || null;
      if (!v) { if (required) fail(key, 'Choose a username.'); }
      else if (!USERNAME_RE.test(v)) fail(key, 'Use 3-30 lowercase letters, numbers, hyphens or underscores (start with a letter or number).');
      return api;
    },
    result() {
      if (Object.keys(errors).length) throw new ValidationError(errors);
      return out;
    },
  };
  return api;
}

module.exports = { validator, ValidationError, isUuid, USERNAME_RE };
