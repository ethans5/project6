const db = require('../config/db');

const columns = 'p.id, p.user_id, u.username AS author_username, p.title, p.body, p.created_at, p.updated_at';
const joinUsers = 'FROM posts p JOIN users u ON p.user_id = u.id';

async function findAll(filters = {}) {
  const conditions = [];
  const values = [];
  const query = filters;

  if (query.filters?.userId !== undefined) {
    conditions.push('p.user_id = ?');
    values.push(query.filters.userId);
  }

  if (query.filters?.title !== undefined) {
    conditions.push('p.title = ?');
    values.push(query.filters.title);
  }

  if (query.search !== undefined) {
    conditions.push('(p.title LIKE ? OR p.body LIKE ?)');
    values.push(`%${query.search}%`, `%${query.search}%`);
  }

  const where = conditions.length > 0
    ? ` WHERE ${conditions.join(' AND ')}`
    : '';

  const [countRows] = await db.execute(
    `SELECT COUNT(*) AS total ${joinUsers}${where}`,
    values
  );
  const [rows] = await db.execute(
    `SELECT ${columns} ${joinUsers}${where}
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
    `SELECT ${columns} ${joinUsers} WHERE p.id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function create(data) {
  const [result] = await db.execute(
    'INSERT INTO posts (user_id, title, body) VALUES (?, ?, ?)',
    [data.user_id, data.title, data.body ?? '']
  );
  return findById(result.insertId);
}

async function update(id, userId, data) {
  // Ownership check: only update if user_id matches
  const fields = Object.keys(data);
  const assignments = fields.map((field) => `${field} = ?`).join(', ');
  const values = fields.map((field) => data[field]);

  const [result] = await db.execute(
    `UPDATE posts SET ${assignments} WHERE id = ? AND user_id = ?`,
    [...values, id, userId]
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return findById(id);
}

async function remove(id, userId) {
  // Ownership check: only delete if user_id matches
  const [result] = await db.execute(
    'DELETE FROM posts WHERE id = ? AND user_id = ?',
    [id, userId]
  );
  return result.affectedRows > 0;
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove
};
