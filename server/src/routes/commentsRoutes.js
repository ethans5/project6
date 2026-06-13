const express = require('express');
const commentsController = require('../controllers/commentsController');

const router = express.Router();

router.get('/', commentsController.getAll);
router.get('/:id', commentsController.getById);
router.post('/', commentsController.create);
router.put('/:id', commentsController.update);
router.delete('/:id', commentsController.remove);

module.exports = router;
