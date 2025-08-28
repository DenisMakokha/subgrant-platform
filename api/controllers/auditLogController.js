const AuditLog = require('../models/auditLog');

class AuditLogController {
  // Get all audit logs with optional filters
  static async getAllAuditLogs(req, res, next) {
    try {
      const { page = 1, limit = 50, ...filters } = req.query;
      const offset = (page - 1) * limit;
      
      // Parse date filters if provided
      if (filters.start_date) {
        filters.start_date = new Date(filters.start_date);
      }
      
      if (filters.end_date) {
        filters.end_date = new Date(filters.end_date);
      }
      
      const auditLogs = await AuditLog.findAll(filters, limit, offset);
      const totalCount = await AuditLog.getCount(filters);
      
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
  }

  // Get audit logs for a specific entity
  static async getAuditLogsByEntity(req, res, next) {
    try {
      const { entityType, entityId } = req.params;
      const auditLogs = await AuditLog.findByEntity(entityType, entityId);
      res.json(auditLogs);
    } catch (err) {
      next(err);
    }
  }

  // Get audit logs for a specific actor
  static async getAuditLogsByActor(req, res, next) {
    try {
      const { actorId } = req.params;
      const auditLogs = await AuditLog.findByActor(actorId);
      res.json(auditLogs);
    } catch (err) {
      next(err);
    }
  }

  // Get audit logs for a specific action
  static async getAuditLogsByAction(req, res, next) {
    try {
      const { action } = req.params;
      const auditLogs = await AuditLog.findByAction(action);
      res.json(auditLogs);
    } catch (err) {
      next(err);
    }
  }

  // Get a specific audit log by ID
  static async getAuditLogById(req, res, next) {
    try {
      const { id } = req.params;
      const auditLog = await AuditLog.findById(id);
      
      if (!auditLog) {
        return res.status(404).json({ error: 'Audit log not found' });
      }
      
      res.json(auditLog);
    } catch (err) {
      next(err);
    }
  }

  // Create a new audit log entry (typically used internally)
  static async createAuditLog(req, res, next) {
    try {
      // Extract IP address and user agent from request
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');
      
      const auditData = {
        ...req.body,
        ip_address: ipAddress,
        user_agent: userAgent
      };
      
      const auditLog = await AuditLog.create(auditData);
      res.status(201).json(auditLog);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = AuditLogController;