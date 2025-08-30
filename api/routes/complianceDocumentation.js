const express = require('express');
const router = express.Router();
const complianceDocumentationController = require('../controllers/complianceDocumentationController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get compliance document types by organization type
router.get('/organizations/:organizationId/document-types', 
  authorizeRole(['admin', 'partner_user']), 
  complianceDocumentationController.getDocumentTypesByOrganization
);

// Get required compliance documents for an organization
router.get('/organizations/:organizationId/required-documents', 
  authorizeRole(['admin', 'partner_user']), 
  complianceDocumentationController.getRequiredDocumentsForOrganization
);

// Submit a compliance document for an organization
router.post('/organizations/:organizationId/document-types/:documentTypeId/submit', 
  authorizeRole(['admin', 'partner_user']), 
  complianceDocumentationController.submitComplianceDocument
);

// Approve a compliance document
router.put('/documents/:complianceDocId/approve', 
  authorizeRole(['admin']), 
  complianceDocumentationController.approveComplianceDocument
);

// Reject a compliance document
router.put('/documents/:complianceDocId/reject', 
  authorizeRole(['admin']), 
  complianceDocumentationController.rejectComplianceDocument
);

// Get compliance document templates by document type
router.get('/document-types/:documentTypeId/templates', 
  authorizeRole(['admin', 'partner_user']), 
  complianceDocumentationController.getDocumentTemplatesByType
);

// Get compliance status summary for an organization
router.get('/organizations/:organizationId/status-summary', 
  authorizeRole(['admin', 'partner_user']), 
  complianceDocumentationController.getComplianceStatusSummary
);

// Get overdue compliance documents for an organization
router.get('/organizations/:organizationId/overdue-documents', 
  authorizeRole(['admin', 'partner_user']), 
  complianceDocumentationController.getOverdueDocuments
);

// Review a compliance document (set review status and add comments)
router.put('/documents/:complianceDocId/review',
  authorizeRole(['admin']),
  complianceDocumentationController.reviewComplianceDocument
);

// Get expired compliance documents for an organization
router.get('/organizations/:organizationId/expired-documents',
  authorizeRole(['admin', 'partner_user']),
  complianceDocumentationController.getExpiredDocuments
);

// Search and filter compliance documents
router.get('/documents/search',
  authorizeRole(['admin', 'partner_user']),
  complianceDocumentationController.searchComplianceDocuments
);

// Create a new compliance document type
router.post('/document-types',
  authorizeRole(['admin']),
  complianceDocumentationController.createDocumentType
);

// Update a compliance document type
router.put('/document-types/:documentTypeId',
  authorizeRole(['admin']),
  complianceDocumentationController.updateDocumentType
);

// Delete a compliance document type
router.delete('/document-types/:documentTypeId',
  authorizeRole(['admin']),
  complianceDocumentationController.deleteDocumentType
);

module.exports = router;