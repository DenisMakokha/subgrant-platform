const express = require('express');
const router = express.Router();
const financialReportController = require('../controllers/financialReportController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { validateFinancialReport } = require('../middleware/validation');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Create a new financial report
router.post('/', authorizeRole(['admin', 'partner_user']), financialReportController.createFinancialReport);

// Get a financial report by ID
router.get('/:id', financialReportController.getFinancialReportById);

// Get financial reports by budget ID
router.get('/budget/:budgetId', financialReportController.getFinancialReportsByBudgetId);

// Get all financial reports with optional filters
router.get('/', authorizeRole(['admin', 'accountant', 'finance_manager']), financialReportController.getAllFinancialReports);

// Update a financial report
router.put('/:id', authorizeRole(['admin', 'partner_user']), financialReportController.updateFinancialReport);

// Delete a financial report
router.delete('/:id', authorizeRole(['admin']), financialReportController.deleteFinancialReport);

// Submit a financial report
router.patch('/:id/submit', authorizeRole(['admin', 'partner_user']), financialReportController.submitFinancialReport);

// Approve a financial report
router.patch('/:id/approve', authorizeRole(['admin', 'accountant']), financialReportController.approveFinancialReport);

// Get receipts for a financial report
router.get('/:id/receipts', financialReportController.getReceiptsForFinancialReport);

// Export a financial report as PDF
router.get('/:id/export/pdf', authorizeRole(['admin', 'm&e_officer', 'donor']), financialReportController.exportFinancialReportAsPdf);

// Export a financial report as Excel
router.get('/:id/export/excel', authorizeRole(['admin', 'm&e_officer', 'donor']), financialReportController.exportFinancialReportAsExcel);

module.exports = router;