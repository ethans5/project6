const albumsRepository = require('../repositories/albumsRepository');
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
  title: stringRule({ required: true, maxLength: 255 })
};

const updateRules = {
  title: stringRule({ maxLength: 255 })
};

async function getAll(query) {
  const queryOptions = parseListQuery(query, {
    sortFields: {
      id: 'a.id',
      userId: 'a.user_id',
      title: 'a.title',
      createdAt: 'a.created_at',
      updatedAt: 'a.updated_at'
    },
    filters: {
      userId: parsePositiveInteger,
      title: parseString
    }
  });
  const result = await albumsRepository.findAll(queryOptions);
  return { ...result, query: queryOptions };
}

async function getById(rawId) {
  const id = validateId(rawId);
  const album = await albumsRepository.findById(id);

  if (!album) {
    throw new AppError('Album not found', 404);
  }

  return album;
}

async function create(body) {
  const data = validateBody(body, createRules, true);
  const album = await albumsRepository.create(data);

  await auditService.record({
    actorUserId: data.user_id,
    targetUserId: data.user_id,
    action: 'album.created',
    entityType: 'album',
    entityId: album.id,
    metadata: { title: album.title }
  });

  return album;
}

async function update(rawId, body) {
  const id = validateId(rawId);

  if (!body.userId) {
    throw new AppError('userId is required for authorization', 400);
  }

  const userId = validateId(body.userId, 'userId');
  const { userId: _ignore, ...updateData } = body;
  const data = validateBody(updateData, updateRules, false);
  const album = await albumsRepository.update(id, userId, data);

  if (!album) {
    throw new AppError('Album not found or you are not the owner', 403);
  }

  await auditService.record({
    actorUserId: userId,
    targetUserId: userId,
    action: 'album.updated',
    entityType: 'album',
    entityId: id,
    metadata: { fields: Object.keys(data) }
  });

  return album;
}

async function remove(rawId, body) {
  const id = validateId(rawId);

  if (!body.userId) {
    throw new AppError('userId is required for authorization', 400);
  }

  const userId = validateId(body.userId, 'userId');
  const removed = await albumsRepository.remove(id, userId);

  if (!removed) {
    throw new AppError('Album not found or you are not the owner', 403);
  }

  await auditService.record({
    actorUserId: userId,
    targetUserId: userId,
    action: 'album.deleted',
    entityType: 'album',
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
