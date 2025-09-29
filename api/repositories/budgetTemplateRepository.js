const db = require('../config/database');

class BudgetTemplateRepository {
  static async create(template, client = db.pool) {
    const query = `
      INSERT INTO budget_templates (
        id,
        project_id,
        name,
        description,
        is_default,
        status,
        created_by,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const values = [
      template.id,
      template.projectId || null,
      template.name,
      template.description || null,
      template.isDefault !== undefined ? template.isDefault : false,
      template.status || 'DRAFT',
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
    
    if (updates.projectId !== undefined) {
      fields.push(`project_id = $${index++}`);
      values.push(updates.projectId);
    }
    if (updates.name !== undefined) {
      fields.push(`name = $${index++}`);
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${index++}`);
      values.push(updates.description);
    }
    if (updates.isDefault !== undefined) {
      fields.push(`is_default = $${index++}`);
      values.push(updates.isDefault);
    }
    if (updates.status !== undefined) {
      fields.push(`status = $${index++}`);
      values.push(updates.status);
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
      UPDATE budget_templates
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
      FROM budget_templates
      WHERE id = $1
    `;
    const result = await client.query(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  }
  
  static async findByProject(projectId, client = db.pool) {
    const query = `
      SELECT *
      FROM budget_templates
      WHERE project_id = $1 OR project_id IS NULL
      ORDER BY is_default DESC, name
    `;
    const result = await client.query(query, [projectId]);
    return result.rows;
  }
  
  static async findActive(client = db.pool) {
    const query = `
      SELECT *
      FROM budget_templates
      WHERE status = 'ACTIVE'
      ORDER BY is_default DESC, name
    `;
    const result = await client.query(query);
    return result.rows;
  }
  
  static async findDefault(client = db.pool) {
    const query = `
      SELECT *
      FROM budget_templates
      WHERE is_default = true AND status = 'ACTIVE'
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const result = await client.query(query);
    return result.rows.length > 0 ? result.rows[0] : null;
  }
  
  static async delete(id, client = db.pool) {
    const query = `
      DELETE FROM budget_templates
      WHERE id = $1
    `;
    await client.query(query, [id]);
  }
}

module.exports = BudgetTemplateRepository;