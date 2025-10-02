const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const rbacMiddleware = require('../middleware/rbac');
const {
  getAllIssues,
  getIssueById,
  createIssue,
  updateIssue,
  addComment,
  getIssueStats,
  deleteIssue
} = require('../controllers/reportedIssuesController');

/**
 * Reported Issues SSOT Routes with Capability-Based Access Control
 * Base path: /api/reported-issues
 * 
 * Capabilities:
 * - issues.view: View reported issues
 * - issues.create: Report new issues
 * - issues.update: Update issue status/priority
 * - issues.assign: Assign issues to users
 * - issues.resolve: Resolve issues
 * - issues.delete: Delete issues
 */

// All authenticated users can view their own issues and create new ones
router.get('/', requireAuth, getAllIssues);
router.get('/:id', requireAuth, getIssueById);
router.post('/', requireAuth, createIssue);
router.post('/:id/comments', requireAuth, addComment);

// Capability-based routes (checks user's role capabilities)
router.get('/stats', requireAuth, rbacMiddleware.checkPermission('issues', 'view'), getIssueStats);
router.put('/:id', requireAuth, rbacMiddleware.checkPermission('issues', 'update'), updateIssue);
router.delete('/:id', requireAuth, rbacMiddleware.checkPermission('issues', 'delete'), deleteIssue);

module.exports = router;
