const postsRepository = require('../repositories/postsRepository');
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
  user_id: positiveIntegerRule({ required: true }),
  title: stringRule({ required: true, maxLength: 255 }),
  body: stringRule({ allowEmpty: true })
};

const updateRules = {
  title: stringRule({ maxLength: 255 }),
  body: stringRule({ allowEmpty: true })
};

async function getAll(query) {
  const queryOptions = parseListQuery(query, {
    sortFields: {
      id: 'p.id',
      userId: 'p.user_id',
      title: 'p.title',
      createdAt: 'p.created_at',
      updatedAt: 'p.updated_at'
    },
    filters: {
      userId: parsePositiveInteger,
      title: parseString
    }
  });
  const result = await postsRepository.findAll(queryOptions);
  return { ...result, query: queryOptions };
}

async function getById(rawId) {
  const id = validateId(rawId);
  const post = await postsRepository.findById(id);

  if (!post) {
    throw new AppError('Post not found', 404);
  }

  return post;
}

async function create(body) {
  const data = validateBody(body, createRules, true);
  const post = await postsRepository.create(data);

  await auditService.record({
    actorUserId: data.user_id,
    targetUserId: data.user_id,
    action: 'post.created',
    entityType: 'post',
    entityId: post.id,
    metadata: { title: post.title }
  });

  return post;
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

  await auditService.record({
    actorUserId: userId,
    targetUserId: userId,
    action: 'post.updated',
    entityType: 'post',
    entityId: id,
    metadata: { fields: Object.keys(data) }
  });

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

  await auditService.record({
    actorUserId: userId,
    targetUserId: userId,
    action: 'post.deleted',
    entityType: 'post',
    entityId: id
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
