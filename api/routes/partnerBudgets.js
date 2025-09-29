const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const rbacMiddleware = require('../middleware/rbac');
const partnerBudgetController = require('../controllers/partnerBudgetController');

router.use(authMiddleware);

router.post(
  '/',
  rbacMiddleware.checkPermission('budgets', 'create'),
  partnerBudgetController.createBudget
);

router.put(
  '/:id',
  rbacMiddleware.checkPermission('budgets', 'update'),
  partnerBudgetController.updateBudget
);

router.get(
  '/:id',
  rbacMiddleware.checkPermission('budgets', 'read'),
  partnerBudgetController.getBudgetById
);

router.get(
  '/partner/:partner_id',
  rbacMiddleware.checkPermission('budgets', 'read'),
  partnerBudgetController.getBudgetsByPartner
);

router.get(
  '/project/:project_id',
  rbacMiddleware.checkPermission('budgets', 'read'),
  partnerBudgetController.getBudgetsByProject
);

router.get(
  '/:id/templates',
  rbacMiddleware.checkPermission('budgets', 'read'),
  partnerBudgetController.getBudgetTemplates
);

router.get(
  '/:id/lines',
  rbacMiddleware.checkPermission('budgets', 'read'),
  partnerBudgetController.getBudgetLines
);

router.get(
  '/:id/review-thread',
  rbacMiddleware.checkPermission('budgets', 'read'),
  partnerBudgetController.getReviewThread
);

router.post(
  '/:id/review-comments',
  rbacMiddleware.checkPermission('budgets', 'update'),
  partnerBudgetController.createReviewComment
);

router.post(
  '/:id/review-comments/resolve',
  rbacMiddleware.checkPermission('budgets', 'update'),
  partnerBudgetController.resolveReviewComments
);

router.post(
  '/:id/validate',
  rbacMiddleware.checkPermission('budgets', 'read'),
  partnerBudgetController.validateBudget
);

router.post(
  '/:id/submit',
  rbacMiddleware.checkPermission('budgets', 'update'),
  partnerBudgetController.submitBudget
);

router.post(
  '/:id/request-revisions',
  rbacMiddleware.checkPermission('budgets', 'update'),
  partnerBudgetController.requestRevisions
);

router.post(
  '/:id/approve/accountant',
  rbacMiddleware.checkPermission('budgets', 'update'),
  partnerBudgetController.approveAsAccountant
);

router.post(
  '/:id/approve/budget-holder',
  rbacMiddleware.checkPermission('budgets', 'update'),
  partnerBudgetController.approveAsBudgetHolder
);

router.post(
  '/:id/approve/finance-manager',
  rbacMiddleware.checkPermission('budgets', 'update'),
  partnerBudgetController.approveAsFinanceManager
);

module.exports = router;