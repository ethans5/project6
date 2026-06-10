const createCrudRouter = require('./createCrudRouter');
const postsController = require('../controllers/postsController');

module.exports = createCrudRouter(postsController);
