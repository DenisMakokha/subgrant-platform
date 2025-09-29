const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { applyRLS } = require('./security');

// Load environment variables
dotenv.config();

// Mock user data for testing with scopes
const mockUsers = [
  {
    id: '1',
    email: 'admin@example.com',
    role: 'admin',
    scopes: { project: 'all', tenant: 'all' }
  },
  {
    id: '2',
    email: 'partner@example.com',
    role: 'partner_user',
    scopes: { project: 'self', tenant: 'current' }
  }
];

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    
    // For mock database, we'll just attach the user data directly
    req.user = user;
    next();
  });
};

const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Export the authenticateToken function as the default export
// and authorizeRole as a named export
module.exports = authenticateToken;
module.exports.authenticateToken = authenticateToken;
module.exports.authorizeRole = authorizeRole;