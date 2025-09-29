const db = require('../config/database');

class EmailPreferenceRepository {
  static async create(preference, client = db.pool) {
    const query = `
      INSERT INTO email_preferences (
        id,
        tenant_id,
        user_id,
        email_type,
        enabled,
        frequency,
        preferred_time,
        preferred_tz,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (user_id, email_type) 
      DO UPDATE SET
        tenant_id = EXCLUDED.tenant_id,
        enabled = EXCLUDED.enabled,
        frequency = EXCLUDED.frequency,
        preferred_time = EXCLUDED.preferred_time,
        preferred_tz = EXCLUDED.preferred_tz,
        updated_at = EXCLUDED.updated_at
      RETURNING *
    `;
    
    const values = [
      preference.id,
      preference.tenantId || null,
      preference.userId,
      preference.emailType,
      preference.enabled !== undefined ? preference.enabled : true,
      preference.frequency || 'immediate',
      preference.preferredTime || null,
      preference.preferredTz || null,
      preference.createdAt || new Date(),
      preference.updatedAt || new Date()
    ];
    
    const result = await client.query(query, values);
    return result.rows[0];
  }
  
  static async update(userId, emailType, updates, client = db.pool) {
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
    if (updates.preferredTime !== undefined) {
      fields.push(`preferred_time = $${index++}`);
      values.push(updates.preferredTime);
    }
    if (updates.preferredTz !== undefined) {
      fields.push(`preferred_tz = $${index++}`);
      values.push(updates.preferredTz);
    }
    if (updates.updatedAt !== undefined) {
      fields.push(`updated_at = $${index++}`);
      values.push(updates.updatedAt);
    }
    
    if (fields.length === 0) {
      return this.findByUserAndType(userId, emailType, client);
    }
    
    values.push(userId, emailType);
    
    const query = `
      UPDATE email_preferences
      SET ${fields.join(', ')}
      WHERE user_id = $${index} AND email_type = $${index + 1}
      RETURNING *
    `;
    
    const result = await client.query(query, values);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  }
  
  static async findByUserAndType(userId, emailType, client = db.pool) {
    const query = `
      SELECT *
      FROM email_preferences
      WHERE user_id = $1 AND email_type = $2
    `;
    const result = await client.query(query, [userId, emailType]);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  }
  
  static async findByUser(userId, client = db.pool) {
    const query = `
      SELECT *
      FROM email_preferences
      WHERE user_id = $1
      ORDER BY email_type
    `;
    const result = await client.query(query, [userId]);
    return result.rows;
  }
  
  static async findByTenant(tenantId, client = db.pool) {
    const query = `
      SELECT *
      FROM email_preferences
      WHERE tenant_id = $1 OR tenant_id IS NULL
      ORDER BY user_id, email_type
    `;
    const result = await client.query(query, [tenantId]);
    return result.rows;
  }
  
  static async findActiveByUser(userId, client = db.pool) {
    const query = `
      SELECT *
      FROM email_preferences
      WHERE user_id = $1 AND enabled = true
      ORDER BY email_type
    `;
    const result = await client.query(query, [userId]);
    return result.rows;
  }
  
  static async findAll(client = db.pool) {
    const query = `
      SELECT *
      FROM email_preferences
      ORDER BY user_id, email_type
    `;
    const result = await client.query(query);
    return result.rows;
  }
  
  static async delete(userId, emailType, client = db.pool) {
    const query = `
      DELETE FROM email_preferences
      WHERE user_id = $1 AND email_type = $2
    `;
    await client.query(query, [userId, emailType]);
  }
}

module.exports = EmailPreferenceRepository;