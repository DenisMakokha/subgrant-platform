const Document = require('./models/document');
const crypto = require('crypto');
const logger = require('utils/logger');

async function testDocumentVersioning() {
  logger.info('Testing Document Versioning functionality...');
  
  try {
    // Test creating a document
    logger.info('\n1. Testing document creation...');
    const documentData = {
      entity_type: 'test',
      entity_id: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID
      title: 'Version Test Document',
      description: 'This is a test document for versioning',
      document_uri: '/path/to/document-v1.pdf',
      document_name: 'document-v1.pdf',
      mime_type: 'application/pdf',
      uploaded_by: '123e4567-e89b-12d3-a456-426614174001' // Valid UUID
    };
    
    const documentV1 = await Document.create(documentData);
    logger.info('✓ Document version 1 created successfully');
    logger.info('  Document ID:', documentV1.id);
    logger.info('  Version:', documentV1.version);
    
    // Test creating a new version of the same document
    logger.info('\n2. Testing automatic version increment...');
    const documentDataV2 = {
      ...documentData,
      description: 'This is an updated version of the test document',
      document_uri: '/path/to/document-v2.pdf',
      document_name: 'document-v2.pdf'
    };
    
    const documentV2 = await Document.create(documentDataV2);
    logger.info('✓ Document version 2 created successfully');
    logger.info('  Document ID:', documentV2.id);
    logger.info('  Version:', documentV2.version);
    
    // Verify that version was incremented automatically
    if (documentV2.version === 2) {
      logger.info('✓ Version was correctly incremented to 2');
    } else {
      logger.info('✗ Version was not incremented correctly. Expected 2, got', documentV2.version);
      return;
    }
    
    // Test creating a third version
    logger.info('\n3. Testing third version creation...');
    const documentDataV3 = {
      ...documentData,
      description: 'This is the third version of the test document',
      document_uri: '/path/to/document-v3.pdf',
      document_name: 'document-v3.pdf'
    };
    
    const documentV3 = await Document.create(documentDataV3);
    logger.info('✓ Document version 3 created successfully');
    logger.info('  Document ID:', documentV3.id);
    logger.info('  Version:', documentV3.version);
    
    // Verify that version was incremented automatically
    if (documentV3.version === 3) {
      logger.info('✓ Version was correctly incremented to 3');
    } else {
      logger.info('✗ Version was not incremented correctly. Expected 3, got', documentV3.version);
      return;
    }
    
    // Test retrieving version history
    logger.info('\n4. Testing document version history retrieval...');
    const versionHistory = await Document.getVersionHistory('test', '123e4567-e89b-12d3-a456-426614174000');
    if (versionHistory && versionHistory.length === 3) {
      logger.info('✓ Document version history retrieved successfully');
      logger.info('  Total versions:', versionHistory.length);
      versionHistory.forEach((doc, index) => {
        logger.info(`  Version ${doc.version}: ${doc.document_name}`);
      });
    } else {
      logger.info('✗ Failed to retrieve correct document version history');
      logger.info('  Expected 3 versions, got', versionHistory ? versionHistory.length : 0);
      return;
    }
    
    // Test retrieving the latest version
    logger.info('\n5. Testing latest version retrieval...');
    const latestVersion = await Document.getLatestVersion('test', '123e4567-e89b-12d3-a456-426614174000');
    if (latestVersion && latestVersion.version === 3) {
      logger.info('✓ Latest version retrieved successfully');
      logger.info('  Latest version:', latestVersion.version);
      logger.info('  Latest document name:', latestVersion.document_name);
    } else {
      logger.info('✗ Failed to retrieve correct latest version');
      logger.info('  Expected version 3, got', latestVersion ? latestVersion.version : 'null');
      return;
    }
    
    // Test retrieving a specific document by ID
    logger.info('\n6. Testing specific document retrieval...');
    const specificDocument = await Document.findById(documentV2.id);
    if (specificDocument && specificDocument.version === 2) {
      logger.info('✓ Specific document retrieved successfully');
      logger.info('  Version:', specificDocument.version);
    } else {
      logger.info('✗ Failed to retrieve specific document');
      logger.info('  Expected version 2, got', specificDocument ? specificDocument.version : 'null');
      return;
    }
    
    logger.info('\n🎉 All document versioning tests completed successfully!');
    
  } catch (error) {
    logger.error('❌ Test failed with error:', error);
  }
}

// Run the test
testDocumentVersioning();