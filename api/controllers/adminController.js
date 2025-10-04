const capabilitiesCatalog = require('../config/capabilitiesCatalog');
const scopesCatalog = require('../config/scopesCatalog');
const { CAPABILITIES } = require('../registry/capabilities');
const { DATA_KEYS } = require('../registry/dataKeys');
const { invalidateCache } = require('../cache/cacheInvalidation');
const { ValidationError, NotFoundError } = require('../errors');
const { sanitizeInput } = require('../middleware/sanitization');
const { logApiCall, logError } = require('../services/observabilityService');
const adminActivityLogService = require('../services/adminActivityLogService');

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

exports.getCapabilitiesCatalog = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      // Log successful API call
      logApiCall('GET', '/admin/catalog/capabilities', 200, Date.now() - startTime, req.user.id);
      
      res.json(capabilitiesCatalog);
    } catch (error) {
      // Log error
      logError(error, 'getCapabilitiesCatalog', { userId: req.user.id });
      
      // Log failed API call
      logApiCall('GET', '/admin/catalog/capabilities', 500, Date.now() - startTime, req.user.id);
      
      next(error);
    }
  }
];

exports.getScopesCatalog = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      // Log successful API call
      logApiCall('GET', '/admin/catalog/scopes', 200, Date.now() - startTime, req.user.id);
      
      res.json(scopesCatalog);
    } catch (error) {
      // Log error
      logError(error, 'getScopesCatalog', { userId: req.user.id });
      
      // Log failed API call
      logApiCall('GET', '/admin/catalog/scopes', 500, Date.now() - startTime, req.user.id);
      
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
      
      // Log admin activity
      await adminActivityLogService.logActivity({
        adminId: req.user?.id,
        action: 'create_or_update_role',
        entityType: 'role',
        entityId: roleDef.id || null,
        changes: {
          before: null, // Would fetch existing role in real implementation
          after: roleDef
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      // Log successful API call
      logApiCall('POST', '/admin/roles', 200, Date.now() - startTime, req.user.id);
      
      res.json({ message: 'Role created/updated successfully', role: roleDef });
    } catch (error) {
      // Log failed activity
      await adminActivityLogService.logActivity({
        adminId: req.user?.id,
        action: 'create_or_update_role',
        entityType: 'role',
        result: 'error',
        errorMessage: error.message,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
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
      
      // Log admin activity
      await adminActivityLogService.logActivity({
        adminId: req.user?.id,
        action: 'publish_role',
        entityType: 'role',
        entityId: id,
        changes: {
          before: { active: false, version: version - 1 },
          after: { active: true, version }
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      // Log successful API call
      logApiCall('POST', '/admin/roles/publish', 200, Date.now() - startTime, req.user.id);
      
      res.json({ message: `Role ${id} version ${version} published successfully` });
    } catch (error) {
      // Log failed activity
      await adminActivityLogService.logActivity({
        adminId: req.user?.id,
        action: 'publish_role',
        entityType: 'role',
        result: 'error',
        errorMessage: error.message,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      // Log error
      logError(error, 'publishRole', { userId: req.user.id });
      
      // Log failed API call
      logApiCall('POST', '/admin/roles/publish', 500, Date.now() - startTime, req.user.id);
      
      next(error);
    }
  }
];

exports.deleteRole = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      const { roleId } = req.params;
      
      // Get role data before deletion for logging
      const roleToDelete = rolesRegistry.find(r => r.id === roleId);
      
      // In a real implementation, check if role has users assigned
      // If yes, prevent deletion or reassign users
      
      // Invalidate cache
      invalidateCache('roles');
      
      // Log admin activity
      await adminActivityLogService.logActivity({
        adminId: req.user?.id,
        action: 'delete_role',
        entityType: 'role',
        entityId: roleId,
        changes: {
          before: roleToDelete || { id: roleId },
          after: null
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      // Log successful API call
      logApiCall('DELETE', `/admin/roles/${roleId}`, 200, Date.now() - startTime, req.user.id);
      
      res.json({ message: `Role ${roleId} deleted successfully` });
    } catch (error) {
      // Log failed activity
      await adminActivityLogService.logActivity({
        adminId: req.user?.id,
        action: 'delete_role',
        entityType: 'role',
        entityId: req.params.roleId,
        result: 'error',
        errorMessage: error.message,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      // Log error
      logError(error, 'deleteRole', { userId: req.user.id, roleId: req.params.roleId });
      
      // Log failed API call
      logApiCall('DELETE', `/admin/roles/${req.params.roleId}`, 500, Date.now() - startTime, req.user.id);
      
      next(error);
    }
  }
];

exports.toggleRoleActive = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      const { roleId } = req.params;
      const { active } = req.body;
      
      // Get current state
      const currentRole = rolesRegistry.find(r => r.id === roleId);
      
      // In a real implementation, update role active status in database
      const updatedRole = {
        id: roleId,
        active,
        updatedAt: new Date()
      };
      
      // Invalidate cache
      invalidateCache('roles');
      
      // Log admin activity
      await adminActivityLogService.logActivity({
        adminId: req.user?.id,
        action: 'toggle_role_active',
        entityType: 'role',
        entityId: roleId,
        changes: {
          before: { active: currentRole?.active },
          after: { active }
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      // Log successful API call
      logApiCall('PUT', `/admin/roles/${roleId}/toggle`, 200, Date.now() - startTime, req.user.id);
      
      res.json({ message: `Role ${roleId} ${active ? 'activated' : 'deactivated'} successfully`, role: updatedRole });
    } catch (error) {
      // Log failed activity
      await adminActivityLogService.logActivity({
        adminId: req.user?.id,
        action: 'toggle_role_active',
        entityType: 'role',
        entityId: req.params.roleId,
        result: 'error',
        errorMessage: error.message,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      // Log error
      logError(error, 'toggleRoleActive', { userId: req.user.id, roleId: req.params.roleId });
      
      // Log failed API call
      logApiCall('PUT', `/admin/roles/${req.params.roleId}/toggle`, 500, Date.now() - startTime, req.user.id);
      
      next(error);
    }
  }
];

exports.cloneRole = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      const { roleId } = req.params;
      const { newRoleId, newLabel } = req.body;
      
      // Get source role
      const sourceRole = rolesRegistry.find(r => r.id === roleId);
      
      // In a real implementation:
      // 1. Fetch original role
      // 2. Create new role with new ID and label
      // 3. Copy all capabilities and scopes
      
      const clonedRole = {
        id: newRoleId,
        label: newLabel,
        description: `Cloned from ${roleId}`,
        capabilities: [], // Would copy from original
        scopes: {}, // Would copy from original
        active: false, // Start as inactive
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Invalidate cache
      invalidateCache('roles');
      
      // Log admin activity
      await adminActivityLogService.logActivity({
        adminId: req.user?.id,
        action: 'clone_role',
        entityType: 'role',
        entityId: newRoleId,
        changes: {
          before: null,
          after: {
            sourceRoleId: roleId,
            newRoleId,
            newLabel
          }
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      // Log successful API call
      logApiCall('POST', `/admin/roles/${roleId}/clone`, 200, Date.now() - startTime, req.user.id);
      
      res.json({ message: `Role ${roleId} cloned successfully`, role: clonedRole });
    } catch (error) {
      // Log failed activity
      await adminActivityLogService.logActivity({
        adminId: req.user?.id,
        action: 'clone_role',
        entityType: 'role',
        entityId: req.params.roleId,
        result: 'error',
        errorMessage: error.message,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      // Log error
      logError(error, 'cloneRole', { userId: req.user.id, roleId: req.params.roleId });
      
      // Log failed API call
      logApiCall('POST', `/admin/roles/${req.params.roleId}/clone`, 500, Date.now() - startTime, req.user.id);
      
      next(error);
    }
  }
];

exports.getRoleById = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      const { roleId } = req.params;
      
      // In a real implementation, fetch from database
      // For now, return from registry
      const role = rolesRegistry.find(r => r.id === roleId);
      
      if (!role) {
        return res.status(404).json({ error: 'Role not found' });
      }
      
      // Log successful API call
      logApiCall('GET', `/admin/roles/${roleId}`, 200, Date.now() - startTime, req.user.id);
      
      res.json(role);
    } catch (error) {
      // Log error
      logError(error, 'getRoleById', { userId: req.user.id, roleId: req.params.roleId });
      
      // Log failed API call
      logApiCall('GET', `/admin/roles/${req.params.roleId}`, 500, Date.now() - startTime, req.user.id);
      
      next(error);
    }
  }
];

exports.getUsersByRole = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      const { roleId } = req.params;
      
      // In a real implementation, query users table where role = roleId
      const users = []; // Would fetch from database
      
      // Log successful API call
      logApiCall('GET', `/admin/roles/${roleId}/users`, 200, Date.now() - startTime, req.user.id);
      
      res.json(users);
    } catch (error) {
      // Log error
      logError(error, 'getUsersByRole', { userId: req.user.id, roleId: req.params.roleId });
      
      // Log failed API call
      logApiCall('GET', `/admin/roles/${req.params.roleId}/users`, 500, Date.now() - startTime, req.user.id);
      
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
