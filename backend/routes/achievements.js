const crudRouter = require('./crud');
const schemas = require('../utils/schemas');

module.exports = crudRouter({
  table: 'achievements',
  noun: 'achievement',
  validate: schemas.achievement,
  orderBy: [['earned_on', false], ['created_at', false]],
});
