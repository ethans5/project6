const db = require('../config/db');

const columns = `
  p.id,
  p.album_id,
  a.user_id,
  p.title,
  p.url,
  p.thumbnail_url,
  p.created_at,
  p.updated_at
`;
const joinAlbums = 'FROM photos p JOIN albums a ON p.album_id = a.id';

async function findAll(query) {
  const conditions = [];
  const values = [];

  if (query.filters?.albumId !== undefined) {
    conditions.push('p.album_id = ?');
    values.push(query.filters.albumId);
  }

  if (query.filters?.title !== undefined) {
    conditions.push('p.title = ?');
    values.push(query.filters.title);
  }

  if (query.search !== undefined) {
    conditions.push('(p.title LIKE ? OR p.url LIKE ? OR p.thumbnail_url LIKE ?)');
    values.push(`%${query.search}%`, `%${query.search}%`, `%${query.search}%`);
  }

  const where = conditions.length > 0
    ? ` WHERE ${conditions.join(' AND ')}`
    : '';

  const [countRows] = await db.execute(
    `SELECT COUNT(*) AS total ${joinAlbums}${where}`,
    values
  );
  const [rows] = await db.execute(
    `SELECT ${columns} ${joinAlbums}${where}
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
    `SELECT ${columns} ${joinAlbums} WHERE p.id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function findAlbumOwner(albumId) {
  const [rows] = await db.execute(
    'SELECT user_id FROM albums WHERE id = ?',
    [albumId]
  );
  return rows[0]?.user_id || null;
}

async function create(data) {
  const [result] = await db.execute(
    'INSERT INTO photos (album_id, title, url, thumbnail_url) VALUES (?, ?, ?, ?)',
    [data.album_id, data.title, data.url, data.thumbnail_url]
  );
  return findById(result.insertId);
}

async function update(id, userId, data) {
  const fields = Object.keys(data);
  const assignments = fields.map((field) => `p.${field} = ?`).join(', ');
  const values = fields.map((field) => data[field]);
  const [result] = await db.execute(
    `UPDATE photos p
     JOIN albums a ON p.album_id = a.id
     SET ${assignments}
     WHERE p.id = ? AND a.user_id = ?`,
    [...values, id, userId]
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return findById(id);
}

async function remove(id, userId) {
  const [result] = await db.execute(
    `DELETE p FROM photos p
     JOIN albums a ON p.album_id = a.id
     WHERE p.id = ? AND a.user_id = ?`,
    [id, userId]
  );
  return result.affectedRows > 0;
}

module.exports = {
  findAll,
  findById,
  findAlbumOwner,
  create,
  update,
  remove
};
