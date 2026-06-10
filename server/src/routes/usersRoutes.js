const createCrudRouter = require('./createCrudRouter');
const usersController = require('../controllers/usersController');

module.exports = createCrudRouter(usersController);
