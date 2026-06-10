const todosRepository = require('../repositories/todosRepository');
const createCrudService = require('./createCrudService');
const {
  stringRule,
  positiveIntegerRule,
  booleanRule
} = require('../utils/validation');

const rules = {
  user_id: positiveIntegerRule({ required: true }),
  title: stringRule({ required: true, maxLength: 255 }),
  completed: booleanRule()
};

module.exports = createCrudService(todosRepository, rules, 'Todo');
