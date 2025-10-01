const express = require('express');
const router = express.Router();
const approvalChainController = require('../controllers/approvalChainController');
const authMiddleware = require('../middleware/auth');
const rbacMiddleware = require('../middleware/rbac');

// All approval chain routes require authentication
router.use(authMiddleware);

// ==================== WORKFLOW MANAGEMENT (Admin Only) ====================
router.get(
  '/workflows',
  rbacMiddleware.checkPermission('approvals', 'configure'),
  approvalChainController.getWorkflows
);

router.get(
  '/workflows/:id',
  rbacMiddleware.checkPermission('approvals', 'configure'),
  approvalChainController.getWorkflowById
);

router.post(
  '/workflows',
  rbacMiddleware.checkPermission('approvals', 'configure'),
  approvalChainController.createWorkflow
);

router.put(
  '/workflows/:id',
  rbacMiddleware.checkPermission('approvals', 'configure'),
  approvalChainController.updateWorkflow
);

router.delete(
  '/workflows/:id',
  rbacMiddleware.checkPermission('approvals', 'configure'),
  approvalChainController.deleteWorkflow
);

// ==================== APPROVAL REQUESTS ====================
router.post(
  '/request',
  rbacMiddleware.checkPermission('approvals', 'request'),
  approvalChainController.createRequest
);

router.get(
  '/queue',
  rbacMiddleware.checkPermission('approvals', 'act'),
  approvalChainController.getQueue
);

// ==================== ANALYTICS (must be before /:id) ====================
router.get(
  '/analytics',
  rbacMiddleware.checkPermission('approvals', 'view'),
  approvalChainController.getAnalytics
);

// ==================== DELEGATION ====================
router.get(
  '/delegates',
  rbacMiddleware.checkPermission('approvals', 'delegate'),
  approvalChainController.getDelegations
);

router.post(
  '/delegates',
  rbacMiddleware.checkPermission('approvals', 'delegate'),
  approvalChainController.createDelegation
);

router.delete(
  '/delegates/:id',
  rbacMiddleware.checkPermission('approvals', 'delegate'),
  approvalChainController.deleteDelegation
);

// ==================== SPECIFIC REQUEST ROUTES (/:id must be last) ====================
router.get(
  '/:id',
  approvalChainController.getRequestById
);

router.post(
  '/:id/approve',
  rbacMiddleware.checkPermission('approvals', 'act'),
  approvalChainController.approveRequest
);

router.post(
  '/:id/reject',
  rbacMiddleware.checkPermission('approvals', 'act'),
  approvalChainController.rejectRequest
);

router.post(
  '/:id/cancel',
  approvalChainController.cancelRequest
);

module.exports = router;
