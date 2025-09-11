const db = require('../config/database');

class ForumPost {
  static async create(postData) {
    const {
      topic_id,
      author_id,
      body,
      is_answer,
      parent_id
    } = postData;

    const query = `
      INSERT INTO forum_posts (
        topic_id, author_id, body, is_answer, parent_id, votes, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, 0, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      topic_id,
      author_id,
      body,
      is_answer || false,
      parent_id || null
    ];

    try {
      const result = await db.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error creating forum post: ${error.message}`);
    }
  }

  static async findById(id) {
    const query = `
      SELECT fp.*, 
             u.name as author_name, u.avatar_url as author_avatar,
             ft.title as topic_title
      FROM forum_posts fp
      LEFT JOIN users u ON fp.author_id = u.id
      LEFT JOIN forum_topics ft ON fp.topic_id = ft.id
      WHERE fp.id = $1 AND fp.deleted_at IS NULL
    `;

    try {
      const result = await db.pool.query(query, [id]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw new Error(`Error finding forum post: ${error.message}`);
    }
  }

  static async findByTopicId(topicId, filters = {}) {
    let query = `
      SELECT fp.*, 
             u.name as author_name, u.avatar_url as author_avatar,
             COUNT(replies.id) as reply_count
      FROM forum_posts fp
      LEFT JOIN users u ON fp.author_id = u.id
      LEFT JOIN forum_posts replies ON fp.id = replies.parent_id AND replies.deleted_at IS NULL
      WHERE fp.topic_id = $1 AND fp.deleted_at IS NULL
    `;

    const values = [topicId];
    let paramCount = 1;

    if (filters.is_answer !== undefined) {
      paramCount++;
      query += ` AND fp.is_answer = $${paramCount}`;
      values.push(filters.is_answer);
    }

    if (filters.parent_id !== undefined) {
      paramCount++;
      if (filters.parent_id === null) {
        query += ` AND fp.parent_id IS NULL`;
      } else {
        query += ` AND fp.parent_id = $${paramCount}`;
        values.push(filters.parent_id);
      }
    }

    query += `
      GROUP BY fp.id, u.name, u.avatar_url
    `;

    // Sorting
    const sortBy = filters.sort || 'oldest';
    switch (sortBy) {
      case 'votes':
        query += ` ORDER BY fp.votes DESC, fp.created_at ASC`;
        break;
      case 'newest':
        query += ` ORDER BY fp.created_at DESC`;
        break;
      default: // oldest
        query += ` ORDER BY fp.is_answer DESC, fp.created_at ASC`;
    }

    // Pagination
    if (filters.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      values.push(filters.limit);
    }

    if (filters.offset) {
      paramCount++;
      query += ` OFFSET $${paramCount}`;
      values.push(filters.offset);
    }

    try {
      const result = await db.pool.query(query, values);
      return result.rows.map(post => ({
        ...post,
        reply_count: parseInt(post.reply_count)
      }));
    } catch (error) {
      throw new Error(`Error finding posts by topic: ${error.message}`);
    }
  }

  static async update(id, updateData) {
    const { body, is_answer } = updateData;

    const query = `
      UPDATE forum_posts 
      SET body = $2, is_answer = $3, updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `;

    const values = [id, body, is_answer];

    try {
      const result = await db.pool.query(query, values);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw new Error(`Error updating forum post: ${error.message}`);
    }
  }

  static async delete(id) {
    const query = `
      UPDATE forum_posts 
      SET deleted_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id
    `;

    try {
      const result = await db.pool.query(query, [id]);
      return result.rows.length > 0;
    } catch (error) {
      throw new Error(`Error deleting forum post: ${error.message}`);
    }
  }

  static async markAsAnswer(id, topicId) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Remove existing answer status from other posts in the topic
      await client.query(
        'UPDATE forum_posts SET is_answer = false WHERE topic_id = $1 AND id != $2',
        [topicId, id]
      );

      // Mark this post as the answer
      const result = await client.query(
        'UPDATE forum_posts SET is_answer = true WHERE id = $1 RETURNING *',
        [id]
      );

      // Update topic as answered
      await client.query(
        'UPDATE forum_topics SET is_answered = true WHERE id = $1',
        [topicId]
      );

      await client.query('COMMIT');
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Error marking post as answer: ${error.message}`);
    } finally {
      client.release();
    }
  }

  static async unmarkAsAnswer(id, topicId) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Remove answer status
      const result = await client.query(
        'UPDATE forum_posts SET is_answer = false WHERE id = $1 RETURNING *',
        [id]
      );

      // Check if there are any other answers in the topic
      const answersResult = await client.query(
        'SELECT COUNT(*) as count FROM forum_posts WHERE topic_id = $1 AND is_answer = true AND deleted_at IS NULL',
        [topicId]
      );

      const hasAnswers = parseInt(answersResult.rows[0].count) > 0;

      // Update topic answered status
      await client.query(
        'UPDATE forum_topics SET is_answered = $1 WHERE id = $2',
        [hasAnswers, topicId]
      );

      await client.query('COMMIT');
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Error unmarking post as answer: ${error.message}`);
    } finally {
      client.release();
    }
  }

  static async getAnswerForTopic(topicId) {
    const query = `
      SELECT fp.*, 
             u.name as author_name, u.avatar_url as author_avatar
      FROM forum_posts fp
      LEFT JOIN users u ON fp.author_id = u.id
      WHERE fp.topic_id = $1 AND fp.is_answer = true AND fp.deleted_at IS NULL
      ORDER BY fp.votes DESC, fp.created_at ASC
      LIMIT 1
    `;

    try {
      const result = await db.pool.query(query, [topicId]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw new Error(`Error getting answer for topic: ${error.message}`);
    }
  }

  static async getReplies(parentId, limit = 10) {
    const query = `
      SELECT fp.*, 
             u.name as author_name, u.avatar_url as author_avatar
      FROM forum_posts fp
      LEFT JOIN users u ON fp.author_id = u.id
      WHERE fp.parent_id = $1 AND fp.deleted_at IS NULL
      ORDER BY fp.created_at ASC
      LIMIT $2
    `;

    try {
      const result = await db.pool.query(query, [parentId, limit]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error getting post replies: ${error.message}`);
    }
  }

  static async getPostsByUser(userId, limit = 20, offset = 0) {
    const query = `
      SELECT fp.id, fp.topic_id, fp.body, fp.votes, fp.created_at,
             ft.title as topic_title, ft.category_id,
             fc.name as category_name
      FROM forum_posts fp
      LEFT JOIN forum_topics ft ON fp.topic_id = ft.id
      LEFT JOIN forum_categories fc ON ft.category_id = fc.id
      WHERE fp.author_id = $1 AND fp.deleted_at IS NULL AND ft.deleted_at IS NULL
      ORDER BY fp.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    try {
      const result = await db.pool.query(query, [userId, limit, offset]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error getting posts by user: ${error.message}`);
    }
  }
}

module.exports = ForumPost;
