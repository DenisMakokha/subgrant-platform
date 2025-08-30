const AuditLog = require('./models/auditLog');

async function testAuditLogs() {
  console.log('Testing Audit Logs functionality...');
  
  try {
    // Test creating an audit log for a document action
    console.log('\n1. Testing audit log creation for document...');
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
    console.log('✓ Document audit log created successfully');
    console.log('  Audit Log ID:', auditLog1.id);
    console.log('  Action:', auditLog1.action);
    
    // Test creating an audit log for a budget action
    console.log('\n2. Testing audit log creation for budget...');
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
    console.log('✓ Budget audit log created successfully');
    console.log('  Audit Log ID:', auditLog2.id);
    console.log('  Action:', auditLog2.action);
    
    // Test retrieving audit logs for a specific entity
    console.log('\n3. Testing audit log retrieval by entity...');
    const entityLogs = await AuditLog.findByEntity('document', '123e4567-e89b-12d3-a456-426614174001');
    if (entityLogs && entityLogs.length > 0) {
      console.log('✓ Audit logs retrieved successfully by entity');
      console.log('  Found', entityLogs.length, 'audit log(s)');
      console.log('  First log action:', entityLogs[0].action);
    } else {
      console.log('✗ Failed to retrieve audit logs by entity');
      return;
    }
    
    // Test retrieving audit logs for a specific actor
    console.log('\n4. Testing audit log retrieval by actor...');
    const actorLogs = await AuditLog.findByActor('123e4567-e89b-12d3-a456-426614174000');
    if (actorLogs && actorLogs.length >= 2) {
      console.log('✓ Audit logs retrieved successfully by actor');
      console.log('  Found', actorLogs.length, 'audit log(s)');
      console.log('  Actions:', actorLogs.map(log => log.action).join(', '));
    } else {
      console.log('✗ Failed to retrieve correct number of audit logs by actor');
      console.log('  Expected at least 2, got', actorLogs ? actorLogs.length : 0);
      return;
    }
    
    // Test retrieving audit logs by action type
    console.log('\n5. Testing audit log retrieval by action...');
    const actionLogs = await AuditLog.findByAction('document_created');
    if (actionLogs && actionLogs.length > 0) {
      console.log('✓ Audit logs retrieved successfully by action');
      console.log('  Found', actionLogs.length, 'audit log(s)');
      console.log('  First log entity type:', actionLogs[0].entity_type);
    } else {
      console.log('✗ Failed to retrieve audit logs by action');
      return;
    }
    
    // Test retrieving recent audit logs
    console.log('\n6. Testing recent audit logs retrieval...');
    const recentLogs = await AuditLog.findAll({}, 10, 0);
    if (recentLogs && recentLogs.length >= 2) {
      console.log('✓ Recent audit logs retrieved successfully');
      console.log('  Found', recentLogs.length, 'recent audit log(s)');
      console.log('  Most recent action:', recentLogs[0].action);
    } else {
      console.log('✗ Failed to retrieve correct number of recent audit logs');
      console.log('  Expected at least 2, got', recentLogs ? recentLogs.length : 0);
      return;
    }
    
    console.log('\n🎉 All audit log tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testAuditLogs();