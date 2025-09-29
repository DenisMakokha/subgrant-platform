const db = require('../config/database');

class Budget {
  constructor(data) {
    this.id = data.id;
    this.organization_id = data.organization_id;
    this.project_id = data.project_id;
    this.title = data.title;
    this.description = data.description;
    this.total_amount = data.total_amount;
    this.currency = data.currency;
    this.status = data.status;
    this.submitted_at = data.submitted_at;
    this.approved_at = data.approved_at;
    this.approved_by = data.approved_by;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.created_by = data.created_by;
    this.updated_by = data.updated_by;
  }

  // Create a new budget
  static async create(budgetData) {
    const query = `
      INSERT INTO budgets (organization_id, project_id, title, description, total_amount, currency, status, created_by, updated_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const values = [
      budgetData.organization_id,
      budgetData.project_id,
      budgetData.title,
      budgetData.description || '',
      budgetData.total_amount,
      budgetData.currency || 'USD',
      budgetData.status || 'draft',
      budgetData.created_by,
      budgetData.updated_by || budgetData.created_by
    ];
    
    const result = await db.pool.query(query, values);
    return new Budget(result.rows[0]);
  }

  // Find all budgets
  static async findAll() {
    const query = 'SELECT * FROM budgets ORDER BY created_at DESC';
    const result = await db.pool.query(query);
    return result.rows.map(row => new Budget(row));
  }

  // Find budget by ID
  static async findById(id) {
    const query = 'SELECT * FROM budgets WHERE id = $1';
    const result = await db.pool.query(query, [id]);
    return result.rows.length ? new Budget(result.rows[0]) : null;
  }

  // Find budgets by organization ID
  static async findByOrganizationId(organizationId) {
    const query = 'SELECT * FROM budgets WHERE organization_id = $1 ORDER BY created_at DESC';
    const result = await db.pool.query(query, [organizationId]);
    return result.rows.map(row => new Budget(row));
  }

  // Find budgets by project ID
  static async findByProjectId(projectId) {
    const query = 'SELECT * FROM budgets WHERE project_id = $1 ORDER BY created_at DESC';
    const result = await db.pool.query(query, [projectId]);
    return result.rows.map(row => new Budget(row));
  }

  // Find budgets by status
  static async findByStatus(status) {
    const query = 'SELECT * FROM budgets WHERE status = $1 ORDER BY created_at DESC';
    const result = await db.pool.query(query, [status]);
    return result.rows.map(row => new Budget(row));
  }

  // Update budget
  static async update(id, budgetData) {
    const query = `
      UPDATE budgets
      SET title = $1, description = $2, total_amount = $3, currency = $4, status = $5, 
          submitted_at = $6, approved_at = $7, approved_by = $8, updated_by = $9, updated_at = NOW()
      WHERE id = $10
      RETURNING *
    `;
    
    const values = [
      budgetData.title,
      budgetData.description,
      budgetData.total_amount,
      budgetData.currency,
      budgetData.status,
      budgetData.submitted_at || null,
      budgetData.approved_at || null,
      budgetData.approved_by || null,
      budgetData.updated_by,
      id
    ];
    
    const result = await db.pool.query(query, values);
    return result.rows.length ? new Budget(result.rows[0]) : null;
  }

  // Delete budget
  static async delete(id) {
    const query = 'DELETE FROM budgets WHERE id = $1 RETURNING *';
    const result = await db.pool.query(query, [id]);
    return result.rows.length ? new Budget(result.rows[0]) : null;
  }

  // Submit budget (change status to submitted)
  static async submit(id, userId) {
    const query = `
      UPDATE budgets
      SET status = 'submitted', submitted_at = NOW(), updated_by = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await db.pool.query(query, [id, userId]);
    return result.rows.length ? new Budget(result.rows[0]) : null;
  }

  // Request revisions for budget (change status to revise_requested)
  static async requestRevisions(id, userId) {
    const query = `
      UPDATE budgets
      SET status = 'revise_requested', updated_by = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await db.pool.query(query, [id, userId]);
    return result.rows.length ? new Budget(result.rows[0]) : null;
  }

  // Approve budget (change status to approved)
  static async approve(id, userId) {
    const query = `
      UPDATE budgets
      SET status = 'approved', approved_at = NOW(), approved_by = $2, updated_by = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await db.pool.query(query, [id, userId]);
    return result.rows.length ? new Budget(result.rows[0]) : null;
  }

  // Get budget lines for a budget
  static async getBudgetLines(budgetId) {
    const query = 'SELECT * FROM budget_lines WHERE budget_id = $1 ORDER BY created_at ASC';
    const result = await db.pool.query(query, [budgetId]);
    return result.rows;
  }

  // KPI Methods
  static async countAll() {
    const query = 'SELECT COUNT(*) as count FROM budgets';
    const result = await db.pool.query(query);
    return parseInt(result.rows[0].count);
  }

  static async countApproved() {
    const query = 'SELECT COUNT(*) as count FROM budgets WHERE status = $1';
    const result = await db.pool.query(query, ['approved']);
    return parseInt(result.rows[0].count);
  }

  static async countByOrganization(organizationId) {
    const query = 'SELECT COUNT(*) as count FROM budgets WHERE organization_id = $1';
    const result = await db.pool.query(query, [organizationId]);
    return parseInt(result.rows[0].count);
  }

  static async countApprovedByOrganization(organizationId) {
    const query = 'SELECT COUNT(*) as count FROM budgets WHERE organization_id = $1 AND status = $2';
    const result = await db.pool.query(query, [organizationId, 'approved']);
    return parseInt(result.rows[0].count);
  }

  static async countByProject(projectId) {
    const query = 'SELECT COUNT(*) as count FROM budgets WHERE project_id = $1';
    const result = await db.pool.query(query, [projectId]);
    return parseInt(result.rows[0].count);
  }

  static async countApprovedByProject(projectId) {
    const query = 'SELECT COUNT(*) as count FROM budgets WHERE project_id = $1 AND status = $2';
    const result = await db.pool.query(query, [projectId, 'approved']);
    return parseInt(result.rows[0].count);
  }

  static async getTotalAmount() {
    const query = 'SELECT COALESCE(SUM(total_amount), 0) as total FROM budgets WHERE status = $1';
    const result = await db.pool.query(query, ['approved']);
    return parseFloat(result.rows[0].total);
  }

  static async getTotalAmountByOrganization(organizationId) {
    const query = 'SELECT COALESCE(SUM(total_amount), 0) as total FROM budgets WHERE organization_id = $1 AND status = $2';
    const result = await db.pool.query(query, [organizationId, 'approved']);
    return parseFloat(result.rows[0].total);
  }

  static async getTotalAmountByProject(projectId) {
    const query = 'SELECT COALESCE(SUM(total_amount), 0) as total FROM budgets WHERE project_id = $1 AND status = $2';
    const result = await db.pool.query(query, [projectId, 'approved']);
    return parseFloat(result.rows[0].total);
  }
}

module.exports = Budget;