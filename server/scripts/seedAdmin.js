const bcrypt = require('bcryptjs');
const db = require('../src/config/db');

function requireEnv(name) {
  const value = process.env[name];

  if (!value || value.trim() === '') {
    throw new Error(`${name} is required`);
  }

  return value.trim();
}

async function main() {
  const admin = {
    name: requireEnv('ADMIN_NAME'),
    username: requireEnv('ADMIN_USERNAME'),
    email: requireEnv('ADMIN_EMAIL'),
    password: requireEnv('ADMIN_PASSWORD')
  };
  const passwordHash = await bcrypt.hash(admin.password, 10);
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [existingRows] = await connection.execute(
      'SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1',
      [admin.username, admin.email]
    );

    let userId;

    if (existingRows[0]) {
      userId = existingRows[0].id;
      await connection.execute(
        `UPDATE users
         SET name = ?, username = ?, email = ?, role = 'admin', is_blocked = FALSE
         WHERE id = ?`,
        [admin.name, admin.username, admin.email, userId]
      );
      await connection.execute(
        `INSERT INTO passwords (user_id, password_hash)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
        [userId, passwordHash]
      );
    } else {
      const [result] = await connection.execute(
        `INSERT INTO users (name, username, email, role, is_blocked)
         VALUES (?, ?, ?, 'admin', FALSE)`,
        [admin.name, admin.username, admin.email]
      );
      userId = result.insertId;
      await connection.execute(
        'INSERT INTO passwords (user_id, password_hash) VALUES (?, ?)',
        [userId, passwordHash]
      );
    }

    await connection.execute(
      `INSERT INTO audit_events
        (actor_user_id, target_user_id, action, entity_type, entity_id, metadata)
       VALUES (?, ?, 'admin.seeded', 'user', ?, ?)`,
      [userId, userId, userId, JSON.stringify({ username: admin.username })]
    );

    await connection.commit();
    console.log(`Admin account is ready: ${admin.username} (${admin.email})`);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    await db.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
