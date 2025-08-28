const db = require('../config/database');

class Project {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.open_date = data.open_date;
    this.close_date = data.close_date;
    this.currency = data.currency;
    this.status = data.status;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.created_by = data.created_by;
    this.updated_by = data.updated_by;
  }

  // Create a new project
  static async create(projectData) {
    const query = `
      INSERT INTO projects (name, description, open_date, close_date, currency, status, created_by, updated_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const values = [
      projectData.name,
      projectData.description,
      projectData.open_date,
      projectData.close_date,
      projectData.currency || 'USD',
      projectData.status || 'draft',
      projectData.created_by,
      projectData.updated_by || projectData.created_by
    ];
    
    const result = await db.query(query, values);
    return new Project(result.rows[0]);
  }

  // Find all projects
  static async findAll() {
    const query = 'SELECT * FROM projects ORDER BY created_at DESC';
    const result = await db.query(query);
    return result.rows.map(row => new Project(row));
  }

  // Find project by ID
  static async findById(id) {
    const query = 'SELECT * FROM projects WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows.length ? new Project(result.rows[0]) : null;
  }

  // Find projects by status
  static async findByStatus(status) {
    const query = 'SELECT * FROM projects WHERE status = $1 ORDER BY created_at DESC';
    const result = await db.query(query, [status]);
    return result.rows.map(row => new Project(row));
  }

  // Archive a project
  static async archive(id) {
    const query = `
      UPDATE projects
      SET status = 'archived', updated_at = NOW()
      WHERE id = $1 AND status != 'archived'
      RETURNING *
    `;
    const result = await db.query(query, [id]);
    return result.rows.length ? new Project(result.rows[0]) : null;
  }

  // Close a project
  static async close(id) {
    const query = `
      UPDATE projects
      SET status = 'closed', updated_at = NOW()
      WHERE id = $1 AND status != 'closed' AND status != 'archived'
      RETURNING *
    `;
    const result = await db.query(query, [id]);
    return result.rows.length ? new Project(result.rows[0]) : null;
  }

  // Find archived projects
  static async findArchived() {
    const query = 'SELECT * FROM projects WHERE status = $1 ORDER BY updated_at DESC';
    const result = await db.query(query, ['archived']);
    return result.rows.map(row => new Project(row));
  }

  // Find closed projects
  static async findClosed() {
    const query = 'SELECT * FROM projects WHERE status = $1 ORDER BY updated_at DESC';
    const result = await db.query(query, ['closed']);
    return result.rows.map(row => new Project(row));
  }

  // Search projects by name or description
  static async search(searchTerm) {
    const query = `
      SELECT * FROM projects
      WHERE name ILIKE $1 OR description ILIKE $1
      ORDER BY created_at DESC
    `;
    const result = await db.query(query, [`%${searchTerm}%`]);
    return result.rows.map(row => new Project(row));
  }

  // Update project
  static async update(id, projectData) {
    const query = `
      UPDATE projects
      SET name = $1, description = $2, open_date = $3, close_date = $4, currency = $5, status = $6, updated_by = $7, updated_at = NOW()
      WHERE id = $8
      RETURNING *
    `;
    
    const values = [
      projectData.name,
      projectData.description,
      projectData.open_date,
      projectData.close_date,
      projectData.currency,
      projectData.status,
      projectData.updated_by,
      id
    ];
    
    const result = await db.query(query, values);
    return result.rows.length ? new Project(result.rows[0]) : null;
  }

  // Delete project
  static async delete(id) {
    const query = 'DELETE FROM projects WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    return result.rows.length ? new Project(result.rows[0]) : null;
  }

  // Get all budget categories for a project
  static async getBudgetCategories(projectId) {
    const query = 'SELECT * FROM budget_categories WHERE project_id = $1 ORDER BY created_at DESC';
    const result = await db.query(query, [projectId]);
    return result.rows;
  }
}

module.exports = Project;