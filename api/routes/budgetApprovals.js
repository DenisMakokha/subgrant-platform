const express = require('express');
const router = express.Router();
const budgetApprovalController = require('../controllers/budgetApprovalController');
const authMiddleware = require('../middleware/auth');
const rbacMiddleware = require('../middleware/rbac');

// All budget approval routes require authentication
router.use(authMiddleware);

// Submit budget for approval (Partner users can submit their own budgets)
router.patch('/:id/submit', 
  rbacMiddleware.checkPermission('budgets', 'update'),
  budgetApprovalController.submitBudget
);

// Request revisions for budget (Approvers can request revisions)
router.patch('/:id/request-revisions', 
  rbacMiddleware.checkPermission('budgets', 'update'),
  budgetApprovalController.requestRevisions
);

// Multi-level approval workflow

// Accountant approval
router.patch('/:id/approve/accountant', 
  rbacMiddleware.checkPermission('budgets', 'update'),
  budgetApprovalController.accountantApprove
);

// Budget Holder approval
router.patch('/:id/approve/budget-holder', 
  rbacMiddleware.checkPermission('budgets', 'update'),
  budgetApprovalController.budgetHolderApprove
);

// Finance Manager final approval
router.patch('/:id/approve/finance-manager', 
  rbacMiddleware.checkPermission('budgets', 'update'),
  budgetApprovalController.financeManagerApprove
);

module.exports = router;