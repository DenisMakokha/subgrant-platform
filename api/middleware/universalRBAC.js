const db = require('../config/database');
const capabilitiesCatalog = require('../config/capabilitiesCatalog');

/**
 * Universal Role-Based Access Control Middleware
 * 
 * This middleware provides capability-based access control that works with:
 * 1. Built-in roles (admin, partner, etc.)
 * 2. Custom roles created via Role Wizard
 * 3. Dynamic capabilities from the capabilities catalog
 * 
 * NO MORE ROLE CONFUSION - checks capabilities, not role names
 */

/**
 * Get user's capabilities from database
 * Supports both built-in roles and custom roles
 */
async function getUserCapabilities(userId, userRole) {
  try {
    // Admin has all capabilities automatically
    if (userRole === 'admin') {
      return capabilitiesCatalog.map(cap => cap.cap);
    }

    // Check if it's a custom role from role_wizard
    const customRoleQuery = `
      SELECT capabilities 
      FROM role_wizard 
      WHERE role_name = $1 AND is_active = true
      LIMIT 1
    `;
    
    const customRoleResult = await db.pool.query(customRoleQuery, [userRole]);
    
    if (customRoleResult.rows.length > 0) {
      // Custom role - return its capabilities
      return customRoleResult.rows[0].capabilities || [];
    }

    // Built-in role - map to capabilities
    const builtInCapabilities = getBuiltInRoleCapabilities(userRole);
    return builtInCapabilities;
    
  } catch (error) {
    console.error('Error fetching user capabilities:', error);
    return [];
  }
}

/**
 * Map built-in roles to capabilities
 * This provides backward compatibility with existing roles
 */
function getBuiltInRoleCapabilities(role) {
  const roleCapabilityMap = {
    partner: [
      'onboarding.view',
      'onboarding.complete',
      'organizations.view',
      'projects.view',
      'budgets.view',
      'budgets.create',
      'budgets.update',
      'contracts.view',
      'disbursements.view',
      'me_reports.view',
      'me_reports.create',
      'me_reports.submit',
      'financial_reports.view',
      'documents.view',
      'documents.upload',
      'compliance.view',
      'compliance.submit',
      'fund_requests.create',
      'fund_requests.view',
      'issues.create',
      'issues.view', // Partners can see their own issues
      'messages.view',
      'messages.send',
      'forum.view',
      'forum.post'
    ],
    
    grants_manager: [
      'onboarding.view',
      'onboarding.review',
      'organizations.view',
      'organizations.update',
      'projects.view',
      'projects.create',
      'projects.update',
      'budgets.view',
      'budgets.review',
      'budgets.approve',
      'contracts.view',
      'contracts.create',
      'contracts.review',
      'disbursements.view',
      'disbursements.approve',
      'me_reports.view',
      'me_reports.review',
      'financial_reports.view',
      'documents.view',
      'compliance.view',
      'compliance.review',
      'fund_requests.view',
      'fund_requests.review',
      'fund_requests.approve',
      'issues.view',
      'issues.update',
      'issues.assign',
      'approvals.act',
      'approvals.view',
      'audit_logs.view'
    ],
    
    coo: [
      'onboarding.view',
      'onboarding.review',
      'onboarding.approve',
      'organizations.view',
      'organizations.update',
      'organizations.manage_status',
      'projects.view',
      'projects.approve',
      'budgets.view',
      'budgets.approve',
      'contracts.view',
      'contracts.approve',
      'disbursements.view',
      'disbursements.approve',
      'me_reports.view',
      'me_reports.approve',
      'financial_reports.view',
      'compliance.view',
      'compliance.approve',
      'fund_requests.view',
      'fund_requests.approve',
      'issues.view',
      'issues.update',
      'issues.resolve',
      'approvals.act',
      'approvals.view',
      'approvals.delegate',
      'audit_logs.view'
    ],
    
    accountant: [
      'organizations.view',
      'projects.view',
      'budgets.view',
      'budgets.create',
      'budgets.update',
      'contracts.view',
      'disbursements.view',
      'disbursements.create',
      'disbursements.update',
      'financial_reports.view',
      'financial_reports.create',
      'receipts.view',
      'receipts.upload',
      'reconciliation.view',
      'reconciliation.create',
      'audit_logs.view'
    ],
    
    finance_manager: [
      'organizations.view',
      'projects.view',
      'budgets.view',
      'budgets.create',
      'budgets.update',
      'budgets.approve',
      'contracts.view',
      'contracts.create',
      'contracts.update',
      'disbursements.view',
      'disbursements.create',
      'disbursements.update',
      'disbursements.approve',
      'financial_reports.view',
      'financial_reports.create',
      'receipts.view',
      'receipts.approve',
      'reconciliation.view',
      'reconciliation.approve',
      'audit_logs.view'
    ],
    
    compliance_officer: [
      'organizations.view',
      'projects.view',
      'compliance.view',
      'compliance.review',
      'compliance.approve',
      'documents.view',
      'documents.review',
      'contracts.view',
      'me_reports.view',
      'me_reports.review',
      'audit_logs.view',
      'audit_logs.export'
    ],
    
    auditor: [
      'organizations.view',
      'projects.view',
      'budgets.view',
      'contracts.view',
      'disbursements.view',
      'me_reports.view',
      'financial_reports.view',
      'compliance.view',
      'documents.view',
      'audit_logs.view',
      'audit_logs.export'
    ],
    
    donor: [
      'organizations.view',
      'projects.view',
      'budgets.view',
      'contracts.view',
      'disbursements.view',
      'me_reports.view',
      'financial_reports.view',
      'compliance.view',
      'documents.view'
    ]
  };

  return roleCapabilityMap[role] || [];
}

