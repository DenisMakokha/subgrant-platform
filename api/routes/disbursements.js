const express = require('express');
const router = express.Router();
const disbursementController = require('../controllers/disbursementController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { validateDisbursement } = require('../middleware/validation');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Create a new disbursement
router.post('/', authorizeRole(['admin', 'accountant', 'finance_manager']), disbursementController.createDisbursement);

// Get a disbursement by ID
router.get('/:id', disbursementController.getDisbursementById);

// Get disbursements by budget ID
router.get('/budget/:budgetId', disbursementController.getDisbursementsByBudgetId);

// Get all disbursements with optional filters
router.get('/', authorizeRole(['admin', 'accountant', 'finance_manager']), disbursementController.getAllDisbursements);

// Update a disbursement
router.put('/:id', authorizeRole(['admin', 'accountant', 'finance_manager']), disbursementController.updateDisbursement);

// Delete a disbursement
router.delete('/:id', authorizeRole(['admin', 'finance_manager']), disbursementController.deleteDisbursement);

// Update disbursement status
router.patch('/:id/status', authorizeRole(['admin', 'accountant', 'finance_manager']), disbursementController.updateStatus);

// Mark disbursement as paid
router.patch('/:id/pay', authorizeRole(['admin', 'accountant']), disbursementController.markAsPaid);

// Mark disbursement as reconciled
router.patch('/:id/reconcile', authorizeRole(['admin', 'accountant']), disbursementController.markAsReconciled);

// Get total disbursement amount in a specific currency
router.get('/total/:targetCurrency', authorizeRole(['admin', 'accountant', 'finance_manager']), disbursementController.getTotalAmountInCurrency);

module.exports = router;