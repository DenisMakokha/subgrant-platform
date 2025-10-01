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

// Public routes (authenticated users)
router.post('/', requireAuth, createIssue);

// Admin routes
router.get('/', requireAuth, requireRole('admin'), getAllIssues);
router.get('/stats', requireAuth, requireRole('admin'), getIssueStats);
router.get('/:id', requireAuth, getIssueById);
router.put('/:id', requireAuth, requireRole('admin'), updateIssue);
router.post('/:id/comments', requireAuth, addComment);
router.delete('/:id', requireAuth, requireRole('admin'), deleteIssue);

module.exports = router;
