const db = require('../config/database');

class ForumCategory {
  static async create(categoryData) {
    const {
      parent_id,
      name,
      slug,
      visibility,
      description,
      order_index,
      acl_json,
      created_by
    } = categoryData;

    const query = `
      INSERT INTO forum_categories (
        parent_id, name, slug, visibility, description, order_index, acl_json, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      parent_id,
      name,
      slug,
      visibility || 'public',
      description,
      order_index || 0,
      JSON.stringify(acl_json || {}),
      created_by
    ];

    try {
      const result = await db.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error creating forum category: ${error.message}`);
    }
  }

  static async findById(id) {
    const query = `
      SELECT fc.*, u.name as created_by_name
      FROM forum_categories fc
      LEFT JOIN users u ON fc.created_by = u.id
      WHERE fc.id = $1 AND fc.deleted_at IS NULL
    `;

    try {
      const result = await db.pool.query(query, [id]);
      if (result.rows.length > 0) {
        const category = result.rows[0];
        category.acl_json = JSON.parse(category.acl_json || '{}');
        return category;
      }
      return null;
    } catch (error) {
      throw new Error(`Error finding forum category: ${error.message}`);
    }
  }

  static async findAll(filters = {}) {
    let query = `
      SELECT fc.*, u.name as created_by_name,
             COUNT(ft.id) as topic_count
      FROM forum_categories fc
      LEFT JOIN users u ON fc.created_by = u.id
      LEFT JOIN forum_topics ft ON fc.id = ft.category_id AND ft.deleted_at IS NULL
      WHERE fc.deleted_at IS NULL
    `;

    const values = [];
    let paramCount = 0;

    if (filters.visibility) {
      paramCount++;
      query += ` AND fc.visibility = $${paramCount}`;
      values.push(filters.visibility);
    }

    if (filters.parent_id !== undefined) {
      paramCount++;
      if (filters.parent_id === null) {
        query += ` AND fc.parent_id IS NULL`;
      } else {
        query += ` AND fc.parent_id = $${paramCount}`;
        values.push(filters.parent_id);
      }
    }

    query += `
      GROUP BY fc.id, u.name
      ORDER BY fc.order_index ASC, fc.created_at ASC
    `;

    try {
      const result = await db.pool.query(query, values);
      return result.rows.map(category => ({
        ...category,
        acl_json: JSON.parse(category.acl_json || '{}'),
        topic_count: parseInt(category.topic_count)
      }));
    } catch (error) {
      throw new Error(`Error finding forum categories: ${error.message}`);
    }
  }

  static async update(id, updateData) {
    const {
      parent_id,
      name,
      slug,
      visibility,
      description,
      order_index,
      acl_json
    } = updateData;

    const query = `
      UPDATE forum_categories 
      SET parent_id = $2, name = $3, slug = $4, visibility = $5, 
          description = $6, order_index = $7, acl_json = $8, updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `;

    const values = [
      id,
      parent_id,
      name,
      slug,
      visibility,
      description,
      order_index,
      JSON.stringify(acl_json || {})
    ];

    try {
      const result = await db.pool.query(query, values);
      if (result.rows.length > 0) {
        const category = result.rows[0];
        category.acl_json = JSON.parse(category.acl_json || '{}');
        return category;
      }
      return null;
    } catch (error) {
      throw new Error(`Error updating forum category: ${error.message}`);
    }
  }

  static async delete(id) {
    const query = `
      UPDATE forum_categories 
      SET deleted_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id
    `;

    try {
      const result = await db.pool.query(query, [id]);
      return result.rows.length > 0;
    } catch (error) {
      throw new Error(`Error deleting forum category: ${error.message}`);
    }
  }

  static async getHierarchy() {
    const query = `
      WITH RECURSIVE category_tree AS (
        SELECT id, parent_id, name, slug, visibility, description, order_index, 0 as level
        FROM forum_categories
        WHERE parent_id IS NULL AND deleted_at IS NULL
        
        UNION ALL
        
        SELECT fc.id, fc.parent_id, fc.name, fc.slug, fc.visibility, fc.description, fc.order_index, ct.level + 1
        FROM forum_categories fc
        INNER JOIN category_tree ct ON fc.parent_id = ct.id
        WHERE fc.deleted_at IS NULL
      )
      SELECT * FROM category_tree
      ORDER BY level, order_index, name
    `;

    try {
      const result = await db.pool.query(query);
      return result.rows;
    } catch (error) {
      throw new Error(`Error getting category hierarchy: ${error.message}`);
    }
  }

  static async checkUserAccess(categoryId, userId, action = 'view') {
    const category = await this.findById(categoryId);
    if (!category) return false;

    // Public categories are viewable by all
    if (category.visibility === 'public' && action === 'view') {
      return true;
    }

    // Check ACL permissions
    const acl = category.acl_json || {};
    const userPermissions = acl[userId] || [];
    const rolePermissions = acl.roles || {};

    // Get user roles (this would need to be implemented based on your user system)
    // For now, assume basic role checking
    return userPermissions.includes(action) || 
           (rolePermissions.all && rolePermissions.all.includes(action));
  }
}

module.exports = ForumCategory;
