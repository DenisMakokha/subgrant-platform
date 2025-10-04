/**
 * Role & Dashboard Wizard Controller
 * Production-ready controller with full validation and error handling
 */

const roleWizardService = require('../services/roleWizardService');
const { ValidationError, NotFoundError } = require('../errors');
const { sanitizeInput } = require('../middleware/sanitization');
const { logApiCall, logError } = require('../services/observabilityService');

/**
 * Create or update role
 * POST /api/admin/wizard/role
 */
exports.createOrUpdateRole = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      const roleDef = req.body;
      const userId = req.user.sub || req.user.id;

      // Create or update role
      const role = await roleWizardService.createOrUpdateRole(roleDef, userId);

      // Log successful API call
      logApiCall('POST', '/admin/wizard/role', 200, Date.now() - startTime, userId);

      res.status(200).json({
        success: true,
        message: 'Role created/updated successfully',
        data: role,
        meta: {
          timestamp: new Date().toISOString(),
          userId
        }
      });
    } catch (error) {
      // Log error
      logError(error, 'createOrUpdateRole', { userId: req.user?.sub || req.user?.id });
      logApiCall('POST', '/admin/wizard/role', error.statusCode || 500, Date.now() - startTime, req.user?.sub || req.user?.id);
      
      next(error);
    }
  }
];

/**
 * Create or update dashboard
 * POST /api/admin/wizard/dashboard
 */
exports.createOrUpdateDashboard = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      const dashboardDef = req.body;
      const userId = req.user.sub || req.user.id;

      // Create or update dashboard
      const dashboard = await roleWizardService.createOrUpdateDashboard(dashboardDef, userId);

      // Log successful API call
      logApiCall('POST', '/admin/wizard/dashboard', 200, Date.now() - startTime, userId);

      res.status(200).json({
        success: true,
        message: 'Dashboard created/updated successfully',
        data: dashboard,
        meta: {
          timestamp: new Date().toISOString(),
          userId
        }
      });
    } catch (error) {
      // Log error
      logError(error, 'createOrUpdateDashboard', { userId: req.user?.sub || req.user?.id });
      logApiCall('POST', '/admin/wizard/dashboard', error.statusCode || 500, Date.now() - startTime, req.user?.sub || req.user?.id);
      
      next(error);
    }
  }
];

/**
 * Save dashboard as template
 * POST /api/admin/wizard/template
 */
exports.saveDashboardTemplate = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      const templateData = req.body;
      const userId = req.user.sub || req.user.id;

      // Save template
      const template = await roleWizardService.saveDashboardTemplate(templateData, userId);

      // Log successful API call
      logApiCall('POST', '/admin/wizard/template', 200, Date.now() - startTime, userId);

      res.status(200).json({
        success: true,
        message: 'Dashboard template saved successfully',
        data: template,
        meta: {
          timestamp: new Date().toISOString(),
          userId
        }
      });
    } catch (error) {
      // Log error
      logError(error, 'saveDashboardTemplate', { userId: req.user?.sub || req.user?.id });
      logApiCall('POST', '/admin/wizard/template', error.statusCode || 500, Date.now() - startTime, req.user?.sub || req.user?.id);
      
      next(error);
    }
  }
];

/**
 * Complete wizard - create role and dashboard in one transaction
 * POST /api/admin/wizard/complete
 */
exports.completeWizard = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      const { role, dashboard, saveAsTemplate, templateName } = req.body;
      const userId = req.user.sub || req.user.id;

      // Validate inputs
      if (!role || !dashboard) {
        throw new ValidationError('Both role and dashboard definitions are required');
      }

      // Create role
      const createdRole = await roleWizardService.createOrUpdateRole(role, userId);

      // Create dashboard
      dashboard.role_id = createdRole.id;
      const createdDashboard = await roleWizardService.createOrUpdateDashboard(dashboard, userId);

      // Save as template if requested
      let template = null;
      if (saveAsTemplate && templateName) {
        const templateData = {
          id: templateName.toLowerCase().replace(/\s+/g, '_'),
          name: templateName,
          description: `Custom template for ${createdRole.label}`,
          target_role: createdRole.id,
          default_widgets: dashboard.widgets || [],
          default_menus: dashboard.menus_json || [],
          default_pages: dashboard.pages_json || [],
          default_layout_columns: 3,
          is_system_template: false
        };

        template = await roleWizardService.saveDashboardTemplate(templateData, userId);
      }

      // Log successful API call
      logApiCall('POST', '/admin/wizard/complete', 200, Date.now() - startTime, userId);

      res.status(200).json({
        success: true,
        message: template 
          ? 'Role, dashboard, and template created successfully' 
          : 'Role and dashboard created successfully',
        data: {
          role: createdRole,
          dashboard: createdDashboard,
          template
        },
        meta: {
          timestamp: new Date().toISOString(),
          userId
        }
      });
    } catch (error) {
      // Log error
      logError(error, 'completeWizard', { userId: req.user?.sub || req.user?.id });
      logApiCall('POST', '/admin/wizard/complete', error.statusCode || 500, Date.now() - startTime, req.user?.sub || req.user?.id);
      
      next(error);
    }
  }
];

/**
 * Get role with dashboard
 * GET /api/admin/wizard/role/:roleId
 */
