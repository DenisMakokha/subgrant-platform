const db = require('../config/database');

class PartnerBudgetLineSSOTRepository {
  static async create(line, client = db.pool) {
    const query = `
      INSERT INTO partner_budget_lines_ssot (
        id,
        budget_id,
        template_line_id,
        category_id,
        description,
        unit,
        qty,
        unit_cost,
        currency,
        period_from,
        period_to,
        notes,
        status,
        created_by,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;
    
    const values = [
      line.id,
      line.budgetId,
      line.templateLineId || null,
      line.categoryId || null,
      line.description,
      line.unit,
      line.qty,
      line.unitCost,
      line.currency,
      line.periodFrom || null,
      line.periodTo || null,
      line.notes || null,
      line.status || 'DRAFT',
      line.createdBy,
      line.createdAt || new Date()
    ];
    
    const result = await client.query(query, values);
    return result.rows[0];
  }
  
  static async update(id, updates, client = db.pool) {
    const fields = [];
    const values = [];
    let index = 1;
    
    if (updates.budgetId !== undefined) {
      fields.push(`budget_id = $${index++}`);
      values.push(updates.budgetId);
    }
    if (updates.templateLineId !== undefined) {
      fields.push(`template_line_id = $${index++}`);
      values.push(updates.templateLineId);
    }
    if (updates.categoryId !== undefined) {
      fields.push(`category_id = $${index++}`);
      values.push(updates.categoryId);
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${index++}`);
      values.push(updates.description);
    }
    if (updates.unit !== undefined) {
      fields.push(`unit = $${index++}`);
      values.push(updates.unit);
    }
    if (updates.qty !== undefined) {
      fields.push(`qty = $${index++}`);
      values.push(updates.qty);
    }
    if (updates.unitCost !== undefined) {
      fields.push(`unit_cost = $${index++}`);
      values.push(updates.unitCost);
    }
    if (updates.currency !== undefined) {
      fields.push(`currency = $${index++}`);
      values.push(updates.currency);
    }
    if (updates.periodFrom !== undefined) {
      fields.push(`period_from = $${index++}`);
      values.push(updates.periodFrom);
    }
    if (updates.periodTo !== undefined) {
      fields.push(`period_to = $${index++}`);
      values.push(updates.periodTo);
    }
    if (updates.notes !== undefined) {
      fields.push(`notes = $${index++}`);
      values.push(updates.notes);
    }
    if (updates.status !== undefined) {
      fields.push(`status = $${index++}`);
      values.push(updates.status);
    }
    
    if (fields.length === 0) {
      return this.findById(id, client);
    }
    
    values.push(id);
    
    const query = `
      UPDATE partner_budget_lines_ssot
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
      FROM partner_budget_lines_ssot
      WHERE id = $1
    `;
    const result = await client.query(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  }
  
  static async findByBudget(budgetId, client = db.pool) {
    const query = `
      SELECT *
      FROM partner_budget_lines_ssot
      WHERE budget_id = $1
      ORDER BY created_at
    `;
    const result = await client.query(query, [budgetId]);
    return result.rows;
  }
  
  static async findByTemplateLine(templateLineId, client = db.pool) {
    const query = `
      SELECT *
      FROM partner_budget_lines_ssot
      WHERE template_line_id = $1
      ORDER BY created_at
    `;
    const result = await client.query(query, [templateLineId]);
    return result.rows;
  }
  
  static async findByCategory(categoryId, client = db.pool) {
    const query = `
      SELECT *
      FROM partner_budget_lines_ssot
      WHERE category_id = $1
      ORDER BY created_at
    `;
    const result = await client.query(query, [categoryId]);
    return result.rows;
  }
  
  static async findByStatus(status, client = db.pool) {
    const query = `
      SELECT *
      FROM partner_budget_lines_ssot
      WHERE status = $1
      ORDER BY created_at
    `;
    const result = await client.query(query, [status]);
    return result.rows;
  }
  
  static async delete(id, client = db.pool) {
    const query = `
      DELETE FROM partner_budget_lines_ssot
      WHERE id = $1
    `;
    await client.query(query, [id]);
  }
  
  static async deleteByBudget(budgetId, client = db.pool) {
    const query = `
      DELETE FROM partner_budget_lines_ssot
      WHERE budget_id = $1
    `;
    await client.query(query, [budgetId]);
  }
}

module.exports = PartnerBudgetLineSSOTRepository;