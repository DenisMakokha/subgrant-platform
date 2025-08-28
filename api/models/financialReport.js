const db = require('../config/database');

class FinancialReport {
  constructor(data) {
    this.id = data.id;
    this.budget_id = data.budget_id;
    this.title = data.title;
    this.description = data.description;
    this.report_date = data.report_date;
    this.total_spent = data.total_spent;
    this.variance = data.variance;
    this.status = data.status;
    this.submitted_at = data.submitted_at;
    this.approved_at = data.approved_at;
    this.approved_by = data.approved_by;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.created_by = data.created_by;
    this.updated_by = data.updated_by;
  }

  static async create(financialReportData) {
    const query = `
      INSERT INTO financial_reports (
        budget_id, title, description, report_date, total_spent, variance, status, 
        submitted_at, approved_at, approved_by, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;
    `;
    
    const values = [
      financialReportData.budget_id,
      financialReportData.title,
      financialReportData.description,
      financialReportData.report_date,
      financialReportData.total_spent || 0,
      financialReportData.variance || 0,
      financialReportData.status || 'draft',
      financialReportData.submitted_at,
      financialReportData.approved_at,
      financialReportData.approved_by,
      financialReportData.created_by,
      financialReportData.updated_by
    ];
    
    const result = await db.pool.query(query, values);
    return new FinancialReport(result.rows[0]);
  }

  static async findById(id) {
    const query = 'SELECT * FROM financial_reports WHERE id = $1;';
    const result = await db.pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new FinancialReport(result.rows[0]);
  }

  static async findByBudgetId(budgetId, filters = {}) {
    let query = 'SELECT * FROM financial_reports WHERE budget_id = $1';
    const values = [budgetId];
    
    // Add status filter if provided
    if (filters.status) {
      query += ' AND status = $2';
      values.push(filters.status);
    }
    
    query += ' ORDER BY report_date DESC;';
    
    const result = await db.pool.query(query, values);
    
    return result.rows.map(row => new FinancialReport(row));
  }

  static async findAll(filters = {}) {
    let query = 'SELECT * FROM financial_reports';
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
    
    query += ' ORDER BY report_date DESC;';
    
    const result = await db.pool.query(query, values);
    return result.rows.map(row => new FinancialReport(row));
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
      UPDATE financial_reports 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${values.length}
      RETURNING *;
    `;
    
    const result = await db.pool.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('Financial report not found');
    }
    
    Object.assign(this, result.rows[0]);
    return this;
  }

  async delete() {
    const query = 'DELETE FROM financial_reports WHERE id = $1 RETURNING *;';
    const result = await db.pool.query(query, [this.id]);
    
    if (result.rows.length === 0) {
      throw new Error('Financial report not found');
    }
    
    return new FinancialReport(result.rows[0]);
  }

  static async deleteById(id) {
    const query = 'DELETE FROM financial_reports WHERE id = $1 RETURNING *;';
    const result = await db.pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new FinancialReport(result.rows[0]);
  }
}

module.exports = FinancialReport;