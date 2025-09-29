const db = require('../config/database');

const IDEMPOTENCY_COLUMNS = [
  'id',
  'idempotency_key',
  'action_key',
  'actor_user_id',
  'request_hash',
  'response_json',
  'created_at'
];

class ActionIdempotencyRepository {
  static async reserve({ key, actionKey, actorUserId, requestHash }, client = db.pool) {
    const query = `
      INSERT INTO action_idempotency (
        id,
        idempotency_key,
        action_key,
        actor_user_id,
        request_hash,
        response_json,
        created_at
      )
      VALUES (
        gen_random_uuid(),
        $1,
        $2,
        $3,
        $4,
        NULL,
        now()
      )
      ON CONFLICT (idempotency_key) DO NOTHING
      RETURNING ${IDEMPOTENCY_COLUMNS.join(', ')}
    `;
    const result = await client.query(query, [key, actionKey, actorUserId, requestHash || null]);
    return result.rows.length ? ActionIdempotencyRepository.mapRow(result.rows[0]) : null;
  }

  static async markCompleted(key, responseJson, client = db.pool) {
    const query = `
      UPDATE action_idempotency
      SET response_json = $2
      WHERE idempotency_key = $1
      RETURNING ${IDEMPOTENCY_COLUMNS.join(', ')}
    `;
    const result = await client.query(query, [key, responseJson || null]);
    return result.rows.length ? ActionIdempotencyRepository.mapRow(result.rows[0]) : null;
  }

  static async findByKey(key, client = db.pool) {
    const query = `
      SELECT ${IDEMPOTENCY_COLUMNS.join(', ')}
      FROM action_idempotency
      WHERE idempotency_key = $1
    `;
    const result = await client.query(query, [key]);
    return result.rows.length ? ActionIdempotencyRepository.mapRow(result.rows[0]) : null;
  }

  static mapRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      idempotencyKey: row.idempotency_key,
      actionKey: row.action_key,
      actorUserId: row.actor_user_id,
      requestHash: row.request_hash,
      responseJson: row.response_json,
      createdAt: row.created_at
    };
  }
}

module.exports = ActionIdempotencyRepository;