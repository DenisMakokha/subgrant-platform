const express = require('express');
const router = express.Router();
const adminKnowledgeController = require('../controllers/adminKnowledgeController');
const { body, param, query } = require('express-validator');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/knowledge/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept common document formats
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/rtf'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Word, Excel, and text files are allowed.'), false);
    }
  }
});

/**
 * Knowledge Documents Routes
 */

// GET /api/admin/knowledge/documents - Get all documents with filtering and pagination
router.get('/documents', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('sortBy').optional().isIn(['title', 'type', 'category', 'status', 'author', 'createdAt', 'updatedAt']),
  query('sortOrder').optional().isIn(['ASC', 'DESC']),
  query('query').optional().isString(),
  query('type').optional().isIn(['policy', 'procedure', 'guideline', 'template', 'training', 'reference']),
  query('category').optional().isString(),
  query('status').optional().isIn(['draft', 'review', 'published', 'archived']),
  query('author').optional().isString(),
  query('tags').optional().isArray()
], adminKnowledgeController.getDocuments);

// GET /api/admin/knowledge/documents/popular - Get popular documents
router.get('/documents/popular', [
  query('limit').optional().isInt({ min: 1, max: 50 })
], adminKnowledgeController.getPopularDocuments);

// GET /api/admin/knowledge/documents/recent - Get recent documents
router.get('/documents/recent', [
  query('limit').optional().isInt({ min: 1, max: 50 })
], adminKnowledgeController.getRecentDocuments);

// GET /api/admin/knowledge/documents/statistics - Get document statistics
router.get('/documents/statistics', adminKnowledgeController.getDocumentStatistics);

// GET /api/admin/knowledge/documents/categories - Get all document categories
router.get('/documents/categories', adminKnowledgeController.getDocumentCategories);

// GET /api/admin/knowledge/documents/tags - Get all document tags
router.get('/documents/tags', adminKnowledgeController.getDocumentTags);

// GET /api/admin/knowledge/documents/:id - Get document by ID
router.get('/documents/:id', [
  param('id').notEmpty().isString()
], adminKnowledgeController.getDocumentById);

// POST /api/admin/knowledge/documents - Create new document
router.post('/documents', [
  upload.single('file'),
  body('title').notEmpty().isLength({ min: 1, max: 255 }),
  body('description').optional().isLength({ max: 1000 }),
  body('content').notEmpty(),
  body('type').isIn(['policy', 'procedure', 'guideline', 'template', 'training', 'reference']),
  body('category').notEmpty(),
  body('tags').optional().isArray(),
  body('version').optional().isString(),
  body('status').optional().isIn(['draft', 'review', 'published', 'archived'])
], adminKnowledgeController.createDocument);

// PUT /api/admin/knowledge/documents/:id - Update document
router.put('/documents/:id', [
  param('id').notEmpty().isString(),
  upload.single('file'),
  body('title').optional().isLength({ min: 1, max: 255 }),
  body('description').optional().isLength({ max: 1000 }),
  body('content').optional(),
  body('type').optional().isIn(['policy', 'procedure', 'guideline', 'template', 'training', 'reference']),
  body('category').optional(),
  body('tags').optional().isArray(),
  body('version').optional().isString(),
  body('status').optional().isIn(['draft', 'review', 'published', 'archived'])
], adminKnowledgeController.updateDocument);

// DELETE /api/admin/knowledge/documents/:id - Delete document
router.delete('/documents/:id', [
  param('id').notEmpty().isString()
], adminKnowledgeController.deleteDocument);

// GET /api/admin/knowledge/documents/:id/download - Download document file
router.get('/documents/:id/download', [
  param('id').notEmpty().isString()
], adminKnowledgeController.downloadDocument);

// POST /api/admin/knowledge/documents/bulk-status - Bulk update document status
router.post('/documents/bulk-status', [
  body('documentIds').isArray({ min: 1 }),
  body('status').isIn(['draft', 'review', 'published', 'archived'])
], adminKnowledgeController.bulkUpdateDocumentStatus);

// POST /api/admin/knowledge/documents/archive-old - Archive old documents
router.post('/documents/archive-old', [
  body('olderThanDays').optional().isInt({ min: 1 })
], adminKnowledgeController.archiveOldDocuments);

