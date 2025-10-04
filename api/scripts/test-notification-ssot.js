#!/usr/bin/env node

// Test notification SSoT endpoints

const axios = require('axios');
const dotenv = require('dotenv');
const logger = require('../utils/logger');

dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_USER_ID = 'test-user-id';

let authToken = null;

async function makeRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status 
    };
  }
}

async function testNotificationListEndpoint() {
  logger.info('📋 Testing notification list endpoint...');
  
  const result = await makeRequest('GET', `/ssot/data/notification.list?userId=${TEST_USER_ID}`);
  
  if (result.success) {
    logger.info('  ✅ Notification list endpoint working');
    logger.info(`  📋 Response: ${JSON.stringify(result.data)}`);
    return true;
  } else {
    logger.info('  ❌ Notification list endpoint failed:', result.error);
    return false;
  }
}

async function testNotificationDetailEndpoint() {
  logger.info('📋 Testing notification detail endpoint...');
  
  const result = await makeRequest('GET', `/ssot/data/notification.detail?notificationId=test-notification-id&userId=${TEST_USER_ID}`);
  
  if (result.success) {
    logger.info('  ✅ Notification detail endpoint working');
    logger.info(`  📋 Response: ${JSON.stringify(result.data)}`);
    return true;
  } else {
    logger.info('  ❌ Notification detail endpoint failed:', result.error);
    return false;
  }
}

async function testNotificationMarkAsReadAction() {
  logger.info('📋 Testing notification mark as read action...');
  
  const result = await makeRequest('POST', '/ssot/action', {
    actionKey: 'notification.markAsRead',
    payload: {
      notificationId: 'test-notification-id'
    }
  });
  
  if (result.success) {
    logger.info('  ✅ Notification mark as read action working');
    logger.info(`  📋 Response: ${JSON.stringify(result.data)}`);
    return true;
  } else {
    logger.info('  ❌ Notification mark as read action failed:', result.error);
    return false;
  }
}

async function testNotificationMarkAllAsReadAction() {
  logger.info('📋 Testing notification mark all as read action...');
  
  const result = await makeRequest('POST', '/ssot/action', {
    actionKey: 'notification.markAllAsRead',
    payload: {}
  });
  
  if (result.success) {
    logger.info('  ✅ Notification mark all as read action working');
    logger.info(`  📋 Response: ${JSON.stringify(result.data)}`);
    return true;
  } else {
    logger.info('  ❌ Notification mark all as read action failed:', result.error);
    return false;
  }
}

async function runNotificationTests() {
  logger.info('🚀 Running Notification SSoT Tests');
  logger.info('=' .repeat(50));
  logger.info(`📡 API Base URL: ${API_BASE_URL}`);
  logger.info('');
  
  const tests = [
    { name: 'Notification List Endpoint', fn: testNotificationListEndpoint },
    { name: 'Notification Detail Endpoint', fn: testNotificationDetailEndpoint },
    { name: 'Notification Mark As Read Action', fn: testNotificationMarkAsReadAction },
    { name: 'Notification Mark All As Read Action', fn: testNotificationMarkAllAsReadAction }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
        logger.info(`✅ ${test.name} test passed\n`);
      } else {
        failed++;
        logger.info(`❌ ${test.name} test failed\n`);
      }
    } catch (error) {
      failed++;
      logger.info(`❌ ${test.name} test error: ${error.message}\n`);
    }
  }
  
  logger.info('=' .repeat(50));
  logger.info(`📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    logger.info('🎉 All notification SSoT tests passed successfully!');
  } else {
    logger.info('⚠️  Some notification SSoT tests failed. Check the output above for details.');
  }
  
  return failed === 0;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runNotificationTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = runNotificationTests;