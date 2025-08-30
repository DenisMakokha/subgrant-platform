const db = require('../config/database');

class Disbursement {
  constructor(data) {
    this.id = data.id;
    this.budget_id = data.budget_id;
    this.title = data.title;
    this.description = data.description;
    this.tranche_number = data.tranche_number;
    this.amount = data.amount;
    this.currency = data.currency;
    this.planned_date = data.planned_date;
    this.status = data.status;
    this.invoice_id = data.invoice_id;
    this.bill_id = data.bill_id;
    this.paid_at = data.paid_at;
    this.reconciled_at = data.reconciled_at;
    this.reconciled_by = data.reconciled_by;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.created_by = data.created_by;
    this.updated_by = data.updated_by;
  }

  static async create(disbursementData) {
    const query = `
      INSERT INTO disbursements (
        budget_id, title, description, tranche_number, amount, currency, 
        planned_date, status, invoice_id, bill_id, paid_at, reconciled_at, 
        reconciled_by, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *;
    `;
    
    const values = [
      disbursementData.budget_id,
      disbursementData.title,
      disbursementData.description,
      disbursementData.tranche_number,
      disbursementData.amount,
      disbursementData.currency || 'USD',
      disbursementData.planned_date,
      disbursementData.status || 'planned',
      disbursementData.invoice_id,
      disbursementData.bill_id,
      disbursementData.paid_at,
      disbursementData.reconciled_at,
      disbursementData.reconciled_by,
      disbursementData.created_by,
      disbursementData.updated_by
    ];
    
    const result = await db.pool.query(query, values);
    return new Disbursement(result.rows[0]);
  }

  static async findById(id) {
    const query = 'SELECT * FROM disbursements WHERE id = $1;';
    const result = await db.pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new Disbursement(result.rows[0]);
  }

  static async findByBudgetId(budgetId) {
    const query = 'SELECT * FROM disbursements WHERE budget_id = $1 ORDER BY tranche_number ASC;';
    const result = await db.pool.query(query, [budgetId]);
    
    return result.rows.map(row => new Disbursement(row));
  }

  static async findAll(filters = {}) {
    let query = 'SELECT * FROM disbursements';
    const values = [];
    const conditions = [];
    
    if (filters.status) {
      values.push(filters.status);
      conditions.push(`status = $${values.length}`);
    }
    
    if (filters.budget_id) {
      values.push(filters.budget_id);
      conditions.push(`budget_id = $${values.length}`);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY planned_date DESC;';
    
    const result = await db.pool.query(query, values);
    return result.rows.map(row => new Disbursement(row));
  }

  async update(updateData) {
    const fields = [];
    const values = [];
    
    for (const [key, value] of Object.entries(updateData)) {
      if (key !== 'id' && key !== 'created_at') {
        fields.push(`${key} = $${fields.length + 1}`);
        values.push(value);
      }
    }
    
    if (fields.length === 0) {
      return this;
    }
    
    values.push(this.id);
    const query = `
      UPDATE disbursements 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${values.length}
      RETURNING *;
    `;
    
    const result = await db.pool.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('Disbursement not found');
    }
    
    Object.assign(this, result.rows[0]);
    return this;
  }

  async delete() {
    const query = 'DELETE FROM disbursements WHERE id = $1 RETURNING *;';
    const result = await db.pool.query(query, [this.id]);
    
    if (result.rows.length === 0) {
      throw new Error('Disbursement not found');
    }
    
    return new Disbursement(result.rows[0]);
  }

  static async deleteById(id) {
    const query = 'DELETE FROM disbursements WHERE id = $1 RETURNING *;';
    const result = await db.pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new Disbursement(result.rows[0]);
  }

  // Get organization for a disbursement
  static async getOrganizationForDisbursement(id) {
    const query = `
      SELECT o.*
      FROM disbursements d
      JOIN budgets b ON d.budget_id = b.id
      JOIN projects p ON b.project_id = p.id
      JOIN organizations o ON p.organization_id = o.id
      WHERE d.id = $1;
    `;
    const result = await db.pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  }
}

module.exports = Disbursement;