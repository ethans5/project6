function createCrudController(service) {
  return {
    async getAll(req, res, next) {
      try {
        const data = await service.getAll();
        res.status(200).json({ success: true, data });
      } catch (error) {
        next(error);
      }
    },

    async getById(req, res, next) {
      try {
        const data = await service.getById(req.params.id);
        res.status(200).json({ success: true, data });
      } catch (error) {
        next(error);
      }
    },

    async create(req, res, next) {
      try {
        const data = await service.create(req.body);
        res.status(201).json({ success: true, data });
      } catch (error) {
        next(error);
      }
    },

    async update(req, res, next) {
      try {
        const data = await service.update(req.params.id, req.body);
        res.status(200).json({ success: true, data });
      } catch (error) {
        next(error);
      }
    },

    async remove(req, res, next) {
      try {
        const data = await service.remove(req.params.id);
        res.status(200).json({ success: true, data });
      } catch (error) {
        next(error);
      }
    }
  };
}

module.exports = createCrudController;
