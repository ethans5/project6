const commentsRepository = require('../repositories/commentsRepository');
const createCrudService = require('./createCrudService');
const {
  stringRule,
  positiveIntegerRule
} = require('../utils/validation');

const rules = {
  post_id: positiveIntegerRule({ required: true }),
  name: stringRule({ required: true, maxLength: 100 }),
  email: stringRule({ required: true, maxLength: 100 }),
  body: stringRule({ allowEmpty: true })
};

module.exports = createCrudService(commentsRepository, rules, 'Comment');
