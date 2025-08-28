const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all audit logs with optional filters
router.get('/', authorizeRole(['admin', 'auditor']), auditLogController.getAllAuditLogs);

// Get audit logs for a specific entity
router.get('/entity/:entityType/:entityId', authorizeRole(['admin', 'auditor']), auditLogController.getAuditLogsByEntity);

// Get audit logs for a specific actor
router.get('/actor/:actorId', authorizeRole(['admin', 'auditor']), auditLogController.getAuditLogsByActor);

// Get audit logs for a specific action
router.get('/action/:action', authorizeRole(['admin', 'auditor']), auditLogController.getAuditLogsByAction);

// Get a specific audit log by ID
router.get('/:id', authorizeRole(['admin', 'auditor']), auditLogController.getAuditLogById);

// Create a new audit log entry (typically used internally)
router.post('/', authorizeRole(['admin']), auditLogController.createAuditLog);

module.exports = router;