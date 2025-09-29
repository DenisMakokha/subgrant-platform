const db = require('../config/database');

class PartnerBudgetSSOTRepository {
  static async create(budget, client = db.pool) {
    const query = `
      INSERT INTO partner_budgets_ssot (
        id,
        project_id,
        partner_id,
        template_id,
        currency,
        ceiling_total,
        status,
        rules_json,
        created_by,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    
    const values = [
      budget.id,
      budget.projectId,
      budget.partnerId,
      budget.templateId || null,
      budget.currency,
      budget.ceilingTotal,
      budget.status || 'DRAFT',
      budget.rulesJson || {},
      budget.createdBy,
      budget.createdAt || new Date(),
      budget.updatedAt || new Date()
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
    if (updates.partnerId !== undefined) {
      fields.push(`partner_id = $${index++}`);
      values.push(updates.partnerId);
    }
    if (updates.templateId !== undefined) {
      fields.push(`template_id = $${index++}`);
      values.push(updates.templateId);
    }
    if (updates.currency !== undefined) {
      fields.push(`currency = $${index++}`);
      values.push(updates.currency);
    }
    if (updates.ceilingTotal !== undefined) {
      fields.push(`ceiling_total = $${index++}`);
      values.push(updates.ceilingTotal);
    }
    if (updates.status !== undefined) {
      fields.push(`status = $${index++}`);
      values.push(updates.status);
    }
    if (updates.rulesJson !== undefined) {
      fields.push(`rules_json = $${index++}`);
      values.push(updates.rulesJson);
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
      UPDATE partner_budgets_ssot
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
      FROM partner_budgets_ssot
      WHERE id = $1
    `;
    const result = await client.query(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  }
  
  static async findByProjectAndPartner(projectId, partnerId, client = db.pool) {
    const query = `
      SELECT *
      FROM partner_budgets_ssot
      WHERE project_id = $1 AND partner_id = $2
      ORDER BY created_at DESC
    `;
    const result = await client.query(query, [projectId, partnerId]);
    return result.rows;
  }
  
  static async findByProject(projectId, client = db.pool) {
    const query = `
      SELECT *
      FROM partner_budgets_ssot
      WHERE project_id = $1
      ORDER BY partner_id, created_at DESC
    `;
    const result = await client.query(query, [projectId]);
    return result.rows;
  }
  
  static async findByPartner(partnerId, client = db.pool) {
    const query = `
      SELECT *
      FROM partner_budgets_ssot
      WHERE partner_id = $1
      ORDER BY project_id, created_at DESC
    `;
    const result = await client.query(query, [partnerId]);
    return result.rows;
  }
  
  static async findByStatus(status, client = db.pool) {
    const query = `
      SELECT *
      FROM partner_budgets_ssot
      WHERE status = $1
      ORDER BY updated_at DESC
    `;
    const result = await client.query(query, [status]);
    return result.rows;
  }
  
  static async delete(id, client = db.pool) {
    const query = `
      DELETE FROM partner_budgets_ssot
      WHERE id = $1
    `;
    await client.query(query, [id]);
  }
}

module.exports = PartnerBudgetSSOTRepository;