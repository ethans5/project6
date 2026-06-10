const createCrudRepository = require('./createCrudRepository');

module.exports = createCrudRepository('users', [
  'id',
  'name',
  'username',
  'email'
]);
