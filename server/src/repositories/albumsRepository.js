const db = require('../config/db');

const columns = 'a.id, a.user_id, u.username AS owner_username, a.title, a.created_at, a.updated_at';
const joinUsers = 'FROM albums a JOIN users u ON a.user_id = u.id';

async function findAll(query) {
  const conditions = [];
  const values = [];

  if (query.filters?.userId !== undefined) {
    conditions.push('a.user_id = ?');
    values.push(query.filters.userId);
  }

  if (query.filters?.title !== undefined) {
    conditions.push('a.title = ?');
    values.push(query.filters.title);
  }

  if (query.search !== undefined) {
    conditions.push('a.title LIKE ?');
    values.push(`%${query.search}%`);
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
    `SELECT ${columns} ${joinUsers} WHERE a.id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function create(data) {
  const [result] = await db.execute(
    'INSERT INTO albums (user_id, title) VALUES (?, ?)',
    [data.user_id, data.title]
  );
  return findById(result.insertId);
}

async function update(id, userId, data) {
  const fields = Object.keys(data);
  const assignments = fields.map((field) => `${field} = ?`).join(', ');
  const values = fields.map((field) => data[field]);
  const [result] = await db.execute(
    `UPDATE albums SET ${assignments} WHERE id = ? AND user_id = ?`,
    [...values, id, userId]
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return findById(id);
}

async function remove(id, userId) {
  const [result] = await db.execute(
    'DELETE FROM albums WHERE id = ? AND user_id = ?',
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
