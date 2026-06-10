const createCrudRouter = require('./createCrudRouter');
const commentsController = require('../controllers/commentsController');

module.exports = createCrudRouter(commentsController);
