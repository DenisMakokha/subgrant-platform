const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');
const authMiddleware = require('../middleware/auth');
const rbacMiddleware = require('../middleware/rbac');

// All budget routes require authentication
router.use(authMiddleware);

// Create a new budget
router.post('/', 
  rbacMiddleware.checkPermission('budgets', 'create'),
  budgetController.createBudget
);

// Get all budgets
router.get('/', 
  rbacMiddleware.checkPermission('budgets', 'read'),
  budgetController.getAllBudgets
);

// Get budget by ID
router.get('/:id', 
  rbacMiddleware.checkPermission('budgets', 'read'),
  budgetController.getBudgetById
);

// Get budgets by organization ID
router.get('/organization/:organization_id', 
  rbacMiddleware.checkPermission('budgets', 'read'),
  budgetController.getBudgetsByOrganizationId
);

// Get budgets by project ID
router.get('/project/:project_id', 
  rbacMiddleware.checkPermission('budgets', 'read'),
  budgetController.getBudgetsByProjectId
);

// Get budgets by status
router.get('/status/:status', 
  rbacMiddleware.checkPermission('budgets', 'read'),
  budgetController.getBudgetsByStatus
);

// Update budget (only allowed for budgets in draft status)
router.put('/:id', 
  rbacMiddleware.checkPermission('budgets', 'update'),
  budgetController.updateBudget
);

// Delete budget (only allowed for budgets in draft status)
router.delete('/:id', 
  rbacMiddleware.checkPermission('budgets', 'delete'),
  budgetController.deleteBudget
);

// Submit budget for approval (Partner users can submit their own budgets)
router.patch('/:id/submit', 
  rbacMiddleware.checkPermission('budgets', 'update'),
  budgetController.submitBudget
);

// Request revisions for budget (Approvers can request revisions)
router.patch('/:id/request-revisions', 
  rbacMiddleware.checkPermission('budgets', 'update'),
  budgetController.requestRevisions
);

// Approve budget (Approvers can approve budgets)
router.patch('/:id/approve', 
  rbacMiddleware.checkPermission('budgets', 'update'),
  budgetController.approveBudget
);

module.exports = router;