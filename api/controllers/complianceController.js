const AuditLog = require('../models/auditLog');
const Document = require('../models/document');
const ComplianceAlertService = require('../services/complianceAlertService');

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
      
      // Get upcoming compliance deadlines (mock data for now)
      const upcomingDeadlines = [
        { id: 1, title: 'Annual Financial Report', dueDate: '2023-12-31', status: 'pending' },
        { id: 2, title: 'Quarterly ME Report', dueDate: '2023-09-30', status: 'overdue' },
        { id: 3, title: 'Monthly Budget Reconciliation', dueDate: '2023-08-15', status: 'completed' }
      ];
      
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
      res.json(alerts);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ComplianceController;