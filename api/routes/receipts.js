const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receiptController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { validateReceipt } = require('../middleware/validation');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Create a new receipt
router.post('/', authorizeRole(['admin', 'partner_user']), receiptController.createReceipt);

// Get a receipt by ID
router.get('/:id', receiptController.getReceiptById);

// Get receipts by financial report ID
router.get('/financial-report/:financialReportId', receiptController.getReceiptsByFinancialReportId);

// Get receipts by budget line ID
router.get('/budget-line/:budgetLineId', receiptController.getReceiptsByBudgetLineId);

// Get all receipts with optional filters
router.get('/', authorizeRole(['admin', 'accountant', 'finance_manager']), receiptController.getAllReceipts);

// Update a receipt
router.put('/:id', authorizeRole(['admin', 'partner_user']), receiptController.updateReceipt);

// Delete a receipt
router.delete('/:id', authorizeRole(['admin']), receiptController.deleteReceipt);

module.exports = router;