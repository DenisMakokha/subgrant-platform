const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');
const rbacMiddleware = require('../middleware/rbac');

// All admin routes require authentication
router.use(authMiddleware);

// Registry Management (Admin-only)
// Guards: only wizard.admin capability may call these.
router.get('/catalog/caps', rbacMiddleware.checkPermission('admin', 'wizard.admin'), adminController.getCatalogCaps);
router.get('/catalog/data-keys', rbacMiddleware.checkPermission('admin', 'wizard.admin'), adminController.getCatalogDataKeys);
router.get('/roles', rbacMiddleware.checkPermission('admin', 'wizard.admin'), adminController.listRoles);
router.post('/roles', rbacMiddleware.checkPermission('admin', 'wizard.admin'), adminController.createOrUpdateRole);
router.post('/roles/publish', rbacMiddleware.checkPermission('admin', 'wizard.admin'), adminController.publishRole);
router.get('/dashboards', rbacMiddleware.checkPermission('admin', 'wizard.admin'), adminController.listDashboards);
router.post('/dashboards', rbacMiddleware.checkPermission('admin', 'wizard.admin'), adminController.createOrUpdateDashboard);
router.post('/dashboards/publish', rbacMiddleware.checkPermission('admin', 'wizard.admin'), adminController.publishDashboard);
router.post('/preview', rbacMiddleware.checkPermission('admin', 'wizard.admin'), adminController.previewData);

module.exports = router;