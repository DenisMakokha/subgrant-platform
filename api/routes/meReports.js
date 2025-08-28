const express = require('express');
const router = express.Router();
const meReportController = require('../controllers/meReportController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { validateMeReport } = require('../middleware/validation');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Create a new ME report
router.post('/', authorizeRole(['admin', 'partner_user']), meReportController.createMeReport);

// Get an ME report by ID
router.get('/:id', meReportController.getMeReportById);

// Get ME reports by budget ID
router.get('/budget/:budgetId', meReportController.getMeReportsByBudgetId);

// Get all ME reports with optional filters
router.get('/', authorizeRole(['admin', 'accountant', 'finance_manager', 'm&e_officer']), meReportController.getAllMeReports);

// Update an ME report
router.put('/:id', authorizeRole(['admin', 'partner_user']), meReportController.updateMeReport);

// Delete an ME report
router.delete('/:id', authorizeRole(['admin']), meReportController.deleteMeReport);

// Submit an ME report
router.patch('/:id/submit', authorizeRole(['admin', 'partner_user']), meReportController.submitMeReport);

// Approve an ME report
router.patch('/:id/approve', authorizeRole(['admin', 'm&e_officer']), meReportController.approveMeReport);

// Export an ME report as PDF
router.get('/:id/export/pdf', authorizeRole(['admin', 'm&e_officer', 'donor']), meReportController.exportMeReportAsPdf);

// Export an ME report as Excel
router.get('/:id/export/excel', authorizeRole(['admin', 'm&e_officer', 'donor']), meReportController.exportMeReportAsExcel);

module.exports = router;