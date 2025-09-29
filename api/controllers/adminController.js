const { CAPABILITIES } = require('../registry/capabilities');
const { DATA_KEYS } = require('../registry/dataKeys');
const { invalidateCache } = require('../cache/cacheInvalidation');
const { ValidationError, NotFoundError } = require('../errors');
const { sanitizeInput } = require('../middleware/sanitization');
const { logApiCall, logError } = require('../services/observabilityService');

// Mock data for demonstration
// In a real implementation, this would fetch from the database
const rolesRegistry = [
  { id: 'admin', label: 'Administrator', inherits: [], caps: ['wizard.admin'], scopes: { project: 'all', tenant: 'all' }, visibility_rules: [], version: 1, active: true },
  { id: 'partner', label: 'Partner', inherits: [], caps: [], scopes: { project: 'self', tenant: 'current' }, visibility_rules: [], version: 1, active: true }
];

const dashboardsRegistry = [
  { 
    role_id: 'admin', 
    version: 1, 
    menus_json: [], 
    pages_json: [], 
    active: true 
  },
  { 
    role_id: 'partner', 
    version: 1, 
    menus_json: [], 
    pages_json: [], 
    active: true 
  }
];

exports.getCatalogCaps = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      // Log successful API call
      logApiCall('GET', '/admin/catalog/caps', 200, Date.now() - startTime, req.user.id);
      
      res.json(CAPABILITIES);
    } catch (error) {
      // Log error
      logError(error, 'getCatalogCaps', { userId: req.user.id });
      
      // Log failed API call
      logApiCall('GET', '/admin/catalog/caps', 500, Date.now() - startTime, req.user.id);
      
      next(error);
    }
  }
];

exports.getCatalogDataKeys = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      // Log successful API call
      logApiCall('GET', '/admin/catalog/data-keys', 200, Date.now() - startTime, req.user.id);
      
      res.json(DATA_KEYS);
    } catch (error) {
      // Log error
      logError(error, 'getCatalogDataKeys', { userId: req.user.id });
      
      // Log failed API call
      logApiCall('GET', '/admin/catalog/data-keys', 500, Date.now() - startTime, req.user.id);
      
      next(error);
    }
  }
];

exports.listRoles = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      // Log successful API call
      logApiCall('GET', '/admin/roles', 200, Date.now() - startTime, req.user.id);
      
      res.json(rolesRegistry);
    } catch (error) {
      // Log error
      logError(error, 'listRoles', { userId: req.user.id });
      
      // Log failed API call
      logApiCall('GET', '/admin/roles', 500, Date.now() - startTime, req.user.id);
      
      next(error);
    }
  }
];

exports.createOrUpdateRole = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      // In a real implementation, this would validate and upsert to the database
      const roleDef = req.body;
      
      // Invalidate cache for roles
      invalidateCache('roles');
      
      // Log successful API call
      logApiCall('POST', '/admin/roles', 200, Date.now() - startTime, req.user.id);
      
      res.json({ message: 'Role created/updated successfully', role: roleDef });
    } catch (error) {
      // Log error
      logError(error, 'createOrUpdateRole', { userId: req.user.id });
      
      // Log failed API call
      logApiCall('POST', '/admin/roles', 500, Date.now() - startTime, req.user.id);
      
      next(error);
    }
  }
];

exports.publishRole = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      const { id, version } = req.body;
      // In a real implementation, this would set active true and deactivate prior versions
      
      // Log successful API call
      logApiCall('POST', '/admin/roles/publish', 200, Date.now() - startTime, req.user.id);
      
      res.json({ message: `Role ${id} version ${version} published successfully` });
    } catch (error) {
      // Log error
      logError(error, 'publishRole', { userId: req.user.id });
      
      // Log failed API call
      logApiCall('POST', '/admin/roles/publish', 500, Date.now() - startTime, req.user.id);
      
      next(error);
    }
  }
];

exports.listDashboards = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      // Log successful API call
      logApiCall('GET', '/admin/dashboards', 200, Date.now() - startTime, req.user.id);
      
      res.json(dashboardsRegistry);
    } catch (error) {
      // Log error
      logError(error, 'listDashboards', { userId: req.user.id });
      
      // Log failed API call
      logApiCall('GET', '/admin/dashboards', 500, Date.now() - startTime, req.user.id);
      
      next(error);
    }
  }
];

exports.createOrUpdateDashboard = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      // In a real implementation, this would validate and upsert to the database
      const dashboardDef = req.body;
      
      // Invalidate cache for dashboards
      invalidateCache('dashboards');
      
      // Log successful API call
      logApiCall('POST', '/admin/dashboards', 200, Date.now() - startTime, req.user.id);
      
      res.json({ message: 'Dashboard created/updated successfully', dashboard: dashboardDef });
    } catch (error) {
      // Log error
      logError(error, 'createOrUpdateDashboard', { userId: req.user.id });
      
      // Log failed API call
      logApiCall('POST', '/admin/dashboards', 500, Date.now() - startTime, req.user.id);
      
      next(error);
    }
  }
];

exports.publishDashboard = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      const { role_id, version } = req.body;
      // In a real implementation, this would activate the dashboard
      
      // Log successful API call
      logApiCall('POST', '/admin/dashboards/publish', 200, Date.now() - startTime, req.user.id);
      
      res.json({ message: `Dashboard for role ${role_id} version ${version} published successfully` });
    } catch (error) {
      // Log error
      logError(error, 'publishDashboard', { userId: req.user.id });
      
      // Log failed API call
      logApiCall('POST', '/admin/dashboards/publish', 500, Date.now() - startTime, req.user.id);
      
      next(error);
    }
  }
];

exports.previewData = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      const { dataKey, params } = req.body;
      // In a real implementation, this would return mocked data for the dataKey with params
      
      // Log successful API call
      logApiCall('POST', '/admin/preview-data', 200, Date.now() - startTime, req.user.id);
      
      res.json({ message: `Preview data for ${dataKey}`, data: {}, params });
    } catch (error) {
      // Log error
      logError(error, 'previewData', { userId: req.user.id });
      
      // Log failed API call
      logApiCall('POST', '/admin/preview-data', 500, Date.now() - startTime, req.user.id);
      
      next(error);
    }
  }
];