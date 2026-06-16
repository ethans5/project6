const usersService = require('../services/usersService');
const { setPaginationHeaders } = require('../utils/query');

async function getAll(req, res, next) {
  try {
    const result = await usersService.getAll(req.query);
    setPaginationHeaders(res, result, result.query);
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const data = await usersService.getById(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getMe(req, res, next) {
  try {
    const data = await usersService.getCurrentUser(req.user);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function updateMe(req, res, next) {
  try {
    const data = await usersService.updateOwnProfile(req.user, req.body);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    const data = await usersService.changeOwnPassword(req.user, req.body);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function updateAsAdmin(req, res, next) {
  try {
    const data = await usersService.updateAsAdmin(req.params.id, req.body, req.user);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function blockUser(req, res, next) {
  try {
    const data = await usersService.blockUser(req.params.id, req.user);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function unblockUser(req, res, next) {
  try {
    const data = await usersService.unblockUser(req.params.id, req.user);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAll,
  getById,
  getMe,
  updateMe,
  changePassword,
  updateAsAdmin,
  blockUser,
  unblockUser
};
