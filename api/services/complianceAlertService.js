const AuditLog = require('../models/auditLog');
const Document = require('../models/document');
const OrganizationComplianceDocument = require('../models/organizationComplianceDocument');

class ComplianceAlertService {
  // Check for compliance alerts
  static async checkForAlerts() {
    const alerts = [];
    
    // Check for overdue reports
    const overdueReportAlerts = await ComplianceAlertService.checkOverdueReports();
    alerts.push(...overdueReportAlerts);
    
    // Check for document version conflicts
    const documentVersionAlerts = await ComplianceAlertService.checkDocumentVersions();
    alerts.push(...documentVersionAlerts);
    
    // Check for audit anomalies
    const auditAnomalyAlerts = await ComplianceAlertService.checkAuditAnomalies();
    alerts.push(...auditAnomalyAlerts);
    
    // Check for upcoming due dates
    const upcomingDueDateAlerts = await ComplianceAlertService.checkUpcomingDueDates();
    alerts.push(...upcomingDueDateAlerts);
    
    // Check for upcoming expirations
    const upcomingExpirationAlerts = await ComplianceAlertService.checkUpcomingExpirations();
    alerts.push(...upcomingExpirationAlerts);
    
    return alerts;
  }

  // Check for overdue reports
  static async checkOverdueReports() {
    try {
      // Get all ME reports that are past their due date and not yet submitted
      const MeReport = require('../models/meReport');
      const overdueReports = await MeReport.getOverdueReports();
      
      const alerts = overdueReports.map(report => ({
        id: Date.now() + Math.random(),
        type: 'overdue_report',
        title: `Overdue ME Report: ${report.title}`,
        description: `ME Report "${report.title}" for budget ${report.budget_id} is ${Math.ceil((new Date() - new Date(report.due_date)) / (1000 * 3600 * 24))} days overdue`,
        severity: 'high',
        entity_type: 'me_report',
        entity_id: report.id,
        created_at: new Date()
      }));
      
      return alerts;
    } catch (error) {
      logger.error('Error checking for overdue reports:', error);
      return [];
    }
  }

  // Check for document version conflicts
  static async checkDocumentVersions() {
    try {
      // Get documents with conflicting versions (same entity but different checksums)
      const conflictingDocs = await Document.getConflictingVersions();
      
      const alerts = conflictingDocs.map(doc => ({
        id: Date.now() + Math.random(),
        type: 'document_version',
        title: `Document Version Conflict: ${doc.title}`,
        description: `Document "${doc.title}" has multiple versions with conflicting content`,
        severity: 'medium',
        entity_type: doc.entity_type,
        entity_id: doc.entity_id,
        created_at: new Date()
      }));
      
      return alerts;
    } catch (error) {
      logger.error('Error checking for document version conflicts:', error);
      return [];
    }
  }

  // Check for audit anomalies
  static async checkAuditAnomalies() {
    try {
      // Get audit logs with unusual patterns (multiple budget deletions in short time period)
      const AuditLog = require('../models/auditLog');
const logger = require('../utils/logger');
      const anomalyLogs = await AuditLog.getAnomalyLogs();
      
      const alerts = anomalyLogs.map(log => ({
        id: Date.now() + Math.random(),
        type: 'audit_anomaly',
        title: `Unusual Activity Detected: ${log.action}`,
        description: `Multiple ${log.action} actions detected in a short time period`,
        severity: 'high',
        entity_type: log.entity_type,
        entity_id: log.entity_id,
        created_at: new Date()
      }));
      
      return alerts;
    } catch (error) {
      logger.error('Error checking for audit anomalies:', error);
      return [];
    }
  }

  // Check for upcoming due dates
  static async checkUpcomingDueDates() {
    try {
      // Get all compliance documents with due dates within the next 30 days
      // that are not yet submitted
      const upcomingDocs = await OrganizationComplianceDocument.getUpcomingDueDocuments(30);
      
      const alerts = upcomingDocs.map(doc => ({
        id: Date.now() + Math.random(),
        type: 'upcoming_due_date',
        title: `Compliance Document Due Soon: ${doc.document_type_name}`,
        description: `Document "${doc.document_type_name}" for ${doc.organization_name} is due on ${new Date(doc.due_date).toLocaleDateString()}`,
        severity: 'medium',
        entity_type: 'compliance_document',
        entity_id: doc.id,
        created_at: new Date()
      }));
      
      return alerts;
    } catch (error) {
      logger.error('Error checking for upcoming due dates:', error);
      return [];
    }
  }

  // Check for upcoming expiration dates
  static async checkUpcomingExpirations() {
    try {
      // Get all compliance documents with expiration dates within the next 30 days
      // that are approved
      const expiringDocs = await OrganizationComplianceDocument.getUpcomingExpirationDocuments(30);
      
      const alerts = expiringDocs.map(doc => ({
        id: Date.now() + Math.random(),
        type: 'upcoming_expiration',
        title: `Compliance Document Expiring Soon: ${doc.document_type_name}`,
        description: `Document "${doc.document_type_name}" for ${doc.organization_name} expires on ${new Date(doc.expiration_date).toLocaleDateString()}`,
        severity: 'medium',
        entity_type: 'compliance_document',
        entity_id: doc.id,
        created_at: new Date()
      }));
      
      return alerts;
    } catch (error) {
      logger.error('Error checking for upcoming expirations:', error);
      return [];
    }
  }

  // Send alert notifications
  static async sendAlertNotifications(alerts) {
    // This would typically send notifications via email, SMS, or in-app notifications
    // For now, we'll just log the alerts
    
    logger.info('Compliance Alerts:', alerts);
    
    // In a real implementation, you might:
    // 1. Send email notifications to admins/auditors
    // 2. Create in-app notifications
    // 3. Send SMS alerts for high severity issues
    // 4. Log alerts to a monitoring system
    
    return { message: 'Alerts processed successfully' };
  }

  // Get alert history
  static async getAlertHistory(limit = 50) {
    try {
      // Get historical alerts from the database
      // For now, we'll return an empty array since we don't have a database table for alerts yet
      // In a real implementation, you would query a alerts table
      
      return [];
    } catch (error) {
      logger.error('Error getting alert history:', error);
      return [];
    }
  }
}

module.exports = ComplianceAlertService;