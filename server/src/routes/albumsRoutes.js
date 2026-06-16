const express = require('express');
const albumsController = require('../controllers/albumsController');

const router = express.Router();

router.get('/', albumsController.getAll);
router.get('/:id', albumsController.getById);
router.post('/', albumsController.create);
router.put('/:id', albumsController.update);
router.delete('/:id', albumsController.remove);

module.exports = router;
