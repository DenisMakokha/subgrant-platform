const db = require('../config/database');
const AuditLog = require('../models/auditLog');
const Document = require('../models/document');
const ComplianceAlertService = require('../services/complianceAlertService');
const auditLogger = require('../middleware/auditLogger');

class ComplianceController {
  // Get compliance dashboard data
  static async getComplianceDashboard(req, res, next) {
    try {
      // Get recent audit logs
      const recentAuditLogs = await AuditLog.findAll({}, 10, 0);
      
      // Get recent document uploads
      const recentDocuments = await Document.findAll({}, 10, 0);
      
      // Get compliance statistics
      const complianceStats = await ComplianceController.getComplianceStats();
      
      // Get upcoming compliance deadlines from the database
      // This would typically come from a deadlines table or be calculated based on project dates
      const upcomingDeadlines = await ComplianceController.getUpcomingDeadlines();
      
      // Log the compliance dashboard access
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'ACCESS_COMPLIANCE_DASHBOARD',
          entity_type: 'compliance',
          entity_id: null,
          before_state: null,
          after_state: { accessed_at: new Date() },
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error creating audit log:', auditError);
      }
      
      res.json({
        recentAuditLogs,
        recentDocuments,
        complianceStats,
        upcomingDeadlines
      });
    } catch (err) {
      next(err);
    }
  }

  // Get compliance statistics
  static async getComplianceStats() {
    try {
      // Get total audit log count
      const totalAuditLogs = await AuditLog.getCount();
      
      // Get audit logs by action type
      const createBudgetLogs = await AuditLog.getCount({ action: 'CREATE_BUDGET' });
      const updateBudgetLogs = await AuditLog.getCount({ action: 'UPDATE_BUDGET' });
      const deleteBudgetLogs = await AuditLog.getCount({ action: 'DELETE_BUDGET' });
      const submitBudgetLogs = await AuditLog.getCount({ action: 'SUBMIT_BUDGET' });
      const approveBudgetLogs = await AuditLog.getCount({ action: 'APPROVE_BUDGET' });
      
      // Get document statistics
      const totalDocuments = await Document.findAll({});
      const documentCount = totalDocuments.length;
      
      // Get document versions
      const versionedDocuments = totalDocuments.filter(doc => doc.version > 1);
      const versionedDocumentCount = versionedDocuments.length;
      
      return {
        totalAuditLogs,
        budgetActions: {
          create: createBudgetLogs,
          update: updateBudgetLogs,
          delete: deleteBudgetLogs,
          submit: submitBudgetLogs,
          approve: approveBudgetLogs
        },
        documentStats: {
          total: documentCount,
          versioned: versionedDocumentCount,
          percentageVersioned: documentCount > 0 ? (versionedDocumentCount / documentCount * 100).toFixed(2) : 0
        }
      };
    } catch (error) {
      console.error('Error getting compliance stats:', error);
      return {
        totalAuditLogs: 0,
        budgetActions: {
          create: 0,
          update: 0,
          delete: 0,
          submit: 0,
          approve: 0
        },
        documentStats: {
          total: 0,
          versioned: 0,
          percentageVersioned: 0
        }
      };
    }
  }

  // Get upcoming compliance deadlines
  static async getUpcomingDeadlines() {
    try {
      // Query the database for upcoming compliance document deadlines
      // Get documents with due dates within the next 30 days that are not yet approved
      const query = `
        SELECT
          ocd.id,
          ocd.due_date,
          ocd.status,
          cdt.name as document_type_name,
          o.name as organization_name,
          o.id as organization_id
        FROM organization_compliance_documents ocd
        JOIN compliance_document_types cdt ON ocd.document_type_id = cdt.id
        JOIN organizations o ON ocd.organization_id = o.id
        WHERE ocd.due_date <= CURRENT_DATE + INTERVAL '30 days'
          AND ocd.due_date >= CURRENT_DATE
          AND ocd.status != 'approved'
        ORDER BY ocd.due_date ASC
        LIMIT 10
      `;
      
      const result = await db.pool.query(query);
      
      // Transform the results to match the expected format
      return result.rows.map(row => ({
        id: row.id,
        title: `${row.document_type_name} for ${row.organization_name}`,
        dueDate: row.due_date,
        status: row.status
      }));
    } catch (error) {
      console.error('Error getting upcoming deadlines:', error);
      return [];
    }
  }

  // Get audit log trends
  static async getAuditLogTrends(days = 30) {
    try {
      // Query the database for audit log trends
      // Get count of audit logs grouped by date for the specified number of days
      const query = `
        SELECT
          DATE(created_at) as date,
          COUNT(*) as count
        FROM audit_logs
        WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `;
      
      const result = await db.pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error getting audit log trends:', error);
      return [];
    }
  }

  // Get document version history
  static async getDocumentVersionHistory(entityType, entityId) {
    try {
      // Query the database for document version history
      // Get all versions of a document for the specified entity type and ID
      const query = `
        SELECT *
        FROM documents
        WHERE entity_type = $1 AND entity_id = $2
        ORDER BY version DESC
      `;
      
      const values = [entityType, entityId];
      const result = await db.pool.query(query, values);
      return result.rows;
    } catch (error) {
      console.error('Error getting document version history:', error);
      return [];
    }
  }

  // Get audit logs for compliance review
  static async getAuditLogsForCompliance(req, res, next) {
    try {
      const { page = 1, limit = 50, start_date, end_date, action } = req.query;
      const offset = (page - 1) * limit;
      
      const filters = {};
      
      if (start_date) {
        filters.start_date = new Date(start_date);
      }
      
      if (end_date) {
        filters.end_date = new Date(end_date);
      }
      
      if (action) {
        filters.action = action;
      }
      
      const auditLogs = await AuditLog.findAll(filters, limit, offset);
      const totalCount = await AuditLog.getCount(filters);
      
      // Log the audit log access
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'ACCESS_AUDIT_LOGS',
          entity_type: 'compliance',
          entity_id: null,
          before_state: null,
          after_state: { filters, page, limit },
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error creating audit log:', auditError);
      }
      
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

  // Get documents for compliance review
  static async getDocumentsForCompliance(req, res, next) {
    try {
      const { page = 1, limit = 50, entity_type } = req.query;
      const offset = (page - 1) * limit;
      
      const filters = {};
      
      if (entity_type) {
        filters.entity_type = entity_type;
      }
      
      const documents = await Document.findAll(filters, limit, offset);
      const totalCount = documents.length; // In a real implementation, you would get the actual count
      
      // Log the document access
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'ACCESS_DOCUMENTS',
          entity_type: 'compliance',
          entity_id: null,
          before_state: null,
          after_state: { filters, page, limit },
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error creating audit log:', auditError);
      }
      
      res.json({
        data: documents,
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

  // Get compliance alerts
  static async getComplianceAlerts(req, res, next) {
    try {
      const alerts = await ComplianceAlertService.checkForAlerts();
      
      // Log the alert access
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'ACCESS_COMPLIANCE_ALERTS',
          entity_type: 'compliance',
          entity_id: null,
          before_state: null,
          after_state: { accessed_at: new Date() },
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error creating audit log:', auditError);
      }
      
      res.json(alerts);
    } catch (err) {
      next(err);
    }
  }

  // Get alert history
  static async getAlertHistory(req, res, next) {
    try {
      const { limit = 50 } = req.query;
      const alerts = await ComplianceAlertService.getAlertHistory(limit);
      
      // Log the alert history access
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'ACCESS_ALERT_HISTORY',
          entity_type: 'compliance',
          entity_id: null,
          before_state: null,
          after_state: { accessed_at: new Date(), limit },
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error creating audit log:', auditError);
      }
      
      res.json(alerts);
    } catch (err) {
      next(err);
    }
  }

  // Resolve an alert
  static async resolveAlert(req, res, next) {
    try {
      const { alertId } = req.params;
      // In a real implementation, you would update the alert in the database
      // For now, we'll just return a success response
      
      // Log the alert resolution
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'RESOLVE_COMPLIANCE_ALERT',
          entity_type: 'compliance',
          entity_id: alertId,
          before_state: null,
          after_state: { resolved_at: new Date() },
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error creating audit log:', auditError);
      }
      
      res.json({ message: 'Alert resolved successfully' });
    } catch (err) {
      next(err);
    }
  }

  // Get audit log trends (for chart)
  static async getAuditLogTrends(req, res, next) {
    try {
      const { days = 30 } = req.query;
      // Get audit log trends from the database
      const trends = await ComplianceController.getAuditLogTrends(days);
      
      // Log the trend access
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'ACCESS_AUDIT_LOG_TRENDS',
          entity_type: 'compliance',
          entity_id: null,
          before_state: null,
          after_state: { accessed_at: new Date(), days },
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error creating audit log:', auditError);
      }
      
      res.json(trends);
    } catch (err) {
      next(err);
    }
  }

  // Get document version history
  static async getDocumentVersionHistory(req, res, next) {
    try {
      const { entityType, entityId } = req.params;
      // Get document version history from the database
      const versions = await ComplianceController.getDocumentVersionHistory(entityType, entityId);
      
      // Log the version history access
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'ACCESS_DOCUMENT_VERSION_HISTORY',
          entity_type: 'document',
          entity_id: entityId,
          before_state: null,
          after_state: { accessed_at: new Date(), entityType, entityId },
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error creating audit log:', auditError);
      }
      
      res.json(versions);
    } catch (err) {
      next(err);
    }
  }
  
  // Get compliance document status report
  static async getComplianceDocumentStatusReport(req, res, next) {
    try {
      // Get compliance document status report from the database
      // Group documents by status and count them
      const query = `
        SELECT
          status,
          COUNT(*) as count
        FROM organization_compliance_documents
        GROUP BY status
        ORDER BY status
      `;
      
      const result = await db.pool.query(query);
      
      // Log the report access
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'ACCESS_COMPLIANCE_DOCUMENT_STATUS_REPORT',
          entity_type: 'compliance',
          entity_id: null,
          before_state: null,
          after_state: { accessed_at: new Date() },
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error creating audit log:', auditError);
      }
      
      res.json(result.rows);
    } catch (err) {
      next(err);
    }
  }
  
  // Get compliance document type report
  static async getComplianceDocumentTypeReport(req, res, next) {
    try {
      // Get compliance document type report from the database
      // Group documents by document type and count them
      const query = `
        SELECT
          cdt.name as document_type,
          COUNT(*) as count
        FROM organization_compliance_documents ocd
        JOIN compliance_document_types cdt ON ocd.document_type_id = cdt.id
        GROUP BY cdt.name
        ORDER BY cdt.name
      `;
      
      const result = await db.pool.query(query);
      
      // Log the report access
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'ACCESS_COMPLIANCE_DOCUMENT_TYPE_REPORT',
          entity_type: 'compliance',
          entity_id: null,
          before_state: null,
          after_state: { accessed_at: new Date() },
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error creating audit log:', auditError);
      }
      
      res.json(result.rows);
    } catch (err) {
      next(err);
    }
  }
  
  // Get compliance document organization report
  static async getComplianceDocumentOrganizationReport(req, res, next) {
    try {
      // Get compliance document organization report from the database
      // Group documents by organization and count them
      const query = `
        SELECT
          o.name as organization,
          COUNT(*) as count
        FROM organization_compliance_documents ocd
        JOIN organizations o ON ocd.organization_id = o.id
        GROUP BY o.name
        ORDER BY o.name
      `;
      
      const result = await db.pool.query(query);
      
      // Log the report access
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'ACCESS_COMPLIANCE_DOCUMENT_ORGANIZATION_REPORT',
          entity_type: 'compliance',
          entity_id: null,
          before_state: null,
          after_state: { accessed_at: new Date() },
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error creating audit log:', auditError);
      }
      
      res.json(result.rows);
    } catch (err) {
      next(err);
    }
  }
  
  // Export compliance dashboard data
  static async exportComplianceDashboard(req, res, next) {
    try {
      const { format = 'csv' } = req.query;
      
      // Get compliance dashboard data
      const recentAuditLogs = await AuditLog.findAll({}, 10, 0);
      const recentDocuments = await Document.findAll({}, 10, 0);
      const complianceStats = await ComplianceController.getComplianceStats();
      const upcomingDeadlines = await ComplianceController.getUpcomingDeadlines();
      
      // Prepare data for export
      const exportData = {
        timestamp: new Date().toISOString(),
        complianceStats,
        recentAuditLogs: recentAuditLogs.map(log => ({
          id: log.id,
          action: log.action,
          entity_type: log.entity_type,
          created_at: log.created_at
        })),
        recentDocuments: recentDocuments.map(doc => ({
          id: doc.id,
          title: doc.title,
          document_name: doc.document_name,
          mime_type: doc.mime_type,
          created_at: doc.created_at
        })),
        upcomingDeadlines
      };
      
      // Set appropriate headers for export
      res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="compliance-dashboard-export.${format}"`);
      
      // Export data in the requested format
      if (format === 'csv') {
        // Convert to CSV format
        const csvData = ComplianceController.convertToCSV(exportData);
        res.send(csvData);
      } else {
        // Default to JSON format
        res.json(exportData);
      }
      
      // Log the export
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'EXPORT_COMPLIANCE_DASHBOARD',
          entity_type: 'compliance',
          entity_id: null,
          before_state: null,
          after_state: { format, exported_at: new Date() },
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error creating audit log:', auditError);
      }
    } catch (err) {
      next(err);
    }
  }
  
  // Convert export data to CSV format
  static convertToCSV(data) {
    // Convert compliance stats to CSV
    let csv = 'Compliance Dashboard Export\n';
    csv += `Exported at: ${data.timestamp}\n\n`;
    
    csv += 'Compliance Statistics\n';
    csv += 'Metric,Value\n';
    csv += `Total Audit Logs,${data.complianceStats.totalAuditLogs}\n`;
    csv += `Budget Actions - Create,${data.complianceStats.budgetActions.create}\n`;
    csv += `Budget Actions - Update,${data.complianceStats.budgetActions.update}\n`;
    csv += `Budget Actions - Delete,${data.complianceStats.budgetActions.delete}\n`;
    csv += `Budget Actions - Submit,${data.complianceStats.budgetActions.submit}\n`;
    csv += `Budget Actions - Approve,${data.complianceStats.budgetActions.approve}\n`;
    csv += `Total Documents,${data.complianceStats.documentStats.total}\n`;
    csv += `Versioned Documents,${data.complianceStats.documentStats.versioned}\n`;
    csv += `Percentage Versioned,${data.complianceStats.documentStats.percentageVersioned}%\n\n`;
    
    // Convert recent audit logs to CSV
    csv += 'Recent Audit Logs\n';
    csv += 'ID,Action,Entity Type,Created At\n';
    data.recentAuditLogs.forEach(log => {
      csv += `"${log.id}","${log.action}","${log.entity_type}","${log.created_at}"\n`;
    });
    csv += '\n';
    
    // Convert recent documents to CSV
    csv += 'Recent Documents\n';
    csv += 'ID,Title,Document Name,MIME Type,Created At\n';
    data.recentDocuments.forEach(doc => {
      csv += `"${doc.id}","${doc.title}","${doc.document_name}","${doc.mime_type}","${doc.created_at}"\n`;
    });
    csv += '\n';
    
    // Convert upcoming deadlines to CSV
    csv += 'Upcoming Deadlines\n';
    csv += 'ID,Title,Due Date,Status\n';
    data.upcomingDeadlines.forEach(deadline => {
      csv += `"${deadline.id}","${deadline.title}","${deadline.dueDate}","${deadline.status}"\n`;
    });
    
    return csv;
  }
}

module.exports = ComplianceController;