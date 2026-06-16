const auditRepository = require('../repositories/auditRepository');
const AppError = require('../utils/AppError');
const {
  parseListQuery,
  parsePositiveInteger,
  parseString
} = require('../utils/query');

function sanitizeMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') {
    return metadata ?? null;
  }

  const blockedKeys = new Set(['password', 'passwordHash', 'password_hash', 'token', 'cookie', 'session']);
  const clean = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (!blockedKeys.has(key)) {
      clean[key] = value;
    }
  }

  return clean;
}

async function record(event) {
  try {
    await auditRepository.create({
      ...event,
      metadata: sanitizeMetadata(event.metadata)
    });
  } catch (error) {
    console.error('Could not write audit event:', error.message);
  }
}

function parseDate(value, field) {
  const cleanValue = parseString(value, field);
  const date = new Date(cleanValue);

  if (Number.isNaN(date.getTime())) {
    throw new AppError(`${field} must be a valid date`, 400);
  }

  return cleanValue;
}

async function getAll(query) {
  const queryOptions = parseListQuery(query, {
    defaultSortBy: 'createdAt',
    sortFields: {
      id: 'ae.id',
      action: 'ae.action',
      entityType: 'ae.entity_type',
      createdAt: 'ae.created_at',
      actorUserId: 'ae.actor_user_id',
      targetUserId: 'ae.target_user_id'
    },
    filters: {
      actorUserId: parsePositiveInteger,
      targetUserId: parsePositiveInteger,
      action: parseString,
      entityType: parseString,
      from: parseDate,
      to: parseDate
    }
  });
  const result = await auditRepository.findAll(queryOptions);
  return { ...result, query: queryOptions };
}

async function getForUser(rawUserId, query) {
  const queryWithUser = {
    ...query,
    targetUserId: rawUserId
  };
  return getAll(queryWithUser);
}

module.exports = {
  record,
  getAll,
  getForUser
};
