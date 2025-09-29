const db = require('../config/database');

const AUDIT_COLUMNS = [
  'id',
  'actor_user_id',
  'action_key',
  'entity_type',
  'entity_id',
  'from_state',
  'to_state',
  'payload_json',
  'created_at'
];

class AuditLogRepository {
  static async create(entry, client = db.pool) {
    const query = `
      INSERT INTO audit_log (
        id,
        actor_user_id,
        action_key,
        entity_type,
        entity_id,
        from_state,
        to_state,
        payload_json,
        created_at
      )
      VALUES (
        COALESCE($1, gen_random_uuid()),
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        COALESCE($8, '{}'::jsonb),
        COALESCE($9, now())
      )
      RETURNING ${AUDIT_COLUMNS.join(', ')}
    `;
    const values = [
      entry.id || null,
      entry.actorUserId,
      entry.actionKey,
      entry.entityType,
      entry.entityId,
      entry.fromState || null,
      entry.toState || null,
      entry.payloadJson || null,
      entry.createdAt || null
    ];
    const result = await client.query(query, values);
    return AuditLogRepository.mapRow(result.rows[0]);
  }

  static async findByEntity(entityType, entityId, client = db.pool) {
    const query = `
      SELECT ${AUDIT_COLUMNS.join(', ')}
      FROM audit_log
      WHERE entity_type = $1 AND entity_id = $2
      ORDER BY created_at DESC
    `;
    const result = await client.query(query, [entityType, entityId]);
    return result.rows.map(AuditLogRepository.mapRow);
  }

  static mapRow(row) {
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      actorUserId: row.actor_user_id,
      actionKey: row.action_key,
      entityType: row.entity_type,
      entityId: row.entity_id,
      fromState: row.from_state,
      toState: row.to_state,
      payloadJson: row.payload_json,
      createdAt: row.created_at
    };
  }
}

module.exports = AuditLogRepository;