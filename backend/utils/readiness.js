// Portfolio Readiness Meter - pure functions (no database, no randomness).
// The score is calculated fresh from saved data every time it is requested.
// Every item is simply done or not done; points are only awarded for saved information.
const { MANUAL_TASKS } = require('./constants');

const len = (s) => (typeof s === 'string' ? s.trim().length : 0);
const count = (a) => (Array.isArray(a) ? a.length : 0);

// A "meaningful" project has a title, a description of 20+ characters and at least one technology.
const isValidProject = (p) => len(p.title) >= 2 && len(p.description) >= 20 && count(p.technologies) >= 1;
// A genuine achievement record has a title, an issuing organisation and a date.
const isValidAchievement = (a) => len(a.title) >= 2 && len(a.organization) >= 2 && !!a.earned_on;

function item(id, label, points, done, tip) {
  return { id, label, points, done: !!done, earned: done ? points : 0, tip };
}

function criterion(key, label, link, items) {
  return {
    key, label, link, items,
    max: items.reduce((sum, i) => sum + i.points, 0),
    earned: items.reduce((sum, i) => sum + i.earned, 0),
  };
}

function levelFor(score) {
  if (score >= 90) return 'Portfolio ready';
  if (score >= 70) return 'Almost there';
  if (score >= 40) return 'Taking shape';
  return 'Just getting started';
}

function computeReadiness({ profile = {}, projects = [], achievements = [], resume = {} }) {
  const p = profile || {};
  const r = resume || {};
  const validProjects = projects.filter(isValidProject);
  const validAchievements = achievements.filter(isValidAchievement);
  const anyProjectLink = validProjects.some((x) => len(x.github_url) || len(x.live_url));

  const criteria = [
    criterion('basic', 'Basic profile information', '/profile.html', [
      item('basic_name', 'Full name added', 4, len(p.full_name) >= 2, 'Add your full name to your profile.'),
      item('basic_headline', 'Profile headline added', 4, len(p.headline) >= 5, 'Write a short headline, for example "First-year B.Tech student interested in web development".'),
      item('basic_college', 'College added', 4, len(p.college) >= 2, 'Add your college name.'),
      item('basic_course', 'Course added', 4, len(p.course) >= 2, 'Add your course or branch.'),
      item('basic_year', 'Year of study selected', 4, !!p.year_of_study, 'Select your current year of study.'),
    ]),
    criterion('intro', 'Professional introduction', '/profile.html', [
      item('intro_20', 'Introduction has at least 20 characters', 5, len(p.intro) >= 20, 'Complete your professional introduction.'),
      item('intro_50', 'Introduction has at least 50 characters', 5, len(p.intro) >= 50, 'Expand your introduction to a few sentences about your goals and interests.'),
    ]),
    criterion('skills', 'Technical and soft skills', '/profile.html', [
      item('tech_1', 'At least 1 technical skill', 5, count(p.technical_skills) >= 1, 'Add a technical skill you genuinely have.'),
      item('tech_3', 'At least 3 technical skills', 5, count(p.technical_skills) >= 3, 'Add more technical skills (3 or more) that you can explain in an interview.'),
      item('soft_1', 'At least 1 soft skill', 2, count(p.soft_skills) >= 1, 'Add a soft skill such as teamwork or communication.'),
      item('soft_2', 'At least 2 soft skills', 3, count(p.soft_skills) >= 2, 'Add a second soft skill.'),
    ]),
    criterion('projects', 'Meaningful projects', '/projects.html', [
      item('project_1', 'At least 1 complete project', 12, validProjects.length >= 1, 'Add your first project - an academic or personal project is fine.'),
      item('project_link', 'A project has a GitHub or live link', 4, anyProjectLink, 'Add a GitHub or live-demo link to one of your projects.'),
      item('project_2', 'At least 2 complete projects', 4, validProjects.length >= 2, 'Add a second project to show a wider range of work.'),
    ]),
    criterion('achievements', 'Achievements and certifications', '/achievements.html', [
      item('ach_1', 'At least 1 achievement or certificate', 6, validAchievements.length >= 1, 'Add a genuine achievement, certificate or workshop.'),
      item('ach_2', 'At least 2 achievements or certificates', 4, validAchievements.length >= 2, 'Add another genuine achievement or certificate.'),
    ]),
    criterion('resume', 'Resume information and availability', '/resume.html', [
      item('res_objective', 'Career objective written', 3, len(r.objective) >= 20, 'Write a short career objective in the resume builder.'),
      item('res_phone', 'Phone number added', 3, len(r.phone) >= 7, 'Add a phone number to your resume details.'),
      item('res_location', 'Location added', 3, len(r.location) >= 2, 'Add your city or location to your resume details.'),
      item('res_education', 'Education summary added', 3, len(r.education_summary) >= 5, 'Add an education summary to your resume details.'),
      item('res_availability', 'Availability added', 3, len(r.availability) >= 3, 'Say when you are available, for example "Available for internships from May 2027".'),
    ]),
    criterion('links', 'Professional links', '/profile.html', [
      item('link_github', 'GitHub profile link saved', 5, len(p.github_url) > 0, 'Add your GitHub profile link.'),
      item('link_linkedin', 'LinkedIn profile link saved', 5, len(p.linkedin_url) > 0, 'Add your LinkedIn profile link.'),
    ]),
  ];

  const score = criteria.reduce((sum, c) => sum + c.earned, 0);
  const recommendations = [];
  for (const c of criteria) {
    for (const i of c.items) {
      if (!i.done) recommendations.push({ criterion: c.label, message: i.tip, link: c.link, points: i.points });
    }
  }
  // Biggest improvements first (sort is stable, so ties keep their natural order).
  recommendations.sort((a, b) => b.points - a.points);

  return { score, max: 100, level: levelFor(score), criteria, recommendations };
}

