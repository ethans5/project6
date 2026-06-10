const createCrudController = require('./createCrudController');
const todosService = require('../services/todosService');

module.exports = createCrudController(todosService);
