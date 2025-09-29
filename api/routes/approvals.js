const express = require('express');
const router = express.Router();
const approvalController = require('../controllers/approvalController');
const authMiddleware = require('../middleware/auth');
const rbacMiddleware = require('../middleware/rbac');

// All approval routes require authentication
router.use(authMiddleware);

// Approval APIs
router.post('/request', rbacMiddleware.checkPermission('approvals', 'request'), approvalController.requestApproval);
router.post('/:id/approve', rbacMiddleware.checkPermission('approvals', 'act'), approvalController.approveApproval);
router.post('/:id/reject', rbacMiddleware.checkPermission('approvals', 'act'), approvalController.rejectApproval);
router.get('/queue', rbacMiddleware.checkPermission('approvals', 'act'), approvalController.getApprovalQueue);

module.exports = router;