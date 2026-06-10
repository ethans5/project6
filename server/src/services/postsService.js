const postsRepository = require('../repositories/postsRepository');
const createCrudService = require('./createCrudService');
const {
  stringRule,
  positiveIntegerRule
} = require('../utils/validation');

const rules = {
  user_id: positiveIntegerRule({ required: true }),
  title: stringRule({ required: true, maxLength: 255 }),
  body: stringRule({ allowEmpty: true })
};

module.exports = createCrudService(postsRepository, rules, 'Post');
