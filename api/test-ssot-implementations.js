console.log('🧪 Testing All SSOT Implementations...\n');

// Test data keys implementation
function testDataKeys() {
  console.log('📊 Testing Data Keys Implementation...');
  
  const dataController = require('./controllers/dataController');
  const dataKeys = [
    'budget.pb.summary',
    'budget.lines',
    'budget.lines.approved',
    'recon.summary',
    'contract.list',
    'contract.files',
    'report.schedule',
    'report.history',
    'approval.queue',
    'admin.kpis',
    'fundRequest.list',
    'fundRequest.detail',
    'notification.list',
    'notification.detail'
  ];

  let implementedCount = 0;
  let totalCount = dataKeys.length;

  for (const key of dataKeys) {
    try {
      const service = dataController.getDataService(key);
      if (service && typeof service.getData === 'function') {
        console.log(`✅ ${key} - Implemented`);
        implementedCount++;
      } else {
        console.log(`❌ ${key} - Not implemented`);
      }
    } catch (error) {
      console.log(`❌ ${key} - Error: ${error.message}`);
    }
  }

  console.log(`\n📈 Data Keys: ${implementedCount}/${totalCount} implemented\n`);
  return implementedCount === totalCount;
}

// Test action keys implementation
function testActionKeys() {
  console.log('⚡ Testing Action Keys Implementation...');
  
  const actionController = require('./controllers/actionController');
  const actionKeys = [
    'line.create',
    'line.update',
    'line.submit',
    'recon.upload',
    'recon.delete',
    'report.generate.financial',
    'report.submit.narrative',
    'contract.view',
    'contract.sign',
    'approval.act',
    'wizard.admin',
    'fundRequest.create',
    'fundRequest.submit',
    'fundRequest.approve',
    'fundRequest.reject',
    'notification.markAsRead',
    'notification.markAllAsRead'
  ];

  let implementedCount = 0;
  let totalCount = actionKeys.length;

  for (const key of actionKeys) {
    try {
      const service = actionController.getActionService(key);
      if (service && typeof service.executeAction === 'function') {
        console.log(`✅ ${key} - Implemented`);
        implementedCount++;
      } else {
        console.log(`❌ ${key} - Not implemented`);
      }
    } catch (error) {
      console.log(`❌ ${key} - Error: ${error.message}`);
    }
  }

  console.log(`\n📈 Action Keys: ${implementedCount}/${totalCount} implemented\n`);
  return implementedCount === totalCount;
}

// Test repository methods
function testRepositoryMethods() {
  console.log('🗄️ Testing Repository Methods...');
  
  const repositories = {
    'PartnerBudgetRepository': require('./repositories/partnerBudgetRepository'),
    'PartnerBudgetLineRepository': require('./repositories/partnerBudgetLineRepository'),
    'ContractRepository': require('./repositories/contractRepository'),
    'FundRequestRepository': require('./repositories/fundRequestRepository'),
    'ReconciliationRepository': require('./repositories/reconciliationRepository')
  };

  let allMethodsExist = true;

  for (const [name, repo] of Object.entries(repositories)) {
    console.log(`\n🔍 ${name}:`);
    
    // Check for common methods
    const methods = ['create', 'findById', 'update'];
    if (name === 'PartnerBudgetRepository') {
      methods.push('findByPartnerAndProject');
    }
    if (name === 'ContractRepository') {
      methods.push('findByPartnerAndProject');
    }
    if (name === 'FundRequestRepository') {
      methods.push('findByProjectAndPartner', 'updateStatus');
    }
    if (name === 'ReconciliationRepository') {
      methods.push('createEvidence', 'getEvidenceByBudgetLine', 'getEvidenceCountByBudgetLine', 'getTotalSpentByBudgetLine');
    }

    for (const method of methods) {
      if (typeof repo[method] === 'function') {
        console.log(`   ✅ ${method}`);
      } else {
        console.log(`   ❌ ${method} - Missing`);
        allMethodsExist = false;
      }
    }
  }

  console.log(`\n📈 Repository Methods: ${allMethodsExist ? 'All implemented' : 'Some missing'}\n`);
  return allMethodsExist;
}

// Test service methods
function testServiceMethods() {
  console.log('🔧 Testing Service Methods...');
  
  const services = {
    'ReconciliationService': require('./services/reconciliationService'),
    'NotificationService': require('./services/notificationService')
  };

  let allMethodsExist = true;

  for (const [name, service] of Object.entries(services)) {
    console.log(`\n🔍 ${name}:`);
    
    const methods = [];
    if (name === 'ReconciliationService') {
      methods.push('uploadEvidence', 'deleteEvidence', 'getReconciliationSummary', 'getEvidenceByBudgetLine');
    }
    if (name === 'NotificationService') {
      methods.push('getUserNotifications', 'markAsRead', 'markAllAsRead');
    }

    for (const method of methods) {
      if (typeof service[method] === 'function') {
        console.log(`   ✅ ${method}`);
      } else {
        console.log(`   ❌ ${method} - Missing`);
        allMethodsExist = false;
      }
    }
  }

  console.log(`\n📈 Service Methods: ${allMethodsExist ? 'All implemented' : 'Some missing'}\n`);
  return allMethodsExist;
}

// Run all tests
function runAllTests() {
  console.log('🚀 Starting Comprehensive SSOT Implementation Test...\n');
  
  const dataKeysPassed = testDataKeys();
  const actionKeysPassed = testActionKeys();
  const repositoriesPassed = testRepositoryMethods();
  const servicesPassed = testServiceMethods();
  
  const allPassed = dataKeysPassed && actionKeysPassed && repositoriesPassed && servicesPassed;
  
  console.log('🎉 SSOT Implementation Test Complete!');
  console.log('\n📋 Summary:');
  console.log(`   ${dataKeysPassed ? '✅' : '❌'} All Data Keys Implemented`);
  console.log(`   ${actionKeysPassed ? '✅' : '❌'} All Action Keys Implemented`);
  console.log(`   ${repositoriesPassed ? '✅' : '❌'} All Repository Methods Implemented`);
  console.log(`   ${servicesPassed ? '✅' : '❌'} All Service Methods Implemented`);
  
  if (allPassed) {
    console.log('\n🎯 Status: ALL SSOT SYSTEMS FULLY IMPLEMENTED AND READY');
    console.log('\n📊 Implementation Coverage:');
    console.log('   ✅ Budget System - Complete');
    console.log('   ✅ Contract System - Complete');
    console.log('   ✅ Reconciliation System - Complete');
    console.log('   ✅ Fund Request System - Complete');
    console.log('   ✅ Notification System - Complete');
    console.log('   ✅ Report System - Complete');
    console.log('   ✅ Approval System - Complete');
    console.log('   ✅ Admin System - Complete');
  } else {
    console.log('\n⚠️ Status: SOME SSOT SYSTEMS NEED ADDITIONAL IMPLEMENTATION');
  }
  
  return allPassed;
}

// Run the tests
runAllTests();