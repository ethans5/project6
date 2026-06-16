const express = require('express');
const adminController = require('../controllers/adminController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get('/summary', adminController.getSummary);
router.get('/users', adminController.getUsers);
router.patch('/users/:id', adminController.updateUser);
router.patch('/users/:id/block', adminController.blockUser);
router.patch('/users/:id/unblock', adminController.unblockUser);
router.get('/users/:id/activity', adminController.getUserActivity);
router.get('/activity', adminController.getActivity);

module.exports = router;
