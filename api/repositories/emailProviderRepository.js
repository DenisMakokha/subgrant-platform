const db = require('../config/database');

class EmailProviderRepository {
  static async create(provider, client = db.pool) {
    const query = `
      INSERT INTO email_providers (
        id,
        tenant_id,
        name,
        provider_type,
        config_json,
        active,
        default_sender,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const values = [
      provider.id,
      provider.tenantId || null,
      provider.name,
      provider.providerType,
      provider.configJson,
      provider.active !== undefined ? provider.active : true,
      provider.defaultSender || null,
      provider.createdAt || new Date(),
      provider.updatedAt || new Date()
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
    if (updates.providerType !== undefined) {
      fields.push(`provider_type = $${index++}`);
      values.push(updates.providerType);
    }
    if (updates.configJson !== undefined) {
      fields.push(`config_json = $${index++}`);
      values.push(updates.configJson);
    }
    if (updates.active !== undefined) {
      fields.push(`active = $${index++}`);
      values.push(updates.active);
    }
    if (updates.defaultSender !== undefined) {
      fields.push(`default_sender = $${index++}`);
      values.push(updates.defaultSender);
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
      UPDATE email_providers
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
      FROM email_providers
      WHERE id = $1
    `;
    const result = await client.query(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  }
  
  static async findByTenant(tenantId, client = db.pool) {
    const query = `
      SELECT *
      FROM email_providers
      WHERE tenant_id = $1 OR tenant_id IS NULL
      ORDER BY tenant_id DESC, name
    `;
    const result = await client.query(query, [tenantId]);
    return result.rows;
  }
  
  static async findByTenantAndType(tenantId, providerType, client = db.pool) {
    const query = `
      SELECT *
      FROM email_providers
      WHERE (tenant_id = $1 OR tenant_id IS NULL) AND provider_type = $2
      ORDER BY tenant_id DESC
    `;
    const result = await client.query(query, [tenantId, providerType]);
    return result.rows;
  }
  
  static async findActiveByTenant(tenantId, client = db.pool) {
    const query = `
      SELECT *
      FROM email_providers
      WHERE (tenant_id = $1 OR tenant_id IS NULL) AND active = true
      ORDER BY tenant_id DESC, name
    `;
    const result = await client.query(query, [tenantId]);
    return result.rows;
  }
  
  static async findAll(client = db.pool) {
    const query = `
      SELECT *
      FROM email_providers
      ORDER BY tenant_id, name
    `;
    const result = await client.query(query);
    return result.rows;
  }
  
  static async findActive(client = db.pool) {
    const query = `
      SELECT *
      FROM email_providers
      WHERE active = true
      ORDER BY tenant_id, name
    `;
    const result = await client.query(query);
    return result.rows;
  }
  
  static async delete(id, client = db.pool) {
    const query = `
      DELETE FROM email_providers
      WHERE id = $1
    `;
    await client.query(query, [id]);
  }
}

module.exports = EmailProviderRepository;