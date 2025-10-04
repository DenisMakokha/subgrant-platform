const AuditLog = require('./models/auditLog');
const logger = require('utils/logger');

async function testAuditLogs() {
  logger.info('Testing Audit Logs functionality...');
  
  try {
    // Test creating an audit log for a document action
    logger.info('\n1. Testing audit log creation for document...');
    const auditLogData = {
      actor_id: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID
      action: 'document_created',
      entity_type: 'document',
      entity_id: '123e4567-e89b-12d3-a456-426614174001', // Valid UUID
      before_state: null,
      after_state: {
        title: 'Test Document',
        description: 'This is a test document'
      },
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    };
    
    const auditLog1 = await AuditLog.create(auditLogData);
    logger.info('✓ Document audit log created successfully');
    logger.info('  Audit Log ID:', auditLog1.id);
    logger.info('  Action:', auditLog1.action);
    
    // Test creating an audit log for a budget action
    logger.info('\n2. Testing audit log creation for budget...');
    const budgetAuditLogData = {
      actor_id: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID
      action: 'budget_submitted',
      entity_type: 'budget',
      entity_id: '123e4567-e89b-12d3-a456-426614174002', // Valid UUID
      before_state: {
        status: 'draft'
      },
      after_state: {
        status: 'submitted',
        submitted_at: new Date().toISOString()
      },
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    };
    
    const auditLog2 = await AuditLog.create(budgetAuditLogData);
    logger.info('✓ Budget audit log created successfully');
    logger.info('  Audit Log ID:', auditLog2.id);
    logger.info('  Action:', auditLog2.action);
    
    // Test retrieving audit logs for a specific entity
    logger.info('\n3. Testing audit log retrieval by entity...');
    const entityLogs = await AuditLog.findByEntity('document', '123e4567-e89b-12d3-a456-426614174001');
    if (entityLogs && entityLogs.length > 0) {
      logger.info('✓ Audit logs retrieved successfully by entity');
      logger.info('  Found', entityLogs.length, 'audit log(s)');
      logger.info('  First log action:', entityLogs[0].action);
    } else {
      logger.info('✗ Failed to retrieve audit logs by entity');
      return;
    }
    
    // Test retrieving audit logs for a specific actor
    logger.info('\n4. Testing audit log retrieval by actor...');
    const actorLogs = await AuditLog.findByActor('123e4567-e89b-12d3-a456-426614174000');
    if (actorLogs && actorLogs.length >= 2) {
      logger.info('✓ Audit logs retrieved successfully by actor');
      logger.info('  Found', actorLogs.length, 'audit log(s)');
      logger.info('  Actions:', actorLogs.map(log => log.action).join(', '));
    } else {
      logger.info('✗ Failed to retrieve correct number of audit logs by actor');
      logger.info('  Expected at least 2, got', actorLogs ? actorLogs.length : 0);
      return;
    }
    
    // Test retrieving audit logs by action type
    logger.info('\n5. Testing audit log retrieval by action...');
    const actionLogs = await AuditLog.findByAction('document_created');
    if (actionLogs && actionLogs.length > 0) {
      logger.info('✓ Audit logs retrieved successfully by action');
      logger.info('  Found', actionLogs.length, 'audit log(s)');
      logger.info('  First log entity type:', actionLogs[0].entity_type);
    } else {
      logger.info('✗ Failed to retrieve audit logs by action');
      return;
    }
    
    // Test retrieving recent audit logs
    logger.info('\n6. Testing recent audit logs retrieval...');
    const recentLogs = await AuditLog.findAll({}, 10, 0);
    if (recentLogs && recentLogs.length >= 2) {
      logger.info('✓ Recent audit logs retrieved successfully');
      logger.info('  Found', recentLogs.length, 'recent audit log(s)');
      logger.info('  Most recent action:', recentLogs[0].action);
    } else {
      logger.info('✗ Failed to retrieve correct number of recent audit logs');
      logger.info('  Expected at least 2, got', recentLogs ? recentLogs.length : 0);
      return;
    }
    
    logger.info('\n🎉 All audit log tests completed successfully!');
    
  } catch (error) {
    logger.error('❌ Test failed with error:', error);
  }
}

// Run the test
testAuditLogs();