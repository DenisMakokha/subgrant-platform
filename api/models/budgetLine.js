const db = require('../config/database');

class BudgetLine {
  constructor(data) {
    this.id = data.id;
    this.budget_id = data.budget_id;
    this.category_id = data.category_id;
    this.description = data.description;
    this.unit = data.unit;
    this.quantity = data.quantity;
    this.unit_cost = data.unit_cost;
    this.total_cost = data.total_cost;
    this.notes = data.notes;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create a new budget line
  static async create(lineData) {
    const query = `
      INSERT INTO budget_lines (budget_id, category_id, description, unit, quantity, unit_cost, total_cost, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const values = [
      lineData.budget_id,
      lineData.category_id,
      lineData.description,
      lineData.unit || null,
      lineData.quantity || null,
      lineData.unit_cost || null,
      lineData.total_cost,
      lineData.notes || ''
    ];
    
    const result = await db.query(query, values);
    return new BudgetLine(result.rows[0]);
  }

  // Find all budget lines
  static async findAll() {
    const query = 'SELECT * FROM budget_lines ORDER BY created_at ASC';
    const result = await db.query(query);
    return result.rows.map(row => new BudgetLine(row));
  }

  // Find budget line by ID
  static async findById(id) {
    const query = 'SELECT * FROM budget_lines WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows.length ? new BudgetLine(result.rows[0]) : null;
  }

  // Find budget lines by budget ID
  static async findByBudgetId(budgetId) {
    const query = 'SELECT * FROM budget_lines WHERE budget_id = $1 ORDER BY created_at ASC';
    const result = await db.query(query, [budgetId]);
    return result.rows.map(row => new BudgetLine(row));
  }

  // Update budget line
  static async update(id, lineData) {
    const query = `
      UPDATE budget_lines
      SET description = $1, unit = $2, quantity = $3, unit_cost = $4, total_cost = $5, notes = $6, updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `;
    
    const values = [
      lineData.description,
      lineData.unit || null,
      lineData.quantity || null,
      lineData.unit_cost || null,
      lineData.total_cost,
      lineData.notes || '',
      id
    ];
    
    const result = await db.query(query, values);
    return result.rows.length ? new BudgetLine(result.rows[0]) : null;
  }

  // Delete budget line
  static async delete(id) {
    const query = 'DELETE FROM budget_lines WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    return result.rows.length ? new BudgetLine(result.rows[0]) : null;
  }

  // Delete all budget lines for a budget
  static async deleteByBudgetId(budgetId) {
    const query = 'DELETE FROM budget_lines WHERE budget_id = $1 RETURNING *';
    const result = await db.query(query, [budgetId]);
    return result.rows.map(row => new BudgetLine(row));
  }
}

module.exports = BudgetLine;