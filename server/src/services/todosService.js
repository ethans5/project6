const todosRepository = require('../repositories/todosRepository');
const AppError = require('../utils/AppError');
const {
  validateId,
  validateBody,
  stringRule,
  positiveIntegerRule,
  booleanRule
} = require('../utils/validation');

const createRules = {
  userId: positiveIntegerRule({ required: true }),
  title: stringRule({ required: true, maxLength: 255 }),
  completed: booleanRule()
};

const updateRules = {
  title: stringRule({ maxLength: 255 }),
  completed: booleanRule()
};

function parseCompletedFilter(value) {
  if (value === undefined) {
    return undefined;
  }

  if (value === 'true' || value === '1') {
    return true;
  }

  if (value === 'false' || value === '0') {
    return false;
  }

  throw new AppError('completed must be true or false', 400);
}

function validateFilters(query) {
  const allowedFields = ['userId', 'completed'];
  const unknownField = Object.keys(query).find(
    (field) => !allowedFields.includes(field)
  );

  if (unknownField) {
    throw new AppError(`Unknown query parameter: ${unknownField}`, 400);
  }

  return {
    userId: query.userId === undefined
      ? undefined
      : validateId(query.userId, 'userId'),
    completed: parseCompletedFilter(query.completed)
  };
}

async function getAll(query) {
  return todosRepository.findAll(validateFilters(query));
}

async function getById(rawId) {
  const id = validateId(rawId);
  const todo = await todosRepository.findById(id);

  if (!todo) {
    throw new AppError('Todo not found', 404);
  }

  return todo;
}

function create(body) {
  return todosRepository.create(validateBody(body, createRules, true));
}

async function update(rawId, body) {
  const id = validateId(rawId);
  const data = validateBody(body, updateRules, false);
  const todo = await todosRepository.update(id, data);

  if (!todo) {
    throw new AppError('Todo not found', 404);
  }

  return todo;
}

async function remove(rawId) {
  const id = validateId(rawId);
  const removed = await todosRepository.remove(id);

  if (!removed) {
    throw new AppError('Todo not found', 404);
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
