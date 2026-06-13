const db = require('../config/db');

const columns = 'id, post_id, name, email, body, created_at';

async function findAll(filters = {}) {
  const conditions = [];
  const values = [];

  if (filters.postId !== undefined) {
    conditions.push('post_id = ?');
    values.push(filters.postId);
  }

  const where = conditions.length > 0
    ? ` WHERE ${conditions.join(' AND ')}`
    : '';

  const [rows] = await db.execute(
    `SELECT ${columns} FROM comments${where} ORDER BY id ASC`,
    values
  );
  return rows;
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
    'INSERT INTO comments (post_id, name, email, body) VALUES (?, ?, ?, ?)',
    [data.post_id, data.name, data.email, data.body ?? '']
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
