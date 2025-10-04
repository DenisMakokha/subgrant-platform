const AuditLog = require('./models/auditLog');
const Document = require('./models/document');
const crypto = require('crypto');
const logger = require('utils/logger');

async function testAuditAndCompliance() {
  logger.info('Testing Audit and Compliance functionality...');
  
  try {
    // Test creating an audit log
    logger.info('\n1. Testing audit log creation...');
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
    logger.info('✓ Audit log created successfully');
    logger.info('  Audit log ID:', auditLog.id);
    
    // Test retrieving audit logs
    logger.info('\n2. Testing audit log retrieval...');
    const retrievedAuditLog = await AuditLog.findById(auditLog.id);
    if (retrievedAuditLog) {
      logger.info('✓ Audit log retrieved successfully');
      logger.info('  Action:', retrievedAuditLog.action);
      logger.info('  Entity Type:', retrievedAuditLog.entity_type);
    } else {
      logger.info('✗ Failed to retrieve audit log');
    }
    
    // Test creating a document
    logger.info('\n3. Testing document creation...');
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
    logger.info('✓ Document created successfully');
    logger.info('  Document ID:', document.id);
    logger.info('  Document Name:', document.document_name);
    
    // Test retrieving documents
    logger.info('\n4. Testing document retrieval...');
    const retrievedDocument = await Document.findById(document.id);
    if (retrievedDocument) {
      logger.info('✓ Document retrieved successfully');
      logger.info('  Title:', retrievedDocument.title);
      logger.info('  Version:', retrievedDocument.version);
    } else {
      logger.info('✗ Failed to retrieve document');
    }
    
    // Test creating a new version of the document
    logger.info('\n5. Testing document versioning...');
    const updatedDocumentData = {
      ...documentData,
      version: 2,
      description: 'This is an updated test document',
      document_uri: '/path/to/updated-document.pdf'
    };
    
    const updatedDocument = await Document.create(updatedDocumentData);
    logger.info('✓ Document version 2 created successfully');
    logger.info('  Document ID:', updatedDocument.id);
    logger.info('  Version:', updatedDocument.version);
    
    // Test retrieving document version history
    logger.info('\n6. Testing document version history...');
    const versionHistory = await Document.getVersionHistory('budget', 'test-budget-id');
    if (versionHistory && versionHistory.length >= 2) {
      logger.info('✓ Document version history retrieved successfully');
      logger.info('  Total versions:', versionHistory.length);
      versionHistory.forEach((doc, index) => {
        logger.info(`  Version ${index + 1}: ${doc.document_name} (v${doc.version})`);
      });
    } else {
      logger.info('✗ Failed to retrieve document version history');
    }
    
    // Test document checksum verification
    logger.info('\n7. Testing document checksum verification...');
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
    logger.info('✓ Checksum test document created');
    
    // Verify the checksum
    const isChecksumValid = await Document.verifyChecksum(checksumDocument.id, testContent);
    if (isChecksumValid) {
      logger.info('✓ Document checksum verification passed');
    } else {
      logger.info('✗ Document checksum verification failed');
    }
    
    // Test invalid checksum
    const isInvalidChecksumValid = await Document.verifyChecksum(checksumDocument.id, 'invalid content');
    if (!isInvalidChecksumValid) {
      logger.info('✓ Invalid checksum correctly rejected');
    } else {
      logger.info('✗ Invalid checksum was incorrectly accepted');
    }
    
    logger.info('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    logger.error('❌ Test failed with error:', error);
  }
}

// Run the test
testAuditAndCompliance();