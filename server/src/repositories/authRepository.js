const db = require('../config/db');

async function findUserWithPassword(username) {
  // Allow login by either username or email
  const [rows] = await db.execute(
    `SELECT u.*, p.password_hash 
     FROM users u 
     JOIN passwords p ON u.id = p.user_id 
     WHERE u.username = ? OR u.email = ?`,
    [username, username]
  );
  return rows[0] || null;
}

async function createUserWithPassword(userData, passwordHash) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Insert user
    const [userResult] = await connection.execute(
      `INSERT INTO users (name, username, email) VALUES (?, ?, ?)`,
      [userData.name, userData.username, userData.email]
    );

    const userId = userResult.insertId;

    // Insert password
    await connection.execute(
      `INSERT INTO passwords (user_id, password_hash) VALUES (?, ?)`,
      [userId, passwordHash]
    );

    await connection.commit();
    return { id: userId, name: userData.name, username: userData.username, email: userData.email };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

module.exports = {
  findUserWithPassword,
  createUserWithPassword
};
