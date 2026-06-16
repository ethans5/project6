const db = require('../config/db');

const columns = 'id, post_id, username, email, body, created_at';

async function findAll(filters = {}) {
  const conditions = [];
  const values = [];
  const query = filters;

  if (query.filters?.postId !== undefined) {
    conditions.push('post_id = ?');
    values.push(query.filters.postId);
  }

  if (query.filters?.email !== undefined) {
    conditions.push('email = ?');
    values.push(query.filters.email);
  }

  if (query.filters?.username !== undefined) {
    conditions.push('username = ?');
    values.push(query.filters.username);
  }

  if (query.search !== undefined) {
    conditions.push('(username LIKE ? OR email LIKE ? OR body LIKE ?)');
    values.push(`%${query.search}%`, `%${query.search}%`, `%${query.search}%`);
  }

  const where = conditions.length > 0
    ? ` WHERE ${conditions.join(' AND ')}`
    : '';

  const [countRows] = await db.execute(
    `SELECT COUNT(*) AS total FROM comments${where}`,
    values
  );
  const [rows] = await db.execute(
    `SELECT ${columns} FROM comments${where}
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
    `SELECT ${columns} FROM comments WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function create(data) {
  const [result] = await db.execute(
    'INSERT INTO comments (post_id, username, email, body) VALUES (?, ?, ?, ?)',
    [data.post_id, data.username, data.email, data.body ?? '']
  );
  return findById(result.insertId);
}

async function update(id, email, data) {
  // Ownership check: only update if email matches
  const fields = Object.keys(data);
  const assignments = fields.map((field) => `${field} = ?`).join(', ');
  const values = fields.map((field) => data[field]);

  const [result] = await db.execute(
    `UPDATE comments SET ${assignments} WHERE id = ? AND email = ?`,
    [...values, id, email]
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return findById(id);
}

async function remove(id, email) {
  // Ownership check: only delete if email matches
  const [result] = await db.execute(
    'DELETE FROM comments WHERE id = ? AND email = ?',
    [id, email]
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
