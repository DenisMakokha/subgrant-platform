const db = require('../config/database');

class BudgetTemplateLineRepository {
  static async create(line, client = db.pool) {
    const query = `
      INSERT INTO budget_template_lines (
        id,
        template_id,
        category_id,
        subcategory,
        guidance,
        required,
        min_lines,
        max_lines,
        sort_order,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const values = [
      line.id,
      line.templateId,
      line.categoryId || null,
      line.subcategory || null,
      line.guidance || null,
      line.required !== undefined ? line.required : false,
      line.minLines || null,
      line.maxLines || null,
      line.sortOrder || 0,
      line.createdAt || new Date()
    ];
    
    const result = await client.query(query, values);
    return result.rows[0];
  }
  
  static async update(id, updates, client = db.pool) {
    const fields = [];
    const values = [];
    let index = 1;
    
    if (updates.templateId !== undefined) {
      fields.push(`template_id = $${index++}`);
      values.push(updates.templateId);
    }
    if (updates.categoryId !== undefined) {
      fields.push(`category_id = $${index++}`);
      values.push(updates.categoryId);
    }
    if (updates.subcategory !== undefined) {
      fields.push(`subcategory = $${index++}`);
      values.push(updates.subcategory);
    }
    if (updates.guidance !== undefined) {
      fields.push(`guidance = $${index++}`);
      values.push(updates.guidance);
    }
    if (updates.required !== undefined) {
      fields.push(`required = $${index++}`);
      values.push(updates.required);
    }
    if (updates.minLines !== undefined) {
      fields.push(`min_lines = $${index++}`);
      values.push(updates.minLines);
    }
    if (updates.maxLines !== undefined) {
      fields.push(`max_lines = $${index++}`);
      values.push(updates.maxLines);
    }
    if (updates.sortOrder !== undefined) {
      fields.push(`sort_order = $${index++}`);
      values.push(updates.sortOrder);
    }
    
    if (fields.length === 0) {
      return this.findById(id, client);
    }
    
    values.push(id);
    
    const query = `
      UPDATE budget_template_lines
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
      FROM budget_template_lines
      WHERE id = $1
    `;
    const result = await client.query(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  }
  
  static async findByTemplate(templateId, client = db.pool) {
    const query = `
      SELECT *
      FROM budget_template_lines
      WHERE template_id = $1
      ORDER BY sort_order, created_at
    `;
    const result = await client.query(query, [templateId]);
    return result.rows;
  }
  
  static async findByCategory(categoryId, client = db.pool) {
    const query = `
      SELECT *
      FROM budget_template_lines
      WHERE category_id = $1
      ORDER BY sort_order, created_at
    `;
    const result = await client.query(query, [categoryId]);
    return result.rows;
  }
  
  static async delete(id, client = db.pool) {
    const query = `
      DELETE FROM budget_template_lines
      WHERE id = $1
    `;
    await client.query(query, [id]);
  }
  
  static async deleteByTemplate(templateId, client = db.pool) {
    const query = `
      DELETE FROM budget_template_lines
      WHERE template_id = $1
    `;
    await client.query(query, [templateId]);
  }
}

module.exports = BudgetTemplateLineRepository;