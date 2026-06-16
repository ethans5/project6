const express = require('express');
const usersController = require('../controllers/usersController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', usersController.getAll);

router.get('/me', requireAuth, usersController.getMe);
router.patch('/me', requireAuth, usersController.updateMe);
router.put('/me/password', requireAuth, usersController.changePassword);

router.get('/:id', usersController.getById);
router.patch('/:id', requireAuth, requireAdmin, usersController.updateAsAdmin);
router.patch('/:id/block', requireAuth, requireAdmin, usersController.blockUser);
router.patch('/:id/unblock', requireAuth, requireAdmin, usersController.unblockUser);

module.exports = router;
