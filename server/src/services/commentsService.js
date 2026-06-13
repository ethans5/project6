const commentsRepository = require('../repositories/commentsRepository');
const AppError = require('../utils/AppError');
const {
  validateId,
  validateBody,
  stringRule,
  positiveIntegerRule
} = require('../utils/validation');

const createRules = {
  post_id: positiveIntegerRule({ required: true }),
  name: stringRule({ required: true, maxLength: 100 }),
  email: stringRule({ required: true, maxLength: 100 }),
  body: stringRule({ allowEmpty: true })
};

const updateRules = {
  body: stringRule({ allowEmpty: true })
};

function validateFilters(query) {
  const allowedFields = ['postId'];
  const unknownField = Object.keys(query).find(
    (field) => !allowedFields.includes(field)
  );

  if (unknownField) {
    throw new AppError(`Unknown query parameter: ${unknownField}`, 400);
  }

  return {
    postId: query.postId === undefined
      ? undefined
      : validateId(query.postId, 'postId')
  };
}

async function getAll(query) {
  return commentsRepository.findAll(validateFilters(query));
}

async function getById(rawId) {
  const id = validateId(rawId);
  const comment = await commentsRepository.findById(id);

  if (!comment) {
    throw new AppError('Comment not found', 404);
  }

  return comment;
}

function create(body) {
  return commentsRepository.create(validateBody(body, createRules, true));
}

async function update(rawId, body) {
  const id = validateId(rawId);

  // email is required for ownership check
  if (!body.email) {
    throw new AppError('email is required for authorization', 400);
  }

  const email = body.email.trim();
  const { email: _ignore, ...updateData } = body;
  const data = validateBody(updateData, updateRules, false);

  const comment = await commentsRepository.update(id, email, data);

  if (!comment) {
    throw new AppError('Comment not found or you are not the owner', 403);
  }

  return comment;
}

async function remove(rawId, body) {
  const id = validateId(rawId);

  if (!body.email) {
    throw new AppError('email is required for authorization', 400);
  }

  const email = body.email.trim();
  const removed = await commentsRepository.remove(id, email);

  if (!removed) {
    throw new AppError('Comment not found or you are not the owner', 403);
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
