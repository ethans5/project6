const express = require('express');
const photosController = require('../controllers/photosController');

const router = express.Router();

router.get('/', photosController.getAll);
router.get('/:id', photosController.getById);
router.post('/', photosController.create);
router.put('/:id', photosController.update);
router.delete('/:id', photosController.remove);

module.exports = router;
