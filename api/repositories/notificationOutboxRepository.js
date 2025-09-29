const db = require('../config/database');

class NotificationOutboxRepository {
  static async create(outboxItem, client = db.pool) {
    const query = `
      INSERT INTO notif_outbox (
        id,
        tenant_id,
        event_key,
        payload,
        created_by,
        created_at,
        processed_at,
        status,
        attempts,
        last_error
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const values = [
      outboxItem.id,
      outboxItem.tenantId || null,
      outboxItem.eventKey,
      outboxItem.payload,
      outboxItem.createdBy || null,
      outboxItem.createdAt || new Date(),
      outboxItem.processedAt || null,
      outboxItem.status || 'PENDING',
      outboxItem.attempts || 0,
      outboxItem.lastError || null
    ];
    
    const result = await client.query(query, values);
    return result.rows[0];
  }
  
  static async update(id, updates, client = db.pool) {
    const fields = [];
    const values = [];
    let index = 1;
    
    if (updates.tenantId !== undefined) {
      fields.push(`tenant_id = $${index++}`);
      values.push(updates.tenantId);
    }
    if (updates.eventKey !== undefined) {
      fields.push(`event_key = $${index++}`);
      values.push(updates.eventKey);
    }
    if (updates.payload !== undefined) {
      fields.push(`payload = $${index++}`);
      values.push(updates.payload);
    }
    if (updates.createdBy !== undefined) {
      fields.push(`created_by = $${index++}`);
      values.push(updates.createdBy);
    }
    if (updates.processedAt !== undefined) {
      fields.push(`processed_at = $${index++}`);
      values.push(updates.processedAt);
    }
    if (updates.status !== undefined) {
      fields.push(`status = $${index++}`);
      values.push(updates.status);
    }
    if (updates.attempts !== undefined) {
      fields.push(`attempts = $${index++}`);
      values.push(updates.attempts);
    }
    if (updates.lastError !== undefined) {
      fields.push(`last_error = $${index++}`);
      values.push(updates.lastError);
    }
    
    if (fields.length === 0) {
      return this.findById(id, client);
    }
    
    values.push(id);
    
    const query = `
      UPDATE notif_outbox
      SET ${fields.join(', ')}
      WHERE id = $${index}
      RETURNING *
    `;
    
    const result = await client.query(query, values);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  }
  
  static async findById(id, client = db.pool) {
    const query = `
      SELECT *
      FROM notif_outbox
      WHERE id = $1
    `;
    const result = await client.query(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  }
  
  static async findPending(limit = 100, client = db.pool) {
    const query = `
      SELECT *
      FROM notif_outbox
      WHERE status = 'PENDING'
      ORDER BY created_at ASC
      LIMIT $1
    `;
    const result = await client.query(query, [limit]);
    return result.rows;
  }
  
  static async findProcessing(limit = 100, client = db.pool) {
    const query = `
      SELECT *
      FROM notif_outbox
      WHERE status = 'PROCESSING'
      ORDER BY created_at ASC
      LIMIT $1
    `;
    const result = await client.query(query, [limit]);
    return result.rows;
  }
  
  static async findFailed(limit = 100, client = db.pool) {
    const query = `
      SELECT *
      FROM notif_outbox
      WHERE status = 'FAILED'
      ORDER BY created_at ASC
      LIMIT $1
    `;
    const result = await client.query(query, [limit]);
    return result.rows;
  }
  
  static async findAll(limit = 100, client = db.pool) {
    const query = `
      SELECT *
      FROM notif_outbox
      ORDER BY created_at DESC
      LIMIT $1
    `;
    const result = await client.query(query, [limit]);
    return result.rows;
  }
  
  static async countByStatus(client = db.pool) {
    const query = `
      SELECT status, COUNT(*) as count
      FROM notif_outbox
      GROUP BY status
    `;
    const result = await client.query(query);
    return result.rows;
  }
}

module.exports = NotificationOutboxRepository;