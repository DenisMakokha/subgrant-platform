#!/usr/bin/env node

// Test backend API endpoints for linear onboarding flow

const axios = require('axios');
const dotenv = require('dotenv');
const logger = require('../utils/logger');

dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = 'test-linear-flow@example.com';
const TEST_PASSWORD = 'TestPassword123!';

let authToken = null;
let testUserId = null;
let testOrgId = null;

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

async function testRegistration() {
  logger.info('🔐 Testing user registration...');
  
  const result = await makeRequest('POST', '/api/onboarding/auth/register', {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    firstName: 'Test',
    lastName: 'User',
    organizationName: 'Test Organization Linear Flow'
  });
  
  if (result.success) {
    logger.info('  ✅ Registration successful');
    testUserId = result.data.user?.id;
    testOrgId = result.data.organization?.id;
    return true;
  } else {
    logger.info('  ❌ Registration failed:', result.error);
    return false;
  }
}

async function testLogin() {
  logger.info('🔑 Testing user login...');
  
  const result = await makeRequest('POST', '/api/onboarding/auth/login', {
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  });
  
  if (result.success) {
    logger.info('  ✅ Login successful');
    authToken = result.data.token;
    logger.info(`  📋 User role: ${result.data.user.role}`);
    logger.info(`  📋 Organization status: ${result.data.organization?.status}`);
    return true;
  } else {
    logger.info('  ❌ Login failed:', result.error);
    return false;
  }
}

async function testSessionEndpoint() {
  logger.info('📊 Testing /api/session endpoint...');
  
  const result = await makeRequest('GET', '/api/session');
  
  if (result.success) {
    logger.info('  ✅ Session endpoint working');
    logger.info(`  📋 User: ${result.data.user.email} (${result.data.user.role})`);
    logger.info(`  📋 Organization: ${result.data.organization?.status}`);
    logger.info(`  📋 Next step: ${result.data.nextStep}`);
    return true;
  } else {
    logger.info('  ❌ Session endpoint failed:', result.error);
    return false;
  }
}

async function testSectionAEndpoints() {
  logger.info('📝 Testing Section A endpoints...');
  
  // Test GET endpoint
  const getResult = await makeRequest('GET', '/api/onboarding/section-a');
  if (getResult.success) {
    logger.info('  ✅ Section A GET endpoint working');
  } else {
    logger.info('  ❌ Section A GET failed:', getResult.error);
  }
  
  // Test save endpoint
  const saveData = {
    name: 'Test Organization Linear Flow',
    legal_name: 'Test Organization Legal Name',
    registration_number: 'REG123456',
    legal_structure: 'NGO',
    country: 'Kenya',
    email: TEST_EMAIL,
    phone: '+254700000000'
  };
  
  const saveResult = await makeRequest('POST', '/api/onboarding/section-a/save', saveData);
  if (saveResult.success) {
    logger.info('  ✅ Section A save endpoint working');
  } else {
    logger.info('  ❌ Section A save failed:', saveResult.error);
  }
  
  // Test submit endpoint
  const submitResult = await makeRequest('POST', '/api/onboarding/section-a/submit', saveData);
  if (submitResult.success) {
    logger.info('  ✅ Section A POST (submit) endpoint working');
    logger.info(`  📋 Next step: ${submitResult.data.nextStep}`);
    return true;
  } else {
    logger.info('  ❌ Section A POST failed:', submitResult.error);
    return false;
  }
}

