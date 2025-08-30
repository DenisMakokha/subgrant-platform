const express = require('express');
const router = express.Router();
const complianceController = require('../controllers/complianceController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get compliance dashboard data
router.get('/dashboard', authorizeRole(['admin', 'auditor']), complianceController.getComplianceDashboard);

// Get audit logs for compliance review
router.get('/audit-logs', authorizeRole(['admin', 'auditor']), complianceController.getAuditLogsForCompliance);

// Get documents for compliance review
router.get('/documents', authorizeRole(['admin', 'auditor']), complianceController.getDocumentsForCompliance);

// Get compliance alerts
router.get('/alerts', authorizeRole(['admin', 'auditor']), complianceController.getComplianceAlerts);

// Get alert history
router.get('/alerts/history', authorizeRole(['admin', 'auditor']), complianceController.getAlertHistory);

// Resolve an alert
router.put('/alerts/:alertId/resolve', authorizeRole(['admin', 'auditor']), complianceController.resolveAlert);

// Get audit log trends (for chart)
router.get('/audit-logs/trends', authorizeRole(['admin', 'auditor']), complianceController.getAuditLogTrends);

// Get document version history
router.get('/documents/:entityType/:entityId/versions', authorizeRole(['admin', 'auditor']), complianceController.getDocumentVersionHistory);

// Get compliance document status report
router.get('/reports/document-status', authorizeRole(['admin', 'auditor']), complianceController.getComplianceDocumentStatusReport);

// Get compliance document type report
router.get('/reports/document-type', authorizeRole(['admin', 'auditor']), complianceController.getComplianceDocumentTypeReport);

// Get compliance document organization report
router.get('/reports/document-organization', authorizeRole(['admin', 'auditor']), complianceController.getComplianceDocumentOrganizationReport);

// Export compliance dashboard data
router.get('/dashboard/export', authorizeRole(['admin', 'auditor']), complianceController.exportComplianceDashboard);

module.exports = router;