const createCrudRepository = require('./createCrudRepository');

module.exports = createCrudRepository('comments', [
  'id',
  'post_id',
  'name',
  'email',
  'body',
  'created_at'
]);
