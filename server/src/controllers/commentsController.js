const createCrudController = require('./createCrudController');
const commentsService = require('../services/commentsService');

module.exports = createCrudController(commentsService);
