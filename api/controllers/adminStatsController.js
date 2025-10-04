const db = require('../config/database');
const logger = require('../utils/logger');
const { logApiCall, logError } = require('../services/observabilityService');

/**
 * Get dashboard statistics
 */
exports.getDashboardStats = async (req, res) => {
  const startTime = Date.now();
  try {
    const stats = await getDashboardStatsData();

    logApiCall('GET', '/admin/dashboard/stats', 200, Date.now() - startTime, req.user?.id);
    res.json(stats);
  } catch (error) {
    logError(error, 'getDashboardStats', { userId: req.user?.id });
    logApiCall('GET', '/admin/dashboard/stats', 500, Date.now() - startTime, req.user?.id);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get recent activity
 */
exports.getRecentActivity = async (req, res) => {
  const startTime = Date.now();
  try {
    const limit = parseInt(req.query.limit) || 10;
    const activity = await getRecentActivityData(limit);

    logApiCall('GET', '/admin/dashboard/recent-activity', 200, Date.now() - startTime, req.user?.id);
    res.json(activity);
  } catch (error) {
    logError(error, 'getRecentActivity', { userId: req.user?.id });
    logApiCall('GET', '/admin/dashboard/recent-activity', 500, Date.now() - startTime, req.user?.id);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get pending approvals count
 */
exports.getPendingApprovalsCount = async (req, res) => {
  const startTime = Date.now();
  try {
    const count = await getPendingApprovalsCountData();

    logApiCall('GET', '/admin/dashboard/pending-approvals', 200, Date.now() - startTime, req.user?.id);
    res.json(count);
  } catch (error) {
    logError(error, 'getPendingApprovalsCount', { userId: req.user?.id });
    logApiCall('GET', '/admin/dashboard/pending-approvals', 500, Date.now() - startTime, req.user?.id);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Helper function to get dashboard stats data
 */
async function getDashboardStatsData() {
  try {
    // Get user counts
    const userStats = await db.pool.query(`
      SELECT
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE is_active = true) as active_users
      FROM users
    `);

    // Get organization count - with fallback
    let totalOrganizations = 0;
    try {
      const orgStats = await db.pool.query('SELECT COUNT(*) as total_organizations FROM organizations');
      totalOrganizations = parseInt(orgStats.rows[0].total_organizations) || 0;
    } catch (err) {
      logger.info('Organizations table not found, using 0');
    }

    // Get project count - with fallback
    let totalProjects = 0;
    try {
      const projectStats = await db.pool.query('SELECT COUNT(*) as total_projects FROM projects');
      totalProjects = parseInt(projectStats.rows[0].total_projects) || 0;
    } catch (err) {
      logger.info('⚠️ Projects table does not exist yet');
    }

    // Get pending approvals count - with fallback
    let pendingApprovals = 0;
    try {
      const approvalStats = await db.pool.query(`
        SELECT COUNT(*) as pending_approvals
        FROM approvals
        WHERE status = 'pending'
      `);
      pendingApprovals = parseInt(approvalStats.rows[0].pending_approvals) || 0;
    } catch (err) {
      logger.info('⚠️ Approvals table does not exist yet');
    }

    // Get system alerts from actual system monitoring
    let systemAlerts = 0;
    try {
      const alertsQuery = await db.pool.query(`
        SELECT COUNT(*) as alert_count
        FROM system_alerts
        WHERE resolved_at IS NULL
      `);
      systemAlerts = parseInt(alertsQuery.rows[0].alert_count) || 0;
    } catch (err) {
      logger.info('⚠️ System alerts table does not exist yet');
    }

    return {
      totalUsers: parseInt(userStats.rows[0].total_users) || 0,
      totalOrganizations,
      totalProjects,
      activeUsers: parseInt(userStats.rows[0].active_users) || 0,
      pendingApprovals,
      systemAlerts,
    };
  } catch (error) {
    logger.error('❌ Error getting dashboard stats:', error);
    throw error;
  }
}

/**
 * Helper function to get recent activity data
 */
async function getRecentActivityData(limit = 10) {
  try {
    // Get recent audit log entries
    const auditLogs = await db.pool.query(`
      SELECT
        id,
        created_at as timestamp,
        actor_user_id,
        action_key,
        entity_type,
        entity_id,
        payload_json
      FROM audit_log
      ORDER BY created_at DESC
      LIMIT $1
    `, [limit]);

    // Get user emails for the audit logs
    const userIds = [...new Set(auditLogs.rows.map(log => log.actor_user_id).filter(Boolean))];

    let userEmailMap = {};
    if (userIds.length > 0) {
      const userResults = await db.pool.query(
        'SELECT id, email FROM users WHERE id = ANY($1)',
        [userIds]
      );
      userEmailMap = Object.fromEntries(userResults.rows.map(user => [user.id, user.email]));
    }

    // Transform audit logs into activity entries
    const activities = auditLogs.rows.map(log => ({
      id: log.id,
      timestamp: log.timestamp,
      userId: log.actor_user_id,
      userEmail: userEmailMap[log.actor_user_id] || 'Unknown User',
      action: log.action_key,
      entityType: log.entity_type,
      entityId: log.entity_id,
      details: log.payload_json || {},
      ipAddress: null,
      userAgent: null,
    }));

    return activities;
  } catch (error) {
    logger.info('⚠️ Audit log table does not exist yet');
    return [];
  }
}

/**
 * Helper function to get pending approvals count
 */
async function getPendingApprovalsCountData() {
  try {
    const result = await db.pool.query(`
      SELECT COUNT(*) as count
      FROM approvals
      WHERE status = 'pending'
    `);

    return { count: parseInt(result.rows[0].count) || 0 };
  } catch (error) {
    logger.info('⚠️ Approvals table does not exist yet');
    return { count: 0 };
  }
}
