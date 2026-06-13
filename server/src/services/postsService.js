const postsRepository = require('../repositories/postsRepository');
const AppError = require('../utils/AppError');
const {
  validateId,
  validateBody,
  stringRule,
  positiveIntegerRule
} = require('../utils/validation');

const createRules = {
  user_id: positiveIntegerRule({ required: true }),
  title: stringRule({ required: true, maxLength: 255 }),
  body: stringRule({ allowEmpty: true })
};

const updateRules = {
  title: stringRule({ maxLength: 255 }),
  body: stringRule({ allowEmpty: true })
};

function validateFilters(query) {
  const allowedFields = ['userId'];
  const unknownField = Object.keys(query).find(
    (field) => !allowedFields.includes(field)
  );

  if (unknownField) {
    throw new AppError(`Unknown query parameter: ${unknownField}`, 400);
  }

  return {
    userId: query.userId === undefined
      ? undefined
      : validateId(query.userId, 'userId')
  };
}

async function getAll(query) {
  return postsRepository.findAll(validateFilters(query));
}

async function getById(rawId) {
  const id = validateId(rawId);
  const post = await postsRepository.findById(id);

  if (!post) {
    throw new AppError('Post not found', 404);
  }

  return post;
}

function create(body) {
  return postsRepository.create(validateBody(body, createRules, true));
}

async function update(rawId, body) {
  const id = validateId(rawId);

  // userId is required for ownership check
  if (!body.userId) {
    throw new AppError('userId is required for authorization', 400);
  }

  const userId = validateId(body.userId, 'userId');

  // Remove userId from the data to be updated (not a column to update)
  const { userId: _ignore, ...updateData } = body;
  const data = validateBody(updateData, updateRules, false);

  const post = await postsRepository.update(id, userId, data);

  if (!post) {
    throw new AppError('Post not found or you are not the owner', 403);
  }

  return post;
}

async function remove(rawId, body) {
  const id = validateId(rawId);

  if (!body.userId) {
    throw new AppError('userId is required for authorization', 400);
  }

  const userId = validateId(body.userId, 'userId');
  const removed = await postsRepository.remove(id, userId);

  if (!removed) {
    throw new AppError('Post not found or you are not the owner', 403);
  }

  return { id };
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove
};
