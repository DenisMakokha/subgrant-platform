const express = require('express');
const router = express.Router();
const ForumController = require('../controllers/forumController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// Apply authentication to all forum routes
router.use(authenticateToken);

// Categories routes
router.get('/categories', ForumController.getCategories);
router.post('/categories', requireRole(['system_administrator', 'moderator']), ForumController.createCategory);
router.get('/categories/hierarchy', ForumController.getCategoryHierarchy);
router.get('/categories/:id', ForumController.getCategoryById);
router.patch('/categories/:id', requireRole(['system_administrator', 'moderator']), ForumController.updateCategory);
router.delete('/categories/:id', requireRole(['system_administrator']), ForumController.deleteCategory);

// Tags routes
router.get('/tags', ForumController.getTags);
router.post('/tags', requireRole(['system_administrator', 'moderator']), ForumController.createTag);
router.get('/tags/popular', ForumController.getPopularTags);
router.get('/tags/search', ForumController.searchTags);
router.get('/tags/:id', ForumController.getTagById);
router.patch('/tags/:id', requireRole(['system_administrator', 'moderator']), ForumController.updateTag);
router.delete('/tags/:id', requireRole(['system_administrator']), ForumController.deleteTag);

// Topics routes
router.get('/topics', ForumController.getTopics);
router.post('/topics', ForumController.createTopic);
router.get('/topics/:id', ForumController.getTopicById);
router.patch('/topics/:id', ForumController.updateTopic);
router.delete('/topics/:id', ForumController.deleteTopic);

// Topic moderation routes
router.post('/topics/:id/lock', requireRole(['system_administrator', 'moderator']), ForumController.lockTopic);
router.post('/topics/:id/unlock', requireRole(['system_administrator', 'moderator']), ForumController.unlockTopic);
router.post('/topics/:id/pin', requireRole(['system_administrator', 'moderator']), ForumController.pinTopic);
router.post('/topics/:id/unpin', requireRole(['system_administrator', 'moderator']), ForumController.unpinTopic);
router.patch('/topics/:id/tags', requireRole(['system_administrator', 'moderator']), ForumController.updateTopicTags);

// Posts routes
router.get('/topics/:id/posts', ForumController.getTopicPosts);
router.post('/topics/:id/posts', ForumController.createPost);
router.get('/topics/:id/posts/:postId', ForumController.getPostById);
router.patch('/topics/:id/posts/:postId', ForumController.updatePost);
router.delete('/topics/:id/posts/:postId', ForumController.deletePost);

// Post answer routes
router.post('/topics/:id/posts/:postId/accept', ForumController.markPostAsAnswer);
router.delete('/topics/:id/posts/:postId/accept', ForumController.unmarkPostAsAnswer);
router.get('/topics/:id/posts/:postId/replies', ForumController.getPostReplies);

// Attachments routes
router.get('/topics/:id/attachments', ForumController.getTopicAttachments);
router.get('/topics/:id/posts/:postId/attachments', ForumController.getPostAttachments);
router.get('/attachments/:attachmentId', ForumController.getAttachmentById);
router.get('/attachments/:attachmentId/download', ForumController.downloadAttachment);
router.delete('/attachments/:attachmentId', ForumController.deleteAttachment);

// Search routes
router.get('/search', ForumController.searchForum);

// Statistics routes
router.get('/stats', requireRole(['system_administrator', 'moderator']), ForumController.getForumStats);

module.exports = router;