/**
 * Training Modules Routes
 */

// GET /api/admin/knowledge/modules - Get all training modules with filtering and pagination
router.get('/modules', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('sortBy').optional().isIn(['title', 'type', 'category', 'difficulty', 'status', 'createdAt', 'updatedAt']),
  query('sortOrder').optional().isIn(['ASC', 'DESC']),
  query('query').optional().isString(),
  query('type').optional().isIn(['course', 'workshop', 'webinar', 'documentation', 'video', 'quiz']),
  query('category').optional().isString(),
  query('status').optional().isIn(['draft', 'published', 'archived']),
  query('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']),
  query('tags').optional().isArray()
], adminKnowledgeController.getTrainingModules);

// GET /api/admin/knowledge/modules/popular - Get popular modules
router.get('/modules/popular', [
  query('limit').optional().isInt({ min: 1, max: 50 })
], adminKnowledgeController.getPopularModules);

// GET /api/admin/knowledge/modules/recent - Get recent modules
router.get('/modules/recent', [
  query('limit').optional().isInt({ min: 1, max: 50 })
], adminKnowledgeController.getRecentModules);

// GET /api/admin/knowledge/modules/statistics - Get module statistics
router.get('/modules/statistics', adminKnowledgeController.getTrainingStatistics);

// GET /api/admin/knowledge/modules/categories - Get all module categories
router.get('/modules/categories', adminKnowledgeController.getTrainingCategories);

// GET /api/admin/knowledge/modules/tags - Get all module tags
router.get('/modules/tags', adminKnowledgeController.getTrainingTags);

// GET /api/admin/knowledge/modules/:id - Get module by ID
router.get('/modules/:id', [
  param('id').notEmpty().isString()
], adminKnowledgeController.getTrainingModuleById);

// POST /api/admin/knowledge/modules - Create new training module
router.post('/modules', [
  body('title').notEmpty().isLength({ min: 1, max: 255 }),
  body('description').notEmpty().isLength({ max: 1000 }),
  body('type').isIn(['course', 'workshop', 'webinar', 'documentation', 'video', 'quiz']),
  body('category').notEmpty(),
  body('difficulty').isIn(['beginner', 'intermediate', 'advanced']),
  body('duration').isInt({ min: 1 }),
  body('content').isArray({ min: 1 }),
  body('prerequisites').optional().isArray(),
  body('learningObjectives').optional().isArray(),
  body('tags').optional().isArray(),
  body('status').optional().isIn(['draft', 'published', 'archived'])
], adminKnowledgeController.createTrainingModule);

// PUT /api/admin/knowledge/modules/:id - Update training module
router.put('/modules/:id', [
  param('id').notEmpty().isString(),
  body('title').optional().isLength({ min: 1, max: 255 }),
  body('description').optional().isLength({ max: 1000 }),
  body('type').optional().isIn(['course', 'workshop', 'webinar', 'documentation', 'video', 'quiz']),
  body('category').optional(),
  body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']),
  body('duration').optional().isInt({ min: 1 }),
  body('content').optional().isArray(),
  body('prerequisites').optional().isArray(),
  body('learningObjectives').optional().isArray(),
  body('tags').optional().isArray(),
  body('status').optional().isIn(['draft', 'published', 'archived'])
], adminKnowledgeController.updateTrainingModule);

// DELETE /api/admin/knowledge/modules/:id - Delete training module
router.delete('/modules/:id', [
  param('id').notEmpty().isString()
], adminKnowledgeController.deleteTrainingModule);

// POST /api/admin/knowledge/modules/:id/enroll - Enroll user in module
router.post('/modules/:id/enroll', [
  param('id').notEmpty().isString()
], adminKnowledgeController.enrollInModule);

// POST /api/admin/knowledge/modules/bulk-status - Bulk update module status
router.post('/modules/bulk-status', [
  body('moduleIds').isArray({ min: 1 }),
  body('status').isIn(['draft', 'published', 'archived'])
], adminKnowledgeController.bulkUpdateModuleStatus);

// POST /api/admin/knowledge/modules/archive-old - Archive old modules
router.post('/modules/archive-old', [
  body('olderThanDays').optional().isInt({ min: 1 })
], adminKnowledgeController.archiveOldModules);

module.exports = router;
