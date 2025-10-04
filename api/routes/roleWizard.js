/**
 * Role & Dashboard Wizard Routes
 * Secure routes with admin-only access
 */

const express = require('express');
const router = express.Router();
const roleWizardController = require('../controllers/roleWizardController');
const { requireAuth } = require('../middleware/auth');
const rbacMiddleware = require('../middleware/rbac');

// Apply authentication to all routes
router.use(requireAuth);

// Apply admin-only access to all routes
router.use(rbacMiddleware.requireAdmin);

/**
 * Complete wizard - create role and dashboard in one transaction
 * POST /api/admin/wizard/complete
 */
router.post('/complete', 
  rbacMiddleware.checkPermission('wizard', 'create'),
  roleWizardController.completeWizard
);

/**
 * Create or update role
 * POST /api/admin/wizard/role
 */
router.post('/role', 
  rbacMiddleware.checkPermission('wizard', 'create'),
  roleWizardController.createOrUpdateRole
);

/**
 * Create or update dashboard
 * POST /api/admin/wizard/dashboard
 */
router.post('/dashboard', 
  rbacMiddleware.checkPermission('wizard', 'create'),
  roleWizardController.createOrUpdateDashboard
);

/**
 * Save dashboard as template
 * POST /api/admin/wizard/template
 */
router.post('/template', 
  rbacMiddleware.checkPermission('wizard', 'create'),
  roleWizardController.saveDashboardTemplate
);

/**
 * Get all roles with dashboards
 * GET /api/admin/wizard/roles
 */
router.get('/roles', 
  rbacMiddleware.checkPermission('wizard', 'read'),
  roleWizardController.getAllRolesWithDashboards
);

/**
 * Validate role ID availability
 * GET /api/admin/wizard/validate-role-id/:roleId
 */
router.get('/validate-role-id/:roleId', 
  rbacMiddleware.checkPermission('wizard', 'read'),
  roleWizardController.validateRoleId
);

/**
 * Get role with dashboard
 * GET /api/admin/wizard/role/:roleId
 */
router.get('/role/:roleId', 
  rbacMiddleware.checkPermission('wizard', 'read'),
  roleWizardController.getRoleWithDashboard
);

/**
 * Clone role with dashboard
 * POST /api/admin/wizard/role/:roleId/clone
 */
router.post('/role/:roleId/clone', 
  rbacMiddleware.checkPermission('wizard', 'create'),
  roleWizardController.cloneRole
);

/**
 * Toggle role active status
 * PUT /api/admin/wizard/role/:roleId/toggle
 */
router.put('/role/:roleId/toggle', 
  rbacMiddleware.checkPermission('wizard', 'update'),
  roleWizardController.toggleRoleActive
);

/**
 * Delete role and dashboard
 * DELETE /api/admin/wizard/role/:roleId
 */
router.delete('/role/:roleId', 
  rbacMiddleware.checkPermission('wizard', 'delete'),
  roleWizardController.deleteRoleAndDashboard
);

module.exports = router;
