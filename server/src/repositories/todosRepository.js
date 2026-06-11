const db = require('../config/db');

const columns = 'id, user_id AS userId, title, completed, created_at, updated_at';

async function findAll(filters = {}) {
  const conditions = [];
  const values = [];

  if (filters.userId !== undefined) {
    conditions.push('user_id = ?');
    values.push(filters.userId);
  }

  if (filters.completed !== undefined) {
    conditions.push('completed = ?');
    values.push(filters.completed);
  }

  const where = conditions.length > 0
    ? ` WHERE ${conditions.join(' AND ')}`
    : '';
  const [rows] = await db.execute(
    `SELECT ${columns} FROM todos${where} ORDER BY id`,
    values
  );
  return rows;
}

async function findById(id) {
  const [rows] = await db.execute(
    `SELECT ${columns} FROM todos WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function create(data) {
  const [result] = await db.execute(
    'INSERT INTO todos (user_id, title, completed) VALUES (?, ?, ?)',
    [data.userId, data.title, data.completed ?? false]
  );
  return findById(result.insertId);
}

async function update(id, data) {
  const fields = Object.keys(data);
  const databaseFields = {
    title: 'title',
    completed: 'completed'
  };
  const assignments = fields.map((field) => `${databaseFields[field]} = ?`);
  const values = fields.map((field) => data[field]);
  const [result] = await db.execute(
    `UPDATE todos SET ${assignments.join(', ')} WHERE id = ?`,
    [...values, id]
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return findById(id);
}

async function remove(id) {
  const [result] = await db.execute('DELETE FROM todos WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove
};
