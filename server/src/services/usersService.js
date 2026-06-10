const usersRepository = require('../repositories/usersRepository');
const createCrudService = require('./createCrudService');
const { stringRule } = require('../utils/validation');

const rules = {
  name: stringRule({ required: true, maxLength: 100 }),
  username: stringRule({ required: true, maxLength: 50 }),
  email: stringRule({ required: true, maxLength: 100 })
};

module.exports = createCrudService(usersRepository, rules, 'User');
