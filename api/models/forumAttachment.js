const db = require('../config/database');

class ForumAttachment {
  static async create(attachmentData) {
    const {
      owner_user_id,
      topic_id,
      post_id,
      filename,
      original_filename,
      mime_type,
      size_bytes,
      storage_path,
      storage_key,
      virus_status
    } = attachmentData;

    const query = `
      INSERT INTO forum_attachments (
        owner_user_id, topic_id, post_id, filename, original_filename, 
        mime_type, size_bytes, storage_path, storage_key, virus_status, 
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      owner_user_id,
      topic_id || null,
      post_id || null,
      filename,
      original_filename,
      mime_type,
      size_bytes,
      storage_path,
      storage_key,
      virus_status || 'pending'
    ];

    try {
      const result = await db.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error creating forum attachment: ${error.message}`);
    }
  }

  static async findById(id) {
    const query = `
      SELECT fa.*, 
             u.name as owner_name,
             ft.title as topic_title,
             fp.id as post_exists
      FROM forum_attachments fa
      LEFT JOIN users u ON fa.owner_user_id = u.id
      LEFT JOIN forum_topics ft ON fa.topic_id = ft.id
      LEFT JOIN forum_posts fp ON fa.post_id = fp.id
      WHERE fa.id = $1 AND fa.deleted_at IS NULL
    `;

    try {
      const result = await db.pool.query(query, [id]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw new Error(`Error finding forum attachment: ${error.message}`);
    }
  }

  static async findByTopicId(topicId) {
    const query = `
      SELECT fa.*, 
             u.name as owner_name
      FROM forum_attachments fa
      LEFT JOIN users u ON fa.owner_user_id = u.id
      WHERE fa.topic_id = $1 AND fa.deleted_at IS NULL
      ORDER BY fa.created_at ASC
    `;

    try {
      const result = await db.pool.query(query, [topicId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error finding attachments by topic: ${error.message}`);
    }
  }

  static async findByPostId(postId) {
    const query = `
      SELECT fa.*, 
             u.name as owner_name
      FROM forum_attachments fa
      LEFT JOIN users u ON fa.owner_user_id = u.id
      WHERE fa.post_id = $1 AND fa.deleted_at IS NULL
      ORDER BY fa.created_at ASC
    `;

    try {
      const result = await db.pool.query(query, [postId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error finding attachments by post: ${error.message}`);
    }
  }

  static async findByUser(userId, limit = 50, offset = 0) {
    const query = `
      SELECT fa.*, 
             ft.title as topic_title,
             fc.name as category_name
      FROM forum_attachments fa
      LEFT JOIN forum_topics ft ON fa.topic_id = ft.id
      LEFT JOIN forum_categories fc ON ft.category_id = fc.id
      WHERE fa.owner_user_id = $1 AND fa.deleted_at IS NULL
      ORDER BY fa.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    try {
      const result = await db.pool.query(query, [userId, limit, offset]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error finding attachments by user: ${error.message}`);
    }
  }

  static async update(id, updateData) {
    const {
      filename,
      virus_status,
      download_count
    } = updateData;

    const query = `
      UPDATE forum_attachments 
      SET filename = $2, virus_status = $3, download_count = $4, updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `;

    const values = [id, filename, virus_status, download_count];

    try {
      const result = await db.pool.query(query, values);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw new Error(`Error updating forum attachment: ${error.message}`);
    }
  }

  static async updateVirusStatus(id, status) {
    const query = `
      UPDATE forum_attachments 
      SET virus_status = $2, updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `;

    try {
      const result = await db.pool.query(query, [id, status]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw new Error(`Error updating virus status: ${error.message}`);
    }
  }

  static async incrementDownloadCount(id) {
    const query = `
      UPDATE forum_attachments 
      SET download_count = download_count + 1, updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING download_count
    `;

    try {
      const result = await db.pool.query(query, [id]);
      return result.rows.length > 0 ? result.rows[0].download_count : null;
    } catch (error) {
      throw new Error(`Error incrementing download count: ${error.message}`);
    }
  }

  static async delete(id) {
    const query = `
      UPDATE forum_attachments 
      SET deleted_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id, storage_key
    `;

    try {
      const result = await db.pool.query(query, [id]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw new Error(`Error deleting forum attachment: ${error.message}`);
    }
  }

  static async getStorageStats() {
    const query = `
      SELECT 
        COUNT(*) as total_files,
        SUM(size_bytes) as total_size,
        AVG(size_bytes) as avg_size,
        COUNT(CASE WHEN virus_status = 'clean' THEN 1 END) as clean_files,
        COUNT(CASE WHEN virus_status = 'infected' THEN 1 END) as infected_files,
        COUNT(CASE WHEN virus_status = 'pending' THEN 1 END) as pending_files
      FROM forum_attachments 
      WHERE deleted_at IS NULL
    `;

    try {
      const result = await db.pool.query(query);
      const stats = result.rows[0];
      return {
        total_files: parseInt(stats.total_files),
        total_size: parseInt(stats.total_size || 0),
        avg_size: parseFloat(stats.avg_size || 0),
        clean_files: parseInt(stats.clean_files),
        infected_files: parseInt(stats.infected_files),
        pending_files: parseInt(stats.pending_files)
      };
    } catch (error) {
      throw new Error(`Error getting storage stats: ${error.message}`);
    }
  }

  static async findPendingVirusScan(limit = 10) {
    const query = `
      SELECT * FROM forum_attachments 
      WHERE virus_status = 'pending' AND deleted_at IS NULL
      ORDER BY created_at ASC
      LIMIT $1
    `;

    try {
      const result = await db.pool.query(query, [limit]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error finding pending virus scans: ${error.message}`);
    }
  }

  static async findByMimeType(mimeType, limit = 100) {
    const query = `
      SELECT fa.*, 
             u.name as owner_name,
             ft.title as topic_title
      FROM forum_attachments fa
      LEFT JOIN users u ON fa.owner_user_id = u.id
      LEFT JOIN forum_topics ft ON fa.topic_id = ft.id
      WHERE fa.mime_type = $1 AND fa.deleted_at IS NULL
      ORDER BY fa.created_at DESC
      LIMIT $2
    `;

    try {
      const result = await db.pool.query(query, [mimeType, limit]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error finding attachments by mime type: ${error.message}`);
    }
  }

  static async getUserStorageUsage(userId) {
    const query = `
      SELECT 
        COUNT(*) as file_count,
        SUM(size_bytes) as total_size
      FROM forum_attachments 
      WHERE owner_user_id = $1 AND deleted_at IS NULL
    `;

    try {
      const result = await db.pool.query(query, [userId]);
      const stats = result.rows[0];
      return {
        file_count: parseInt(stats.file_count),
        total_size: parseInt(stats.total_size || 0)
      };
    } catch (error) {
      throw new Error(`Error getting user storage usage: ${error.message}`);
    }
  }

  static async cleanupOrphanedAttachments() {
    const query = `
      UPDATE forum_attachments 
      SET deleted_at = NOW()
      WHERE deleted_at IS NULL 
        AND topic_id IS NOT NULL 
        AND topic_id NOT IN (SELECT id FROM forum_topics WHERE deleted_at IS NULL)
        OR (post_id IS NOT NULL 
        AND post_id NOT IN (SELECT id FROM forum_posts WHERE deleted_at IS NULL))
      RETURNING id, storage_key
    `;

    try {
      const result = await db.pool.query(query);
      return result.rows;
    } catch (error) {
      throw new Error(`Error cleaning up orphaned attachments: ${error.message}`);
    }
  }
}

module.exports = ForumAttachment;
