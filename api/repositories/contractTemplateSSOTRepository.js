const db = require('../config/database');

class ContractTemplateSSOTRepository {
  static async create(template, client = db.pool) {
    const query = `
      INSERT INTO contract_templates_ssot (
        id,
        name,
        description,
        content,
        version,
        is_active,
        created_by,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const values = [
      template.id,
      template.name,
      template.description || null,
      template.content,
      template.version || 1,
      template.isActive !== undefined ? template.isActive : true,
      template.createdBy,
      template.createdAt || new Date(),
      template.updatedAt || new Date()
    ];
    
    const result = await client.query(query, values);
    return result.rows[0];
  }
  
  static async update(id, updates, client = db.pool) {
    const fields = [];
    const values = [];
    let index = 1;
    
    if (updates.name !== undefined) {
      fields.push(`name = $${index++}`);
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${index++}`);
      values.push(updates.description);
    }
    if (updates.content !== undefined) {
      fields.push(`content = $${index++}`);
      values.push(updates.content);
    }
    if (updates.version !== undefined) {
      fields.push(`version = $${index++}`);
      values.push(updates.version);
    }
    if (updates.isActive !== undefined) {
      fields.push(`is_active = $${index++}`);
      values.push(updates.isActive);
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
      UPDATE contract_templates_ssot
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
      FROM contract_templates_ssot
      WHERE id = $1
    `;
    const result = await client.query(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  }
  
  static async findByName(name, client = db.pool) {
    const query = `
      SELECT *
      FROM contract_templates_ssot
      WHERE name = $1
      ORDER BY version DESC
      LIMIT 1
    `;
    const result = await client.query(query, [name]);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  }
  
  static async findAll(client = db.pool) {
    const query = `
      SELECT *
      FROM contract_templates_ssot
      ORDER BY name, version DESC
    `;
    const result = await client.query(query);
    return result.rows;
  }
  
  static async findActive(client = db.pool) {
    const query = `
      SELECT *
      FROM contract_templates_ssot
      WHERE is_active = true
      ORDER BY name, version DESC
    `;
    const result = await client.query(query);
    return result.rows;
  }
  
  static async findByVersion(name, version, client = db.pool) {
    const query = `
      SELECT *
      FROM contract_templates_ssot
      WHERE name = $1 AND version = $2
    `;
    const result = await client.query(query, [name, version]);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  }
  
  static async delete(id, client = db.pool) {
    const query = `
      DELETE FROM contract_templates_ssot
      WHERE id = $1
    `;
    await client.query(query, [id]);
  }
}

module.exports = ContractTemplateSSOTRepository;