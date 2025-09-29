const db = require('../config/database');

class EmailDigestRepository {
  static async create(digest, client = db.pool) {
    const query = `
      INSERT INTO email_digests (
        id,
        tenant_id,
        user_id,
        email_type,
        frequency,
        next_run_at,
        last_run_at,
        items_json,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const values = [
      digest.id,
      digest.tenantId || null,
      digest.userId,
      digest.emailType,
      digest.frequency,
      digest.nextRunAt,
      digest.lastRunAt || null,
      digest.itemsJson || null,
      digest.createdAt || new Date(),
      digest.updatedAt || new Date()
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
    if (updates.userId !== undefined) {
      fields.push(`user_id = $${index++}`);
      values.push(updates.userId);
    }
    if (updates.emailType !== undefined) {
      fields.push(`email_type = $${index++}`);
      values.push(updates.emailType);
    }
    if (updates.frequency !== undefined) {
      fields.push(`frequency = $${index++}`);
      values.push(updates.frequency);
    }
    if (updates.nextRunAt !== undefined) {
      fields.push(`next_run_at = $${index++}`);
      values.push(updates.nextRunAt);
    }
    if (updates.lastRunAt !== undefined) {
      fields.push(`last_run_at = $${index++}`);
      values.push(updates.lastRunAt);
    }
    if (updates.itemsJson !== undefined) {
      fields.push(`items_json = $${index++}`);
      values.push(updates.itemsJson);
    }
    if (updates.updatedAt !== undefined) {
      fields.push(`updated_at = $${index++}`);
      values.push(updates.updatedAt);
    }
    
    if (fields.length === 0) {
      return this.findById(id, client);
    }
    
    values.push(id);
    
    const query = `
      UPDATE email_digests
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
      FROM email_digests
      WHERE id = $1
    `;
    const result = await client.query(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  }
  
  static async findByUserAndFrequency(userId, frequency, client = db.pool) {
    const query = `
      SELECT *
      FROM email_digests
      WHERE user_id = $1 AND frequency = $2
    `;
    const result = await client.query(query, [userId, frequency]);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  }
  
  static async findByUser(userId, client = db.pool) {
    const query = `
      SELECT *
      FROM email_digests
      WHERE user_id = $1
      ORDER BY frequency
    `;
    const result = await client.query(query, [userId]);
    return result.rows;
  }
  
  static async findByTenant(tenantId, client = db.pool) {
    const query = `
      SELECT *
      FROM email_digests
      WHERE tenant_id = $1 OR tenant_id IS NULL
      ORDER BY user_id, frequency
    `;
    const result = await client.query(query, [tenantId]);
    return result.rows;
  }
  
  static async findDueForProcessing(limit = 100, client = db.pool) {
    const query = `
      SELECT *
      FROM email_digests
      WHERE next_run_at <= NOW()
      ORDER BY next_run_at ASC
      LIMIT $1
    `;
    const result = await client.query(query, [limit]);
    return result.rows;
  }
  
  static async findAll(client = db.pool) {
    const query = `
      SELECT *
      FROM email_digests
      ORDER BY user_id, frequency
    `;
    const result = await client.query(query);
    return result.rows;
  }
  
  static async delete(id, client = db.pool) {
    const query = `
      DELETE FROM email_digests
      WHERE id = $1
    `;
    await client.query(query, [id]);
  }
}

module.exports = EmailDigestRepository;