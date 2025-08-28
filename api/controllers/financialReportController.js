const FinancialReport = require('../models/financialReport');
const Receipt = require('../models/receipt');
const { validateFinancialReport } = require('../middleware/validation');

class FinancialReportController {
  // Create a new financial report
  static async createFinancialReport(req, res, next) {
    try {
      const financialReportData = {
        ...req.body,
        created_by: req.user.id,
        updated_by: req.user.id
      };

      // Validate financial report data
      const { error } = validateFinancialReport(financialReportData);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const financialReport = await FinancialReport.create(financialReportData);
      res.status(201).json(financialReport);
    } catch (err) {
      next(err);
    }
  }

  // Get a financial report by ID
  static async getFinancialReportById(req, res, next) {
    try {
      const { id } = req.params;
      const financialReport = await FinancialReport.findById(id);
      
      if (!financialReport) {
        return res.status(404).json({ error: 'Financial report not found' });
      }
      
      // If user is a donor, only allow access to approved reports
      if (req.user.role === 'donor' && financialReport.status !== 'approved') {
        return res.status(403).json({ error: 'Access denied: Report not approved' });
      }
      
      res.json(financialReport);
    } catch (err) {
      next(err);
    }
  }

  // Get financial reports by budget ID
  static async getFinancialReportsByBudgetId(req, res, next) {
    try {
      const { budgetId } = req.params;
      
      // If user is a donor, only get approved reports
      let financialReports;
      if (req.user.role === 'donor') {
        financialReports = await FinancialReport.findByBudgetId(budgetId, { status: 'approved' });
      } else {
        financialReports = await FinancialReport.findByBudgetId(budgetId);
      }
      
      res.json(financialReports);
    } catch (err) {
      next(err);
    }
  }

  // Get all financial reports with optional filters
  static async getAllFinancialReports(req, res, next) {
    try {
      const filters = req.query;
      
      // If user is a donor, only allow access to approved reports
      if (req.user.role === 'donor') {
        filters.status = 'approved';
      }
      
      const financialReports = await FinancialReport.findAll(filters);
      res.json(financialReports);
    } catch (err) {
      next(err);
    }
  }

  // Update a financial report
  static async updateFinancialReport(req, res, next) {
    try {
      const { id } = req.params;
      const financialReport = await FinancialReport.findById(id);

      if (!financialReport) {
        return res.status(404).json({ error: 'Financial report not found' });
      }

      // Validate financial report data if provided
      if (Object.keys(req.body).length > 0) {
        const { error } = validateFinancialReport(req.body);
        if (error) {
          return res.status(400).json({ error: error.details[0].message });
        }
      }

      const updateData = {
        ...req.body,
        updated_by: req.user.id
      };

      const updatedFinancialReport = await financialReport.update(updateData);
      res.json(updatedFinancialReport);
    } catch (err) {
      next(err);
    }
  }

  // Delete a financial report
  static async deleteFinancialReport(req, res, next) {
    try {
      const { id } = req.params;
      const financialReport = await FinancialReport.deleteById(id);

      if (!financialReport) {
        return res.status(404).json({ error: 'Financial report not found' });
      }

      res.json({ message: 'Financial report deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  // Submit a financial report
  static async submitFinancialReport(req, res, next) {
    try {
      const { id } = req.params;
      const financialReport = await FinancialReport.findById(id);

      if (!financialReport) {
        return res.status(404).json({ error: 'Financial report not found' });
      }

      const updatedFinancialReport = await financialReport.update({ 
        status: 'submitted',
        submitted_at: new Date()
      });
      res.json(updatedFinancialReport);
    } catch (err) {
      next(err);
    }
  }

  // Approve a financial report
  static async approveFinancialReport(req, res, next) {
    try {
      const { id } = req.params;
      const financialReport = await FinancialReport.findById(id);

      if (!financialReport) {
        return res.status(404).json({ error: 'Financial report not found' });
      }

      const updatedFinancialReport = await financialReport.update({ 
        status: 'approved',
        approved_at: new Date(),
        approved_by: req.user.id
      });
      res.json(updatedFinancialReport);
    } catch (err) {
      next(err);
    }
  }

  // Get receipts for a financial report
  static async getReceiptsForFinancialReport(req, res, next) {
    try {
      const { id } = req.params;
      const receipts = await Receipt.findByFinancialReportId(id);
      res.json(receipts);
    } catch (err) {
      next(err);
    }
  }
  
  // Export a financial report as PDF
  static async exportFinancialReportAsPdf(req, res, next) {
    try {
      const { id } = req.params;
      const financialReport = await FinancialReport.findById(id);
      
      if (!financialReport) {
        return res.status(404).json({ error: 'Financial report not found' });
      }
      
      // In a real implementation, you would generate a PDF file here
      // For now, we'll just send a placeholder response
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="financial-report-${id}.pdf"`);
      res.send(`PDF content for financial report ${id}`);
    } catch (err) {
      next(err);
    }
  }
  
  // Export a financial report as Excel
  static async exportFinancialReportAsExcel(req, res, next) {
    try {
      const { id } = req.params;
      const financialReport = await FinancialReport.findById(id);
      
      if (!financialReport) {
        return res.status(404).json({ error: 'Financial report not found' });
      }
      
      // In a real implementation, you would generate an Excel file here
      // For now, we'll just send a placeholder response
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="financial-report-${id}.xlsx"`);
      res.send(`Excel content for financial report ${id}`);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = FinancialReportController;