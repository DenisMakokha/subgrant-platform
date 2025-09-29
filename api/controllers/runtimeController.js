const { FEATURE_FLAGS } = require('../registry/featureFlags');
const { ValidationError, NotFoundError } = require('../errors');
const { sanitizeInput } = require('../middleware/sanitization');
const { logApiCall, logError } = require('../services/observabilityService');

// Mock data for demonstration
// In a real implementation, this would fetch from the database
const userRoles = [
  { user_id: 'user1', role_id: 'admin' },
  { user_id: 'user2', role_id: 'partner' }
];

const userCaps = {
  'user1': ['wizard.admin', 'line.create', 'line.update', 'line.submit', 'approval.act'],
  'user2': ['fundRequest.create', 'fundRequest.submit']
};

const userScopes = {
  'user1': { project: 'all', tenant: 'all' },
  'user2': { project: 'self', tenant: 'current' }
};

const userFlags = {
  'user1': { 'contracts.enabled': true, 'approvals.enabled': true },
  'user2': { 'contracts.enabled': false, 'approvals.enabled': true }
};

const dashboardsActive = {
  'admin': { 
    role_id: 'admin', 
    version: 1, 
    menus_json: [{ key: 'admin', label: 'Admin', icon: 'admin', items: [{ key: 'wizard', label: 'Role & Dashboard Wizard', route: '/app/admin/wizard' }] }], 
    pages_json: [{ key: 'dashboard', route: '/app/dashboard', widgets: [] }] 
  },
  'partner': { 
    role_id: 'partner', 
    version: 1, 
    menus_json: [{ key: 'finance', label: 'Finance', icon: 'finance', items: [{ key: 'fund-requests', label: 'Fund Requests', route: '/app/partner/projects/:projectId/fund-requests' }] }], 
    pages_json: [{ key: 'dashboard', route: '/app/dashboard', widgets: [] }] 
  }
};

exports.getExperience = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      const userId = req.user.id;
      
      // Find user roles
      const roles = userRoles.filter(ur => ur.user_id === userId).map(ur => ({ id: ur.role_id, label: ur.role_id }));
      
      // Get user capabilities
      const caps = userCaps[userId] || [];
      
      // Get user scopes
      const scopes = userScopes[userId] || { project: 'self', tenant: 'current' };
      
      // Get user flags
      const flags = userFlags[userId] || {};
      
      // Get feature flags with default values
      const featureFlags = {};
      for (const flag of FEATURE_FLAGS) {
        featureFlags[flag.key] = flags[flag.key] !== undefined ? flags[flag.key] : flag.defaultValue;
      }
      
      // Log successful API call
      logApiCall('GET', '/runtime/experience', 200, Date.now() - startTime, userId);
      
      res.json({
        user: { id: userId, email: `${userId}@example.com` },
        roles,
        caps,
        scopes,
        flags: featureFlags
      });
    } catch (error) {
      // Log error
      logError(error, 'getExperience', { userId: req.user.id });
      
      // Log failed API call
      logApiCall('GET', '/runtime/experience', 500, Date.now() - startTime, req.user.id);
      
      next(error);
    }
  }
];

exports.getDashboardConfig = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      const { role } = req.query;
      
      if (!role) {
        // Log failed API call
        logApiCall('GET', '/runtime/dashboard', 400, Date.now() - startTime, req.user.id);
        throw new ValidationError('role parameter is required');
      }
      
      const dashboard = dashboardsActive[role];
      if (!dashboard) {
        // Log failed API call
        logApiCall('GET', '/runtime/dashboard', 404, Date.now() - startTime, req.user.id);
        throw new NotFoundError(`Dashboard not found for role: ${role}`);
      }
      
      // Log successful API call
      logApiCall('GET', '/runtime/dashboard', 200, Date.now() - startTime, req.user.id);
      
      res.json(dashboard);
    } catch (error) {
      // Log error
      logError(error, 'getDashboardConfig', { userId: req.user.id });
      
      // Log failed API call
      logApiCall('GET', '/runtime/dashboard', 500, Date.now() - startTime, req.user.id);
      
      next(error);
    }
  }
];