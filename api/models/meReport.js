const db = require('../config/database');

class MeReport {
  constructor(data) {
    this.id = data.id;
    this.budget_id = data.budget_id;
    this.title = data.title;
    this.description = data.description;
    this.report_date = data.report_date;
    this.indicators = data.indicators;
    this.status = data.status;
    this.submitted_at = data.submitted_at;
    this.approved_at = data.approved_at;
    this.approved_by = data.approved_by;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.created_by = data.created_by;
    this.updated_by = data.updated_by;
  }

  static async create(meReportData) {
    const query = `
      INSERT INTO me_reports (
        budget_id, title, description, report_date, indicators, status, 
        submitted_at, approved_at, approved_by, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;
    `;
    
    const values = [
      meReportData.budget_id,
      meReportData.title,
      meReportData.description,
      meReportData.report_date,
      meReportData.indicators,
      meReportData.status || 'draft',
      meReportData.submitted_at,
      meReportData.approved_at,
      meReportData.approved_by,
      meReportData.created_by,
      meReportData.updated_by
    ];
    
    const result = await db.pool.query(query, values);
    return new MeReport(result.rows[0]);
  }

  static async findById(id) {
    const query = 'SELECT * FROM me_reports WHERE id = $1;';
    const result = await db.pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new MeReport(result.rows[0]);
  }

  static async findByBudgetId(budgetId, filters = {}) {
    let query = 'SELECT * FROM me_reports WHERE budget_id = $1';
    const values = [budgetId];
    
    // Add status filter if provided
    if (filters.status) {
      query += ' AND status = $2';
      values.push(filters.status);
    }
    
    query += ' ORDER BY report_date DESC;';
    
    const result = await db.pool.query(query, values);
    
    return result.rows.map(row => new MeReport(row));
  }

  static async findAll(filters = {}) {
    let query = 'SELECT * FROM me_reports';
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
    return result.rows.map(row => new MeReport(row));
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
      UPDATE me_reports 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${values.length}
      RETURNING *;
    `;
    
    const result = await db.pool.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('ME report not found');
    }
    
    Object.assign(this, result.rows[0]);
    return this;
  }

  async delete() {
    const query = 'DELETE FROM me_reports WHERE id = $1 RETURNING *;';
    const result = await db.pool.query(query, [this.id]);
    
    if (result.rows.length === 0) {
      throw new Error('ME report not found');
    }
    
    return new MeReport(result.rows[0]);
  }

  static async deleteById(id) {
    const query = 'DELETE FROM me_reports WHERE id = $1 RETURNING *;';
    const result = await db.pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new MeReport(result.rows[0]);
  }
}

  // Get overdue ME reports
  static async getOverdueReports() {
    const query = `
      SELECT *
      FROM me_reports
      WHERE status != 'approved'
        AND report_date < CURRENT_DATE
      ORDER BY report_date ASC
    `;
    
    const result = await db.pool.query(query);
    return result.rows.map(row => new MeReport(row));
  }
}

module.exports = MeReport;