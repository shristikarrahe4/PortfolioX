// Values shared by validation, readiness scoring and the frontend (sent via /api/config).
// The category lists must match the CHECK constraints in database/schema.sql.
module.exports = {
  PROJECT_CATEGORIES: [
    'Web Development', 'Mobile App', 'Data Science', 'Embedded / IoT',
    'Core Engineering', 'Game Development', 'Research', 'Other',
  ],
  ACHIEVEMENT_CATEGORIES: [
    'Certification', 'Workshop', 'Competition', 'Hackathon', 'Academic', 'Leadership', 'Other',
  ],
  // Checklist tasks the student ticks by hand (saved in the checklist_items table).
  MANUAL_TASKS: [
    { key: 'review_skills', label: 'Review my skills list and remove anything I cannot explain' },
    { key: 'save_resume_pdf', label: 'Save a PDF copy of my resume' },
    { key: 'share_portfolio', label: 'Share my portfolio link with a mentor or friend for feedback' },
    { key: 'practice_projects', label: 'Practise explaining each project in two minutes' },
  ],
};
