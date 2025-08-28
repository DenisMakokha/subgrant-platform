const MeReport = require('../models/meReport');
const { validateMeReport } = require('../middleware/validation');

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
      res.json(updatedMeReport);
    } catch (err) {
      next(err);
    }
  }

  // Delete an ME report
  static async deleteMeReport(req, res, next) {
    try {
      const { id } = req.params;
      const meReport = await MeReport.deleteById(id);

      if (!meReport) {
        return res.status(404).json({ error: 'ME report not found' });
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
      
      // In a real implementation, you would generate a PDF file here
      // For now, we'll just send a placeholder response
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="me-report-${id}.pdf"`);
      res.send(`PDF content for ME report ${id}`);
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
      
      // In a real implementation, you would generate an Excel file here
      // For now, we'll just send a placeholder response
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="me-report-${id}.xlsx"`);
      res.send(`Excel content for ME report ${id}`);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = MeReportController;