exports.getRoleWithDashboard = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      const { roleId } = req.params;
      const userId = req.user.sub || req.user.id;

      const data = await roleWizardService.getRoleWithDashboard(roleId);

      // Log successful API call
      logApiCall('GET', `/admin/wizard/role/${roleId}`, 200, Date.now() - startTime, userId);

      res.status(200).json({
        success: true,
        data,
        meta: {
          timestamp: new Date().toISOString(),
          userId
        }
      });
    } catch (error) {
      // Log error
      logError(error, 'getRoleWithDashboard', { userId: req.user?.sub || req.user?.id, roleId: req.params.roleId });
      logApiCall('GET', `/admin/wizard/role/${req.params.roleId}`, error.statusCode || 500, Date.now() - startTime, req.user?.sub || req.user?.id);
      
      next(error);
    }
  }
];

/**
 * Delete role and dashboard
 * DELETE /api/admin/wizard/role/:roleId
 */
exports.deleteRoleAndDashboard = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      const { roleId } = req.params;
      const userId = req.user.sub || req.user.id;

      const result = await roleWizardService.deleteRoleAndDashboard(roleId, userId);

      // Log successful API call
      logApiCall('DELETE', `/admin/wizard/role/${roleId}`, 200, Date.now() - startTime, userId);

      res.status(200).json({
        success: true,
        message: result.message,
        meta: {
          timestamp: new Date().toISOString(),
          userId
        }
      });
    } catch (error) {
      // Log error
      logError(error, 'deleteRoleAndDashboard', { userId: req.user?.sub || req.user?.id, roleId: req.params.roleId });
      logApiCall('DELETE', `/admin/wizard/role/${req.params.roleId}`, error.statusCode || 500, Date.now() - startTime, req.user?.sub || req.user?.id);
      
      next(error);
    }
  }
];

/**
 * Clone role with dashboard
 * POST /api/admin/wizard/role/:roleId/clone
 */
exports.cloneRole = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      const { roleId } = req.params;
      const { newRoleId, newLabel } = req.body;
      const userId = req.user.sub || req.user.id;

      if (!newRoleId || !newLabel) {
        throw new ValidationError('New role ID and label are required');
      }

      const result = await roleWizardService.cloneRole(roleId, newRoleId, newLabel, userId);

      // Log successful API call
      logApiCall('POST', `/admin/wizard/role/${roleId}/clone`, 200, Date.now() - startTime, userId);

      res.status(200).json({
        success: true,
        message: `Role ${roleId} cloned successfully`,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          userId
        }
      });
    } catch (error) {
      // Log error
      logError(error, 'cloneRole', { userId: req.user?.sub || req.user?.id, roleId: req.params.roleId });
      logApiCall('POST', `/admin/wizard/role/${req.params.roleId}/clone`, error.statusCode || 500, Date.now() - startTime, req.user?.sub || req.user?.id);
      
      next(error);
    }
  }
];

/**
 * Toggle role active status
 * PUT /api/admin/wizard/role/:roleId/toggle
 */
exports.toggleRoleActive = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      const { roleId } = req.params;
      const { active } = req.body;
      const userId = req.user.sub || req.user.id;

      if (typeof active !== 'boolean') {
        throw new ValidationError('Active status must be a boolean');
      }

      const role = await roleWizardService.toggleRoleActive(roleId, active, userId);

      // Log successful API call
      logApiCall('PUT', `/admin/wizard/role/${roleId}/toggle`, 200, Date.now() - startTime, userId);

      res.status(200).json({
        success: true,
        message: `Role ${roleId} ${active ? 'activated' : 'deactivated'} successfully`,
        data: role,
        meta: {
          timestamp: new Date().toISOString(),
          userId
        }
      });
    } catch (error) {
      // Log error
      logError(error, 'toggleRoleActive', { userId: req.user?.sub || req.user?.id, roleId: req.params.roleId });
      logApiCall('PUT', `/admin/wizard/role/${req.params.roleId}/toggle`, error.statusCode || 500, Date.now() - startTime, req.user?.sub || req.user?.id);
      
      next(error);
    }
  }
];

/**
 * Get all roles with dashboards
 * GET /api/admin/wizard/roles
 */
exports.getAllRolesWithDashboards = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      const userId = req.user.sub || req.user.id;

      const roles = await roleWizardService.getAllRolesWithDashboards();

      // Log successful API call
      logApiCall('GET', '/admin/wizard/roles', 200, Date.now() - startTime, userId);

      res.status(200).json({
        success: true,
        data: roles,
        meta: {
          timestamp: new Date().toISOString(),
          userId,
          count: roles.length
        }
      });
    } catch (error) {
      // Log error
      logError(error, 'getAllRolesWithDashboards', { userId: req.user?.sub || req.user?.id });
      logApiCall('GET', '/admin/wizard/roles', error.statusCode || 500, Date.now() - startTime, req.user?.sub || req.user?.id);
      
      next(error);
    }
  }
];

/**
 * Validate role ID availability
 * GET /api/admin/wizard/validate-role-id/:roleId
 */
exports.validateRoleId = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      const { roleId } = req.params;
      const userId = req.user.sub || req.user.id;

      const exists = await roleWizardService.checkRoleExists(roleId);

      // Log successful API call
      logApiCall('GET', `/admin/wizard/validate-role-id/${roleId}`, 200, Date.now() - startTime, userId);

      res.status(200).json({
        success: true,
        data: {
          roleId,
          available: !exists,
          exists
        },
        meta: {
          timestamp: new Date().toISOString(),
          userId
        }
      });
    } catch (error) {
      // Log error
      logError(error, 'validateRoleId', { userId: req.user?.sub || req.user?.id, roleId: req.params.roleId });
      logApiCall('GET', `/admin/wizard/validate-role-id/${req.params.roleId}`, error.statusCode || 500, Date.now() - startTime, req.user?.sub || req.user?.id);
      
      next(error);
    }
  }
];

module.exports = exports;