/**
 * Main capability checking middleware
 * Usage: requireCapability('budgets.approve')
 */
function requireCapability(capability) {
  return async (req, res, next) => {
    try {
      const userId = req.auth?.sub || req.auth?.user_id || req.user?.sub || req.user?.id;
      const userRole = req.auth?.role || req.user?.role;

      if (!userId || !userRole) {
        return res.status(401).json({ 
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      // Get user's capabilities
      const userCapabilities = await getUserCapabilities(userId, userRole);

      // Check if user has the required capability
      if (!userCapabilities.includes(capability)) {
        console.warn(`⚠️ Access denied: User ${userId} (role: ${userRole}) attempted to access ${capability}`);
        return res.status(403).json({ 
          success: false,
          error: `Access denied: ${capability} capability required`,
          code: 'CAPABILITY_REQUIRED',
          required: capability,
          userRole: userRole
        });
      }

      // Attach capabilities to request for use in controllers
      req.auth = req.auth || {};
      req.auth.capabilities = userCapabilities;
      req.auth.hasCapability = (cap) => userCapabilities.includes(cap);

      next();
    } catch (error) {
      console.error('Error checking capability:', error);
      res.status(500).json({ 
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  };
}

/**
 * Check if user has ANY of the specified capabilities
 * Usage: requireAnyCapability(['budgets.view', 'budgets.approve'])
 */
function requireAnyCapability(capabilities) {
  return async (req, res, next) => {
    try {
      const userId = req.auth?.sub || req.auth?.user_id || req.user?.sub || req.user?.id;
      const userRole = req.auth?.role || req.user?.role;

      if (!userId || !userRole) {
        return res.status(401).json({ 
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      // Get user's capabilities
      const userCapabilities = await getUserCapabilities(userId, userRole);

      // Check if user has ANY of the required capabilities
      const hasAnyCapability = capabilities.some(cap => userCapabilities.includes(cap));

      if (!hasAnyCapability) {
        console.warn(`⚠️ Access denied: User ${userId} (role: ${userRole}) attempted to access one of ${capabilities.join(', ')}`);
        return res.status(403).json({ 
          success: false,
          error: `Access denied: One of these capabilities required: ${capabilities.join(', ')}`,
          code: 'CAPABILITY_REQUIRED',
          required: capabilities,
          userRole: userRole
        });
      }

      // Attach capabilities to request
      req.auth = req.auth || {};
      req.auth.capabilities = userCapabilities;
      req.auth.hasCapability = (cap) => userCapabilities.includes(cap);

      next();
    } catch (error) {
      console.error('Error checking capabilities:', error);
      res.status(500).json({ 
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  };
}

/**
 * Check if user has ALL of the specified capabilities
 * Usage: requireAllCapabilities(['budgets.view', 'budgets.approve'])
 */
function requireAllCapabilities(capabilities) {
  return async (req, res, next) => {
    try {
      const userId = req.auth?.sub || req.auth?.user_id || req.user?.sub || req.user?.id;
      const userRole = req.auth?.role || req.user?.role;

      if (!userId || !userRole) {
        return res.status(401).json({ 
          success: false,
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        });
      }

      // Get user's capabilities
      const userCapabilities = await getUserCapabilities(userId, userRole);

      // Check if user has ALL of the required capabilities
      const hasAllCapabilities = capabilities.every(cap => userCapabilities.includes(cap));

      if (!hasAllCapabilities) {
        const missingCapabilities = capabilities.filter(cap => !userCapabilities.includes(cap));
        console.warn(`⚠️ Access denied: User ${userId} (role: ${userRole}) missing capabilities: ${missingCapabilities.join(', ')}`);
        return res.status(403).json({ 
          success: false,
          error: `Access denied: All of these capabilities required: ${capabilities.join(', ')}`,
          code: 'CAPABILITIES_REQUIRED',
          required: capabilities,
          missing: missingCapabilities,
          userRole: userRole
        });
      }

      // Attach capabilities to request
      req.auth = req.auth || {};
      req.auth.capabilities = userCapabilities;
      req.auth.hasCapability = (cap) => userCapabilities.includes(cap);

      next();
    } catch (error) {
      console.error('Error checking capabilities:', error);
      res.status(500).json({ 
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  };
}

/**
 * Attach user capabilities to request without enforcing any requirement
 * Useful for controllers that need to check capabilities conditionally
 */
async function attachCapabilities(req, res, next) {
  try {
    const userId = req.auth?.sub || req.auth?.user_id || req.user?.sub || req.user?.id;
    const userRole = req.auth?.role || req.user?.role;

    if (userId && userRole) {
      const userCapabilities = await getUserCapabilities(userId, userRole);
      req.auth = req.auth || {};
      req.auth.capabilities = userCapabilities;
      req.auth.hasCapability = (cap) => userCapabilities.includes(cap);
    }

    next();
  } catch (error) {
    console.error('Error attaching capabilities:', error);
    next(); // Continue even if error - don't block request
  }
}

/**
 * Backward compatibility: Map old resource.action format to new capability format
 * Usage: checkPermission('budgets', 'approve') → checks 'budgets.approve'
 */
function checkPermission(resource, action) {
  const capability = `${resource}.${action}`;
  return requireCapability(capability);
}

module.exports = {
  requireCapability,
  requireAnyCapability,
  requireAllCapabilities,
  attachCapabilities,
  checkPermission, // Backward compatibility
  getUserCapabilities // Export for use in controllers
};
