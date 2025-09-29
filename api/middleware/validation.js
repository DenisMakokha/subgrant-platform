// Validation middleware using Zod schemas
const { ZodError } = require('zod');

/**
 * Create a validation middleware function
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Express middleware function
 */
function validate(schema) {
  return (req, res, next) => {
    try {
      // Parse and validate the request body
      const parsedData = schema.parse(req.body);
      
      // Replace req.body with the parsed and validated data
      req.body = parsedData;
      
      // Continue to the next middleware
      next();
    } catch (error) {
      // Handle Zod validation errors
      if (error instanceof ZodError) {
        // Format the error for the client
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
      
      // Pass other errors to the next middleware
      next(error);
    }
  };
}

/**
 * Create a validation middleware function for query parameters
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Express middleware function
 */
function validateQuery(schema) {
  return (req, res, next) => {
    try {
      // Parse and validate the query parameters
      const parsedData = schema.parse(req.query);
      
      // Replace req.query with the parsed and validated data
      req.query = parsedData;
      
      // Continue to the next middleware
      next();
    } catch (error) {
      // Handle Zod validation errors
      if (error instanceof ZodError) {
        // Format the error for the client
        const formattedErrors = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        
        return res.status(400).json({
          error: 'Query validation failed',
          details: formattedErrors
        });
      }
      
      // Pass other errors to the next middleware
      next(error);
    }
  };
}

module.exports = { validate, validateQuery };