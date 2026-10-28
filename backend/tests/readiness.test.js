const test = require('node:test');
const assert = require('node:assert');
const { computeReadiness, profileCompletion, buildChecklist } = require('../utils/readiness');

const fullData = {
  profile: {
    full_name: 'Asha Rao', headline: 'First-year B.Tech student', college: 'ABC College', course: 'CSE', year_of_study: 1,
    intro: 'I am a first-year student who enjoys building small web projects and learning new things.',
    technical_skills: ['HTML', 'CSS', 'JavaScript'], soft_skills: ['Teamwork', 'Communication'],
    interests: ['Web'], github_url: 'https://github.com/asha', linkedin_url: 'https://linkedin.com/in/asha',
  },
  projects: [
    { title: 'Todo App', description: 'A simple to-do list web app.', technologies: ['JS'], github_url: 'https://github.com/asha/todo' },
    { title: 'Weather App', description: 'Shows weather using an API.', technologies: ['JS'] },
  ],
  achievements: [
    { title: 'Python Basics', organization: 'Coursera', earned_on: '2026-01-10' },
    { title: 'Hackathon', organization: 'College Club', earned_on: '2026-03-05' },
  ],
  resume: { objective: 'Seeking an internship in web development.', phone: '+91 98765 43210', location: 'Hyderabad',
    education_summary: 'B.Tech CSE (2026-2030)', availability: 'Available from May 2027' },
};

test('empty portfolio scores 0 with recommendations', () => {
  const r = computeReadiness({});
  assert.strictEqual(r.score, 0);
  assert.ok(r.recommendations.length > 0);
});

test('complete portfolio scores exactly 100', () => {
  const r = computeReadiness(fullData);
  assert.strictEqual(r.score, 100);
  assert.strictEqual(r.recommendations.length, 0);
  assert.strictEqual(r.criteria.reduce((s, c) => s + c.max, 0), 100);
});

test('criteria maximums match the documented scoring table', () => {
  const max = Object.fromEntries(computeReadiness({}).criteria.map((c) => [c.key, c.max]));
  assert.deepStrictEqual(max, { basic: 20, intro: 10, skills: 15, projects: 20, achievements: 10, resume: 15, links: 10 });
});

test('adding the first project adds exactly 12 points', () => {
  const before = computeReadiness({ ...fullData, projects: [] }).score;
  const after = computeReadiness({ ...fullData, projects: [fullData.projects[1]] }).score;
  assert.strictEqual(after - before, 12);
});

test('a project without technologies or a real description earns nothing', () => {
  const r = computeReadiness({ projects: [{ title: 'X project', description: 'short', technologies: [] }] });
  assert.strictEqual(r.criteria.find((c) => c.key === 'projects').earned, 0);
});

test('recommendations link to the right pages and are sorted by points', () => {
  const r = computeReadiness({ profile: { full_name: 'A B' } });
  assert.ok(r.recommendations.every((x) => x.link.startsWith('/')));
  for (let i = 1; i < r.recommendations.length; i++) assert.ok(r.recommendations[i - 1].points >= r.recommendations[i].points);
  assert.strictEqual(r.recommendations[0].link, '/projects.html');
});

test('checklist automatic tasks agree with the readiness items', () => {
  const full = buildChecklist(computeReadiness(fullData), []);
  assert.ok(full.items.filter((i) => i.type === 'auto').every((i) => i.done));
  const empty = buildChecklist(computeReadiness({}), []);
  assert.ok(empty.items.filter((i) => i.type === 'auto').every((i) => !i.done));
});

test('manual checklist tasks come from saved rows only', () => {
  const c = buildChecklist(computeReadiness({}), [{ task_key: 'save_resume_pdf', is_done: true }]);
  assert.strictEqual(c.items.find((i) => i.key === 'save_resume_pdf').done, true);
  assert.strictEqual(c.items.find((i) => i.key === 'review_skills').done, false);
});

test('profile completion percentage', () => {
  assert.strictEqual(profileCompletion({}), 0);
  assert.strictEqual(profileCompletion(fullData.profile), 100);
});
