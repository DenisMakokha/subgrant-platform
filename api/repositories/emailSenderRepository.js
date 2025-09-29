const db = require('../config/database');

class EmailSenderRepository {
  static async create(sender, client = db.pool) {
    const query = `
      INSERT INTO email_senders (
        id,
        tenant_id,
        name,
        email,
        reply_to,
        display_name,
        verified,
        active,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const values = [
      sender.id,
      sender.tenantId || null,
      sender.name,
      sender.email,
      sender.replyTo || null,
      sender.displayName || null,
      sender.verified !== undefined ? sender.verified : false,
      sender.active !== undefined ? sender.active : true,
      sender.createdAt || new Date(),
      sender.updatedAt || new Date()
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
    if (updates.name !== undefined) {
      fields.push(`name = $${index++}`);
      values.push(updates.name);
    }
    if (updates.email !== undefined) {
      fields.push(`email = $${index++}`);
      values.push(updates.email);
    }
    if (updates.replyTo !== undefined) {
      fields.push(`reply_to = $${index++}`);
      values.push(updates.replyTo);
    }
    if (updates.displayName !== undefined) {
      fields.push(`display_name = $${index++}`);
      values.push(updates.displayName);
    }
    if (updates.verified !== undefined) {
      fields.push(`verified = $${index++}`);
      values.push(updates.verified);
    }
    if (updates.active !== undefined) {
      fields.push(`active = $${index++}`);
      values.push(updates.active);
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
      UPDATE email_senders
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
      FROM email_senders
      WHERE id = $1
    `;
    const result = await client.query(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  }
  
  static async findByEmail(email, tenantId = null, client = db.pool) {
    const query = `
      SELECT *
      FROM email_senders
      WHERE email = $1 AND (tenant_id = $2 OR (tenant_id IS NULL AND $2 IS NULL))
    `;
    const result = await client.query(query, [email, tenantId]);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  }
  
  static async findByTenant(tenantId, client = db.pool) {
    const query = `
      SELECT *
      FROM email_senders
      WHERE tenant_id = $1 OR tenant_id IS NULL
      ORDER BY tenant_id DESC, name
    `;
    const result = await client.query(query, [tenantId]);
    return result.rows;
  }
  
  static async findAll(client = db.pool) {
    const query = `
      SELECT *
      FROM email_senders
      ORDER BY tenant_id, name
    `;
    const result = await client.query(query);
    return result.rows;
  }
  
  static async findActive(client = db.pool) {
    const query = `
      SELECT *
      FROM email_senders
      WHERE active = true
      ORDER BY tenant_id, name
    `;
    const result = await client.query(query);
    return result.rows;
  }
  
  static async delete(id, client = db.pool) {
    const query = `
      DELETE FROM email_senders
      WHERE id = $1
    `;
    await client.query(query, [id]);
  }
}

module.exports = EmailSenderRepository;