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

module.exports = router;