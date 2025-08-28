const db = require('../config/database');

class Receipt {
  constructor(data) {
    this.id = data.id;
    this.financial_report_id = data.financial_report_id;
    this.budget_line_id = data.budget_line_id;
    this.amount = data.amount;
    this.currency = data.currency;
    this.description = data.description;
    this.document_uri = data.document_uri;
    this.document_name = data.document_name;
    this.mime_type = data.mime_type;
    this.checksum = data.checksum;
    this.created_at = data.created_at;
    this.created_by = data.created_by;
  }

  static async create(receiptData) {
    const query = `
      INSERT INTO receipts (
        financial_report_id, budget_line_id, amount, currency, description, 
        document_uri, document_name, mime_type, checksum, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;
    
    const values = [
      receiptData.financial_report_id,
      receiptData.budget_line_id,
      receiptData.amount,
      receiptData.currency || 'USD',
      receiptData.description,
      receiptData.document_uri,
      receiptData.document_name,
      receiptData.mime_type,
      receiptData.checksum,
      receiptData.created_by
    ];
    
    const result = await db.pool.query(query, values);
    return new Receipt(result.rows[0]);
  }

  static async findById(id) {
    const query = 'SELECT * FROM receipts WHERE id = $1;';
    const result = await db.pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new Receipt(result.rows[0]);
  }

  static async findByFinancialReportId(financialReportId) {
    const query = 'SELECT * FROM receipts WHERE financial_report_id = $1 ORDER BY created_at DESC;';
    const result = await db.pool.query(query, [financialReportId]);
    
    return result.rows.map(row => new Receipt(row));
  }

  static async findByBudgetLineId(budgetLineId) {
    const query = 'SELECT * FROM receipts WHERE budget_line_id = $1 ORDER BY created_at DESC;';
    const result = await db.pool.query(query, [budgetLineId]);
    
    return result.rows.map(row => new Receipt(row));
  }

  static async findAll(filters = {}) {
    let query = 'SELECT * FROM receipts';
    const values = [];
    const conditions = [];
    
    if (filters.financial_report_id) {
      values.push(filters.financial_report_id);
      conditions.push(`financial_report_id = $${values.length}`);
    }
    
    if (filters.budget_line_id) {
      values.push(filters.budget_line_id);
      conditions.push(`budget_line_id = $${values.length}`);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY created_at DESC;';
    
    const result = await db.pool.query(query, values);
    return result.rows.map(row => new Receipt(row));
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
      UPDATE receipts 
      SET ${fields.join(', ')}
      WHERE id = $${values.length}
      RETURNING *;
    `;
    
    const result = await db.pool.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('Receipt not found');
    }
    
    Object.assign(this, result.rows[0]);
    return this;
  }

  async delete() {
    const query = 'DELETE FROM receipts WHERE id = $1 RETURNING *;';
    const result = await db.pool.query(query, [this.id]);
    
    if (result.rows.length === 0) {
      throw new Error('Receipt not found');
    }
    
    return new Receipt(result.rows[0]);
  }

  static async deleteById(id) {
    const query = 'DELETE FROM receipts WHERE id = $1 RETURNING *;';
    const result = await db.pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new Receipt(result.rows[0]);
  }
}

module.exports = Receipt;