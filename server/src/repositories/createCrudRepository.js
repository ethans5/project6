const db = require('../config/db');

function createCrudRepository(table, columns) {
  const columnList = columns.join(', ');

  return {
    async findAll() {
      const [rows] = await db.execute(
        `SELECT ${columnList} FROM ${table} ORDER BY id`
      );
      return rows;
    },

    async findById(id) {
      const [rows] = await db.execute(
        `SELECT ${columnList} FROM ${table} WHERE id = ?`,
        [id]
      );
      return rows[0] || null;
    },

    async create(data) {
      const fields = Object.keys(data);
      const placeholders = fields.map(() => '?').join(', ');
      const values = fields.map((field) => data[field]);
      const [result] = await db.execute(
        `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`,
        values
      );
      return this.findById(result.insertId);
    },

    async update(id, data) {
      const fields = Object.keys(data);
      const assignments = fields.map((field) => `${field} = ?`).join(', ');
      const values = fields.map((field) => data[field]);
      const [result] = await db.execute(
        `UPDATE ${table} SET ${assignments} WHERE id = ?`,
        [...values, id]
      );

      if (result.affectedRows === 0) {
        return null;
      }

      return this.findById(id);
    },

    async remove(id) {
      const [result] = await db.execute(
        `DELETE FROM ${table} WHERE id = ?`,
        [id]
      );
      return result.affectedRows > 0;
    }
  };
}

module.exports = createCrudRepository;
