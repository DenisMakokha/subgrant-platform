const express = require('express');
const router = express.Router();
const ContractController = require('../controllers/contractController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');

// All contract routes require authentication
router.use(authenticateToken);

// Create a new contract (Admin only)
router.post(
  '/',
  authorizeRole(['admin', 'admin']),
  checkPermission('contracts', 'create'),
  ContractController.createContract
);

// Get a contract by ID
router.get(
  '/:id',
  checkPermission('contracts', 'read'),
  ContractController.getContractById
);

// Get contracts by budget ID
router.get(
  '/budget/:budgetId',
  checkPermission('contracts', 'read'),
  ContractController.getContractsByBudgetId
);

// Get all contracts with optional filters
router.get(
  '/',
  checkPermission('contracts', 'read'),
  ContractController.getAllContracts
);

// Update a contract (Admin only)
router.put(
  '/:id',
  authorizeRole(['admin', 'admin']),
  checkPermission('contracts', 'update'),
  ContractController.updateContract
);

// Delete a contract (Admin only)
router.delete(
  '/:id',
  authorizeRole(['admin', 'admin']),
  checkPermission('contracts', 'delete'),
  ContractController.deleteContract
);

// Upload a signed contract document (Admin only)
router.post(
  '/:contractId/artifacts',
  authorizeRole(['admin', 'admin']),
  checkPermission('contracts', 'update'),
  ContractController.uploadContractDocument
);

// Get contract artifacts by contract ID
router.get(
  '/:contractId/artifacts',
  checkPermission('contracts', 'read'),
  ContractController.getContractArtifacts
);

// Get the latest contract artifact
router.get(
  '/:contractId/artifacts/latest',
  checkPermission('contracts', 'read'),
  ContractController.getLatestContractArtifact
);

// Send contract for signing (Admin only)
router.post(
  '/:contractId/send-for-signing',
  authorizeRole(['admin', 'admin']),
  checkPermission('contracts', 'update'),
  ContractController.sendContractForSigning
);

// Download a contract document
router.get(
  '/artifacts/:artifactId/download',
  checkPermission('contracts', 'read'),
  ContractController.downloadContractDocument
);

// Generate contract PDF
router.post(
  '/:contractId/generate-pdf',
  authorizeRole(['admin', 'admin']),
  checkPermission('contracts', 'update'),
  ContractController.generateContractPDF
);

// Get contract templates
router.get(
  '/templates',
  checkPermission('contracts', 'read'),
  ContractController.getContractTemplates
);

module.exports = router;