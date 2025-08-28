const express = require('express');
const router = express.Router();
const reviewCommentController = require('../controllers/reviewCommentController');
const authMiddleware = require('../middleware/auth');
const rbacMiddleware = require('../middleware/rbac');

// All review comment routes require authentication
router.use(authMiddleware);

// Create a new review comment
router.post('/', 
  rbacMiddleware.checkPermission('review_comments', 'create'),
  reviewCommentController.createComment
);

// Get all review comments (Admin only)
router.get('/', 
  rbacMiddleware.checkPermission('review_comments', 'read'),
  reviewCommentController.getAllComments
);

// Get review comment by ID
router.get('/:id', 
  rbacMiddleware.checkPermission('review_comments', 'read'),
  reviewCommentController.getCommentById
);

// Get review comments by entity type and ID
router.get('/entity/:entity_type/:entity_id', 
  rbacMiddleware.checkPermission('review_comments', 'read'),
  reviewCommentController.getCommentsByEntity
);

// Get review comments by author ID
router.get('/author/:author_id', 
  rbacMiddleware.checkPermission('review_comments', 'read'),
  reviewCommentController.getCommentsByAuthorId
);

// Update review comment (only author can update)
router.put('/:id', 
  rbacMiddleware.checkPermission('review_comments', 'update'),
  reviewCommentController.updateComment
);

// Delete review comment (only author or admin can delete)
router.delete('/:id', 
  rbacMiddleware.checkPermission('review_comments', 'delete'),
  reviewCommentController.deleteComment
);

// Resolve review comment (Admin or approvers can resolve)
router.patch('/:id/resolve', 
  rbacMiddleware.checkPermission('review_comments', 'update'),
  reviewCommentController.resolveComment
);

module.exports = router;