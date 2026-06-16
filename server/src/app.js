const express = require('express');
const cors = require('cors');
const authController = require('./controllers/authController');
const usersRoutes = require('./routes/usersRoutes');
const adminRoutes = require('./routes/adminRoutes');
const postsRoutes = require('./routes/postsRoutes');
const commentsRoutes = require('./routes/commentsRoutes');
const todosRoutes = require('./routes/todosRoutes');
const albumsRoutes = require('./routes/albumsRoutes');
const photosRoutes = require('./routes/photosRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Limit', 'X-Total-Pages']
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'JSONPlaceholder Clone API',
      resources: ['/users', '/posts', '/comments', '/todos', '/albums', '/photos']
    }
  });
});

app.use('/users', usersRoutes);
app.use('/admin', adminRoutes);
app.use('/posts', postsRoutes);
app.use('/comments', commentsRoutes);
app.use('/todos', todosRoutes);
app.use('/albums', albumsRoutes);
app.use('/photos', photosRoutes);

app.post('/register', authController.register);
app.post('/login', authController.login);
app.post('/logout', authController.logout);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.use(errorHandler);

module.exports = app;
