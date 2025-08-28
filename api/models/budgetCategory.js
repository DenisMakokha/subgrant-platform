const db = require('../config/database');

class BudgetCategory {
  constructor(data) {
    this.id = data.id;
    this.project_id = data.project_id;
    this.name = data.name;
    this.description = data.description;
    this.cap_amount = data.cap_amount;
    this.cap_percentage = data.cap_percentage;
    this.is_active = data.is_active;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.created_by = data.created_by;
    this.updated_by = data.updated_by;
  }

  // Create a new budget category
  static async create(categoryData) {
    const query = `
      INSERT INTO budget_categories (project_id, name, description, cap_amount, cap_percentage, is_active, created_by, updated_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const values = [
      categoryData.project_id,
      categoryData.name,
      categoryData.description || '',
      categoryData.cap_amount || null,
      categoryData.cap_percentage || null,
      categoryData.is_active !== undefined ? categoryData.is_active : true,
      categoryData.created_by,
      categoryData.updated_by || categoryData.created_by
    ];
    
    const result = await db.query(query, values);
    return new BudgetCategory(result.rows[0]);
  }

  // Find all budget categories
  static async findAll() {
    const query = 'SELECT * FROM budget_categories ORDER BY created_at DESC';
    const result = await db.query(query);
    return result.rows.map(row => new BudgetCategory(row));
  }

  // Find budget category by ID
  static async findById(id) {
    const query = 'SELECT * FROM budget_categories WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows.length ? new BudgetCategory(result.rows[0]) : null;
  }

  // Find budget categories by project ID
  static async findByProjectId(projectId) {
    const query = 'SELECT * FROM budget_categories WHERE project_id = $1 ORDER BY created_at DESC';
    const result = await db.query(query, [projectId]);
    return result.rows.map(row => new BudgetCategory(row));
  }

  // Find active budget categories by project ID
  static async findActiveByProjectId(projectId) {
    const query = 'SELECT * FROM budget_categories WHERE project_id = $1 AND is_active = true ORDER BY created_at DESC';
    const result = await db.query(query, [projectId]);
    return result.rows.map(row => new BudgetCategory(row));
  }

  // Update budget category
  static async update(id, categoryData) {
    const query = `
      UPDATE budget_categories
      SET name = $1, description = $2, cap_amount = $3, cap_percentage = $4, is_active = $5, updated_by = $6, updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `;
    
    const values = [
      categoryData.name,
      categoryData.description,
      categoryData.cap_amount,
      categoryData.cap_percentage,
      categoryData.is_active,
      categoryData.updated_by,
      id
    ];
    
    const result = await db.query(query, values);
    return result.rows.length ? new BudgetCategory(result.rows[0]) : null;
  }

  // Delete budget category
  static async delete(id) {
    const query = 'DELETE FROM budget_categories WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    return result.rows.length ? new BudgetCategory(result.rows[0]) : null;
  }
}

module.exports = BudgetCategory;