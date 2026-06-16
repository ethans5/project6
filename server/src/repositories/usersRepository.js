const db = require('../config/db');

const publicColumns = 'id, name, username, email, role, is_blocked, blocked_at, blocked_by, updated_at';

async function findAll(query) {
  const conditions = [];
  const values = [];

  if (query.filters?.role !== undefined) {
    conditions.push('role = ?');
    values.push(query.filters.role);
  }

  if (query.filters?.isBlocked !== undefined) {
    conditions.push('is_blocked = ?');
    values.push(query.filters.isBlocked);
  }

  if (query.search !== undefined) {
    conditions.push('(name LIKE ? OR username LIKE ? OR email LIKE ?)');
    values.push(`%${query.search}%`, `%${query.search}%`, `%${query.search}%`);
  }

  const where = conditions.length > 0
    ? ` WHERE ${conditions.join(' AND ')}`
    : '';

  const [countRows] = await db.execute(
    `SELECT COUNT(*) AS total FROM users${where}`,
    values
  );
  const [rows] = await db.execute(
    `SELECT ${publicColumns} FROM users${where}
     ORDER BY ${query.sortColumn} ${query.order}
     LIMIT ${query.offset}, ${query.limit}`,
    values
  );
  return {
    rows,
    total: Number(countRows[0].total)
  };
}

async function findById(id) {
  const [rows] = await db.execute(
    `SELECT ${publicColumns} FROM users WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function findByUsernameOrEmail(value) {
  const [rows] = await db.execute(
    `SELECT ${publicColumns} FROM users WHERE username = ? OR email = ?`,
    [value, value]
  );
  return rows[0] || null;
}

async function countAdmins() {
  const [[row]] = await db.execute(
    "SELECT COUNT(*) AS total FROM users WHERE role = 'admin'"
  );
  return Number(row.total);
}

async function updateProfile(id, data) {
  const fields = Object.keys(data);
  const assignments = fields.map((field) => `${field} = ?`).join(', ');
  const values = fields.map((field) => data[field]);

  const [result] = await db.execute(
    `UPDATE users SET ${assignments} WHERE id = ?`,
    [...values, id]
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return findById(id);
}

async function block(id, blockedBy) {
  const [result] = await db.execute(
    `UPDATE users
     SET is_blocked = TRUE, blocked_at = CURRENT_TIMESTAMP, blocked_by = ?
     WHERE id = ?`,
    [blockedBy, id]
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return findById(id);
}

async function unblock(id) {
  const [result] = await db.execute(
    `UPDATE users
     SET is_blocked = FALSE, blocked_at = NULL, blocked_by = NULL
     WHERE id = ?`,
    [id]
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return findById(id);
}

async function updatePasswordHash(userId, passwordHash) {
  const [result] = await db.execute(
    'UPDATE passwords SET password_hash = ? WHERE user_id = ?',
    [passwordHash, userId]
  );
  return result.affectedRows > 0;
}

async function findPasswordHash(userId) {
  const [rows] = await db.execute(
    'SELECT password_hash FROM passwords WHERE user_id = ?',
    [userId]
  );
  return rows[0]?.password_hash || null;
}

module.exports = {
  findAll,
  findById,
  findByUsernameOrEmail,
  countAdmins,
  updateProfile,
  block,
  unblock,
  updatePasswordHash,
  findPasswordHash
};
