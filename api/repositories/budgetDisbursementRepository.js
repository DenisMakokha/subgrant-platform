const db = require('../config/database');

class BudgetDisbursementRepository {
  static async create(disbursement, client = db.pool) {
    const query = `
      INSERT INTO budget_disbursements (
        id,
        budget_id,
        amount,
        currency,
        disbursement_date,
        reference,
        status,
        created_by,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    
    const values = [
      disbursement.id,
      disbursement.budgetId,
      disbursement.amount,
      disbursement.currency,
      disbursement.disbursementDate,
      disbursement.reference || null,
      disbursement.status || 'SCHEDULED',
      disbursement.createdBy,
      disbursement.createdAt || new Date(),
      disbursement.updatedAt || new Date()
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
    if (updates.amount !== undefined) {
      fields.push(`amount = $${index++}`);
      values.push(updates.amount);
    }
    if (updates.currency !== undefined) {
      fields.push(`currency = $${index++}`);
      values.push(updates.currency);
    }
    if (updates.disbursementDate !== undefined) {
      fields.push(`disbursement_date = $${index++}`);
      values.push(updates.disbursementDate);
    }
    if (updates.reference !== undefined) {
      fields.push(`reference = $${index++}`);
      values.push(updates.reference);
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
      UPDATE budget_disbursements
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
      FROM budget_disbursements
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
      FROM budget_disbursements
      WHERE budget_id = $1
      ORDER BY disbursement_date DESC, created_at DESC
    `;
    const result = await client.query(query, [budgetId]);
    return result.rows;
  }
  
  static async findByStatus(status, client = db.pool) {
    const query = `
      SELECT *
      FROM budget_disbursements
      WHERE status = $1
      ORDER BY disbursement_date, created_at DESC
    `;
    const result = await client.query(query, [status]);
    return result.rows;
  }
  
  static async findByDateRange(startDate, endDate, client = db.pool) {
    const query = `
      SELECT *
      FROM budget_disbursements
      WHERE disbursement_date >= $1 AND disbursement_date <= $2
      ORDER BY disbursement_date, created_at DESC
    `;
    const result = await client.query(query, [startDate, endDate]);
    return result.rows;
  }
  
  static async delete(id, client = db.pool) {
    const query = `
      DELETE FROM budget_disbursements
      WHERE id = $1
    `;
    await client.query(query, [id]);
  }
}

module.exports = BudgetDisbursementRepository;