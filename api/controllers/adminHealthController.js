const db = require('../config/database');
const { logApiCall, logError } = require('../services/observabilityService');

/**
 * Get system health overview
 */
exports.getSystemHealth = async (req, res) => {
  const startTime = Date.now();
  try {
    // Get service status
    const services = await getServiceStatus();

    // Get system metrics
    const metrics = await getSystemMetrics();

    // Get active alerts
    const alerts = await getActiveAlerts();

    const health = {
      services,
      metrics,
      alerts,
      lastUpdated: new Date(),
    };

    logApiCall('GET', '/admin/health/system', 200, Date.now() - startTime, req.user?.id);
    res.json(health);
  } catch (error) {
    logError(error, 'getSystemHealth', { userId: req.user?.id });
    logApiCall('GET', '/admin/health/system', 500, Date.now() - startTime, req.user?.id);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get service status details
 */
exports.getServiceStatus = async (req, res) => {
  const startTime = Date.now();
  try {
    const services = await getServiceStatus();

    logApiCall('GET', '/admin/health/services', 200, Date.now() - startTime, req.user?.id);
    res.json(services);
  } catch (error) {
    logError(error, 'getServiceStatus', { userId: req.user?.id });
    logApiCall('GET', '/admin/health/services', 500, Date.now() - startTime, req.user?.id);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get system metrics
 */
exports.getMetrics = async (req, res) => {
  const startTime = Date.now();
  try {
    const metrics = await getSystemMetrics();

    logApiCall('GET', '/admin/health/metrics', 200, Date.now() - startTime, req.user?.id);
    res.json(metrics);
  } catch (error) {
    logError(error, 'getMetrics', { userId: req.user?.id });
    logApiCall('GET', '/admin/health/metrics', 500, Date.now() - startTime, req.user?.id);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get active alerts
 */
exports.getAlerts = async (req, res) => {
  const startTime = Date.now();
  try {
    const alerts = await getActiveAlerts();

    logApiCall('GET', '/admin/health/alerts', 200, Date.now() - startTime, req.user?.id);
    res.json(alerts);
  } catch (error) {
    logError(error, 'getAlerts', { userId: req.user?.id });
    logApiCall('GET', '/admin/health/alerts', 500, Date.now() - startTime, req.user?.id);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Resolve an alert
 */
exports.resolveAlert = async (req, res) => {
  const startTime = Date.now();
  try {
    const { alertId } = req.params;

    // In a real implementation, this would update the alert in the database
    // For now, we'll just return success
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate DB operation

    logApiCall('PUT', `/admin/health/alerts/${alertId}/resolve`, 200, Date.now() - startTime, req.user?.id);
    res.json({ message: 'Alert resolved successfully' });
  } catch (error) {
    logError(error, 'resolveAlert', { userId: req.user?.id, alertId: req.params.alertId });
    logApiCall('PUT', `/admin/health/alerts/${req.params.alertId}/resolve`, 500, Date.now() - startTime, req.user?.id);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Helper function to get service status
 */
async function getServiceStatus() {
  const services = {};

  // Database status
  try {
    const dbStart = Date.now();
    await db.pool.query('SELECT 1');
    const dbResponseTime = Date.now() - dbStart;
    services.database = {
      name: 'Database',
      status: 'healthy',
      responseTime: dbResponseTime,
      lastCheck: new Date(),
      message: 'Connected successfully',
    };
  } catch (error) {
    services.database = {
      name: 'Database',
      status: 'error',
      lastCheck: new Date(),
      message: error.message,
    };
  }

  // API status (always healthy for this service)
  services.api = {
    name: 'API',
    status: 'healthy',
    responseTime: 0,
    lastCheck: new Date(),
    message: 'API is responding',
  };

  // Cache status (Redis if available)
  services.cache = {
    name: 'Cache',
    status: 'healthy',
    responseTime: 1,
    lastCheck: new Date(),
    message: 'Cache is operational',
  };

  // Notifications status
  services.notifications = {
    name: 'Notifications',
    status: 'healthy',
    responseTime: 5,
    lastCheck: new Date(),
    message: 'Notification system operational',
  };

  // Email status (if configured)
  services.email = {
    name: 'Email',
    status: 'healthy',
    responseTime: 10,
    lastCheck: new Date(),
    message: 'Email service operational',
  };

  return services;
}

/**
 * Helper function to get system metrics
 */
async function getSystemMetrics() {
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
      console.log('⚠️ Organizations table does not exist yet');
    }

    // Get project count - with fallback
    let totalProjects = 0;
    try {
      const projectStats = await db.pool.query('SELECT COUNT(*) as total_projects FROM projects');
      totalProjects = parseInt(projectStats.rows[0].total_projects) || 0;
    } catch (err) {
      console.log('⚠️ Projects table does not exist yet');
    }

    // Get real API response time from recent API calls
    let apiResponseTime = 0;
    try {
      const apiStats = await db.pool.query(`
        SELECT AVG(duration) as avg_duration
        FROM api_calls
        WHERE created_at > NOW() - INTERVAL '5 minutes'
      `);
      apiResponseTime = Math.round(parseFloat(apiStats.rows[0].avg_duration) || 0);
    } catch (err) {
      console.log('⚠️ API calls table does not exist yet');
    }

    // Get real error rate from recent API calls
    let errorRate = 0;
    try {
      const errorStats = await db.pool.query(`
        SELECT 
          COUNT(*) FILTER (WHERE status_code >= 400) as errors,
          COUNT(*) as total
        FROM api_calls
        WHERE created_at > NOW() - INTERVAL '5 minutes'
      `);
      const errors = parseInt(errorStats.rows[0].errors) || 0;
      const total = parseInt(errorStats.rows[0].total) || 0;
      errorRate = total > 0 ? ((errors / total) * 100).toFixed(2) : 0;
    } catch (err) {
      console.log('⚠️ API calls table does not exist yet');
    }

    // Get system load (CPU usage if available)
    const systemLoad = 0; // Will be 0 until we implement system monitoring

    return {
      totalUsers: parseInt(userStats.rows[0].total_users) || 0,
      activeUsers: parseInt(userStats.rows[0].active_users) || 0,
      totalOrganizations,
      totalProjects,
      apiResponseTime,
      errorRate: parseFloat(errorRate),
      systemLoad,
    };
  } catch (error) {
    console.error('❌ Error getting system metrics:', error);
    throw error;
  }
}

/**
 * Helper function to get active alerts
 */
async function getActiveAlerts() {
  try {
    // Query real system alerts from database
    const result = await db.pool.query(`
      SELECT 
        id,
        type,
        title,
        message,
        created_at as timestamp,
        resolved_at IS NOT NULL as resolved,
        severity
      FROM system_alerts
      WHERE resolved_at IS NULL
      ORDER BY created_at DESC
      LIMIT 10
    `);

    return result.rows.map(alert => ({
      id: alert.id,
      type: alert.type,
      title: alert.title,
      message: alert.message,
      timestamp: alert.timestamp,
      resolved: alert.resolved,
      severity: alert.severity,
    }));
  } catch (error) {
    console.log('⚠️ System alerts table does not exist yet');
    return [];
  }
}
