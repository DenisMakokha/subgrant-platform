// Input sanitization middleware
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

// Create DOMPurify instance
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

/**
 * Sanitize input middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function sanitizeInput(req, res, next) {
  try {
    // Sanitize query parameters
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = DOMPurify.sanitize(req.query[key], {
          ALLOWED_TAGS: [],
          ALLOWED_ATTR: []
        });
      }
    }
    
    // Sanitize request body
    if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
      for (const key in req.body) {
        if (typeof req.body[key] === 'string') {
          req.body[key] = DOMPurify.sanitize(req.body[key], {
            ALLOWED_TAGS: [],
            ALLOWED_ATTR: []
          });
        }
      }
    }
    
    // Sanitize URL parameters
    for (const key in req.params) {
      if (typeof req.params[key] === 'string') {
        req.params[key] = DOMPurify.sanitize(req.params[key], {
          ALLOWED_TAGS: [],
          ALLOWED_ATTR: []
        });
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { sanitizeInput };