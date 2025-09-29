#!/usr/bin/env node

// Test notification SSoT endpoints

const axios = require('axios');
const dotenv = require('dotenv');

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
  console.log('📋 Testing notification list endpoint...');
  
  const result = await makeRequest('GET', `/ssot/data/notification.list?userId=${TEST_USER_ID}`);
  
  if (result.success) {
    console.log('  ✅ Notification list endpoint working');
    console.log(`  📋 Response: ${JSON.stringify(result.data)}`);
    return true;
  } else {
    console.log('  ❌ Notification list endpoint failed:', result.error);
    return false;
  }
}

async function testNotificationDetailEndpoint() {
  console.log('📋 Testing notification detail endpoint...');
  
  const result = await makeRequest('GET', `/ssot/data/notification.detail?notificationId=test-notification-id&userId=${TEST_USER_ID}`);
  
  if (result.success) {
    console.log('  ✅ Notification detail endpoint working');
    console.log(`  📋 Response: ${JSON.stringify(result.data)}`);
    return true;
  } else {
    console.log('  ❌ Notification detail endpoint failed:', result.error);
    return false;
  }
}

async function testNotificationMarkAsReadAction() {
  console.log('📋 Testing notification mark as read action...');
  
  const result = await makeRequest('POST', '/ssot/action', {
    actionKey: 'notification.markAsRead',
    payload: {
      notificationId: 'test-notification-id'
    }
  });
  
  if (result.success) {
    console.log('  ✅ Notification mark as read action working');
    console.log(`  📋 Response: ${JSON.stringify(result.data)}`);
    return true;
  } else {
    console.log('  ❌ Notification mark as read action failed:', result.error);
    return false;
  }
}

async function testNotificationMarkAllAsReadAction() {
  console.log('📋 Testing notification mark all as read action...');
  
  const result = await makeRequest('POST', '/ssot/action', {
    actionKey: 'notification.markAllAsRead',
    payload: {}
  });
  
  if (result.success) {
    console.log('  ✅ Notification mark all as read action working');
    console.log(`  📋 Response: ${JSON.stringify(result.data)}`);
    return true;
  } else {
    console.log('  ❌ Notification mark all as read action failed:', result.error);
    return false;
  }
}

async function runNotificationTests() {
  console.log('🚀 Running Notification SSoT Tests');
  console.log('=' .repeat(50));
  console.log(`📡 API Base URL: ${API_BASE_URL}`);
  console.log('');
  
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
        console.log(`✅ ${test.name} test passed\n`);
      } else {
        failed++;
        console.log(`❌ ${test.name} test failed\n`);
      }
    } catch (error) {
      failed++;
      console.log(`❌ ${test.name} test error: ${error.message}\n`);
    }
  }
  
  console.log('=' .repeat(50));
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All notification SSoT tests passed successfully!');
  } else {
    console.log('⚠️  Some notification SSoT tests failed. Check the output above for details.');
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