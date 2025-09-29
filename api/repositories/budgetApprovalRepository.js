const db = require('../config/database');

class BudgetApprovalRepository {
  static async create(approval, client = db.pool) {
    const query = `
      INSERT INTO budget_approvals (
        id,
        budget_id,
        approver_id,
        status,
        comments,
        approved_at,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [
      approval.id,
      approval.budgetId,
      approval.approverId,
      approval.status || 'PENDING',
      approval.comments || null,
      approval.approvedAt || null,
      approval.createdAt || new Date()
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
    if (updates.approverId !== undefined) {
      fields.push(`approver_id = $${index++}`);
      values.push(updates.approverId);
    }
    if (updates.status !== undefined) {
      fields.push(`status = $${index++}`);
      values.push(updates.status);
    }
    if (updates.comments !== undefined) {
      fields.push(`comments = $${index++}`);
      values.push(updates.comments);
    }
    if (updates.approvedAt !== undefined) {
      fields.push(`approved_at = $${index++}`);
      values.push(updates.approvedAt);
    }
    
    if (fields.length === 0) {
      return this.findById(id, client);
    }
    
    values.push(id);
    
    const query = `
      UPDATE budget_approvals
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
      FROM budget_approvals
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
      FROM budget_approvals
      WHERE budget_id = $1
      ORDER BY created_at
    `;
    const result = await client.query(query, [budgetId]);
    return result.rows;
  }
  
  static async findByApprover(approverId, client = db.pool) {
    const query = `
      SELECT *
      FROM budget_approvals
      WHERE approver_id = $1
      ORDER BY created_at DESC
    `;
    const result = await client.query(query, [approverId]);
    return result.rows;
  }
  
  static async findByBudgetAndApprover(budgetId, approverId, client = db.pool) {
    const query = `
      SELECT *
      FROM budget_approvals
      WHERE budget_id = $1 AND approver_id = $2
    `;
    const result = await client.query(query, [budgetId, approverId]);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  }
  
  static async findByStatus(status, client = db.pool) {
    const query = `
      SELECT *
      FROM budget_approvals
      WHERE status = $1
      ORDER BY created_at DESC
    `;
    const result = await client.query(query, [status]);
    return result.rows;
  }
  
  static async delete(id, client = db.pool) {
    const query = `
      DELETE FROM budget_approvals
      WHERE id = $1
    `;
    await client.query(query, [id]);
  }
}

module.exports = BudgetApprovalRepository;