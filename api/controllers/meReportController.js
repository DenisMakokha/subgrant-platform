const MeReport = require('../models/meReport');
const { validateMeReport } = require('../middleware/validation');
const auditLogger = require('../middleware/auditLogger');
const approvalIntegrationService = require('../services/approvalIntegrationService');
const logger = require('../utils/logger');
const activityLogService = require('../services/activityLogService');

class MeReportController {
  // Create a new ME report
  static async createMeReport(req, res, next) {
    try {
      const meReportData = {
        ...req.body,
        created_by: req.user.id,
        updated_by: req.user.id
      };

      // Validate ME report data
      const { error } = validateMeReport(meReportData);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const meReport = await MeReport.create(meReportData);
      
      // Log activity
      if (req.user && req.user.organizationId) {
        try {
          await activityLogService.logActivity({
            organizationId: req.user.organizationId,
            userId: req.user.id,
            activityType: 'report_created',
            activityCategory: 'report',
            title: 'M&E Report Created',
            description: `Created M&E report`,
            metadata: {
              reportId: meReport.id,
              reportType: meReport.report_type
            },
            entityType: 'me_report',
            entityId: meReport.id,
            severity: 'success'
          });
        } catch (activityError) {
          logger.error('Error logging activity:', activityError);
        }
      }
      
      // Log the ME report creation
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'CREATE_ME_REPORT',
          entity_type: 'me_report',
          entity_id: meReport.id,
          before_state: null,
          after_state: meReport,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        logger.error('Error creating audit log:', auditError);
      }
      
      res.status(201).json(meReport);
    } catch (err) {
      next(err);
    }
  }

  // Get an ME report by ID
  static async getMeReportById(req, res, next) {
    try {
      const { id } = req.params;
      const meReport = await MeReport.findById(id);
      
      if (!meReport) {
        return res.status(404).json({ error: 'ME report not found' });
      }
      
      // If user is a donor, only allow access to approved reports
      if (req.user.role === 'donor' && meReport.status !== 'approved') {
        return res.status(403).json({ error: 'Access denied: Report not approved' });
      }
      
      res.json(meReport);
    } catch (err) {
      next(err);
    }
  }

  // Get ME reports by budget ID
  static async getMeReportsByBudgetId(req, res, next) {
    try {
      const { budgetId } = req.params;
      
      // If user is a donor, only get approved reports
      let meReports;
      if (req.user.role === 'donor') {
        meReports = await MeReport.findByBudgetId(budgetId, { status: 'approved' });
      } else {
        meReports = await MeReport.findByBudgetId(budgetId);
      }
      
      res.json(meReports);
    } catch (err) {
      next(err);
    }
  }

  // Get all ME reports with optional filters
  static async getAllMeReports(req, res, next) {
    try {
      const filters = req.query;
      
      // If user is a donor, only allow access to approved reports
      if (req.user.role === 'donor') {
        filters.status = 'approved';
      }
      
      const meReports = await MeReport.findAll(filters);
      res.json(meReports);
    } catch (err) {
      next(err);
    }
  }

  // Update an ME report
  static async updateMeReport(req, res, next) {
    try {
      const { id } = req.params;
      const meReport = await MeReport.findById(id);

      if (!meReport) {
        return res.status(404).json({ error: 'ME report not found' });
      }

      // Validate ME report data if provided
      if (Object.keys(req.body).length > 0) {
        const { error } = validateMeReport(req.body);
        if (error) {
          return res.status(400).json({ error: error.details[0].message });
        }
      }

      const updateData = {
        ...req.body,
        updated_by: req.user.id
      };

      const updatedMeReport = await meReport.update(updateData);
      
      // Log the ME report update
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'UPDATE_ME_REPORT',
          entity_type: 'me_report',
          entity_id: id,
          before_state: meReport,
          after_state: updatedMeReport,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        logger.error('Error creating audit log:', auditError);
      }
      
      res.json(updatedMeReport);
    } catch (err) {
      next(err);
    }
  }

  // Delete an ME report
  static async deleteMeReport(req, res, next) {
    try {
      const { id } = req.params;
      const meReport = await MeReport.findById(id);

      if (!meReport) {
        return res.status(404).json({ error: 'ME report not found' });
      }

      await MeReport.deleteById(id);
      
      // Log the ME report deletion
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'DELETE_ME_REPORT',
          entity_type: 'me_report',
          entity_id: id,
          before_state: meReport,
          after_state: null,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        logger.error('Error creating audit log:', auditError);
      }

      res.json({ message: 'ME report deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  // Submit an ME report
  static async submitMeReport(req, res, next) {
    try {
      const { id } = req.params;
      const meReport = await MeReport.findById(id);

      if (!meReport) {
        return res.status(404).json({ error: 'ME report not found' });
      }
      const updatedMeReport = await meReport.update({ 
        status: 'submitted',
        submitted_at: new Date()
      });
      
      // Log activity
      if (req.user && req.user.organizationId) {
        try {
          await activityLogService.logActivity({
            organizationId: req.user.organizationId,
            userId: req.user.id,
            activityType: 'report_submitted',
            activityCategory: 'report',
            title: 'M&E Report Submitted',
            description: `Submitted M&E report for review`,
            metadata: {
              reportId: id,
              reportType: meReport.report_type
            },
            entityType: 'me_report',
            entityId: parseInt(id),
            severity: 'success'
          });
        } catch (activityError) {
          logger.error('Error logging activity:', activityError);
        }
      }
      
      // Create approval request for the report
      let approvalRequest;
      try {
        approvalRequest = await approvalIntegrationService.createApprovalRequest({
          entityType: 'report',
          entityId: id,
          userId: req.user.id,
          metadata: {
            report_type: meReport.report_type || 'M&E Report',
            due_date: meReport.due_date,
            budget_id: meReport.budget_id
          }
        });
        
        if (approvalRequest) {
          // Link approval request to report
          await approvalIntegrationService.linkApprovalToEntity(
            'grant_reporting_dates',
            id,
            approvalRequest.id
          );
          
          // Add approval_request_id to response
          updatedMeReport.approval_request_id = approvalRequest.id;
        }
      } catch (approvalError) {
        logger.error('Error creating approval request for report:', approvalError);
        // Continue without approval - don't fail the report submission
      }
      
      // Log the ME report submission
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'SUBMIT_ME_REPORT',
          entity_type: 'me_report',
          entity_id: id,
          before_state: meReport,
          after_state: updatedMeReport,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        logger.error('Error creating audit log:', auditError);
      }
      
      res.json(updatedMeReport);
    } catch (err) {
      next(err);
    }
  }

  // Approve an ME report
  static async approveMeReport(req, res, next) {
    try {
      const { id } = req.params;
      const meReport = await MeReport.findById(id);
      
      if (!meReport) {
        return res.status(404).json({ error: 'ME report not found' });
      }
      
      const updatedMeReport = await meReport.update({
        status: 'approved',
        approved_at: new Date(),
        approved_by: req.user.id
      });
      
      // Log the ME report approval
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'APPROVE_ME_REPORT',
          entity_type: 'me_report',
          entity_id: id,
          before_state: meReport,
          after_state: updatedMeReport,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        logger.error('Error creating audit log:', auditError);
      }
      
      res.json(updatedMeReport);
    } catch (err) {
      next(err);
    }
  }
  
  // Export an ME report as PDF
  static async exportMeReportAsPdf(req, res, next) {
    try {
      const { id } = req.params;
      const meReport = await MeReport.findById(id);
      
      if (!meReport) {
        return res.status(404).json({ error: 'ME report not found' });
      }
      
      // Log the ME report export
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'EXPORT_ME_REPORT_PDF',
          entity_type: 'me_report',
          entity_id: id,
          before_state: null,
          after_state: { id, format: 'pdf' },
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        logger.error('Error creating audit log:', auditError);
      }
      
      // In a real implementation, you would generate a PDF file here
      // For example, using a library like pdfkit or puppeteer
      // const pdfBuffer = await generateMeReportPdf(meReport);
      // res.send(pdfBuffer);
      
      // For now, we'll send a placeholder response indicating where the real implementation would go
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="me-report-${id}.pdf"`);
      res.send(`PDF content for ME report ${id} would be generated here in a real implementation.`);
    } catch (err) {
      next(err);
    }
  }
  
  // Export an ME report as Excel
  static async exportMeReportAsExcel(req, res, next) {
    try {
      const { id } = req.params;
      const meReport = await MeReport.findById(id);
      
      if (!meReport) {
        return res.status(404).json({ error: 'ME report not found' });
      }
      
      // Log the ME report export
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'EXPORT_ME_REPORT_EXCEL',
          entity_type: 'me_report',
          entity_id: id,
          before_state: null,
          after_state: { id, format: 'excel' },
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        logger.error('Error creating audit log:', auditError);
      }
      
      // In a real implementation, you would generate an Excel file here
      // For example, using a library like exceljs or xlsx
      // const excelBuffer = await generateMeReportExcel(meReport);
      // res.send(excelBuffer);
      
      // For now, we'll send a placeholder response indicating where the real implementation would go
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="me-report-${id}.xlsx"`);
      res.send(`Excel content for ME report ${id} would be generated here in a real implementation.`);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = MeReportController;
