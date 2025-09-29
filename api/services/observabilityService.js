// Observability service for logging and monitoring

const winston = require('winston');
const db = require('../config/database');

// Create a logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'ssot-platform' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // In production, you might want to add file transports or external logging services
  ]
});

// Metrics storage (in a real implementation, this would be stored in a time-series database)
const metrics = {
  apiCalls: 0,
  approvalsCreated: 0,
  approvalsProcessed: 0,
  fundRequestsCreated: 0,
  fundRequestsProcessed: 0,
  errors: 0
};

/**
 * Log an API call
 * @param {string} method - HTTP method
 * @param {string} url - Request URL
 * @param {number} statusCode - HTTP status code
 * @param {number} duration - Request duration in ms
 * @param {string} userId - User ID (if authenticated)
 */
function logApiCall(method, url, statusCode, duration, userId = null) {
  metrics.apiCalls++;
  
  logger.info('API call', {
    method,
    url,
    statusCode,
    duration,
    userId,
    timestamp: new Date().toISOString()
  });
}

/**
 * Log an approval creation
 * @param {string} approvalId - Approval ID
 * @param {string} entityType - Entity type
 * @param {string} entityId - Entity ID
 * @param {string} userId - User ID
 */
function logApprovalCreation(approvalId, entityType, entityId, userId) {
  metrics.approvalsCreated++;
  
  logger.info('Approval created', {
    approvalId,
    entityType,
    entityId,
    userId,
    timestamp: new Date().toISOString()
  });
}

/**
 * Log an approval decision
 * @param {string} approvalId - Approval ID
 * @param {string} decision - Decision (APPROVE/REJECT)
 * @param {string} userId - User ID
 * @param {string} comment - Decision comment
 */
function logApprovalDecision(approvalId, decision, userId, comment = null) {
  metrics.approvalsProcessed++;
  
  logger.info('Approval decision', {
    approvalId,
    decision,
    userId,
    comment,
    timestamp: new Date().toISOString()
  });
}

/**
 * Log a fund request creation
 * @param {string} fundRequestId - Fund request ID
 * @param {number} amount - Request amount
 * @param {string} currency - Request currency
 * @param {string} userId - User ID
 */
function logFundRequestCreation(fundRequestId, amount, currency, userId) {
  metrics.fundRequestsCreated++;
  
  logger.info('Fund request created', {
    fundRequestId,
    amount,
    currency,
    userId,
    timestamp: new Date().toISOString()
  });
}

/**
 * Log a fund request processing
 * @param {string} fundRequestId - Fund request ID
 * @param {string} status - New status
 * @param {string} userId - User ID
 */
function logFundRequestProcessing(fundRequestId, status, userId) {
  metrics.fundRequestsProcessed++;
  
  logger.info('Fund request processed', {
    fundRequestId,
    status,
    userId,
    timestamp: new Date().toISOString()
  });
}

/**
 * Log an error
 * @param {Error} error - Error object
 * @param {string} context - Context where error occurred
 * @param {any} metadata - Additional metadata
 */
function logError(error, context, metadata = {}) {
  metrics.errors++;
  
  logger.error('Application error', {
    error: error.message,
    stack: error.stack,
    context,
    ...metadata,
    timestamp: new Date().toISOString()
  });
}

/**
 * Get current metrics
 * @returns {Object} Current metrics
 */
function getMetrics() {
  return { ...metrics };
}

/**
 * Get system health status
 * @returns {Promise<Object>} Health status
 */
async function getHealthStatus() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    metrics: getMetrics()
  };
  
  // Check database connectivity
  try {
    const client = await db.pool.connect();
    await client.query('SELECT 1');
    client.release();
    health.database = 'connected';
  } catch (error) {
    health.status = 'unhealthy';
    health.database = 'disconnected';
    logError(error, 'health-check');
  }
  
  return health;
}

/**
 * Log system startup
 */
function logStartup() {
  logger.info('SSOT Platform starting up', {
    version: process.env.npm_package_version || 'unknown',
    nodeVersion: process.version,
    platform: process.platform,
    timestamp: new Date().toISOString()
  });
}

/**
 * Log system shutdown
 */
function logShutdown() {
  logger.info('SSOT Platform shutting down', {
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  logger,
  logApiCall,
  logApprovalCreation,
  logApprovalDecision,
  logFundRequestCreation,
  logFundRequestProcessing,
  logError,
  getMetrics,
  getHealthStatus,
  logStartup,
  logShutdown
};