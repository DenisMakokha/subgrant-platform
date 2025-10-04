logger.info('🧪 Testing All SSOT Implementations...\n');

// Test data keys implementation
function testDataKeys() {
  logger.info('📊 Testing Data Keys Implementation...');
  
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
        logger.info(`✅ ${key} - Implemented`);
        implementedCount++;
      } else {
        logger.info(`❌ ${key} - Not implemented`);
      }
    } catch (error) {
      logger.info(`❌ ${key} - Error: ${error.message}`);
    }
  }

  logger.info(`\n📈 Data Keys: ${implementedCount}/${totalCount} implemented\n`);
  return implementedCount === totalCount;
}

// Test action keys implementation
function testActionKeys() {
  logger.info('⚡ Testing Action Keys Implementation...');
  
  const actionController = require('./controllers/actionController');
const logger = require('utils/logger');
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
        logger.info(`✅ ${key} - Implemented`);
        implementedCount++;
      } else {
        logger.info(`❌ ${key} - Not implemented`);
      }
    } catch (error) {
      logger.info(`❌ ${key} - Error: ${error.message}`);
    }
  }

  logger.info(`\n📈 Action Keys: ${implementedCount}/${totalCount} implemented\n`);
  return implementedCount === totalCount;
}

// Test repository methods
function testRepositoryMethods() {
  logger.info('🗄️ Testing Repository Methods...');
  
  const repositories = {
    'PartnerBudgetRepository': require('./repositories/partnerBudgetRepository'),
    'PartnerBudgetLineRepository': require('./repositories/partnerBudgetLineRepository'),
    'ContractRepository': require('./repositories/contractRepository'),
    'FundRequestRepository': require('./repositories/fundRequestRepository'),
    'ReconciliationRepository': require('./repositories/reconciliationRepository')
  };

  let allMethodsExist = true;

  for (const [name, repo] of Object.entries(repositories)) {
    logger.info(`\n🔍 ${name}:`);
    
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
        logger.info(`   ✅ ${method}`);
      } else {
        logger.info(`   ❌ ${method} - Missing`);
        allMethodsExist = false;
      }
    }
  }

  logger.info(`\n📈 Repository Methods: ${allMethodsExist ? 'All implemented' : 'Some missing'}\n`);
  return allMethodsExist;
}

// Test service methods
function testServiceMethods() {
  logger.info('🔧 Testing Service Methods...');
  
  const services = {
    'ReconciliationService': require('./services/reconciliationService'),
    'NotificationService': require('./services/notificationService')
  };

  let allMethodsExist = true;

  for (const [name, service] of Object.entries(services)) {
    logger.info(`\n🔍 ${name}:`);
    
    const methods = [];
    if (name === 'ReconciliationService') {
      methods.push('uploadEvidence', 'deleteEvidence', 'getReconciliationSummary', 'getEvidenceByBudgetLine');
    }
    if (name === 'NotificationService') {
      methods.push('getUserNotifications', 'markAsRead', 'markAllAsRead');
    }

    for (const method of methods) {
      if (typeof service[method] === 'function') {
        logger.info(`   ✅ ${method}`);
      } else {
        logger.info(`   ❌ ${method} - Missing`);
        allMethodsExist = false;
      }
    }
  }

  logger.info(`\n📈 Service Methods: ${allMethodsExist ? 'All implemented' : 'Some missing'}\n`);
  return allMethodsExist;
}

// Run all tests
function runAllTests() {
  logger.info('🚀 Starting Comprehensive SSOT Implementation Test...\n');
  
  const dataKeysPassed = testDataKeys();
  const actionKeysPassed = testActionKeys();
  const repositoriesPassed = testRepositoryMethods();
  const servicesPassed = testServiceMethods();
  
  const allPassed = dataKeysPassed && actionKeysPassed && repositoriesPassed && servicesPassed;
  
  logger.info('🎉 SSOT Implementation Test Complete!');
  logger.info('\n📋 Summary:');
  logger.info(`   ${dataKeysPassed ? '✅' : '❌'} All Data Keys Implemented`);
  logger.info(`   ${actionKeysPassed ? '✅' : '❌'} All Action Keys Implemented`);
  logger.info(`   ${repositoriesPassed ? '✅' : '❌'} All Repository Methods Implemented`);
  logger.info(`   ${servicesPassed ? '✅' : '❌'} All Service Methods Implemented`);
  
  if (allPassed) {
    logger.info('\n🎯 Status: ALL SSOT SYSTEMS FULLY IMPLEMENTED AND READY');
    logger.info('\n📊 Implementation Coverage:');
    logger.info('   ✅ Budget System - Complete');
    logger.info('   ✅ Contract System - Complete');
    logger.info('   ✅ Reconciliation System - Complete');
    logger.info('   ✅ Fund Request System - Complete');
    logger.info('   ✅ Notification System - Complete');
    logger.info('   ✅ Report System - Complete');
    logger.info('   ✅ Approval System - Complete');
    logger.info('   ✅ Admin System - Complete');
  } else {
    logger.info('\n⚠️ Status: SOME SSOT SYSTEMS NEED ADDITIONAL IMPLEMENTATION');
  }
  
  return allPassed;
}

// Run the tests
runAllTests();