const crudRouter = require('./crud');
const schemas = require('../utils/schemas');

module.exports = crudRouter({
  table: 'projects',
  noun: 'project',
  validate: schemas.project,
  orderBy: [['is_featured', false], ['completed_on', false], ['created_at', false]],
});
