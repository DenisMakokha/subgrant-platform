const db = require('../config/database');

class NotificationPreferencesRepository {
  static async create(preference, client = db.pool) {
    const query = `
      INSERT INTO notif_preferences (
        id,
        tenant_id,
        user_id,
        event_key,
        channel,
        enabled,
        frequency,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (user_id, event_key, channel) 
      DO UPDATE SET
        tenant_id = EXCLUDED.tenant_id,
        enabled = EXCLUDED.enabled,
        frequency = EXCLUDED.frequency,
        created_at = EXCLUDED.created_at
      RETURNING *
    `;
    
    const values = [
      preference.id,
      preference.tenantId || null,
      preference.userId,
      preference.eventKey,
      preference.channel,
      preference.enabled !== undefined ? preference.enabled : true,
      preference.frequency || 'immediate',
      preference.createdAt || new Date()
    ];
    
    const result = await client.query(query, values);
    return result.rows[0];
  }
  
  static async update(userId, eventKey, channel, updates, client = db.pool) {
    const fields = [];
    const values = [];
    let index = 1;
    
    if (updates.tenantId !== undefined) {
      fields.push(`tenant_id = $${index++}`);
      values.push(updates.tenantId);
    }
    if (updates.enabled !== undefined) {
      fields.push(`enabled = $${index++}`);
      values.push(updates.enabled);
    }
    if (updates.frequency !== undefined) {
      fields.push(`frequency = $${index++}`);
      values.push(updates.frequency);
    }
    
    if (fields.length === 0) {
      return this.findByUserEventChannel(userId, eventKey, channel, client);
    }
    
    values.push(userId, eventKey, channel);
    
    const query = `
      UPDATE notif_preferences
      SET ${fields.join(', ')}
      WHERE user_id = $${index} AND event_key = $${index + 1} AND channel = $${index + 2}
      RETURNING *
    `;
    
    const result = await client.query(query, values);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  }
  
  static async findByUserEventChannel(userId, eventKey, channel, client = db.pool) {
    const query = `
      SELECT *
      FROM notif_preferences
      WHERE user_id = $1 AND event_key = $2 AND channel = $3
    `;
    const result = await client.query(query, [userId, eventKey, channel]);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  }
  
  static async findByUser(userId, client = db.pool) {
    const query = `
      SELECT *
      FROM notif_preferences
      WHERE user_id = $1
      ORDER BY event_key, channel
    `;
    const result = await client.query(query, [userId]);
    return result.rows;
  }
  
  static async findByUserAndEvent(userId, eventKey, client = db.pool) {
    const query = `
      SELECT *
      FROM notif_preferences
      WHERE user_id = $1 AND event_key = $2
      ORDER BY channel
    `;
    const result = await client.query(query, [userId, eventKey]);
    return result.rows;
  }
  
  static async findActiveByUser(userId, client = db.pool) {
    const query = `
      SELECT *
      FROM notif_preferences
      WHERE user_id = $1 AND enabled = true
      ORDER BY event_key, channel
    `;
    const result = await client.query(query, [userId]);
    return result.rows;
  }
  
  static async delete(userId, eventKey, channel, client = db.pool) {
    const query = `
      DELETE FROM notif_preferences
      WHERE user_id = $1 AND event_key = $2 AND channel = $3
    `;
    await client.query(query, [userId, eventKey, channel]);
  }
}

module.exports = NotificationPreferencesRepository;