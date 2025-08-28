const db = require('../config/database');

class Contract {
  constructor(data) {
    this.id = data.id;
    this.budget_id = data.budget_id;
    this.template_id = data.template_id;
    this.title = data.title;
    this.description = data.description;
    this.envelope_id = data.envelope_id;
    this.status = data.status;
    this.sent_at = data.sent_at;
    this.completed_at = data.completed_at;
    this.filed_at = data.filed_at;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.created_by = data.created_by;
    this.updated_by = data.updated_by;
  }

  static async create(contractData) {
    const query = `
      INSERT INTO contracts (
        budget_id, template_id, title, description, envelope_id, status, 
        sent_at, completed_at, filed_at, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;
    `;
    
    const values = [
      contractData.budget_id,
      contractData.template_id,
      contractData.title,
      contractData.description,
      contractData.envelope_id,
      contractData.status || 'ready',
      contractData.sent_at,
      contractData.completed_at,
      contractData.filed_at,
      contractData.created_by,
      contractData.updated_by
    ];
    
    const result = await db.pool.query(query, values);
    return new Contract(result.rows[0]);
  }

  static async findById(id) {
    const query = 'SELECT * FROM contracts WHERE id = $1;';
    const result = await db.pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new Contract(result.rows[0]);
  }

  static async findByBudgetId(budgetId) {
    const query = 'SELECT * FROM contracts WHERE budget_id = $1 ORDER BY created_at DESC;';
    const result = await db.pool.query(query, [budgetId]);
    
    return result.rows.map(row => new Contract(row));
  }

  static async findByEnvelopeId(envelopeId) {
    const query = 'SELECT * FROM contracts WHERE envelope_id = $1;';
    const result = await db.pool.query(query, [envelopeId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new Contract(result.rows[0]);
  }

  static async findAll(filters = {}) {
    let query = 'SELECT * FROM contracts';
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
    
    query += ' ORDER BY created_at DESC;';
    
    const result = await db.pool.query(query, values);
    return result.rows.map(row => new Contract(row));
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
      UPDATE contracts 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${values.length}
      RETURNING *;
    `;
    
    const result = await db.pool.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('Contract not found');
    }
    
    Object.assign(this, result.rows[0]);
    return this;
  }

  async delete() {
    const query = 'DELETE FROM contracts WHERE id = $1 RETURNING *;';
    const result = await db.pool.query(query, [this.id]);
    
    if (result.rows.length === 0) {
      throw new Error('Contract not found');
    }
    
    return new Contract(result.rows[0]);
  }

  static async deleteById(id) {
    const query = 'DELETE FROM contracts WHERE id = $1 RETURNING *;';
    const result = await db.pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new Contract(result.rows[0]);
  }
}

module.exports = Contract;