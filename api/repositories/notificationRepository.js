const db = require('../config/database');

const NOTIFICATION_COLUMNS = [
  'id',
  'user_id',
  'channel',
  'template_key',
  'payload_json',
  'read_at',
  'created_at'
];

class NotificationRepository {
  static async create(notification, client = db.pool) {
    const query = `
      INSERT INTO notifications (
        id,
        user_id,
        channel,
        template_key,
        payload_json,
        read_at,
        created_at
      )
      VALUES (
        COALESCE($1, gen_random_uuid()),
        $2,
        $3,
        $4,
        COALESCE($5, '{}'::jsonb),
        $6,
        COALESCE($7, now())
      )
      RETURNING ${NOTIFICATION_COLUMNS.join(', ')}
    `;
    const values = [
      notification.id || null,
      notification.userId,
      notification.channel,
      notification.templateKey,
      notification.payloadJson,
      notification.readAt || null,
      notification.createdAt || null
    ];
    const result = await client.query(query, values);
    return NotificationRepository.mapRow(result.rows[0]);
  }

  static async markRead(id, readAt = new Date(), client = db.pool) {
    const query = `
      UPDATE notifications
      SET read_at = $2
      WHERE id = $1
      RETURNING ${NOTIFICATION_COLUMNS.join(', ')}
    `;
    const result = await client.query(query, [id, readAt]);
    if (result.rows.length === 0) {
      return null;
    }
    return NotificationRepository.mapRow(result.rows[0]);
  }

  static async findUnreadByUser(userId, client = db.pool) {
    const query = `
      SELECT ${NOTIFICATION_COLUMNS.join(', ')}
      FROM notifications
      WHERE user_id = $1 AND read_at IS NULL
      ORDER BY created_at DESC
    `;
    const result = await client.query(query, [userId]);
    return result.rows.map(NotificationRepository.mapRow);
  }

  static async findRecentByUser(userId, limit = 50, client = db.pool) {
    const query = `
      SELECT ${NOTIFICATION_COLUMNS.join(', ')}
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    const result = await client.query(query, [userId, limit]);
    return result.rows.map(NotificationRepository.mapRow);
  }

  static mapRow(row) {
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      userId: row.user_id,
      channel: row.channel,
      templateKey: row.template_key,
      payloadJson: row.payload_json,
      readAt: row.read_at,
      createdAt: row.created_at
    };
  }
}

module.exports = NotificationRepository;