const db = require('../config/database');

class ForumTag {
  static async create(tagData) {
    const {
      name,
      slug,
      description,
      color,
      created_by
    } = tagData;

    const query = `
      INSERT INTO forum_tags (
        name, slug, description, color, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      name,
      slug,
      description,
      color || '#6B7280',
      created_by
    ];

    try {
      const result = await db.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error creating forum tag: ${error.message}`);
    }
  }

  static async findById(id) {
    const query = `
      SELECT ft.*, u.name as created_by_name
      FROM forum_tags ft
      LEFT JOIN users u ON ft.created_by = u.id
      WHERE ft.id = $1 AND ft.deleted_at IS NULL
    `;

    try {
      const result = await db.pool.query(query, [id]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw new Error(`Error finding forum tag: ${error.message}`);
    }
  }

  static async findBySlug(slug) {
    const query = `
      SELECT ft.*, u.name as created_by_name
      FROM forum_tags ft
      LEFT JOIN users u ON ft.created_by = u.id
      WHERE ft.slug = $1 AND ft.deleted_at IS NULL
    `;

    try {
      const result = await db.pool.query(query, [slug]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw new Error(`Error finding forum tag by slug: ${error.message}`);
    }
  }

  static async findAll(filters = {}) {
    let query = `
      SELECT ft.*, u.name as created_by_name,
             COUNT(ftt.topic_id) as usage_count
      FROM forum_tags ft
      LEFT JOIN users u ON ft.created_by = u.id
      LEFT JOIN forum_topic_tags ftt ON ft.id = ftt.tag_id
      LEFT JOIN forum_topics topic ON ftt.topic_id = topic.id AND topic.deleted_at IS NULL
      WHERE ft.deleted_at IS NULL
    `;

    const values = [];
    let paramCount = 0;

    if (filters.search) {
      paramCount++;
      query += ` AND (ft.name ILIKE $${paramCount} OR ft.description ILIKE $${paramCount})`;
      values.push(`%${filters.search}%`);
    }

    query += `
      GROUP BY ft.id, u.name
      ORDER BY usage_count DESC, ft.name ASC
    `;

    if (filters.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      values.push(filters.limit);
    }

    try {
      const result = await db.pool.query(query, values);
      return result.rows.map(tag => ({
        ...tag,
        usage_count: parseInt(tag.usage_count)
      }));
    } catch (error) {
      throw new Error(`Error finding forum tags: ${error.message}`);
    }
  }

  static async update(id, updateData) {
    const {
      name,
      slug,
      description,
      color
    } = updateData;

    const query = `
      UPDATE forum_tags 
      SET name = $2, slug = $3, description = $4, color = $5, updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `;

    const values = [id, name, slug, description, color];

    try {
      const result = await db.pool.query(query, values);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw new Error(`Error updating forum tag: ${error.message}`);
    }
  }

  static async delete(id) {
    const query = `
      UPDATE forum_tags 
      SET deleted_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id
    `;

    try {
      const result = await db.pool.query(query, [id]);
      return result.rows.length > 0;
    } catch (error) {
      throw new Error(`Error deleting forum tag: ${error.message}`);
    }
  }

  static async getPopularTags(limit = 20) {
    const query = `
      SELECT ft.*, COUNT(ftt.topic_id) as usage_count
      FROM forum_tags ft
      LEFT JOIN forum_topic_tags ftt ON ft.id = ftt.tag_id
      LEFT JOIN forum_topics topic ON ftt.topic_id = topic.id AND topic.deleted_at IS NULL
      WHERE ft.deleted_at IS NULL
      GROUP BY ft.id
      HAVING COUNT(ftt.topic_id) > 0
      ORDER BY usage_count DESC, ft.name ASC
      LIMIT $1
    `;

    try {
      const result = await db.pool.query(query, [limit]);
      return result.rows.map(tag => ({
        ...tag,
        usage_count: parseInt(tag.usage_count)
      }));
    } catch (error) {
      throw new Error(`Error getting popular tags: ${error.message}`);
    }
  }

  static async searchTags(searchTerm, limit = 10) {
    const query = `
      SELECT ft.*, COUNT(ftt.topic_id) as usage_count
      FROM forum_tags ft
      LEFT JOIN forum_topic_tags ftt ON ft.id = ftt.tag_id
      LEFT JOIN forum_topics topic ON ftt.topic_id = topic.id AND topic.deleted_at IS NULL
      WHERE ft.deleted_at IS NULL 
        AND (ft.name ILIKE $1 OR ft.description ILIKE $1)
      GROUP BY ft.id
      ORDER BY usage_count DESC, ft.name ASC
      LIMIT $2
    `;

    try {
      const result = await db.pool.query(query, [`%${searchTerm}%`, limit]);
      return result.rows.map(tag => ({
        ...tag,
        usage_count: parseInt(tag.usage_count)
      }));
    } catch (error) {
      throw new Error(`Error searching tags: ${error.message}`);
    }
  }
}

module.exports = ForumTag;
