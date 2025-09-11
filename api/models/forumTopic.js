const db = require('../config/database');

class ForumTopic {
  static async create(topicData) {
    const {
      category_id,
      author_id,
      type,
      title,
      body,
      is_pinned,
      tags
    } = topicData;

    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Create the topic
      const topicQuery = `
        INSERT INTO forum_topics (
          category_id, author_id, type, title, body, is_pinned, 
          is_locked, is_answered, views, votes, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, false, false, 0, 0, NOW(), NOW())
        RETURNING *
      `;

      const topicValues = [
        category_id,
        author_id,
        type || 'discussion',
        title,
        body,
        is_pinned || false
      ];

      const topicResult = await client.query(topicQuery, topicValues);
      const topic = topicResult.rows[0];

      // Add tags if provided
      if (tags && tags.length > 0) {
        for (const tagId of tags) {
          await client.query(
            'INSERT INTO forum_topic_tags (topic_id, tag_id) VALUES ($1, $2)',
            [topic.id, tagId]
          );
        }
      }

      await client.query('COMMIT');
      return topic;
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Error creating forum topic: ${error.message}`);
    } finally {
      client.release();
    }
  }

  static async findById(id, includeBody = true) {
    let query = `
      SELECT ft.*, 
             u.name as author_name, u.avatar_url as author_avatar,
             fc.name as category_name, fc.slug as category_slug,
             COUNT(fp.id) as reply_count
      FROM forum_topics ft
      LEFT JOIN users u ON ft.author_id = u.id
      LEFT JOIN forum_categories fc ON ft.category_id = fc.id
      LEFT JOIN forum_posts fp ON ft.id = fp.topic_id AND fp.deleted_at IS NULL
      WHERE ft.id = $1 AND ft.deleted_at IS NULL
      GROUP BY ft.id, u.name, u.avatar_url, fc.name, fc.slug
    `;

    if (!includeBody) {
      query = query.replace('ft.*', 'ft.id, ft.category_id, ft.author_id, ft.type, ft.title, ft.is_locked, ft.is_pinned, ft.is_answered, ft.views, ft.votes, ft.created_at, ft.updated_at');
    }

    try {
      const result = await db.pool.query(query, [id]);
      if (result.rows.length === 0) return null;

      const topic = result.rows[0];
      topic.reply_count = parseInt(topic.reply_count);

      // Get tags
      const tagsQuery = `
        SELECT ft.id, ft.name, ft.slug, ft.color
        FROM forum_tags ft
        INNER JOIN forum_topic_tags ftt ON ft.id = ftt.tag_id
        WHERE ftt.topic_id = $1 AND ft.deleted_at IS NULL
      `;
      
      const tagsResult = await db.pool.query(tagsQuery, [id]);
      topic.tags = tagsResult.rows;

      return topic;
    } catch (error) {
      throw new Error(`Error finding forum topic: ${error.message}`);
    }
  }

  static async findAll(filters = {}) {
    let query = `
      SELECT ft.id, ft.category_id, ft.author_id, ft.type, ft.title, 
             ft.is_locked, ft.is_pinned, ft.is_answered, ft.views, ft.votes, 
             ft.created_at, ft.updated_at,
             u.name as author_name, u.avatar_url as author_avatar,
             fc.name as category_name, fc.slug as category_slug,
             COUNT(fp.id) as reply_count,
             MAX(COALESCE(fp.created_at, ft.created_at)) as last_activity
      FROM forum_topics ft
      LEFT JOIN users u ON ft.author_id = u.id
      LEFT JOIN forum_categories fc ON ft.category_id = fc.id
      LEFT JOIN forum_posts fp ON ft.id = fp.topic_id AND fp.deleted_at IS NULL
      WHERE ft.deleted_at IS NULL
    `;

    const values = [];
    let paramCount = 0;

    if (filters.category_id) {
      paramCount++;
      query += ` AND ft.category_id = $${paramCount}`;
      values.push(filters.category_id);
    }

    if (filters.author_id) {
      paramCount++;
      query += ` AND ft.author_id = $${paramCount}`;
      values.push(filters.author_id);
    }

    if (filters.type) {
      paramCount++;
      query += ` AND ft.type = $${paramCount}`;
      values.push(filters.type);
    }

    if (filters.status) {
      if (filters.status === 'answered') {
        query += ` AND ft.is_answered = true`;
      } else if (filters.status === 'unanswered') {
        query += ` AND ft.is_answered = false AND ft.type = 'question'`;
      } else if (filters.status === 'locked') {
        query += ` AND ft.is_locked = true`;
      }
    }

    if (filters.search) {
      paramCount++;
      query += ` AND (ft.title ILIKE $${paramCount} OR ft.body ILIKE $${paramCount})`;
      values.push(`%${filters.search}%`);
    }

    if (filters.tag_id) {
      query += ` AND ft.id IN (
        SELECT ftt.topic_id FROM forum_topic_tags ftt WHERE ftt.tag_id = $${paramCount + 1}
      )`;
      paramCount++;
      values.push(filters.tag_id);
    }

    query += `
      GROUP BY ft.id, u.name, u.avatar_url, fc.name, fc.slug
    `;

    // Sorting
    const sortBy = filters.sort || 'latest';
    switch (sortBy) {
      case 'popular':
        query += ` ORDER BY ft.votes DESC, ft.views DESC`;
        break;
      case 'views':
        query += ` ORDER BY ft.views DESC`;
        break;
      case 'oldest':
        query += ` ORDER BY ft.created_at ASC`;
        break;
      case 'activity':
        query += ` ORDER BY last_activity DESC`;
        break;
      default: // latest
        query += ` ORDER BY ft.is_pinned DESC, ft.created_at DESC`;
    }

    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const offset = (page - 1) * limit;

    paramCount++;
    query += ` LIMIT $${paramCount}`;
    values.push(limit);

    paramCount++;
    query += ` OFFSET $${paramCount}`;
    values.push(offset);

    try {
      const result = await db.pool.query(query, values);
      
      // Get tags for each topic
      const topics = await Promise.all(result.rows.map(async (topic) => {
        const tagsQuery = `
          SELECT ft.id, ft.name, ft.slug, ft.color
          FROM forum_tags ft
          INNER JOIN forum_topic_tags ftt ON ft.id = ftt.tag_id
          WHERE ftt.topic_id = $1 AND ft.deleted_at IS NULL
        `;
        
        const tagsResult = await db.pool.query(tagsQuery, [topic.id]);
        
        return {
          ...topic,
          reply_count: parseInt(topic.reply_count),
          tags: tagsResult.rows
        };
      }));

      return topics;
    } catch (error) {
      throw new Error(`Error finding forum topics: ${error.message}`);
    }
  }

  static async update(id, updateData) {
    const {
      title,
      body,
      type,
      is_locked,
      is_pinned,
      is_answered
    } = updateData;

    const query = `
      UPDATE forum_topics 
      SET title = $2, body = $3, type = $4, is_locked = $5, 
          is_pinned = $6, is_answered = $7, updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `;

    const values = [id, title, body, type, is_locked, is_pinned, is_answered];

    try {
      const result = await db.pool.query(query, values);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw new Error(`Error updating forum topic: ${error.message}`);
    }
  }

  static async delete(id) {
    const query = `
      UPDATE forum_topics 
      SET deleted_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id
    `;

    try {
      const result = await db.pool.query(query, [id]);
      return result.rows.length > 0;
    } catch (error) {
      throw new Error(`Error deleting forum topic: ${error.message}`);
    }
  }

  static async incrementViews(id) {
    const query = `
      UPDATE forum_topics 
      SET views = views + 1
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING views
    `;

    try {
      const result = await db.pool.query(query, [id]);
      return result.rows.length > 0 ? result.rows[0].views : null;
    } catch (error) {
      throw new Error(`Error incrementing topic views: ${error.message}`);
    }
  }

  static async updateTags(topicId, tagIds) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Remove existing tags
      await client.query('DELETE FROM forum_topic_tags WHERE topic_id = $1', [topicId]);

      // Add new tags
      if (tagIds && tagIds.length > 0) {
        for (const tagId of tagIds) {
          await client.query(
            'INSERT INTO forum_topic_tags (topic_id, tag_id) VALUES ($1, $2)',
            [topicId, tagId]
          );
        }
      }

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Error updating topic tags: ${error.message}`);
    } finally {
      client.release();
    }
  }

  static async getTopicsByTag(tagId, limit = 10) {
    const query = `
      SELECT ft.id, ft.title, ft.views, ft.votes, ft.created_at,
             u.name as author_name
      FROM forum_topics ft
      INNER JOIN forum_topic_tags ftt ON ft.id = ftt.topic_id
      LEFT JOIN users u ON ft.author_id = u.id
      WHERE ftt.tag_id = $1 AND ft.deleted_at IS NULL
      ORDER BY ft.created_at DESC
      LIMIT $2
    `;

    try {
      const result = await db.pool.query(query, [tagId, limit]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error getting topics by tag: ${error.message}`);
    }
  }
}

module.exports = ForumTopic;
