const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const AuditLogService = require('../services/auditLogService');

// Get audit logs with filters
router.get('/', auth, rbac.checkPermission('audit_logs', 'read'), async (req, res, next) => {
  try {
    const { page = 1, limit = 50, actor_id, entity_type, entity_id, action, start_date, end_date } = req.query;
    const offset = (page - 1) * limit;
    
    const filters = {};
    
    if (actor_id) filters.actor_id = actor_id;
    if (entity_type) filters.entity_type = entity_type;
    if (entity_id) filters.entity_id = entity_id;
    if (action) filters.action = action;
    if (start_date) filters.start_date = new Date(start_date);
    if (end_date) filters.end_date = new Date(end_date);
    
    const auditLogs = await AuditLogService.getAuditLogs(filters, limit, offset);
    const totalCount = await AuditLogService.getAuditLogCount(filters);
    
    res.json({
      data: auditLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (err) {
    next(err);
  }
});

// Get audit logs for a specific entity
router.get('/entity/:entityType/:entityId', auth, rbac.checkPermission('audit_logs', 'read'), async (req, res, next) => {
  try {
    const { entityType, entityId } = req.params;
    const auditLogs = await AuditLogService.getAuditLogsForEntity(entityType, entityId);
    res.json(auditLogs);
  } catch (err) {
    next(err);
  }
});

// Get audit logs for a specific user
router.get('/user/:userId', auth, rbac.checkPermission('audit_logs', 'read'), async (req, res, next) => {
  try {
    const { userId } = req.params;
    const auditLogs = await AuditLogService.getAuditLogsForUser(userId);
    res.json(auditLogs);
  } catch (err) {
    next(err);
  }
});

// Get audit logs by action type
router.get('/action/:action', auth, rbac.checkPermission('audit_logs', 'read'), async (req, res, next) => {
  try {
    const { action } = req.params;
    const auditLogs = await AuditLogService.getAuditLogsByAction(action);
    res.json(auditLogs);
  } catch (err) {
    next(err);
  }
});

// Get recent audit logs
router.get('/recent', auth, rbac.checkPermission('audit_logs', 'read'), async (req, res, next) => {
  try {
    const { limit = 50 } = req.query;
    const auditLogs = await AuditLogService.getRecentAuditLogs(limit);
    res.json(auditLogs);
  } catch (err) {
    next(err);
  }
});

// Get audit log trends
router.get('/trends', auth, rbac.checkPermission('audit_logs', 'read'), async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const trends = await AuditLogService.getAuditLogTrends(days);
    res.json(trends);
  } catch (err) {
    next(err);
  }
});

// Export audit logs
router.get('/export', auth, rbac.checkPermission('audit_logs', 'read'), async (req, res, next) => {
  try {
    const { format = 'json', actor_id, entity_type, entity_id, action, start_date, end_date } = req.query;
    
    const filters = {};
    
    if (actor_id) filters.actor_id = actor_id;
    if (entity_type) filters.entity_type = entity_type;
    if (entity_id) filters.entity_id = entity_id;
    if (action) filters.action = action;
    if (start_date) filters.start_date = new Date(start_date);
    if (end_date) filters.end_date = new Date(end_date);
    
    const exportedData = await AuditLogService.exportAuditLogs(filters, format);
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.csv"');
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.json"');
    }
    
    res.send(exportedData);
  } catch (err) {
    next(err);
  }
});

module.exports = router;