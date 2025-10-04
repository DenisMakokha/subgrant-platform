const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * Admin Activity Log Service
 * Tracks all administrative actions for audit trail and monitoring
 */

/**
 * Log an admin activity
 * @param {Object} activityData - Activity information
 * @param {number} activityData.adminId - ID of the admin performing the action
 * @param {string} activityData.action - Action performed (e.g., 'create_user', 'delete_org')
 * @param {string} activityData.entityType - Type of entity affected
 * @param {number} [activityData.entityId] - ID of the affected entity
 * @param {Object} [activityData.changes] - Before/after states
 * @param {string} [activityData.ipAddress] - IP address of the request
 * @param {string} [activityData.userAgent] - User agent string
 * @param {string} [activityData.requestId] - Request correlation ID
 * @param {string} [activityData.sessionId] - Session identifier
 * @param {string} [activityData.result] - Result status (success, failure, error)
 * @param {string} [activityData.errorMessage] - Error message if applicable
 */
async function logActivity(activityData) {
  try {
    const {
      adminId,
      action,
      entityType,
      entityId,
      changes,
      ipAddress,
      userAgent,
      requestId,
      sessionId,
      result = 'success',
      errorMessage
    } = activityData;

    // Validate required fields
    if (!adminId || !action || !entityType) {
      logger.warn('Admin activity log missing required fields', { activityData });
      return null;
    }

    const query = `
      INSERT INTO admin_activity_log (
        admin_id,
        action,
        entity_type,
        entity_id,
        changes,
        ip_address,
        user_agent,
        request_id,
        session_id,
        result,
        error_message,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const values = [
      adminId,
      action,
      entityType,
      entityId || null,
      changes ? JSON.stringify(changes) : null,
      ipAddress || null,
      userAgent || null,
      requestId || null,
      sessionId || null,
      result,
      errorMessage || null
    ];

    const result_query = await db.pool.query(query, values);
    return result_query.rows[0];
  } catch (error) {
    logger.error('Error logging admin activity:', error);
    // Don't throw - logging should never break the main flow
    return null;
  }
}

/**
 * Get recent admin activities
 * @param {Object} options - Query options
 * @param {number} [options.adminId] - Filter by admin ID
 * @param {string} [options.action] - Filter by action type
 * @param {string} [options.entityType] - Filter by entity type
 * @param {number} [options.limit] - Number of records to return
 * @param {number} [options.offset] - Offset for pagination
 * @param {Date} [options.startDate] - Start date filter
 * @param {Date} [options.endDate] - End date filter
 */
async function getActivities(options = {}) {
  try {
    const {
      adminId,
      action,
      entityType,
      limit = 50,
      offset = 0,
      startDate,
      endDate
    } = options;

    let query = `
      SELECT 
        aal.*,
        u.email as admin_email,
        u.role as admin_role
      FROM admin_activity_log aal
      LEFT JOIN users u ON aal.admin_id = u.id
      WHERE 1=1
    `;

    const values = [];
    let paramIndex = 1;

    if (adminId) {
      query += ` AND aal.admin_id = $${paramIndex++}`;
      values.push(adminId);
    }

    if (action) {
      query += ` AND aal.action = $${paramIndex++}`;
      values.push(action);
    }

    if (entityType) {
      query += ` AND aal.entity_type = $${paramIndex++}`;
      values.push(entityType);
    }

    if (startDate) {
      query += ` AND aal.created_at >= $${paramIndex++}`;
      values.push(startDate);
    }

    if (endDate) {
      query += ` AND aal.created_at <= $${paramIndex++}`;
      values.push(endDate);
    }

    query += ` ORDER BY aal.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    values.push(limit, offset);

    const result = await db.pool.query(query, values);
    return result.rows;
  } catch (error) {
    logger.error('Error fetching admin activities:', error);
    throw error;
  }
}

/**
 * Get activity statistics
 * @param {Object} options - Query options
 * @param {number} [options.adminId] - Filter by admin ID
 * @param {Date} [options.startDate] - Start date filter
 * @param {Date} [options.endDate] - End date filter
 */
async function getActivityStats(options = {}) {
  try {
    const { adminId, startDate, endDate } = options;

    let query = `
      SELECT 
        COUNT(*) as total_actions,
        COUNT(DISTINCT admin_id) as unique_admins,
        COUNT(*) FILTER (WHERE result = 'success') as successful_actions,
        COUNT(*) FILTER (WHERE result = 'failure') as failed_actions,
        COUNT(*) FILTER (WHERE result = 'error') as error_actions,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as actions_last_24h,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as actions_last_week,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as actions_last_month
      FROM admin_activity_log
      WHERE 1=1
    `;

    const values = [];
    let paramIndex = 1;

    if (adminId) {
      query += ` AND admin_id = $${paramIndex++}`;
      values.push(adminId);
    }

    if (startDate) {
      query += ` AND created_at >= $${paramIndex++}`;
      values.push(startDate);
    }

    if (endDate) {
      query += ` AND created_at <= $${paramIndex++}`;
      values.push(endDate);
    }

    const result = await db.pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    logger.error('Error fetching activity stats:', error);
    throw error;
  }
}

/**
 * Get most active admins
 * @param {Object} options - Query options
 * @param {number} [options.limit] - Number of admins to return
 * @param {Date} [options.startDate] - Start date filter
 * @param {Date} [options.endDate] - End date filter
 */