// Share of 10 key profile fields that are filled in.
function profileCompletion(profile = {}) {
  const p = profile || {};
  const checks = [
    len(p.full_name), len(p.headline), len(p.intro), len(p.college), len(p.course),
    p.year_of_study, count(p.technical_skills), count(p.soft_skills), count(p.interests),
    len(p.github_url) || len(p.linkedin_url),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

// Checklist = automatic tasks (derived from the SAME items as the score, so they can never disagree)
// + manual tasks (saved in checklist_items).
const AUTO_TASKS = [
  { key: 'complete_profile', label: 'Complete my professional profile', link: '/profile.html',
    ids: ['basic_name', 'basic_headline', 'basic_college', 'basic_course', 'basic_year'] },
  { key: 'add_project', label: 'Add at least one project', link: '/projects.html', ids: ['project_1'] },
  { key: 'add_skills', label: 'Add at least three technical skills', link: '/profile.html', ids: ['tech_3'] },
  { key: 'prepare_resume', label: 'Prepare my resume details', link: '/resume.html',
    ids: ['res_objective', 'res_phone', 'res_location', 'res_education', 'res_availability'] },
  { key: 'add_achievements', label: 'Add a genuine achievement or certificate', link: '/achievements.html', ids: ['ach_1'] },
  { key: 'add_links', label: 'Add my GitHub and LinkedIn links', link: '/profile.html', ids: ['link_github', 'link_linkedin'] },
];

function buildChecklist(readiness, manualRows = []) {
  const doneById = {};
  readiness.criteria.forEach((c) => c.items.forEach((i) => { doneById[i.id] = i.done; }));
  const saved = new Map(manualRows.map((row) => [row.task_key, !!row.is_done]));

  const items = [
    ...AUTO_TASKS.map((t) => ({
      key: t.key, label: t.label, type: 'auto', link: t.link, done: t.ids.every((id) => doneById[id]),
    })),
    ...MANUAL_TASKS.map((t) => ({
      key: t.key, label: t.label, type: 'manual', link: null, done: saved.get(t.key) === true,
    })),
  ];
  const done = items.filter((i) => i.done).length;
  return { items, done, total: items.length, percent: Math.round((done / items.length) * 100) };
}

module.exports = { computeReadiness, profileCompletion, buildChecklist, isValidProject, isValidAchievement };
