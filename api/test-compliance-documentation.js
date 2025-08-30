const OrganizationComplianceDocument = require('./models/organizationComplianceDocument');
const ComplianceDocumentType = require('./models/complianceDocumentType');
const ComplianceDocumentTemplate = require('./models/complianceDocumentTemplate');
const Organization = require('./models/organization');
const Document = require('./models/document');

async function testComplianceDocumentation() {
  console.log('Testing Compliance Documentation functionality...');
  
  try {
    // Test creating a compliance document type
    console.log('\n1. Testing compliance document type creation...');
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
    console.log('✓ Compliance document type created successfully');
    console.log('  Document Type ID:', documentType.id);
    console.log('  Document Type Name:', documentType.name);
    
    // Test retrieving compliance document type
    console.log('\n2. Testing compliance document type retrieval...');
    const retrievedDocumentType = await ComplianceDocumentType.findById(documentType.id);
    if (retrievedDocumentType) {
      console.log('✓ Compliance document type retrieved successfully');
      console.log('  Name:', retrievedDocumentType.name);
      console.log('  Organization Type:', retrievedDocumentType.organization_type);
    } else {
      console.log('✗ Failed to retrieve compliance document type');
    }
    
    // Test creating a compliance document template
    console.log('\n3. Testing compliance document template creation...');
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
    console.log('✓ Compliance document template created successfully');
    console.log('  Template ID:', template.id);
    console.log('  Template Name:', template.name);
    
    // Test retrieving compliance document template
    console.log('\n4. Testing compliance document template retrieval...');
    const retrievedTemplate = await ComplianceDocumentTemplate.findById(template.id);
    if (retrievedTemplate) {
      console.log('✓ Compliance document template retrieved successfully');
      console.log('  Name:', retrievedTemplate.name);
      console.log('  MIME Type:', retrievedTemplate.mime_type);
    } else {
      console.log('✗ Failed to retrieve compliance document template');
    }
    
    // Test creating an organization
    console.log('\n5. Testing organization creation...');
    const organizationData = {
      name: 'Test Organization',
      legal_name: 'Test Organization Ltd',
      status: 'active',
      compliance_status: 'pending',
      country: 'local',
      created_by: 'test-admin-id'
    };
    
    const organization = await Organization.create(organizationData);
    console.log('✓ Organization created successfully');
    console.log('  Organization ID:', organization.id);
    console.log('  Organization Name:', organization.name);
    
    // Test creating a document
    console.log('\n6. Testing document creation...');
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
    console.log('✓ Document created successfully');
    console.log('  Document ID:', document.id);
    console.log('  Document Name:', document.document_name);
    
    // Test creating an organization compliance document
    console.log('\n7. Testing organization compliance document creation...');
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
    console.log('✓ Organization compliance document created successfully');
    console.log('  Compliance Document ID:', complianceDoc.id);
    console.log('  Status:', complianceDoc.status);
    
    // Test retrieving organization compliance document
    console.log('\n8. Testing organization compliance document retrieval...');
    const retrievedComplianceDoc = await OrganizationComplianceDocument.findById(complianceDoc.id);
    if (retrievedComplianceDoc) {
      console.log('✓ Organization compliance document retrieved successfully');
      console.log('  Status:', retrievedComplianceDoc.status);
      console.log('  Due Date:', retrievedComplianceDoc.due_date);
    } else {
      console.log('✗ Failed to retrieve organization compliance document');
    }
    
    // Test approving a compliance document
    console.log('\n9. Testing compliance document approval...');
    const approvedComplianceDoc = await OrganizationComplianceDocument.update(complianceDoc.id, {
      status: 'approved',
      approved_at: new Date(),
      approved_by: 'test-admin-id'
    });
    
    if (approvedComplianceDoc) {
      console.log('✓ Compliance document approved successfully');
      console.log('  New Status:', approvedComplianceDoc.status);
      console.log('  Approved At:', approvedComplianceDoc.approved_at);
    } else {
      console.log('✗ Failed to approve compliance document');
    }
    
    // Test rejecting a compliance document with detailed feedback
    console.log('\n10. Testing compliance document rejection with detailed feedback...');
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
      console.log('✓ Compliance document rejected successfully with detailed feedback');
      console.log('  New Status:', rejectedComplianceDoc.status);
      console.log('  Rejection Category:', rejectedComplianceDoc.rejection_category);
      console.log('  Required Actions:', rejectedComplianceDoc.required_actions);
    } else {
      console.log('✗ Failed to reject compliance document');
    }
    
    // Test searching and filtering compliance documents
    console.log('\n11. Testing compliance document search and filtering...');
    const searchOptions = {
      organization_id: organization.id,
      status: 'rejected',
      document_type_id: documentType.id
    };
    
    const searchResults = await OrganizationComplianceDocument.searchAndFilter(searchOptions);
    if (searchResults && searchResults.length > 0) {
      console.log('✓ Compliance document search completed successfully');
      console.log('  Found', searchResults.length, 'documents');
      console.log('  First document status:', searchResults[0].status);
    } else {
      console.log('✗ Compliance document search returned no results');
    }
    
    // Test getting compliance status summary for an organization
    console.log('\n12. Testing compliance status summary...');
    const complianceSummary = await OrganizationComplianceDocument.getComplianceStatusSummary(organization.id);
    if (complianceSummary) {
      console.log('✓ Compliance status summary retrieved successfully');
      console.log('  Total Documents:', complianceSummary.total_documents);
      console.log('  Approved Documents:', complianceSummary.approved_documents);
      console.log('  Rejected Documents:', complianceSummary.rejected_documents);
    } else {
      console.log('✗ Failed to retrieve compliance status summary');
    }
    
    // Test getting overdue compliance documents
    console.log('\n13. Testing overdue compliance documents...');
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
    console.log('✓ Overdue compliance document created for testing');
    
    const overdueDocs = await OrganizationComplianceDocument.getOverdueDocuments(organization.id);
    if (overdueDocs && overdueDocs.length > 0) {
      console.log('✓ Overdue compliance documents retrieved successfully');
      console.log('  Found', overdueDocs.length, 'overdue documents');
    } else {
      console.log('✗ Failed to retrieve overdue compliance documents');
    }
    
    // Test getting expired compliance documents
    console.log('\n14. Testing expired compliance documents...');
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
    console.log('✓ Expired compliance document created for testing');
    
    const expiredDocs = await OrganizationComplianceDocument.getExpiredDocuments(organization.id);
    if (expiredDocs && expiredDocs.length > 0) {
      console.log('✓ Expired compliance documents retrieved successfully');
      console.log('  Found', expiredDocs.length, 'expired documents');
    } else {
      console.log('✗ Failed to retrieve expired compliance documents');
    }
    
    console.log('\n🎉 All compliance documentation tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testComplianceDocumentation();