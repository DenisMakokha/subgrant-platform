const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
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
 * Reported Issues SSOT Routes
 * Base path: /api/reported-issues
 */

// Authenticated user routes (users can see their own issues, admins see all)
router.get('/', requireAuth, getAllIssues);
router.get('/stats', requireAuth, requireRole('admin'), getIssueStats);
router.get('/:id', requireAuth, getIssueById);
router.post('/', requireAuth, createIssue);
router.post('/:id/comments', requireAuth, addComment);

// Admin-only routes
router.put('/:id', requireAuth, requireRole('admin'), updateIssue);
router.delete('/:id', requireAuth, requireRole('admin'), deleteIssue);

module.exports = router;
