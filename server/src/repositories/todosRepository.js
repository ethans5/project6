const db = require('../config/db');

const columns = 'id, user_id AS userId, title, completed, created_at, updated_at';

async function findAll(filters = {}) {
  const conditions = [];
  const values = [];
  const query = filters;

  if (query.filters?.userId !== undefined) {
    conditions.push('user_id = ?');
    values.push(query.filters.userId);
  }

  if (query.filters?.completed !== undefined) {
    conditions.push('completed = ?');
    values.push(query.filters.completed);
  }

  if (query.search !== undefined) {
    conditions.push('title LIKE ?');
    values.push(`%${query.search}%`);
  }

  const where = conditions.length > 0
    ? ` WHERE ${conditions.join(' AND ')}`
    : '';
  const [countRows] = await db.execute(
    `SELECT COUNT(*) AS total FROM todos${where}`,
    values
  );
  const [rows] = await db.execute(
    `SELECT ${columns} FROM todos${where}
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
