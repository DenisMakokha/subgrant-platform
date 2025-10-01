const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminHealthController = require('../controllers/adminHealthController');
const adminStatsController = require('../controllers/adminStatsController');
const adminUserController = require('../controllers/adminUserController');
const adminAuditController = require('../controllers/adminAuditController');
const adminConfigurationController = require('../controllers/adminConfigurationController');
const adminReportingController = require('../controllers/adminReportingController');
const adminExecutiveController = require('../controllers/adminExecutiveController');
const adminKnowledgeController = require('../controllers/adminKnowledgeController');
const adminOrganizationController = require('../controllers/adminOrganizationController');
const authMiddleware = require('../middleware/auth');
const rbacMiddleware = require('../middleware/rbac');

// All admin routes require authentication AND admin role
router.use(authMiddleware);
router.use(rbacMiddleware.requireAdmin);

// Registry Management (Admin-only)
router.get('/catalog/caps', adminController.getCatalogCaps);
router.get('/catalog/data-keys', adminController.getCatalogDataKeys);
router.get('/catalog/capabilities', adminController.getCapabilitiesCatalog);
router.get('/catalog/scopes', adminController.getScopesCatalog);
router.get('/roles', adminController.listRoles);
router.get('/roles/:roleId', adminController.getRoleById);
router.post('/roles', adminController.createOrUpdateRole);
router.delete('/roles/:roleId', adminController.deleteRole);
router.put('/roles/:roleId/toggle', adminController.toggleRoleActive);
router.post('/roles/:roleId/clone', adminController.cloneRole);
router.get('/roles/:roleId/users', adminController.getUsersByRole);
router.post('/roles/publish', adminController.publishRole);
router.get('/dashboards', adminController.listDashboards);
router.post('/dashboards', adminController.createOrUpdateDashboard);
router.post('/dashboards/publish', adminController.publishDashboard);
router.post('/preview', adminController.previewData);

// System Health Monitoring (Admin-only)
router.get('/health/system', adminHealthController.getSystemHealth);
router.get('/health/services', adminHealthController.getServiceStatus);
router.get('/health/metrics', adminHealthController.getMetrics);
router.get('/health/alerts', adminHealthController.getAlerts);
router.put('/health/alerts/:alertId/resolve', adminHealthController.resolveAlert);

// Dashboard Statistics (Admin-only)
router.get('/dashboard/stats', adminStatsController.getDashboardStats);
router.get('/dashboard/recent-activity', adminStatsController.getRecentActivity);
router.get('/dashboard/pending-approvals', adminStatsController.getPendingApprovalsCount);

// User Management (Admin-only)
router.get('/users', rbacMiddleware.checkPermission('users', 'read'), adminUserController.getUsers);
router.get('/users/:userId', rbacMiddleware.checkPermission('users', 'read'), adminUserController.getUserById);
router.post('/users', rbacMiddleware.checkPermission('users', 'create'), adminUserController.createUser);
router.put('/users/:userId', rbacMiddleware.checkPermission('users', 'update'), adminUserController.updateUser);
router.post('/users/:userId/reset-password', rbacMiddleware.checkPermission('users', 'update'), adminUserController.resetPassword);
router.delete('/users/:userId', rbacMiddleware.checkPermission('users', 'delete'), adminUserController.deleteUser);
router.get('/users/:userId/access-logs', rbacMiddleware.checkPermission('audit_logs', 'read'), adminUserController.getUserAccessLogs);
router.post('/users/bulk-assign-roles', adminUserController.bulkAssignRoles);
router.get('/users/export', adminUserController.exportUsers);

// Audit Center (Admin-only)
router.post('/audit/activity', adminAuditController.getActivityLogs);
router.post('/audit/security', adminAuditController.getSecurityEvents);
router.get('/audit/compliance', adminAuditController.getComplianceReports);
router.post('/audit/compliance', adminAuditController.generateComplianceReport);
router.get('/audit/compliance/:reportId/download', adminAuditController.downloadComplianceReport);
router.post('/audit/export', adminAuditController.exportAuditData);

// Configuration Center (Admin-only)
router.get('/config/feature-flags', adminConfigurationController.getFeatureFlags);
router.put('/config/feature-flags/:flagKey', adminConfigurationController.updateFeatureFlag);
router.get('/config/system-settings', adminConfigurationController.getSystemSettings);
router.put('/config/system-settings/:settingKey', adminConfigurationController.updateSystemSetting);
router.get('/config/integrations', adminConfigurationController.getIntegrationSettings);
router.put('/config/integrations/:integrationKey', adminConfigurationController.updateIntegrationSetting);

