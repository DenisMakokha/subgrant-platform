const express = require('express');
const router = express.Router();
const contractSSOTController = require('../controllers/contractSSOTController');
const authMiddleware = require('../middleware/auth');
const rbacMiddleware = require('../middleware/rbac');

// All contract SSOT routes require authentication
router.use(authMiddleware);

// Create a new contract
router.post('/', 
  rbacMiddleware.checkPermission('contract', 'create'),
  contractSSOTController.createContract
);

// Generate contract document
router.post('/:id/generate', 
  rbacMiddleware.checkPermission('contract', 'update'),
  contractSSOTController.generate
);

// Submit contract for approval
router.post('/:id/submit', 
  rbacMiddleware.checkPermission('contract', 'update'),
  contractSSOTController.submitForApproval
);

// Mark contract as approved
router.post('/:id/approve', 
  rbacMiddleware.checkPermission('contract', 'update'),
  contractSSOTController.markApproved
);

// Send contract for signing
router.post('/:id/send-for-sign', 
  rbacMiddleware.checkPermission('contract', 'update'),
  contractSSOTController.sendForSign
);

// Mark contract as signed
router.post('/:id/sign', 
  rbacMiddleware.checkPermission('contract', 'update'),
  contractSSOTController.markSigned
);

// Activate contract
router.post('/:id/activate', 
  rbacMiddleware.checkPermission('contract', 'update'),
  contractSSOTController.activate
);

// Cancel contract
router.post('/:id/cancel', 
  rbacMiddleware.checkPermission('contract', 'update'),
  contractSSOTController.cancel
);

// Get contract with budget details
router.get('/:id', 
  rbacMiddleware.checkPermission('contract', 'read'),
  contractSSOTController.getContractWithBudget
);

// List contracts by project
router.get('/project/:projectId', 
  rbacMiddleware.checkPermission('contract', 'read'),
  contractSSOTController.listContractsByProject
);

// List contracts by partner
router.get('/partner/:partnerId', 
  rbacMiddleware.checkPermission('contract', 'read'),
  contractSSOTController.listContractsByPartner
);

// List contracts by state
router.get('/state/:state', 
  rbacMiddleware.checkPermission('contract', 'read'),
  contractSSOTController.listContractsByState
);

module.exports = router;