async function getMostActiveAdmins(options = {}) {
  try {
    const { limit = 10, startDate, endDate } = options;

    let query = `
      SELECT 
        aal.admin_id,
        u.email as admin_email,
        u.role as admin_role,
        COUNT(*) as action_count,
        MAX(aal.created_at) as last_activity
      FROM admin_activity_log aal
      LEFT JOIN users u ON aal.admin_id = u.id
      WHERE 1=1
    `;

    const values = [];
    let paramIndex = 1;

    if (startDate) {
      query += ` AND aal.created_at >= $${paramIndex++}`;
      values.push(startDate);
    }

    if (endDate) {
      query += ` AND aal.created_at <= $${paramIndex++}`;
      values.push(endDate);
    }

    query += `
      GROUP BY aal.admin_id, u.email, u.role
      ORDER BY action_count DESC
      LIMIT $${paramIndex++}
    `;
    values.push(limit);

    const result = await db.pool.query(query, values);
    return result.rows;
  } catch (error) {
    logger.error('Error fetching most active admins:', error);
    throw error;
  }
}

/**
 * Get action distribution
 * @param {Object} options - Query options
 * @param {Date} [options.startDate] - Start date filter
 * @param {Date} [options.endDate] - End date filter
 */
async function getActionDistribution(options = {}) {
  try {
    const { startDate, endDate } = options;

    let query = `
      SELECT 
        action,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE result = 'success') as success_count,
        COUNT(*) FILTER (WHERE result = 'failure') as failure_count
      FROM admin_activity_log
      WHERE 1=1
    `;

    const values = [];
    let paramIndex = 1;

    if (startDate) {
      query += ` AND created_at >= $${paramIndex++}`;
      values.push(startDate);
    }

    if (endDate) {
      query += ` AND created_at <= $${paramIndex++}`;
      values.push(endDate);
    }

    query += `
      GROUP BY action
      ORDER BY count DESC
    `;

    const result = await db.pool.query(query, values);
    return result.rows;
  } catch (error) {
    logger.error('Error fetching action distribution:', error);
    throw error;
  }
}

/**
 * Get entity type distribution
 * @param {Object} options - Query options
 * @param {Date} [options.startDate] - Start date filter
 * @param {Date} [options.endDate] - End date filter
 */
async function getEntityDistribution(options = {}) {
  try {
    const { startDate, endDate } = options;

    let query = `
      SELECT 
        entity_type,
        COUNT(*) as count
      FROM admin_activity_log
      WHERE 1=1
    `;

    const values = [];
    let paramIndex = 1;

    if (startDate) {
      query += ` AND created_at >= $${paramIndex++}`;
      values.push(startDate);
    }

    if (endDate) {
      query += ` AND created_at <= $${paramIndex++}`;
      values.push(endDate);
    }

    query += `
      GROUP BY entity_type
      ORDER BY count DESC
    `;

    const result = await db.pool.query(query, values);
    return result.rows;
  } catch (error) {
    logger.error('Error fetching entity distribution:', error);
    throw error;
  }
}

/**
 * Get activity timeline (hourly/daily)
 * @param {Object} options - Query options
 * @param {string} [options.interval] - 'hour' or 'day'
 * @param {Date} [options.startDate] - Start date filter
 * @param {Date} [options.endDate] - End date filter
 */
async function getActivityTimeline(options = {}) {
  try {
    const { interval = 'day', startDate, endDate } = options;

    const dateFormat = interval === 'hour' 
      ? "date_trunc('hour', created_at)" 
      : "date_trunc('day', created_at)";

    let query = `
      SELECT 
        ${dateFormat} as time_bucket,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE result = 'success') as success_count,
        COUNT(*) FILTER (WHERE result = 'failure') as failure_count
      FROM admin_activity_log
      WHERE 1=1
    `;

    const values = [];
    let paramIndex = 1;

    if (startDate) {
      query += ` AND created_at >= $${paramIndex++}`;
      values.push(startDate);
    }

    if (endDate) {
      query += ` AND created_at <= $${paramIndex++}`;
      values.push(endDate);
    }

    query += `
      GROUP BY time_bucket
      ORDER BY time_bucket DESC
    `;

    const result = await db.pool.query(query, values);
    return result.rows;
  } catch (error) {
    logger.error('Error fetching activity timeline:', error);
    throw error;
  }
}

/**
 * Search activities by keyword
 * @param {string} keyword - Search keyword
 * @param {Object} options - Query options
 */
async function searchActivities(keyword, options = {}) {
  try {
    const { limit = 50, offset = 0 } = options;

    const query = `
      SELECT 
        aal.*,
        u.email as admin_email
      FROM admin_activity_log aal
      LEFT JOIN users u ON aal.admin_id = u.id
      WHERE 
        aal.action ILIKE $1 OR
        aal.entity_type ILIKE $1 OR
        u.email ILIKE $1 OR
        aal.error_message ILIKE $1
      ORDER BY aal.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await db.pool.query(query, [`%${keyword}%`, limit, offset]);
    return result.rows;
  } catch (error) {
    logger.error('Error searching activities:', error);
    throw error;
  }
}

module.exports = {
  logActivity,
  getActivities,
  getActivityStats,
  getMostActiveAdmins,
  getActionDistribution,
  getEntityDistribution,
  getActivityTimeline,
  searchActivities
};