async function testSectionBEndpoints() {
  logger.info('💰 Testing Section B endpoints...');
  
  // Test GET endpoint
  const getResult = await makeRequest('GET', '/api/onboarding/section-b');
  if (getResult.success) {
    logger.info('  ✅ Section B GET endpoint working');
  } else {
    logger.info('  ❌ Section B GET failed:', getResult.error);
  }
  
  // Test save endpoint
  const saveData = {
    currentAnnualBudget: { amountUsd: 100000, year: 2024 },
    nextYearAnnualBudgetEstimate: { amountUsd: 120000, year: 2025 },
    largestGrantEverManaged: { amountUsd: 50000, year: 2023 },
    currentDonorFunding: { amountUsd: 80000, year: 2024 },
    otherFunds: { amountUsd: 20000, year: 2024 }
  };
  
  const saveResult = await makeRequest('POST', '/api/onboarding/section-b/save', saveData);
  if (saveResult.success) {
    logger.info('  ✅ Section B save endpoint working');
  } else {
    logger.info('  ❌ Section B save failed:', saveResult.error);
  }
  
  // Test submit endpoint
  const submitResult = await makeRequest('POST', '/api/onboarding/section-b/submit', saveData);
  if (submitResult.success) {
    logger.info('  ✅ Section B submit endpoint working');
    logger.info(`  📋 Next step: ${submitResult.data.nextStep}`);
    return true;
  } else {
    logger.info('  ❌ Section B submit failed:', submitResult.error);
    return false;
  }
}

async function testSectionCEndpoints() {
  logger.info('📁 Testing Section C endpoints...');
  
  // Test GET endpoint
  const getResult = await makeRequest('GET', '/api/onboarding/section-c');
  if (getResult.success) {
    logger.info('  ✅ Section C GET endpoint working');
  } else {
    logger.info('  ❌ Section C GET failed:', getResult.error);
  }
  
  // Test save endpoint
  const saveData = {
    documents: [
      {
        requirementCode: 'legal_incorporation_cert',
        available: 'yes',
        note: 'Test document upload',
        files: []
      }
    ]
  };
  
  const saveResult = await makeRequest('POST', '/api/onboarding/section-c/save', saveData);
  if (saveResult.success) {
    logger.info('  ✅ Section C save endpoint working');
  } else {
    logger.info('  ❌ Section C save failed:', saveResult.error);
  }
  
  // Test final submit endpoint (moves to under_review)
  const submitResult = await makeRequest('POST', '/api/onboarding/section-c/submit', {});
  if (submitResult.success) {
    logger.info('  ✅ Section C final submit endpoint working');
    logger.info(`  📋 Next step: ${submitResult.data.nextStep}`);
    return true;
  } else {
    logger.info('  ❌ Section C final submit failed:', submitResult.error);
    return false;
  }
}

async function testStateTransitions() {
  logger.info('🔄 Testing state transitions...');
  
  // Check current session after all submissions
  const sessionResult = await makeRequest('GET', '/api/session');
  if (sessionResult.success) {
    const orgStatus = sessionResult.data.organization?.status;
    logger.info(`  📋 Current organization status: ${orgStatus}`);
    
    if (orgStatus === 'under_review') {
      logger.info('  ✅ Organization correctly moved to under_review status');
      return true;
    } else {
      logger.info(`  ❌ Expected under_review, got ${orgStatus}`);
      return false;
    }
  } else {
    logger.info('  ❌ Failed to check final status:', sessionResult.error);
    return false;
  }
}

async function runAPITests() {
  logger.info('🚀 Running Backend API Tests for Linear Onboarding Flow');
  logger.info('=' .repeat(70));
  logger.info(`📡 API Base URL: ${API_BASE_URL}`);
  logger.info(`📧 Test Email: ${TEST_EMAIL}`);
  logger.info('');
  
  const tests = [
    { name: 'Registration', fn: testRegistration },
    { name: 'Login', fn: testLogin },
    { name: 'Session Endpoint', fn: testSessionEndpoint },
    { name: 'Section A Endpoints', fn: testSectionAEndpoints },
    { name: 'Section B Endpoints', fn: testSectionBEndpoints },
    { name: 'Section C Endpoints', fn: testSectionCEndpoints },
    { name: 'State Transitions', fn: testStateTransitions }
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
  
  logger.info('=' .repeat(70));
  logger.info(`📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    logger.info('🎉 All API tests passed successfully!');
  } else {
    logger.info('⚠️  Some API tests failed. Check the output above for details.');
  }
  
  return failed === 0;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAPITests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = runAPITests;
