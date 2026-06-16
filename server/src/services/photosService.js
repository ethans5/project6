const photosRepository = require('../repositories/photosRepository');
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
  album_id: positiveIntegerRule({ required: true }),
  title: stringRule({ required: true, maxLength: 255 }),
  url: stringRule({ required: true, maxLength: 2048 }),
  thumbnail_url: stringRule({ required: true, maxLength: 2048 }),
  userId: positiveIntegerRule({ required: true })
};

const updateRules = {
  title: stringRule({ maxLength: 255 }),
  url: stringRule({ maxLength: 2048 }),
  thumbnail_url: stringRule({ maxLength: 2048 })
};

async function getAll(query) {
  const queryOptions = parseListQuery(query, {
    sortFields: {
      id: 'p.id',
      albumId: 'p.album_id',
      title: 'p.title',
      createdAt: 'p.created_at',
      updatedAt: 'p.updated_at'
    },
    filters: {
      albumId: parsePositiveInteger,
      title: parseString
    }
  });
  const result = await photosRepository.findAll(queryOptions);
  return { ...result, query: queryOptions };
}

async function getById(rawId) {
  const id = validateId(rawId);
  const photo = await photosRepository.findById(id);

  if (!photo) {
    throw new AppError('Photo not found', 404);
  }

  return photo;
}

async function create(body) {
  const data = validateBody(body, createRules, true);
  const albumOwner = await photosRepository.findAlbumOwner(data.album_id);

  if (!albumOwner || albumOwner !== data.userId) {
    throw new AppError('Album not found or you are not the owner', 403);
  }

  const { userId, ...photoData } = data;
  const photo = await photosRepository.create(photoData);

  await auditService.record({
    actorUserId: userId,
    targetUserId: userId,
    action: 'photo.created',
    entityType: 'photo',
    entityId: photo.id,
    metadata: { albumId: photo.album_id, title: photo.title }
  });

  return photo;
}

async function update(rawId, body) {
  const id = validateId(rawId);

  if (!body.userId) {
    throw new AppError('userId is required for authorization', 400);
  }

  const userId = validateId(body.userId, 'userId');
  const { userId: _ignore, ...updateData } = body;
  const data = validateBody(updateData, updateRules, false);
  const photo = await photosRepository.update(id, userId, data);

  if (!photo) {
    throw new AppError('Photo not found or you are not the owner', 403);
  }

  await auditService.record({
    actorUserId: userId,
    targetUserId: userId,
    action: 'photo.updated',
    entityType: 'photo',
    entityId: id,
    metadata: { fields: Object.keys(data) }
  });

  return photo;
}

async function remove(rawId, body) {
  const id = validateId(rawId);

  if (!body.userId) {
    throw new AppError('userId is required for authorization', 400);
  }

  const userId = validateId(body.userId, 'userId');
  const removed = await photosRepository.remove(id, userId);

  if (!removed) {
    throw new AppError('Photo not found or you are not the owner', 403);
  }

  await auditService.record({
    actorUserId: userId,
    targetUserId: userId,
    action: 'photo.deleted',
    entityType: 'photo',
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
