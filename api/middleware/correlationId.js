/**
 * Correlation ID Middleware
 * 
 * Adds a unique correlation ID to each request for tracing across services
 * and log aggregation. The ID is:
 * - Generated for new requests
 * - Extracted from X-Correlation-ID header if present
 * - Attached to the request object
 * - Sent back in response headers
 * 
 * Usage in server.js:
 *   const correlationId = require('./middleware/correlationId');
 *   app.use(correlationId);
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * Correlation ID middleware
 * Adds unique tracking ID to each request
 */
function correlationIdMiddleware(req, res, next) {
  // Check if correlation ID already exists in headers
  let correlationId = req.get('X-Correlation-ID') || req.get('x-request-id');
  
  // Generate new ID if not present
  if (!correlationId) {
    correlationId = uuidv4();
  }
  
  // Attach to request object for use in controllers
  req.correlationId = correlationId;
  
  // Add to response headers for client tracking
  res.setHeader('X-Correlation-ID', correlationId);
  
  // Log the incoming request with correlation ID
  logger.http('Incoming request', {
    method: req.method,
    url: req.originalUrl || req.url,
    correlationId,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent')
  });
  
  // Capture response time
  const startTime = Date.now();
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'http';
    
    logger[logLevel]('Request completed', {
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      correlationId
    });
  });
  
  next();
}

module.exports = correlationIdMiddleware;
