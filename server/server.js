const app = require('./src/app');
const db = require('./src/config/db');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    const connection = await db.getConnection();
    connection.release();

    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Could not connect to MySQL:', error.message);
    process.exit(1);
  }
}

startServer();
