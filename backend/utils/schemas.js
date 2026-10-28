// Field rules for every table the student can write to.
// The keys returned here must be real column names in database/schema.sql.
const { validator } = require('./validate');
const C = require('./constants');

function profile(body) {
  return validator(body)
    .text('full_name', { required: true, min: 2, max: 100 })
    .text('headline', { max: 120 })
    .text('intro', { max: 600 })
    .text('college', { max: 150 })
    .text('course', { max: 100 })
    .int('year_of_study', { min: 1, max: 6 })
    .list('technical_skills', { maxItems: 30, maxLen: 40 })
    .list('soft_skills', { maxItems: 30, maxLen: 40 })
    .list('interests', { maxItems: 30, maxLen: 40 })
    .url('github_url', { host: 'github.com' })
    .url('linkedin_url', { host: 'linkedin.com' })
    .url('website_url')
    .email('contact_email')
    .result();
}

function project(body) {
  return validator(body)
    .text('title', { required: true, min: 2, max: 100 })
    .text('description', { required: true, min: 20, max: 500 })
    .text('purpose', { max: 500 })
    .list('technologies', { required: true, maxItems: 20, maxLen: 40 })
    .oneOf('category', C.PROJECT_CATEGORIES)
    .text('role', { max: 200 })
    .url('github_url', { host: 'github.com' })
    .url('live_url')
    .date('completed_on')
    .bool('is_featured', false)
    .bool('is_public', true)
    .result();
}

function achievement(body) {
  return validator(body)
    .text('title', { required: true, min: 2, max: 120 })
    .text('organization', { required: true, min: 2, max: 120 })
    .oneOf('category', C.ACHIEVEMENT_CATEGORIES)
    .date('earned_on', { required: true })
    .url('credential_url')
    .text('description', { max: 400 })
    .bool('is_public', true)
    .result();
}

function resume(body) {
  const data = validator(body)
    .text('objective', { max: 400 })
    .text('phone', { max: 20 })
    .text('location', { max: 100 })
    .text('education_summary', { max: 300 })
    .text('availability', { max: 150 })
    .result();
  if (data.phone && !/^[0-9+()\-\s]{7,20}$/.test(data.phone)) {
    const { ValidationError } = require('./validate');
    throw new ValidationError({ phone: 'Use digits, spaces, + ( ) or - only (7-20 characters).' });
  }
  return data;
}

function portfolioSettings(body) {
  return validator(body)
    .username('username')
    .bool('is_public', false)
    .bool('show_college', true)
    .bool('show_contact_email', false)
    .bool('show_interests', true)
    .result();
}

function checklistToggle(body) {
  return validator(body)
    .oneOf('task_key', C.MANUAL_TASKS.map((t) => t.key))
    .bool('is_done', false)
    .result();
}

module.exports = { profile, project, achievement, resume, portfolioSettings, checklistToggle };