// Organization Management (Admin-only)
router.get('/organizations', adminOrganizationController.getOrganizations);
router.get('/organizations/:orgId', adminOrganizationController.getOrganizationById);
router.put('/organizations/:orgId', adminOrganizationController.updateOrganization);
router.get('/organizations/:orgId/users', adminOrganizationController.getOrganizationUsers);
router.get('/organizations/:orgId/projects', adminOrganizationController.getOrganizationProjects);

// Advanced Reporting (Admin-only)
router.get('/reporting/templates', adminReportingController.getReportTemplates);
router.get('/reporting/templates/:templateId', adminReportingController.getReportTemplate);
router.post('/reporting/templates', adminReportingController.createReportTemplate);
router.put('/reporting/templates/:templateId', adminReportingController.updateReportTemplate);
router.delete('/reporting/templates/:templateId', adminReportingController.deleteReportTemplate);
router.get('/reporting/scheduled', adminReportingController.getScheduledReports);
router.post('/reporting/schedule', adminReportingController.scheduleReport);
router.get('/reporting/generate/:templateId', adminReportingController.generateReport);
router.get('/reporting/analytics', adminReportingController.getReportAnalytics);
router.get('/reporting/data-sources', adminReportingController.getDataSources);
router.post('/reporting/preview', adminReportingController.previewReportData);

// Executive Dashboard (Admin-only)
router.get('/executive/dashboard', adminExecutiveController.getDashboardData);
router.get('/executive/kpis', adminExecutiveController.getExecutiveKPIs);
router.get('/executive/financial', adminExecutiveController.getFinancialSummary);
router.get('/executive/programs', adminExecutiveController.getProgramPerformance);
router.get('/executive/initiatives', adminExecutiveController.getStrategicInitiatives);
router.get('/executive/alerts', adminExecutiveController.getExecutiveAlerts);
router.get('/executive/trends', adminExecutiveController.getTrends);
router.get('/executive/summary', adminExecutiveController.getDashboardSummary);
router.get('/executive/export', adminExecutiveController.exportDashboardData);

// Knowledge Management (Admin-only)
router.get('/knowledge/documents', adminKnowledgeController.getDocuments);
router.get('/knowledge/documents/popular', adminKnowledgeController.getPopularDocuments);
router.get('/knowledge/documents/recent', adminKnowledgeController.getRecentDocuments);
router.get('/knowledge/documents/statistics', adminKnowledgeController.getDocumentStatistics);
router.get('/knowledge/documents/categories', adminKnowledgeController.getDocumentCategories);
router.get('/knowledge/documents/tags', adminKnowledgeController.getDocumentTags);
router.get('/knowledge/documents/:id', adminKnowledgeController.getDocumentById);
router.post('/knowledge/documents', adminKnowledgeController.createDocument);
router.put('/knowledge/documents/:id', adminKnowledgeController.updateDocument);
router.delete('/knowledge/documents/:id', adminKnowledgeController.deleteDocument);
router.get('/knowledge/documents/:id/download', adminKnowledgeController.downloadDocument);
router.post('/knowledge/documents/bulk-status', adminKnowledgeController.bulkUpdateDocumentStatus);
router.post('/knowledge/documents/archive-old', adminKnowledgeController.archiveOldDocuments);

router.get('/knowledge/modules', adminKnowledgeController.getTrainingModules);
router.get('/knowledge/modules/popular', adminKnowledgeController.getPopularModules);
router.get('/knowledge/modules/recent', adminKnowledgeController.getRecentModules);
router.get('/knowledge/modules/statistics', adminKnowledgeController.getTrainingStatistics);
router.get('/knowledge/modules/categories', adminKnowledgeController.getTrainingCategories);
router.get('/knowledge/modules/tags', adminKnowledgeController.getTrainingTags);
router.get('/knowledge/modules/:id', adminKnowledgeController.getTrainingModuleById);
router.post('/knowledge/modules', adminKnowledgeController.createTrainingModule);
router.put('/knowledge/modules/:id', adminKnowledgeController.updateTrainingModule);
router.delete('/knowledge/modules/:id', adminKnowledgeController.deleteTrainingModule);
router.post('/knowledge/modules/:id/enroll', adminKnowledgeController.enrollInModule);
router.post('/knowledge/modules/bulk-status', adminKnowledgeController.bulkUpdateModuleStatus);
router.post('/knowledge/modules/archive-old', adminKnowledgeController.archiveOldModules);

module.exports = router;
