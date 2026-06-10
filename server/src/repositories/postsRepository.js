const createCrudRepository = require('./createCrudRepository');

module.exports = createCrudRepository('posts', [
  'id',
  'user_id',
  'title',
  'body',
  'created_at',
  'updated_at'
]);
