const albumsService = require('../services/albumsService');
const { setPaginationHeaders } = require('../utils/query');

async function getAll(req, res, next) {
  try {
    const result = await albumsService.getAll(req.query);
    setPaginationHeaders(res, result, result.query);
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const data = await albumsService.getById(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function create(req, res, next) {
  try {
    const data = await albumsService.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const data = await albumsService.update(req.params.id, req.body);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    const data = await albumsService.remove(req.params.id, req.body);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove
};
