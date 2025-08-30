const AuditLog = require('../models/auditLog');

class AuditLogService {
  // Get audit logs with filters
  static async getAuditLogs(filters = {}, limit = 50, offset = 0) {
    try {
      return await AuditLog.findAll(filters, limit, offset);
    } catch (error) {
      throw new Error(`Error fetching audit logs: ${error.message}`);
    }
  }

  // Get audit log count with filters
  static async getAuditLogCount(filters = {}) {
    try {
      return await AuditLog.getCount(filters);
    } catch (error) {
      throw new Error(`Error fetching audit log count: ${error.message}`);
    }
  }

  // Get audit logs for a specific entity
  static async getAuditLogsForEntity(entityType, entityId) {
    try {
      return await AuditLog.findByEntity(entityType, entityId);
    } catch (error) {
      throw new Error(`Error fetching audit logs for entity: ${error.message}`);
    }
  }

  // Get audit logs for a specific user
  static async getAuditLogsForUser(userId) {
    try {
      return await AuditLog.findByActor(userId);
    } catch (error) {
      throw new Error(`Error fetching audit logs for user: ${error.message}`);
    }
  }

  // Get audit logs by action type
  static async getAuditLogsByAction(action) {
    try {
      return await AuditLog.findByAction(action);
    } catch (error) {
      throw new Error(`Error fetching audit logs by action: ${error.message}`);
    }
  }

  // Get recent audit logs
  static async getRecentAuditLogs(limit = 50) {
    try {
      return await AuditLog.findAll({}, limit, 0);
    } catch (error) {
      throw new Error(`Error fetching recent audit logs: ${error.message}`);
    }
  }

  // Get audit log trends (count by date)
  static async getAuditLogTrends(days = 30) {
    try {
      const trends = [];
      const endDate = new Date();
      
      for (let i = days - 1; i >= 0; i--) {
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - i);
        startDate.setHours(0, 0, 0, 0);
        
        const endDateForDay = new Date(startDate);
        endDateForDay.setDate(endDateForDay.getDate() + 1);
        
        const count = await AuditLog.getCount({
          start_date: startDate,
          end_date: endDateForDay
        });
        
        trends.push({
          date: startDate.toISOString().split('T')[0],
          count
        });
      }
      
      return trends;
    } catch (error) {
      throw new Error(`Error fetching audit log trends: ${error.message}`);
    }
  }

  // Export audit logs
  static async exportAuditLogs(filters = {}, format = 'json') {
    try {
      const auditLogs = await AuditLog.findAll(filters);
      
      if (format === 'csv') {
        // Convert to CSV format
        const headers = ['ID', 'Actor ID', 'Action', 'Entity Type', 'Entity ID', 'IP Address', 'User Agent', 'Created At'];
        const csvRows = [headers.join(',')];
        
        for (const log of auditLogs) {
          const values = [
            log.id,
            log.actor_id || '',
            log.action,
            log.entity_type,
            log.entity_id,
            log.ip_address || '',
            `"${log.user_agent || ''}"`,
            log.created_at
          ];
          csvRows.push(values.join(','));
        }
        
        return csvRows.join('\n');
      } else {
        // Return as JSON
        return JSON.stringify(auditLogs, null, 2);
      }
    } catch (error) {
      throw new Error(`Error exporting audit logs: ${error.message}`);
    }
  }
}

module.exports = AuditLogService;