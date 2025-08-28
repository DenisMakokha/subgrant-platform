const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all documents with optional filters
router.get('/', authorizeRole(['admin', 'auditor']), documentController.getAllDocuments);

// Get a document by ID
router.get('/:id', authorizeRole(['admin', 'auditor']), documentController.getDocumentById);

// Get documents by entity
router.get('/entity/:entityType/:entityId', authorizeRole(['admin', 'auditor']), documentController.getDocumentsByEntity);

// Get documents by user
router.get('/user/:userId', authorizeRole(['admin', 'auditor']), documentController.getDocumentsByUser);

// Create a new document
router.post('/', authorizeRole(['admin', 'partner_user']), documentController.createDocument);

// Update a document
router.put('/:id', authorizeRole(['admin', 'partner_user']), documentController.updateDocument);

// Delete a document
router.delete('/:id', authorizeRole(['admin']), documentController.deleteDocument);

// Get version history for a document entity
router.get('/history/:entityType/:entityId', authorizeRole(['admin', 'auditor']), documentController.getVersionHistory);

// Verify document checksum
router.post('/:id/verify', authorizeRole(['admin', 'auditor']), documentController.verifyChecksum);

module.exports = router;