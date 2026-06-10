const express = require('express');
const cors = require('cors');
const authController = require('./controllers/authController');
const usersRoutes = require('./routes/usersRoutes');
const postsRoutes = require('./routes/postsRoutes');
const commentsRoutes = require('./routes/commentsRoutes');
const todosRoutes = require('./routes/todosRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'JSONPlaceholder Clone API',
      resources: ['/users', '/posts', '/comments', '/todos']
    }
  });
});

app.use('/users', usersRoutes);
app.use('/posts', postsRoutes);
app.use('/comments', commentsRoutes);
app.use('/todos', todosRoutes);

app.post('/register', authController.register);
app.post('/login', authController.login);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.use(errorHandler);

module.exports = app;
