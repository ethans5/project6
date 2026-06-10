const createCrudRepository = require('./createCrudRepository');

module.exports = createCrudRepository('todos', [
  'id',
  'user_id',
  'title',
  'completed',
  'created_at',
  'updated_at'
]);
