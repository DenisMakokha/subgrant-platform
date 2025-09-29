const db = require('../config/database');

class NotificationEventRepository {
  static async create(event, client = db.pool) {
    const query = `
      INSERT INTO notif_event_catalog (
        key,
        description,
        payload_schema,
        default_channels,
        severity,
        active,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [
      event.key,
      event.description,
      event.payloadSchema,
      event.defaultChannels,
      event.severity || 'info',
      event.active !== undefined ? event.active : true,
      event.createdAt || new Date()
    ];
    
    const result = await client.query(query, values);
    return result.rows[0];
  }
  
  static async update(key, updates, client = db.pool) {
    const fields = [];
    const values = [];
    let index = 1;
    
    if (updates.description !== undefined) {
      fields.push(`description = $${index++}`);
      values.push(updates.description);
    }
    if (updates.payloadSchema !== undefined) {
      fields.push(`payload_schema = $${index++}`);
      values.push(updates.payloadSchema);
    }
    if (updates.defaultChannels !== undefined) {
      fields.push(`default_channels = $${index++}`);
      values.push(updates.defaultChannels);
    }
    if (updates.severity !== undefined) {
      fields.push(`severity = $${index++}`);
      values.push(updates.severity);
    }
    if (updates.active !== undefined) {
      fields.push(`active = $${index++}`);
      values.push(updates.active);
    }
    
    if (fields.length === 0) {
      return this.findByKey(key, client);
    }
    
    values.push(key);
    
    const query = `
      UPDATE notif_event_catalog
      SET ${fields.join(', ')}
      WHERE key = $${index}
      RETURNING *
    `;
    
    const result = await client.query(query, values);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  }
  
  static async findByKey(key, client = db.pool) {
    const query = `
      SELECT *
      FROM notif_event_catalog
      WHERE key = $1
    `;
    const result = await client.query(query, [key]);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  }
  
  static async findAll(client = db.pool) {
    const query = `
      SELECT *
      FROM notif_event_catalog
      ORDER BY key
    `;
    const result = await client.query(query);
    return result.rows;
  }
  
  static async findActive(client = db.pool) {
    const query = `
      SELECT *
      FROM notif_event_catalog
      WHERE active = true
      ORDER BY key
    `;
    const result = await client.query(query);
    return result.rows;
  }
}

module.exports = NotificationEventRepository;