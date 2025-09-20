const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const db = require('../config/database');

// Rate limiting for sensitive operations
const createEmailVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 requests per windowMs
  message: { error: 'Too many verification emails sent. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const createRegistrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 registration attempts per hour
  message: { error: 'Too many registration attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Authentication middleware
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const userResult = await db.pool.query(
      'SELECT id, email, first_name, last_name, email_verified_at FROM users WHERE id = $1',
      [decoded.sub || decoded.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = userResult.rows[0];
    req.auth = decoded; // Also set req.auth for compatibility
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

// Email verification middleware
const requireEmailVerified = async (req, res, next) => {
  try {
    if (!req.user.email_verified_at) {
      return res.status(403).json({ 
        error: 'Email verification required',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }
    next();
  } catch (error) {
    console.error('Email verification middleware error:', error);
    res.status(500).json({ error: 'Verification check failed' });
  }
};

// Organization ownership middleware
const requireOrgOwnership = async (req, res, next) => {
  try {
    const organizationId = req.params.organizationId || req.body.organizationId;
    
    if (!organizationId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    const orgResult = await db.pool.query(
      'SELECT id, owner_user_id, status FROM organizations WHERE id = $1',
      [organizationId]
    );

    if (orgResult.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const organization = orgResult.rows[0];
    
    if (organization.owner_user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    req.organization = organization;
    next();
  } catch (error) {
    console.error('Organization ownership middleware error:', error);
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

// Organization status middleware
const requireOrgStatus = (...allowedStatuses) => {
  return async (req, res, next) => {
    try {
      if (!req.organization) {
        // If organization not loaded, load it
        const organizationId = req.params.organizationId || req.body.organizationId;
        const orgResult = await db.pool.query(
          'SELECT id, owner_user_id, status FROM organizations WHERE id = $1',
          [organizationId]
        );

        if (orgResult.rows.length === 0) {
          return res.status(404).json({ error: 'Organization not found' });
        }

        req.organization = orgResult.rows[0];
      }

      if (!allowedStatuses.includes(req.organization.status)) {
        return res.status(403).json({ 
          error: 'Organization status does not allow this action',
          currentStatus: req.organization.status,
          allowedStatuses
        });
      }

      next();
    } catch (error) {
      console.error('Organization status middleware error:', error);
      res.status(500).json({ error: 'Status check failed' });
    }
  };
};

// Admin role middleware
const requireAdminRole = async (req, res, next) => {
  try {
    // Check if user has admin role in system or for specific organization
    const organizationId = req.params.organizationId;
    
    let query, params;
    if (organizationId) {
      // Check organization-specific admin role
      query = `
        SELECT role FROM org_roles 
        WHERE user_id = $1 AND organization_id = $2 AND role IN ('admin_reviewer')
      `;
      params = [req.user.id, organizationId];
    } else {
      // Check system admin role (you might have a separate system_roles table)
      // For now, we'll check if user has admin role in any organization
      query = `
        SELECT role FROM org_roles 
        WHERE user_id = $1 AND role IN ('admin_reviewer')
        LIMIT 1
      `;
      params = [req.user.id];
    }

    const roleResult = await db.pool.query(query, params);
    
    if (roleResult.rows.length === 0) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    console.error('Admin role middleware error:', error);
    res.status(500).json({ error: 'Role check failed' });
  }
};

// Get user's organization
const getUserOrganization = async (req, res, next) => {
  try {
    const orgResult = await db.pool.query(
      'SELECT id, status, created_at, updated_at FROM organizations WHERE owner_user_id = $1',
      [req.user.id]
    );

    if (orgResult.rows.length === 0) {
      req.userOrganization = null;
    } else {
      req.userOrganization = orgResult.rows[0];
    }

    next();
  } catch (error) {
    console.error('Get user organization middleware error:', error);
    res.status(500).json({ error: 'Failed to get organization' });
  }
};

// Audit logging middleware
const auditLog = (action) => {
  return async (req, res, next) => {
    try {
      const originalSend = res.send;
      
      res.send = function(data) {
        // Log the action after successful response
        if (res.statusCode < 400) {
          const logData = {
            actor_user_id: req.user?.id,
            organization_id: req.organization?.id || req.userOrganization?.id,
            action,
            payload_hash: require('crypto').createHash('sha256').update(JSON.stringify(req.body || {})).digest('hex'),
            ip_address: req.ip,
            user_agent: req.get('User-Agent')
          };

          db.pool.query(
            `INSERT INTO audit_logs (actor_user_id, organization_id, action, payload_hash, ip_address, user_agent)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [logData.actor_user_id, logData.organization_id, logData.action, logData.payload_hash, logData.ip_address, logData.user_agent]
          ).catch(err => console.error('Audit log error:', err));
        }
        
        originalSend.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Audit middleware error:', error);
      next();
    }
  };
};

module.exports = {
  requireAuth,
  requireEmailVerified,
  requireOrgOwnership,
  requireOrgStatus,
  requireAdminRole,
  getUserOrganization,
  auditLog,
  createEmailVerificationLimiter,
  createRegistrationLimiter,
};
