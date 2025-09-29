const db = require('../config/database');

class EmailSuppressionRepository {
  static async create(suppression, client = db.pool) {
    const query = `
      INSERT INTO email_suppressions (
        id,
        tenant_id,
        email,
        reason,
        category,
        suppressed_at,
        expires_at,
        created_by,
        notes,
        active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const values = [
      suppression.id,
      suppression.tenantId || null,
      suppression.email,
      suppression.reason,
      suppression.category || null,
      suppression.suppressedAt || new Date(),
      suppression.expiresAt || null,
      suppression.createdBy || null,
      suppression.notes || null,
      suppression.active !== undefined ? suppression.active : true
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
    if (updates.email !== undefined) {
      fields.push(`email = $${index++}`);
      values.push(updates.email);
    }
    if (updates.reason !== undefined) {
      fields.push(`reason = $${index++}`);
      values.push(updates.reason);
    }
    if (updates.category !== undefined) {
      fields.push(`category = $${index++}`);
      values.push(updates.category);
    }
    if (updates.suppressedAt !== undefined) {
      fields.push(`suppressed_at = $${index++}`);
      values.push(updates.suppressedAt);
    }
    if (updates.expiresAt !== undefined) {
      fields.push(`expires_at = $${index++}`);
      values.push(updates.expiresAt);
    }
    if (updates.createdBy !== undefined) {
      fields.push(`created_by = $${index++}`);
      values.push(updates.createdBy);
    }
    if (updates.notes !== undefined) {
      fields.push(`notes = $${index++}`);
      values.push(updates.notes);
    }
    if (updates.active !== undefined) {
      fields.push(`active = $${index++}`);
      values.push(updates.active);
    }
    
    if (fields.length === 0) {
      return this.findById(id, client);
    }
    
    values.push(id);
    
    const query = `
      UPDATE email_suppressions
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
      FROM email_suppressions
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
      FROM email_suppressions
      WHERE email = $1 AND (tenant_id = $2 OR (tenant_id IS NULL AND $2 IS NULL)) AND active = true
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
      FROM email_suppressions
      WHERE tenant_id = $1 OR tenant_id IS NULL
      ORDER BY tenant_id DESC, suppressed_at DESC
    `;
    const result = await client.query(query, [tenantId]);
    return result.rows;
  }
  
  static async findByReason(reason, client = db.pool) {
    const query = `
      SELECT *
      FROM email_suppressions
      WHERE reason = $1
      ORDER BY suppressed_at DESC
    `;
    const result = await client.query(query, [reason]);
    return result.rows;
  }
  
  static async findActive(client = db.pool) {
    const query = `
      SELECT *
      FROM email_suppressions
      WHERE active = true
      ORDER BY suppressed_at DESC
    `;
    const result = await client.query(query);
    return result.rows;
  }
  
  static async findAll(client = db.pool) {
    const query = `
      SELECT *
      FROM email_suppressions
      ORDER BY suppressed_at DESC
    `;
    const result = await client.query(query);
    return result.rows;
  }
  
  static async delete(id, client = db.pool) {
    const query = `
      DELETE FROM email_suppressions
      WHERE id = $1
    `;
    await client.query(query, [id]);
  }
}

module.exports = EmailSuppressionRepository;