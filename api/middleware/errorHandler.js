// Error handling middleware
const { 
  ValidationError, 
  NotFoundError, 
  UnauthorizedError, 
  ForbiddenError, 
  ConflictError, 
  InternalServerError 
} = require('../errors');
const { logError } = require('../services/observabilityService');

/**
 * Error handling middleware
 * @param {Error} error - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function errorHandler(error, req, res, next) {
  // Log the error with context
  logError(error, 'middleware', {
    url: req.url,
    method: req.method,
    userId: req.user ? req.user.id : null
  });

  // Handle different error types
  if (error instanceof ValidationError) {
    return res.status(400).json({
      error: error.message,
      details: error.details
    });
  }
  
  if (error instanceof NotFoundError) {
    return res.status(404).json({
      error: error.message
    });
  }
  
  if (error instanceof UnauthorizedError) {
    return res.status(401).json({
      error: error.message
    });
  }
  
  if (error instanceof ForbiddenError) {
    return res.status(403).json({
      error: error.message
    });
  }
  
  if (error instanceof ConflictError) {
    return res.status(409).json({
      error: error.message
    });
  }
  
  // Handle Zod validation errors
  if (error.name === 'ZodError') {
    const formattedErrors = error.errors.map(err => ({
      path: err.path.join('.'),
      message: err.message,
      code: err.code
    }));
    
    return res.status(400).json({
      error: 'Validation failed',
      details: formattedErrors
    });
  }
  
  // Handle database constraint violations
  if (error.code && error.code.startsWith('23')) {
    return res.status(400).json({
      error: 'Database constraint violation',
      details: error.message
    });
  }
  
  // Handle JSON parsing errors
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      error: 'Invalid JSON in request body'
    });
  }
  
  // Default error response
  res.status(500).json({
    error: 'Internal server error'
  });
}

module.exports = { errorHandler };