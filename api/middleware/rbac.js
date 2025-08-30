const User = require('../models/user');

// Define role permissions
const rolePermissions = {
  admin: {
    organizations: ['create', 'read', 'update', 'delete'],
    users: ['create', 'read', 'update', 'delete'],
    projects: ['create', 'read', 'update', 'delete'],
    budget_categories: ['create', 'read', 'update', 'delete'],
    budgets: ['create', 'read', 'update', 'delete'],
    budget_lines: ['create', 'read', 'update', 'delete'],
    review_comments: ['create', 'read', 'update', 'delete'],
    contracts: ['create', 'read', 'update', 'delete'],
    audit_logs: ['read']
  },
  accountant: {
    organizations: ['read'],
    users: ['read'],
    projects: ['read'],
    budget_categories: ['read'],
    budgets: ['create', 'read', 'update'],
    budget_lines: ['create', 'read', 'update'],
    review_comments: ['create', 'read', 'update'],
    contracts: ['read'],
    audit_logs: ['read']
  },
  budget_holder: {
    organizations: ['read'],
    users: ['read'],
    projects: ['read'],
    budget_categories: ['read'],
    budgets: ['create', 'read', 'update'],
    budget_lines: ['create', 'read', 'update'],
    review_comments: ['create', 'read', 'update'],
    contracts: ['read'],
    audit_logs: ['read']
  },
  finance_manager: {
    organizations: ['read'],
    users: ['read'],
    projects: ['read'],
    budget_categories: ['read'],
    budgets: ['create', 'read', 'update', 'delete'],
    budget_lines: ['create', 'read', 'update', 'delete'],
    review_comments: ['create', 'read', 'update', 'delete'],
    contracts: ['create', 'read', 'update', 'delete'],
    audit_logs: ['read']
  },
  partner_user: {
    organizations: ['read'],
    users: ['read'],
    projects: ['read'],
    budget_categories: ['read'],
    budgets: ['create', 'read', 'update'],
    budget_lines: ['create', 'read', 'update'],
    review_comments: ['create', 'read', 'update'],
    contracts: ['read'],
    audit_logs: ['read']
  },
  auditor: {
    organizations: ['read'],
    users: ['read'],
    projects: ['read'],
    budget_categories: ['read'],
    budgets: ['read'],
    budget_lines: ['read'],
    review_comments: ['read'],
    contracts: ['read'],
    audit_logs: ['read']
  },
  donor: {
    organizations: ['read'],
    users: ['read'],
    projects: ['read'],
    budget_categories: ['read'],
    budgets: ['read'],
    budget_lines: ['read'],
    review_comments: ['read'],
    contracts: ['read'],
    me_reports: ['read'],
    financial_reports: ['read'],
    audit_logs: ['read']
  },
  system_administrator: {
    organizations: ['create', 'read', 'update', 'delete'],
    users: ['create', 'read', 'update', 'delete'],
    projects: ['create', 'read', 'update', 'delete'],
    budget_categories: ['create', 'read', 'update', 'delete'],
    budgets: ['create', 'read', 'update', 'delete'],
    budget_lines: ['create', 'read', 'update', 'delete'],
    review_comments: ['create', 'read', 'update', 'delete'],
    contracts: ['create', 'read', 'update', 'delete'],
    audit_logs: ['read', 'export']
  },
  compliance_officer: {
    organizations: ['read'],
    users: ['read'],
    projects: ['read'],
    budget_categories: ['read'],
    budgets: ['read'],
    budget_lines: ['read'],
    review_comments: ['read'],
    contracts: ['read'],
    audit_logs: ['read', 'export']
  }
};

// Check if user has permission for a specific resource and action
function checkPermission(resource, action) {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;

      // Get user details
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if role exists in permissions
      if (!rolePermissions[userRole]) {
        return res.status(403).json({ error: 'Access denied: Invalid role' });
      }

      // Check if resource exists for this role
      if (!rolePermissions[userRole][resource]) {
        return res.status(403).json({ error: `Access denied: No permissions for ${resource}` });
      }

      // Check if action is allowed for this resource
      if (!rolePermissions[userRole][resource].includes(action)) {
        return res.status(403).json({ error: `Access denied: No permission to ${action} ${resource}` });
      }

      // For partner users, check if they're accessing their own organization's data
      if (userRole === 'partner_user' && user.organization_id) {
        // Add organization_id to request for filtering in controllers
        req.user.organization_id = user.organization_id;
      }

      next();
    } catch (error) {
      console.error('Error checking permissions:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

module.exports = { checkPermission };