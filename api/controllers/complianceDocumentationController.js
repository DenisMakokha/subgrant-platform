const ComplianceDocumentType = require('../models/complianceDocumentType');
const ComplianceDocumentTemplate = require('../models/complianceDocumentTemplate');
const OrganizationComplianceDocument = require('../models/organizationComplianceDocument');
const Organization = require('../models/organization');
const Document = require('../models/document');
const auditLogger = require('../middleware/auditLogger');
const logger = require('../utils/logger');

class ComplianceDocumentationController {
  // Get compliance document types by organization type
  static async getDocumentTypesByOrganization(req, res, next) {
    try {
      const { organizationId } = req.params;
      
      // Get the organization to determine its type
      const organization = await Organization.findById(organizationId);
      if (!organization) {
        return res.status(404).json({ error: 'Organization not found' });
      }
      
      // Get required compliance document types for this organization type
      const documentTypes = await ComplianceDocumentType.findByOrganizationType(organization.country);
      
      // Log the access
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'GET_COMPLIANCE_DOCUMENT_TYPES',
          entity_type: 'compliance_document_type',
          entity_id: null,
          before_state: null,
          after_state: { organization_id: organizationId, organization_type: organization.country },
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        logger.error('Error creating audit log:', auditError);
      }
      
      res.json(documentTypes);
    } catch (err) {
      next(err);
    }
  }
  
  // Get required compliance documents for an organization
  static async getRequiredDocumentsForOrganization(req, res, next) {
    try {
      const { organizationId } = req.params;
      
      // Get the organization
      const organization = await Organization.findById(organizationId);
      if (!organization) {
        return res.status(404).json({ error: 'Organization not found' });
      }
      
      // Get required compliance document types for this organization type
      const requiredDocumentTypes = await ComplianceDocumentType.findRequiredByOrganizationType(organization.country);
      
      // Get existing compliance documents for this organization
      const existingComplianceDocs = await OrganizationComplianceDocument.findByOrganization(organizationId);
      
      // Combine the required document types with existing compliance documents
      const result = requiredDocumentTypes.map(type => {
        const existingDoc = existingComplianceDocs.find(doc => doc.document_type_id === type.id);
        return {
          ...type,
          compliance_document: existingDoc || null
        };
      });
      
      // Log the access
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'GET_REQUIRED_COMPLIANCE_DOCUMENTS',
          entity_type: 'organization',
          entity_id: organizationId,
          before_state: null,
          after_state: { organization_id: organizationId },
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        logger.error('Error creating audit log:', auditError);
      }
      
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
  
  // Submit a compliance document for an organization with validation
  static async submitComplianceDocument(req, res, next) {
    try {
      const { organizationId, documentTypeId } = req.params;
      const { documentId } = req.body;
      
      // Verify the organization exists
      const organization = await Organization.findById(organizationId);
      if (!organization) {
        return res.status(404).json({ error: 'Organization not found' });
      }
      
      // Verify the document type exists
      const documentType = await ComplianceDocumentType.findById(documentTypeId);
      if (!documentType) {
        return res.status(404).json({ error: 'Document type not found' });
      }
      
      // Verify the document exists
      const document = await Document.findById(documentId);
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }
      
      // Validate the document against the document type requirements
      const validationError = await ComplianceDocumentationController.validateComplianceDocument(document, documentType);
      if (validationError) {
        return res.status(400).json({ error: validationError });
      }
      
      // Check if there's already a compliance document record for this organization and type
      let complianceDoc = await OrganizationComplianceDocument.findByOrganizationAndType(organizationId, documentTypeId);
      
      if (complianceDoc) {
        // Update existing compliance document record
        complianceDoc = await OrganizationComplianceDocument.update(complianceDoc.id, {
          document_id: documentId,
          status: 'submitted',
          submitted_at: new Date(),
          updated_at: new Date()
        });
      } else {
        // Create new compliance document record
        complianceDoc = await OrganizationComplianceDocument.create({
          organization_id: organizationId,
          document_type_id: documentTypeId,
          document_id: documentId,
          status: 'submitted',
          submitted_at: new Date()
        });
      }
      
      // Update organization's compliance status if all required documents are submitted
      const complianceSummary = await OrganizationComplianceDocument.getComplianceStatusSummary(organizationId);
      const totalRequired = await ComplianceDocumentType.findRequiredByOrganizationType(organization.country);
      
      if (complianceSummary.approved_documents >= totalRequired.length) {
        await Organization.update(organizationId, {
          compliance_status: 'approved',
          due_diligence_completed: true,
          due_diligence_date: new Date()
        });
      }
      
      // Log the submission
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'SUBMIT_COMPLIANCE_DOCUMENT',
          entity_type: 'organization_compliance_document',
          entity_id: complianceDoc.id,
          before_state: null,
          after_state: complianceDoc,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        logger.error('Error creating audit log:', auditError);
      }
      
      res.status(201).json({
        message: 'Compliance document submitted successfully',
        compliance_document: complianceDoc
      });
    } catch (err) {
      next(err);
    }
  }
  
  // Validate a compliance document against document type requirements
  static async validateComplianceDocument(document, documentType) {
    try {
      // Check document format (based on mime type)
      if (documentType.allowed_mime_types && documentType.allowed_mime_types.length > 0) {
        if (!documentType.allowed_mime_types.includes(document.mime_type)) {
          return `Invalid document format. Allowed formats: ${documentType.allowed_mime_types.join(', ')}`;
        }
      }
      
      // Check document size (in bytes)
      if (documentType.max_file_size) {
        // In a real implementation, you would check the actual file size
        // For now, we'll assume the document size is stored in the document object
        if (document.file_size && document.file_size > documentType.max_file_size) {
          return `Document size exceeds maximum allowed size of ${documentType.max_file_size} bytes`;
        }
      }
      
      // Check if document has required fields
      if (documentType.required_fields && documentType.required_fields.length > 0) {
        // In a real implementation, you would check the document content for required fields
        // For now, we'll just log that this validation should be implemented
        logger.info('Document content validation for required fields should be implemented');
      }
      
      // If we have compliance document templates, check against them
      if (documentType.id) {
        const templates = await ComplianceDocumentTemplate.findByDocumentType(documentType.id);
        if (templates.length > 0) {
          // In a real implementation, you would validate the document against the templates
          // For now, we'll just log that this validation should be implemented
          logger.info('Document template validation should be implemented');
        }
      }
      
      // If all validations pass, return null (no error)
      return null;
    } catch (error) {
      logger.error('Error validating compliance document:', error);
      return 'Error validating document';
    }
  }
  
  // Approve a compliance document
  static async approveComplianceDocument(req, res, next) {
    try {
      const { complianceDocId } = req.params;
      
      // Get the compliance document
      let complianceDoc = await OrganizationComplianceDocument.findById(complianceDocId);
      if (!complianceDoc) {
        return res.status(404).json({ error: 'Compliance document not found' });
      }
      
      // Update the compliance document status
      complianceDoc = await OrganizationComplianceDocument.update(complianceDocId, {
        status: 'approved',
        approved_at: new Date(),
        approved_by: req.user.id,
        updated_at: new Date()
      });
      
      // Log the approval
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'APPROVE_COMPLIANCE_DOCUMENT',
          entity_type: 'organization_compliance_document',
          entity_id: complianceDocId,
          before_state: { status: 'submitted' },
          after_state: complianceDoc,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        logger.error('Error creating audit log:', auditError);
      }
      
      res.json({
        message: 'Compliance document approved successfully',
        compliance_document: complianceDoc
      });
    } catch (err) {
      next(err);
    }
  }
  
  // Reject a compliance document with detailed feedback
  static async rejectComplianceDocument(req, res, next) {
    try {
      const { complianceDocId } = req.params;
      const { rejection_reason, rejection_category, rejection_details, required_actions } = req.body;
      
      // Get the compliance document
      let complianceDoc = await OrganizationComplianceDocument.findById(complianceDocId);
      if (!complianceDoc) {
        return res.status(404).json({ error: 'Compliance document not found' });
      }
      
      // Prepare update data with detailed feedback
      const updateData = {
        status: 'rejected',
        rejection_reason,
        updated_at: new Date()
      };
      
      // Add optional detailed feedback fields if provided
      if (rejection_category) {
        updateData.rejection_category = rejection_category;
      }
      
      if (rejection_details) {
        updateData.rejection_details = rejection_details;
      }
      
      if (required_actions) {
        updateData.required_actions = required_actions;
      }
      
      // Update the compliance document status with detailed feedback
      complianceDoc = await OrganizationComplianceDocument.update(complianceDocId, updateData);
      
      // Log the rejection
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'REJECT_COMPLIANCE_DOCUMENT',
          entity_type: 'organization_compliance_document',
          entity_id: complianceDocId,
          before_state: { status: 'submitted' },
          after_state: complianceDoc,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        logger.error('Error creating audit log:', auditError);
      }
      
      res.json({
        message: 'Compliance document rejected successfully with detailed feedback',
        compliance_document: complianceDoc
      });
    } catch (err) {
      next(err);
    }
  }
  
  // Review a compliance document (set review status and add comments)
  static async reviewComplianceDocument(req, res, next) {
    try {
      const { complianceDocId } = req.params;
      const { review_status, review_comments } = req.body;
      
      // Get the compliance document
      let complianceDoc = await OrganizationComplianceDocument.findById(complianceDocId);
      if (!complianceDoc) {
        return res.status(404).json({ error: 'Compliance document not found' });
      }
      
      // Update the compliance document review status and comments
      complianceDoc = await OrganizationComplianceDocument.update(complianceDocId, {
        review_status,
        review_comments,
        reviewed_at: new Date(),
        reviewed_by: req.user.id,
        updated_at: new Date()
      });
      
      // Log the review
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'REVIEW_COMPLIANCE_DOCUMENT',
          entity_type: 'organization_compliance_document',
          entity_id: complianceDocId,
          before_state: { review_status: complianceDoc.review_status, review_comments: complianceDoc.review_comments },
          after_state: complianceDoc,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        logger.error('Error creating audit log:', auditError);
      }
      
      res.json({
        message: 'Compliance document review updated successfully',
        compliance_document: complianceDoc
      });
    } catch (err) {
      next(err);
    }
  }
  
  // Get compliance document templates by document type
  static async getDocumentTemplatesByType(req, res, next) {
    try {
      const { documentTypeId } = req.params;
      
      // Verify the document type exists
      const documentType = await ComplianceDocumentType.findById(documentTypeId);
      if (!documentType) {
        return res.status(404).json({ error: 'Document type not found' });
      }
      
      // Get templates for this document type
      const templates = await ComplianceDocumentTemplate.findByDocumentType(documentTypeId);
      
      // Log the access
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'GET_COMPLIANCE_TEMPLATES',
          entity_type: 'compliance_document_template',
          entity_id: documentTypeId,
          before_state: null,
          after_state: { document_type_id: documentTypeId },
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        logger.error('Error creating audit log:', auditError);
      }
      
      res.json(templates);
    } catch (err) {
      next(err);
    }
  }
  
  // Get compliance status summary for an organization
  static async getComplianceStatusSummary(req, res, next) {
    try {
      const { organizationId } = req.params;
      
      // Verify the organization exists
      const organization = await Organization.findById(organizationId);
      if (!organization) {
        return res.status(404).json({ error: 'Organization not found' });
      }
      
      // Get compliance status summary
      const summary = await OrganizationComplianceDocument.getComplianceStatusSummary(organizationId);
      
      // Log the access
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'GET_COMPLIANCE_STATUS_SUMMARY',
          entity_type: 'organization',
          entity_id: organizationId,
          before_state: null,
          after_state: summary,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        logger.error('Error creating audit log:', auditError);
      }
      
      res.json(summary);
    } catch (err) {
      next(err);
    }
  }
  
  // Get overdue compliance documents for an organization
  static async getOverdueDocuments(req, res, next) {
    try {
      const { organizationId } = req.params;
      
      // Verify the organization exists
      const organization = await Organization.findById(organizationId);
      if (!organization) {
        return res.status(404).json({ error: 'Organization not found' });
      }
      
      // Get overdue compliance documents
      const overdueDocs = await OrganizationComplianceDocument.getOverdueDocuments(organizationId);
      
      // Log the access
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'GET_OVERDUE_COMPLIANCE_DOCUMENTS',
          entity_type: 'organization',
          entity_id: organizationId,
          before_state: null,
          after_state: { count: overdueDocs.length },
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        logger.error('Error creating audit log:', auditError);
      }
      
      res.json(overdueDocs);
    } catch (err) {
      next(err);
    }
  }
  
  // Get expired compliance documents for an organization
  static async getExpiredDocuments(req, res, next) {
    try {
      const { organizationId } = req.params;
      
      // Verify the organization exists
      const organization = await Organization.findById(organizationId);
      if (!organization) {
        return res.status(404).json({ error: 'Organization not found' });
      }
      
      // Get expired compliance documents
      const expiredDocs = await OrganizationComplianceDocument.getExpiredDocuments(organizationId);
      
      // Log the access
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'GET_EXPIRED_COMPLIANCE_DOCUMENTS',
          entity_type: 'organization',
          entity_id: organizationId,
          before_state: null,
          after_state: { count: expiredDocs.length },
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        logger.error('Error creating audit log:', auditError);
      }
      
      res.json(expiredDocs);
    } catch (err) {
      next(err);
    }
  }
  
  // Search and filter compliance documents
  static async searchComplianceDocuments(req, res, next) {
    try {
      const {
        organizationId,
        documentTypeId,
        status,
        reviewStatus,
        searchTerm,
        sortBy,
        sortOrder,
        page = 1,
        limit = 50
      } = req.query;
      
      const offset = (page - 1) * limit;
      
      // Prepare search options
      const searchOptions = {
        organizationId,
        documentTypeId,
        status,
        reviewStatus,
        searchTerm,
        sortBy,
        sortOrder,
        limit: parseInt(limit),
        offset: parseInt(offset)
      };
      
      // Get compliance documents with search and filtering
      const complianceDocs = await OrganizationComplianceDocument.searchAndFilter(searchOptions);
      
      // Get total count for pagination
      const totalCount = await OrganizationComplianceDocument.searchAndFilterCount(searchOptions);
      
      // Log the access
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'SEARCH_COMPLIANCE_DOCUMENTS',
          entity_type: 'organization_compliance_document',
          entity_id: null,
          before_state: null,
          after_state: { search_options: searchOptions, result_count: complianceDocs.length },
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        logger.error('Error creating audit log:', auditError);
      }
      
      res.json({
        data: complianceDocs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      });
    } catch (err) {
      next(err);
    }
  }
  
  // Create a new compliance document type
  static async createDocumentType(req, res, next) {
    try {
      const { name, description, organization_type, is_required, is_active } = req.body;
      
      // Validate required fields
      if (!name || !organization_type) {
        return res.status(400).json({ error: 'Name and organization_type are required' });
      }
      
      // Create the document type
      const documentTypeData = {
        name,
        description,
        organization_type,
        is_required: is_required !== undefined ? is_required : true,
        is_active: is_active !== undefined ? is_active : true,
        created_by: req.user.id,
        updated_by: req.user.id
      };
      
      const documentType = await ComplianceDocumentType.create(documentTypeData);
      
      // Log the creation
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'CREATE_COMPLIANCE_DOCUMENT_TYPE',
          entity_type: 'compliance_document_type',
          entity_id: documentType.id,
          before_state: null,
          after_state: documentType,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        logger.error('Error creating audit log:', auditError);
      }
      
      res.status(201).json(documentType);
    } catch (err) {
      next(err);
    }
  }
  
  // Update a compliance document type
  static async updateDocumentType(req, res, next) {
    try {
      const { documentTypeId } = req.params;
      const updateData = req.body;
      
      // Check if document type exists
      const existingDocumentType = await ComplianceDocumentType.findById(documentTypeId);
      if (!existingDocumentType) {
        return res.status(404).json({ error: 'Document type not found' });
      }
      
      // Update the document type
      const updatedDocumentType = await ComplianceDocumentType.update(documentTypeId, {
        ...updateData,
        updated_by: req.user.id
      });
      
      // Log the update
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'UPDATE_COMPLIANCE_DOCUMENT_TYPE',
          entity_type: 'compliance_document_type',
          entity_id: documentTypeId,
          before_state: existingDocumentType,
          after_state: updatedDocumentType,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        logger.error('Error creating audit log:', auditError);
      }
      
      res.json(updatedDocumentType);
    } catch (err) {
      next(err);
    }
  }
  
  // Delete a compliance document type
  static async deleteDocumentType(req, res, next) {
    try {
      const { documentTypeId } = req.params;
      
      // Check if document type exists
      const existingDocumentType = await ComplianceDocumentType.findById(documentTypeId);
      if (!existingDocumentType) {
        return res.status(404).json({ error: 'Document type not found' });
      }
      
      // Check if document type is in use
      const complianceDocs = await OrganizationComplianceDocument.findByDocumentType(documentTypeId);
      if (complianceDocs.length > 0) {
        return res.status(400).json({ error: 'Cannot delete document type that is in use' });
      }
      
      // Delete the document type
      const deletedDocumentType = await ComplianceDocumentType.delete(documentTypeId);
      
      // Log the deletion
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'DELETE_COMPLIANCE_DOCUMENT_TYPE',
          entity_type: 'compliance_document_type',
          entity_id: documentTypeId,
          before_state: existingDocumentType,
          after_state: null,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        logger.error('Error creating audit log:', auditError);
      }
      
      res.json({ message: 'Document type deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ComplianceDocumentationController;