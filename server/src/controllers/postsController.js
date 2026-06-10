const createCrudController = require('./createCrudController');
const postsService = require('../services/postsService');

module.exports = createCrudController(postsService);
