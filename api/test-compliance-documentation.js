const OrganizationComplianceDocument = require('./models/organizationComplianceDocument');
const ComplianceDocumentType = require('./models/complianceDocumentType');
const ComplianceDocumentTemplate = require('./models/complianceDocumentTemplate');
const Organization = require('./models/organization');
const Document = require('./models/document');
const logger = require('utils/logger');

async function testComplianceDocumentation() {
  logger.info('Testing Compliance Documentation functionality...');
  
  try {
    // Test creating a compliance document type
    logger.info('\n1. Testing compliance document type creation...');
    const documentTypeData = {
      name: 'Test Document Type',
      description: 'This is a test document type',
      organization_type: 'local',
      is_required: true,
      is_active: true,
      allowed_mime_types: '["application/pdf", "image/jpeg", "image/png"]',
      max_file_size: 5242880, // 5MB
      required_fields: '["title", "description"]',
      created_by: 'test-admin-id'
    };
    
    const documentType = await ComplianceDocumentType.create(documentTypeData);
    logger.info('✓ Compliance document type created successfully');
    logger.info('  Document Type ID:', documentType.id);
    logger.info('  Document Type Name:', documentType.name);
    
    // Test retrieving compliance document type
    logger.info('\n2. Testing compliance document type retrieval...');
    const retrievedDocumentType = await ComplianceDocumentType.findById(documentType.id);
    if (retrievedDocumentType) {
      logger.info('✓ Compliance document type retrieved successfully');
      logger.info('  Name:', retrievedDocumentType.name);
      logger.info('  Organization Type:', retrievedDocumentType.organization_type);
    } else {
      logger.info('✗ Failed to retrieve compliance document type');
    }
    
    // Test creating a compliance document template
    logger.info('\n3. Testing compliance document template creation...');
    const templateData = {
      document_type_id: documentType.id,
      name: 'Test Document Template',
      description: 'This is a test document template',
      template_uri: '/path/to/template.docx',
      template_name: 'test-template.docx',
      mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      is_active: true,
      created_by: 'test-admin-id'
    };
    
    const template = await ComplianceDocumentTemplate.create(templateData);
    logger.info('✓ Compliance document template created successfully');
    logger.info('  Template ID:', template.id);
    logger.info('  Template Name:', template.name);
    
    // Test retrieving compliance document template
    logger.info('\n4. Testing compliance document template retrieval...');
    const retrievedTemplate = await ComplianceDocumentTemplate.findById(template.id);
    if (retrievedTemplate) {
      logger.info('✓ Compliance document template retrieved successfully');
      logger.info('  Name:', retrievedTemplate.name);
      logger.info('  MIME Type:', retrievedTemplate.mime_type);
    } else {
      logger.info('✗ Failed to retrieve compliance document template');
    }
    
    // Test creating an organization
    logger.info('\n5. Testing organization creation...');
    const organizationData = {
      name: 'Test Organization',
      legal_name: 'Test Organization Ltd',
      status: 'active',
      compliance_status: 'pending',
      country: 'local',
      created_by: 'test-admin-id'
    };
    
    const organization = await Organization.create(organizationData);
    logger.info('✓ Organization created successfully');
    logger.info('  Organization ID:', organization.id);
    logger.info('  Organization Name:', organization.name);
    
    // Test creating a document
    logger.info('\n6. Testing document creation...');
    const documentData = {
      entity_type: 'compliance_document',
      entity_id: 'test-compliance-doc-id',
      title: 'Test Compliance Document',
      description: 'This is a test compliance document',
      document_uri: '/path/to/compliance-document.pdf',
      document_name: 'test-compliance-document.pdf',
      mime_type: 'application/pdf',
      version: 1,
      uploaded_by: 'test-user-id'
    };
    
    const document = await Document.create(documentData);
    logger.info('✓ Document created successfully');
    logger.info('  Document ID:', document.id);
    logger.info('  Document Name:', document.document_name);
    
    // Test creating an organization compliance document
    logger.info('\n7. Testing organization compliance document creation...');
    const complianceDocData = {
      organization_id: organization.id,
      document_type_id: documentType.id,
      document_id: document.id,
      status: 'submitted',
      submitted_at: new Date(),
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      expiration_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      review_status: 'not_reviewed'
    };
    
    const complianceDoc = await OrganizationComplianceDocument.create(complianceDocData);
    logger.info('✓ Organization compliance document created successfully');
    logger.info('  Compliance Document ID:', complianceDoc.id);
    logger.info('  Status:', complianceDoc.status);
    
    // Test retrieving organization compliance document
    logger.info('\n8. Testing organization compliance document retrieval...');
    const retrievedComplianceDoc = await OrganizationComplianceDocument.findById(complianceDoc.id);
    if (retrievedComplianceDoc) {
      logger.info('✓ Organization compliance document retrieved successfully');
      logger.info('  Status:', retrievedComplianceDoc.status);
      logger.info('  Due Date:', retrievedComplianceDoc.due_date);
    } else {
      logger.info('✗ Failed to retrieve organization compliance document');
    }
    
    // Test approving a compliance document
    logger.info('\n9. Testing compliance document approval...');
    const approvedComplianceDoc = await OrganizationComplianceDocument.update(complianceDoc.id, {
      status: 'approved',
      approved_at: new Date(),
      approved_by: 'test-admin-id'
    });
    
    if (approvedComplianceDoc) {
      logger.info('✓ Compliance document approved successfully');
      logger.info('  New Status:', approvedComplianceDoc.status);
      logger.info('  Approved At:', approvedComplianceDoc.approved_at);
    } else {
      logger.info('✗ Failed to approve compliance document');
    }
    
    // Test rejecting a compliance document with detailed feedback
    logger.info('\n10. Testing compliance document rejection with detailed feedback...');
    const rejectedComplianceDoc = await OrganizationComplianceDocument.update(complianceDoc.id, {
      status: 'rejected',
      rejection_reason: 'Document does not meet requirements',
      rejection_category: 'content',
      rejection_details: 'The document content is incomplete',
      required_actions: 'Please provide additional information about the project scope',
      reviewed_at: new Date(),
      reviewed_by: 'test-admin-id'
    });
    
    if (rejectedComplianceDoc) {
      logger.info('✓ Compliance document rejected successfully with detailed feedback');
      logger.info('  New Status:', rejectedComplianceDoc.status);
      logger.info('  Rejection Category:', rejectedComplianceDoc.rejection_category);
      logger.info('  Required Actions:', rejectedComplianceDoc.required_actions);
    } else {
      logger.info('✗ Failed to reject compliance document');
    }
    
    // Test searching and filtering compliance documents
    logger.info('\n11. Testing compliance document search and filtering...');
    const searchOptions = {
      organization_id: organization.id,
      status: 'rejected',
      document_type_id: documentType.id
    };
    
    const searchResults = await OrganizationComplianceDocument.searchAndFilter(searchOptions);
    if (searchResults && searchResults.length > 0) {
      logger.info('✓ Compliance document search completed successfully');
      logger.info('  Found', searchResults.length, 'documents');
      logger.info('  First document status:', searchResults[0].status);
    } else {
      logger.info('✗ Compliance document search returned no results');
    }
    
    // Test getting compliance status summary for an organization
    logger.info('\n12. Testing compliance status summary...');
    const complianceSummary = await OrganizationComplianceDocument.getComplianceStatusSummary(organization.id);
    if (complianceSummary) {
      logger.info('✓ Compliance status summary retrieved successfully');
      logger.info('  Total Documents:', complianceSummary.total_documents);
      logger.info('  Approved Documents:', complianceSummary.approved_documents);
      logger.info('  Rejected Documents:', complianceSummary.rejected_documents);
    } else {
      logger.info('✗ Failed to retrieve compliance status summary');
    }
    
    // Test getting overdue compliance documents
    logger.info('\n13. Testing overdue compliance documents...');
    // Create an overdue document for testing
    const overdueComplianceDocData = {
      organization_id: organization.id,
      document_type_id: documentType.id,
      document_id: document.id,
      status: 'submitted',
      submitted_at: new Date(),
      due_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      review_status: 'not_reviewed'
    };
    
    const overdueComplianceDoc = await OrganizationComplianceDocument.create(overdueComplianceDocData);
    logger.info('✓ Overdue compliance document created for testing');
    
    const overdueDocs = await OrganizationComplianceDocument.getOverdueDocuments(organization.id);
    if (overdueDocs && overdueDocs.length > 0) {
      logger.info('✓ Overdue compliance documents retrieved successfully');
      logger.info('  Found', overdueDocs.length, 'overdue documents');
    } else {
      logger.info('✗ Failed to retrieve overdue compliance documents');
    }
    
    // Test getting expired compliance documents
    logger.info('\n14. Testing expired compliance documents...');
    // Create an expired document for testing
    const expiredComplianceDocData = {
      organization_id: organization.id,
      document_type_id: documentType.id,
      document_id: document.id,
      status: 'approved',
      approved_at: new Date(),
      expiration_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      review_status: 'not_reviewed'
    };
    
    const expiredComplianceDoc = await OrganizationComplianceDocument.create(expiredComplianceDocData);
    logger.info('✓ Expired compliance document created for testing');
    
    const expiredDocs = await OrganizationComplianceDocument.getExpiredDocuments(organization.id);
    if (expiredDocs && expiredDocs.length > 0) {
      logger.info('✓ Expired compliance documents retrieved successfully');
      logger.info('  Found', expiredDocs.length, 'expired documents');
    } else {
      logger.info('✗ Failed to retrieve expired compliance documents');
    }
    
    logger.info('\n🎉 All compliance documentation tests completed successfully!');
    
  } catch (error) {
    logger.error('❌ Test failed with error:', error);
  }
}

// Run the test
testComplianceDocumentation();