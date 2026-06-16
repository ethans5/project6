const todosRepository = require('../repositories/todosRepository');
const AppError = require('../utils/AppError');
const {
  validateId,
  validateBody,
  stringRule,
  positiveIntegerRule,
  booleanRule
} = require('../utils/validation');
const {
  parseListQuery,
  parsePositiveInteger,
  parseBoolean
} = require('../utils/query');
const auditService = require('./auditService');

const createRules = {
  userId: positiveIntegerRule({ required: true }),
  title: stringRule({ required: true, maxLength: 255 }),
  completed: booleanRule()
};

const updateRules = {
  title: stringRule({ maxLength: 255 }),
  completed: booleanRule()
};

async function getAll(query) {
  const queryOptions = parseListQuery(query, {
    sortFields: {
      id: 'id',
      userId: 'user_id',
      title: 'title',
      completed: 'completed',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    },
    filters: {
      userId: parsePositiveInteger,
      completed: parseBoolean
    }
  });
  const result = await todosRepository.findAll(queryOptions);
  return { ...result, query: queryOptions };
}

async function getById(rawId) {
  const id = validateId(rawId);
  const todo = await todosRepository.findById(id);

  if (!todo) {
    throw new AppError('Todo not found', 404);
  }

  return todo;
}

async function create(body) {
  const data = validateBody(body, createRules, true);
  const todo = await todosRepository.create(data);

  await auditService.record({
    actorUserId: data.userId,
    targetUserId: data.userId,
    action: 'todo.created',
    entityType: 'todo',
    entityId: todo.id,
    metadata: { title: todo.title }
  });

  return todo;
}

async function update(rawId, body) {
  const id = validateId(rawId);
  const data = validateBody(body, updateRules, false);
  const todo = await todosRepository.update(id, data);

  if (!todo) {
    throw new AppError('Todo not found', 404);
  }

  await auditService.record({
    targetUserId: todo.userId,
    action: 'todo.updated',
    entityType: 'todo',
    entityId: id,
    metadata: { fields: Object.keys(data) }
  });

  return todo;
}

async function remove(rawId) {
  const id = validateId(rawId);
  const removed = await todosRepository.remove(id);

  if (!removed) {
    throw new AppError('Todo not found', 404);
  }

  await auditService.record({
    action: 'todo.deleted',
    entityType: 'todo',
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
