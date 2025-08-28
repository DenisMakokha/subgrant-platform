const AuditLog = require('./models/auditLog');
const Document = require('./models/document');
const crypto = require('crypto');

async function testAuditAndCompliance() {
  console.log('Testing Audit and Compliance functionality...');
  
  try {
    // Test creating an audit log
    console.log('\n1. Testing audit log creation...');
    const auditData = {
      actor_id: 'test-user-id',
      action: 'CREATE_BUDGET',
      entity_type: 'budget',
      entity_id: 'test-budget-id',
      before_state: null,
      after_state: { id: 'test-budget-id', title: 'Test Budget', amount: 1000 },
      ip_address: '127.0.0.1',
      user_agent: 'Test Script'
    };
    
    const auditLog = await AuditLog.create(auditData);
    console.log('✓ Audit log created successfully');
    console.log('  Audit log ID:', auditLog.id);
    
    // Test retrieving audit logs
    console.log('\n2. Testing audit log retrieval...');
    const retrievedAuditLog = await AuditLog.findById(auditLog.id);
    if (retrievedAuditLog) {
      console.log('✓ Audit log retrieved successfully');
      console.log('  Action:', retrievedAuditLog.action);
      console.log('  Entity Type:', retrievedAuditLog.entity_type);
    } else {
      console.log('✗ Failed to retrieve audit log');
    }
    
    // Test creating a document
    console.log('\n3. Testing document creation...');
    const documentData = {
      entity_type: 'budget',
      entity_id: 'test-budget-id',
      title: 'Test Document',
      description: 'This is a test document',
      document_uri: '/path/to/document.pdf',
      document_name: 'test-document.pdf',
      mime_type: 'application/pdf',
      version: 1,
      uploaded_by: 'test-user-id'
    };
    
    const document = await Document.create(documentData);
    console.log('✓ Document created successfully');
    console.log('  Document ID:', document.id);
    console.log('  Document Name:', document.document_name);
    
    // Test retrieving documents
    console.log('\n4. Testing document retrieval...');
    const retrievedDocument = await Document.findById(document.id);
    if (retrievedDocument) {
      console.log('✓ Document retrieved successfully');
      console.log('  Title:', retrievedDocument.title);
      console.log('  Version:', retrievedDocument.version);
    } else {
      console.log('✗ Failed to retrieve document');
    }
    
    // Test creating a new version of the document
    console.log('\n5. Testing document versioning...');
    const updatedDocumentData = {
      ...documentData,
      version: 2,
      description: 'This is an updated test document',
      document_uri: '/path/to/updated-document.pdf'
    };
    
    const updatedDocument = await Document.create(updatedDocumentData);
    console.log('✓ Document version 2 created successfully');
    console.log('  Document ID:', updatedDocument.id);
    console.log('  Version:', updatedDocument.version);
    
    // Test retrieving document version history
    console.log('\n6. Testing document version history...');
    const versionHistory = await Document.getVersionHistory('budget', 'test-budget-id');
    if (versionHistory && versionHistory.length >= 2) {
      console.log('✓ Document version history retrieved successfully');
      console.log('  Total versions:', versionHistory.length);
      versionHistory.forEach((doc, index) => {
        console.log(`  Version ${index + 1}: ${doc.document_name} (v${doc.version})`);
      });
    } else {
      console.log('✗ Failed to retrieve document version history');
    }
    
    // Test document checksum verification
    console.log('\n7. Testing document checksum verification...');
    // Create a test document with a known checksum
    const testContent = 'This is test content for checksum verification';
    const testChecksum = crypto.createHash('sha256').update(testContent).digest('hex');
    
    const checksumDocumentData = {
      entity_type: 'test',
      entity_id: 'checksum-test-id',
      title: 'Checksum Test Document',
      description: 'Document for checksum testing',
      document_uri: '/path/to/checksum-test.pdf',
      document_name: 'checksum-test.pdf',
      mime_type: 'application/pdf',
      version: 1,
      checksum: testChecksum,
      uploaded_by: 'test-user-id'
    };
    
    const checksumDocument = await Document.create(checksumDocumentData);
    console.log('✓ Checksum test document created');
    
    // Verify the checksum
    const isChecksumValid = await Document.verifyChecksum(checksumDocument.id, testContent);
    if (isChecksumValid) {
      console.log('✓ Document checksum verification passed');
    } else {
      console.log('✗ Document checksum verification failed');
    }
    
    // Test invalid checksum
    const isInvalidChecksumValid = await Document.verifyChecksum(checksumDocument.id, 'invalid content');
    if (!isInvalidChecksumValid) {
      console.log('✓ Invalid checksum correctly rejected');
    } else {
      console.log('✗ Invalid checksum was incorrectly accepted');
    }
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testAuditAndCompliance();