const createCrudRouter = require('./createCrudRouter');
const todosController = require('../controllers/todosController');

module.exports = createCrudRouter(todosController);
