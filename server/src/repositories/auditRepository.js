const db = require('../config/db');

const columns = `
  ae.id,
  ae.actor_user_id AS actorUserId,
  actor.username AS actorUsername,
  ae.target_user_id AS targetUserId,
  target.username AS targetUsername,
  ae.action,
  ae.entity_type AS entityType,
  ae.entity_id AS entityId,
  ae.metadata,
  ae.created_at AS createdAt
`;

const joins = `
  FROM audit_events ae
  LEFT JOIN users actor ON ae.actor_user_id = actor.id
  LEFT JOIN users target ON ae.target_user_id = target.id
`;

function parseEvent(row) {
  return {
    ...row,
    metadata: row.metadata ? JSON.parse(row.metadata) : null
  };
}

async function create(event) {
  const metadata = event.metadata === undefined || event.metadata === null
    ? null
    : JSON.stringify(event.metadata);

  const [result] = await db.execute(
    `INSERT INTO audit_events
      (actor_user_id, target_user_id, action, entity_type, entity_id, metadata)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      event.actorUserId ?? null,
      event.targetUserId ?? null,
      event.action,
      event.entityType,
      event.entityId ?? null,
      metadata
    ]
  );

  return result.insertId;
}

async function findAll(query) {
  const conditions = [];
  const values = [];

  if (query.filters?.actorUserId !== undefined) {
    conditions.push('ae.actor_user_id = ?');
    values.push(query.filters.actorUserId);
  }

  if (query.filters?.targetUserId !== undefined) {
    conditions.push('ae.target_user_id = ?');
    values.push(query.filters.targetUserId);
  }

  if (query.filters?.action !== undefined) {
    conditions.push('ae.action = ?');
    values.push(query.filters.action);
  }

  if (query.filters?.entityType !== undefined) {
    conditions.push('ae.entity_type = ?');
    values.push(query.filters.entityType);
  }

  if (query.filters?.from !== undefined) {
    conditions.push('ae.created_at >= ?');
    values.push(query.filters.from);
  }

  if (query.filters?.to !== undefined) {
    conditions.push('ae.created_at <= ?');
    values.push(query.filters.to);
  }

  if (query.search !== undefined) {
    conditions.push('(ae.action LIKE ? OR ae.entity_type LIKE ? OR actor.username LIKE ? OR target.username LIKE ?)');
    values.push(`%${query.search}%`, `%${query.search}%`, `%${query.search}%`, `%${query.search}%`);
  }

  const where = conditions.length > 0
    ? ` WHERE ${conditions.join(' AND ')}`
    : '';

  const [countRows] = await db.execute(
    `SELECT COUNT(*) AS total ${joins}${where}`,
    values
  );
  const [rows] = await db.execute(
    `SELECT ${columns} ${joins}${where}
     ORDER BY ${query.sortColumn} ${query.order}
     LIMIT ${query.offset}, ${query.limit}`,
    values
  );

  return {
    rows: rows.map(parseEvent),
    total: Number(countRows[0].total)
  };
}

async function findRecent(limit = 10) {
  const [rows] = await db.execute(
    `SELECT ${columns} ${joins}
     ORDER BY ae.created_at DESC
     LIMIT ${limit}`
  );
  return rows.map(parseEvent);
}

module.exports = {
  create,
  findAll,
  findRecent
};
