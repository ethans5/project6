const adminService = require('../services/adminService');
const auditService = require('../services/auditService');
const usersService = require('../services/usersService');
const { setPaginationHeaders } = require('../utils/query');

async function getSummary(req, res, next) {
  try {
    const data = await adminService.getSummary();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

async function getUsers(req, res, next) {
  try {
    const result = await usersService.getAll(req.query);
    setPaginationHeaders(res, result, result.query);
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
}

async function updateUser(req, res, next) {
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

async function getActivity(req, res, next) {
  try {
    const result = await auditService.getAll(req.query);
    setPaginationHeaders(res, result, result.query);
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
}

async function getUserActivity(req, res, next) {
  try {
    const result = await auditService.getForUser(req.params.id, req.query);
    setPaginationHeaders(res, result, result.query);
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSummary,
  getUsers,
  updateUser,
  blockUser,
  unblockUser,
  getActivity,
  getUserActivity
};
