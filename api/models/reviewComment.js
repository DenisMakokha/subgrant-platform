const db = require('../config/database');

class ReviewComment {
  constructor(data) {
    this.id = data.id;
    this.entity_type = data.entity_type;
    this.entity_id = data.entity_id;
    this.parent_id = data.parent_id;
    this.author_id = data.author_id;
    this.content = data.content;
    this.is_resolved = data.is_resolved;
    this.resolved_at = data.resolved_at;
    this.resolved_by = data.resolved_by;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create a new review comment
  static async create(commentData) {
    const query = `
      INSERT INTO review_comments (entity_type, entity_id, parent_id, author_id, content, is_resolved, resolved_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [
      commentData.entity_type,
      commentData.entity_id,
      commentData.parent_id || null,
      commentData.author_id,
      commentData.content,
      commentData.is_resolved || false,
      commentData.resolved_by || null
    ];
    
    const result = await db.query(query, values);
    return new ReviewComment(result.rows[0]);
  }

  // Find all review comments
  static async findAll() {
    const query = 'SELECT * FROM review_comments ORDER BY created_at DESC';
    const result = await db.query(query);
    return result.rows.map(row => new ReviewComment(row));
  }

  // Find review comment by ID
  static async findById(id) {
    const query = 'SELECT * FROM review_comments WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows.length ? new ReviewComment(result.rows[0]) : null;
  }

  // Find review comments by entity type and ID
  static async findByEntity(entityType, entityId) {
    const query = 'SELECT * FROM review_comments WHERE entity_type = $1 AND entity_id = $2 ORDER BY created_at DESC';
    const result = await db.query(query, [entityType, entityId]);
    return result.rows.map(row => new ReviewComment(row));
  }

  // Find review comments by author ID
  static async findByAuthorId(authorId) {
    const query = 'SELECT * FROM review_comments WHERE author_id = $1 ORDER BY created_at DESC';
    const result = await db.query(query, [authorId]);
    return result.rows.map(row => new ReviewComment(row));
  }

  // Update review comment
  static async update(id, commentData) {
    const query = `
      UPDATE review_comments
      SET content = $1, is_resolved = $2, resolved_at = $3, resolved_by = $4, updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `;
    
    const values = [
      commentData.content,
      commentData.is_resolved !== undefined ? commentData.is_resolved : null,
      commentData.resolved_at || null,
      commentData.resolved_by || null,
      id
    ];
    
    const result = await db.query(query, values);
    return result.rows.length ? new ReviewComment(result.rows[0]) : null;
  }

  // Delete review comment
  static async delete(id) {
    const query = 'DELETE FROM review_comments WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    return result.rows.length ? new ReviewComment(result.rows[0]) : null;
  }

  // Resolve review comment
  static async resolve(id, userId) {
    const query = `
      UPDATE review_comments
      SET is_resolved = true, resolved_at = NOW(), resolved_by = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await db.query(query, [id, userId]);
    return result.rows.length ? new ReviewComment(result.rows[0]) : null;
  }
}

module.exports = ReviewComment;