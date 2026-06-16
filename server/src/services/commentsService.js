const commentsRepository = require('../repositories/commentsRepository');
const AppError = require('../utils/AppError');
const {
  validateId,
  validateBody,
  stringRule,
  positiveIntegerRule
} = require('../utils/validation');
const {
  parseListQuery,
  parsePositiveInteger,
  parseString
} = require('../utils/query');
const auditService = require('./auditService');

const createRules = {
  post_id: positiveIntegerRule({ required: true }),
  username: stringRule({ required: true, maxLength: 50 }),
  email: stringRule({ required: true, maxLength: 100 }),
  body: stringRule({ allowEmpty: true })
};

const updateRules = {
  body: stringRule({ allowEmpty: true })
};

async function getAll(query) {
  const queryOptions = parseListQuery(query, {
    sortFields: {
      id: 'id',
      postId: 'post_id',
      username: 'username',
      email: 'email',
      createdAt: 'created_at'
    },
    filters: {
      postId: parsePositiveInteger,
      email: parseString,
      username: parseString
    }
  });
  const result = await commentsRepository.findAll(queryOptions);
  return { ...result, query: queryOptions };
}

async function getById(rawId) {
  const id = validateId(rawId);
  const comment = await commentsRepository.findById(id);

  if (!comment) {
    throw new AppError('Comment not found', 404);
  }

  return comment;
}

async function create(body) {
  const data = validateBody(body, createRules, true);
  const comment = await commentsRepository.create(data);

  await auditService.record({
    action: 'comment.created',
    entityType: 'comment',
    entityId: comment.id,
    metadata: { postId: comment.post_id, username: comment.username, email: comment.email }
  });

  return comment;
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

  await auditService.record({
    action: 'comment.updated',
    entityType: 'comment',
    entityId: id,
    metadata: { email, fields: Object.keys(data) }
  });

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

  await auditService.record({
    action: 'comment.deleted',
    entityType: 'comment',
    entityId: id,
    metadata: { email }
  });

  return { id };
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove
};
