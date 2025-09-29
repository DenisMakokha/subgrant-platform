const db = require('../config/database');

class BudgetCategoryRepository {
  static async create(category, client = db.pool) {
    const query = `
      INSERT INTO budget_categories (
        id,
        project_id,
        name,
        description,
        parent_id,
        sort_order,
        is_active,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const values = [
      category.id,
      category.projectId || null,
      category.name,
      category.description || null,
      category.parentId || null,
      category.sortOrder || 0,
      category.isActive !== undefined ? category.isActive : true,
      category.createdAt || new Date(),
      category.updatedAt || new Date()
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
    if (updates.parentId !== undefined) {
      fields.push(`parent_id = $${index++}`);
      values.push(updates.parentId);
    }
    if (updates.sortOrder !== undefined) {
      fields.push(`sort_order = $${index++}`);
      values.push(updates.sortOrder);
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
      UPDATE budget_categories
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
      FROM budget_categories
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
      FROM budget_categories
      WHERE project_id = $1 OR project_id IS NULL
      ORDER BY sort_order, name
    `;
    const result = await client.query(query, [projectId]);
    return result.rows;
  }
  
  static async findActive(client = db.pool) {
    const query = `
      SELECT *
      FROM budget_categories
      WHERE is_active = true
      ORDER BY sort_order, name
    `;
    const result = await client.query(query);
    return result.rows;
  }
  
  static async delete(id, client = db.pool) {
    const query = `
      DELETE FROM budget_categories
      WHERE id = $1
    `;
    await client.query(query, [id]);
  }
}

module.exports = BudgetCategoryRepository;