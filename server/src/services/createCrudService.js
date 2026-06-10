const AppError = require('../utils/AppError');
const { validateId, validateBody } = require('../utils/validation');

function createCrudService(repository, rules, resourceName) {
  return {
    getAll() {
      return repository.findAll();
    },

    async getById(rawId) {
      const id = validateId(rawId);
      const record = await repository.findById(id);

      if (!record) {
        throw new AppError(`${resourceName} not found`, 404);
      }

      return record;
    },

    create(body) {
      const data = validateBody(body, rules, true);
      return repository.create(data);
    },

    async update(rawId, body) {
      const id = validateId(rawId);
      const data = validateBody(body, rules, false);
      const record = await repository.update(id, data);

      if (!record) {
        throw new AppError(`${resourceName} not found`, 404);
      }

      return record;
    },

    async remove(rawId) {
      const id = validateId(rawId);
      const removed = await repository.remove(id);

      if (!removed) {
        throw new AppError(`${resourceName} not found`, 404);
      }

      return { id };
    }
  };
}

module.exports = createCrudService;
