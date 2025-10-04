const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * Activity Log Service
 * Handles logging and retrieval of partner activities
 */

class ActivityLogService {
  /**
   * Log a new activity
   */
  async logActivity({
    organizationId,
    userId,
    activityType,
    activityCategory,
    title,
    description = null,
    metadata = {},
    entityType = null,
    entityId = null,
    severity = 'info'
  }) {
    try {
      const result = await db.pool.query(
        `SELECT log_partner_activity($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) as activity_id`,
        [
          organizationId,
          userId,
          activityType,
          activityCategory,
          title,
          description,
          JSON.stringify(metadata),
          entityType,
          entityId,
          severity
        ]
      );

      logger.info('Activity logged', {
        activityId: result.rows[0].activity_id,
        organizationId,
        activityType
      });

      return result.rows[0].activity_id;
    } catch (error) {
      logger.error('Error logging activity:', { error: error.message, organizationId, activityType });
      throw error;
    }
  }

  /**
   * Get recent activities for an organization
   */
  async getActivities(organizationId, options = {}) {
    try {
      const {
        limit = 20,
        offset = 0,
        category = null,
        severity = null,
        unreadOnly = false,
        startDate = null,
        endDate = null
      } = options;

      let query = `
        SELECT * FROM partner_activity_feed
        WHERE organization_id = $1
      `;
      const params = [organizationId];
      let paramCount = 1;

      if (category) {
        paramCount++;
        query += ` AND activity_category = $${paramCount}`;
        params.push(category);
      }

      if (severity) {
        paramCount++;
        query += ` AND severity = $${paramCount}`;
        params.push(severity);
      }

      if (unreadOnly) {
        query += ` AND is_read = FALSE`;
      }

      if (startDate) {
        paramCount++;
        query += ` AND created_at >= $${paramCount}`;
        params.push(startDate);
      }

      if (endDate) {
        paramCount++;
        query += ` AND created_at <= $${paramCount}`;
        params.push(endDate);
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(limit, offset);

      const result = await db.pool.query(query, params);

      // Get total count
      let countQuery = `
        SELECT COUNT(*) as total
        FROM partner_activity_log
        WHERE organization_id = $1
      `;
      const countParams = [organizationId];
      let countParamCount = 1;

      if (category) {
        countParamCount++;
        countQuery += ` AND activity_category = $${countParamCount}`;
        countParams.push(category);
      }

      if (severity) {
        countParamCount++;
        countQuery += ` AND severity = $${countParamCount}`;
        countParams.push(severity);
      }

      if (unreadOnly) {
        countQuery += ` AND is_read = FALSE`;
      }

      const countResult = await db.pool.query(countQuery, countParams);

      return {
        activities: result.rows,
        total: parseInt(countResult.rows[0].total),
        limit,
        offset,
        hasMore: (offset + limit) < parseInt(countResult.rows[0].total)
      };
    } catch (error) {
      logger.error('Error fetching activities:', { error: error.message, organizationId });
      throw error;
    }
  }

  /**
   * Mark activity as read
   */
  async markAsRead(activityId, organizationId) {
    try {
      await db.pool.query(
        `UPDATE partner_activity_log 
         SET is_read = TRUE 
         WHERE id = $1 AND organization_id = $2`,
        [activityId, organizationId]
      );

      logger.info('Activity marked as read', { activityId, organizationId });
    } catch (error) {
      logger.error('Error marking activity as read:', { error: error.message, activityId });
      throw error;
    }
  }

  /**
   * Mark all activities as read
   */
  async markAllAsRead(organizationId) {
    try {
      const result = await db.pool.query(
        `UPDATE partner_activity_log 
         SET is_read = TRUE 
         WHERE organization_id = $1 AND is_read = FALSE
         RETURNING id`,
        [organizationId]
      );

      logger.info('All activities marked as read', {
        organizationId,
        count: result.rowCount
      });

      return result.rowCount;
    } catch (error) {
      logger.error('Error marking all activities as read:', { error: error.message, organizationId });
      throw error;
    }
  }

  /**
   * Get activity statistics
   */
  async getStatistics(organizationId, days = 30) {
    try {
      const result = await db.pool.query(
        `SELECT 
          activity_category,
          COUNT(*) as count,
          COUNT(CASE WHEN is_read = FALSE THEN 1 END) as unread_count
         FROM partner_activity_log
         WHERE organization_id = $1 
           AND created_at >= NOW() - INTERVAL '${days} days'
         GROUP BY activity_category
         ORDER BY count DESC`,
        [organizationId]
      );

      return result.rows;
    } catch (error) {
      logger.error('Error fetching activity statistics:', { error: error.message, organizationId });
      throw error;
    }
  }

  /**
   * Delete old activities (cleanup)
   */
  async deleteOldActivities(daysToKeep = 90) {
    try {
      const result = await db.pool.query(
        `DELETE FROM partner_activity_log
         WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'
         RETURNING id`,
        []
      );

      logger.info('Old activities deleted', { count: result.rowCount, daysToKeep });

      return result.rowCount;
    } catch (error) {
      logger.error('Error deleting old activities:', { error: error.message });
      throw error;
    }
  }
}

module.exports = new ActivityLogService();
