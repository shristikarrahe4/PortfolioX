const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const schemas = require('../utils/schemas');
const { ValidationError } = require('../utils/validate');

const throwsFields = (fn) => { try { fn(); } catch (e) { assert.ok(e instanceof ValidationError); return e.fields; } assert.fail('expected ValidationError'); };

test('profile requires a name and rejects bad links', () => {
  const f = throwsFields(() => schemas.profile({ github_url: 'javascript:alert(1)', linkedin_url: 'https://example.com/x' }));
  assert.ok(f.full_name && f.github_url && f.linkedin_url);
});

test('profile accepts comma separated skills and trims them', () => {
  const d = schemas.profile({ full_name: 'Asha Rao', technical_skills: ' HTML, css , HTML ' });
  assert.deepStrictEqual(d.technical_skills, ['HTML', 'css']);
});

test('project validation', () => {
  const f = throwsFields(() => schemas.project({ title: 'A', description: 'too short', category: 'Nope', technologies: '' }));
  assert.ok(f.title && f.description && f.category && f.technologies);
  const ok = schemas.project({ title: 'Todo App', description: 'A simple to-do list web application.', category: 'Web Development', technologies: 'JS, HTML', completed_on: '2026-02-30' === 'x' ? '' : '2026-02-20' });
  assert.strictEqual(ok.is_public, true);
  assert.strictEqual(ok.is_featured, false);
});

test('impossible dates are rejected', () => {
  const f = throwsFields(() => schemas.achievement({ title: 'Cert', organization: 'Org', category: 'Certification', earned_on: '2026-02-31' }));
  assert.ok(f.earned_on);
});

test('settings reject bad usernames and non-boolean flags', () => {
  const f = throwsFields(() => schemas.portfolioSettings({ username: 'A!', is_public: 'yes' }));
  assert.ok(f.username && f.is_public);
  assert.strictEqual(schemas.portfolioSettings({ username: 'Asha_Rao' }).username, 'asha_rao');
});

test('checklist only accepts manual task keys', () => {
  throwsFields(() => schemas.checklistToggle({ task_key: 'complete_profile', is_done: true }));
});

// Every key the backend writes must be a real column in database/schema.sql.
test('validated keys exist as columns in schema.sql', () => {
  const sql = fs.readFileSync(path.join(__dirname, '..', '..', 'database', 'schema.sql'), 'utf8');
  const columnsOf = (table) => {
    const body = sql.split(`create table if not exists public.${table} (`)[1].split('\n);')[0];
    return new Set(body.split('\n').map((l) => l.trim().split(/\s+/)[0]).filter((w) => /^[a-z_]+$/.test(w) && w !== 'constraint'));
  };
  const samples = {
    profiles: [schemas.profile({ full_name: 'Asha Rao' }), schemas.portfolioSettings({})],
    projects: [schemas.project({ title: 'Todo', description: 'A simple to-do list web app.', category: 'Other', technologies: 'JS' })],
    achievements: [schemas.achievement({ title: 'Cert', organization: 'Org', category: 'Other', earned_on: '2026-01-01' })],
    resume_details: [schemas.resume({})],
    checklist_items: [schemas.checklistToggle({ task_key: 'review_skills' })],
  };
  for (const [table, outputs] of Object.entries(samples)) {
    const cols = columnsOf(table);
    for (const out of outputs) for (const key of Object.keys(out)) assert.ok(cols.has(key), `${table}.${key} missing from schema.sql`);
  }
});
