const express = require('express');
const router = express.Router();
const complianceDocumentTemplateController = require('../controllers/complianceDocumentTemplateController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Create a new compliance document template
router.post('/', 
  authorizeRole(['admin']), 
  complianceDocumentTemplateController.createTemplate
);

// Get all compliance document templates
router.get('/', 
  authorizeRole(['admin', 'partner_user']), 
  complianceDocumentTemplateController.getAllTemplates
);

// Get a specific compliance document template by ID
router.get('/:templateId', 
  authorizeRole(['admin', 'partner_user']), 
  complianceDocumentTemplateController.getTemplateById
);

// Update a compliance document template
router.put('/:templateId', 
  authorizeRole(['admin']), 
  complianceDocumentTemplateController.updateTemplate
);

// Delete a compliance document template
router.delete('/:templateId', 
  authorizeRole(['admin']), 
  complianceDocumentTemplateController.deleteTemplate
);

module.exports = router;