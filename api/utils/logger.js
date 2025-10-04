/**
 * Structured Logger Utility
 * 
 * Provides centralized, structured logging using Winston
 * Replaces console.log/error/warn with proper structured logs
 * 
 * Usage:
 *   const logger = require('./utils/logger');
 *   logger.info('User logged in', { userId: 123, email: 'user@example.com' });
 *   logger.error('Database connection failed', { error: err.message, correlationId: req.correlationId });
 */

const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Determine log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'info';
};

// Custom format for structured logging
const structuredFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development (human-readable)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => {
      const { timestamp, level, message, ...meta } = info;
      const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
      return `${timestamp} [${level}]: ${message} ${metaStr}`;
    }
  )
);

// Define transports
const transports = [];

// Console transport (always enabled)
if (process.env.NODE_ENV !== 'test') {
  transports.push(
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? structuredFormat : consoleFormat
    })
  );
}

// File transports for production
if (process.env.NODE_ENV === 'production') {
  // Error log file
  transports.push(
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      format: structuredFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    })
  );

  // Combined log file
  transports.push(
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
      format: structuredFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format: structuredFormat,
  transports,
  exitOnError: false,
});

// Helper function to sanitize sensitive data
const sanitize = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveFields = [
    'password',
    'token',
    'apiKey',
    'api_key',
    'secret',
    'authorization',
    'cookie',
    'session',
    'creditCard',
    'ssn',
    'passport'
  ];
  
  const sanitized = { ...data };
  
  Object.keys(sanitized).forEach(key => {
    const lowerKey = key.toLowerCase();
    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitize(sanitized[key]);
    }
  });
  
  return sanitized;
};

// Enhanced logging methods with automatic sanitization
const log = {
  error: (message, meta = {}) => {
    logger.error(message, sanitize(meta));
  },
  
  warn: (message, meta = {}) => {
    logger.warn(message, sanitize(meta));
  },
  
  info: (message, meta = {}) => {
    logger.info(message, sanitize(meta));
  },
  
  http: (message, meta = {}) => {
    logger.http(message, sanitize(meta));
  },
  
  debug: (message, meta = {}) => {
    logger.debug(message, sanitize(meta));
  },
  
  // Special method for security events
  security: (message, meta = {}) => {
    logger.warn(`[SECURITY] ${message}`, sanitize(meta));
  },
  
  // Special method for audit logs
  audit: (message, meta = {}) => {
    logger.info(`[AUDIT] ${message}`, sanitize(meta));
  }
};

// Export logger
module.exports = log;

// Also export the Winston logger instance for advanced use cases
module.exports.winston = logger;
module.exports.sanitize = sanitize;
