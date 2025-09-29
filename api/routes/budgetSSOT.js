const express = require('express');
const router = express.Router();
const budgetSSOTController = require('../controllers/budgetSSOTController');
const authMiddleware = require('../middleware/auth');
const rbacMiddleware = require('../middleware/rbac');

// All budget SSOT routes require authentication
router.use(authMiddleware);

// Create a new budget
router.post('/', 
  rbacMiddleware.checkPermission('budget', 'create'),
  budgetSSOTController.createBudget
);

// Update a budget
router.put('/:id', 
  rbacMiddleware.checkPermission('budget', 'update'),
  budgetSSOTController.updateBudget
);

// Add budget lines
router.post('/:id/lines', 
  rbacMiddleware.checkPermission('budget', 'update'),
  budgetSSOTController.addBudgetLines
);

// Update budget lines
router.put('/lines', 
  rbacMiddleware.checkPermission('budget', 'update'),
  budgetSSOTController.updateBudgetLines
);

// Delete budget lines
router.delete('/lines', 
  rbacMiddleware.checkPermission('budget', 'update'),
  budgetSSOTController.deleteBudgetLines
);

// Get a budget with its lines
router.get('/:id', 
  rbacMiddleware.checkPermission('budget', 'read'),
  budgetSSOTController.getBudgetWithLines
);

// List budgets by project
router.get('/project/:projectId', 
  rbacMiddleware.checkPermission('budget', 'read'),
  budgetSSOTController.listBudgetsByProject
);

// List budgets by partner
router.get('/partner/:partnerId', 
  rbacMiddleware.checkPermission('budget', 'read'),
  budgetSSOTController.listBudgetsByPartner
);

// Transition budget status
router.post('/:id/transition', 
  rbacMiddleware.checkPermission('budget', 'update'),
  budgetSSOTController.transitionStatus
);

module.exports = router;