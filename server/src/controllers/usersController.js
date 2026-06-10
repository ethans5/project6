const createCrudController = require('./createCrudController');
const usersService = require('../services/usersService');

module.exports = createCrudController(usersService);
