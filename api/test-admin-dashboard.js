/**
 * Comprehensive Admin Dashboard Testing Suite
 * Tests all backend functionality for the admin dashboard
 */

const axios = require('axios');
const db = require('./config/database');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// Mock user for testing (in real implementation, this would be a test user)
const TEST_ADMIN_USER = {
  id: 'test-admin-user',
  email: 'admin@test.com',
  role: 'admin',
  capabilities: ['wizard.admin']
};

class AdminDashboardTester {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      tests: []
    };
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive Admin Dashboard Tests...\n');

    try {
      // Test 1: System Health Monitoring
      await this.testSystemHealth();

      // Test 2: Dashboard Statistics
      await this.testDashboardStats();

      // Test 3: User Management
      await this.testUserManagement();

      // Test 4: Audit Center
      await this.testAuditCenter();

      // Test 5: Role Management
      await this.testRoleManagement();

      // Test 6: Error Handling
      await this.testErrorHandling();

      this.printSummary();
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    }
  }

  async testSystemHealth() {
    console.log('🔍 Testing System Health Monitoring...');

    const tests = [
      {
        name: 'Get System Health Overview',
        test: async () => {
          const response = await this.makeRequest('GET', '/admin/health/system');
          this.validateResponse(response, ['services', 'metrics', 'alerts', 'lastUpdated']);
        }
      },
      {
        name: 'Get Service Status',
        test: async () => {
          const response = await this.makeRequest('GET', '/admin/health/services');
          this.validateResponse(response, ['database', 'api', 'cache', 'notifications']);
        }
      },
      {
        name: 'Get System Metrics',
        test: async () => {
          const response = await this.makeRequest('GET', '/admin/health/metrics');
          this.validateResponse(response, ['totalUsers', 'activeUsers', 'totalOrganizations', 'totalProjects']);
        }
      },
      {
        name: 'Get Active Alerts',
        test: async () => {
          const response = await this.makeRequest('GET', '/admin/health/alerts');
          this.validateArrayResponse(response);
        }
      }
    ];

    await this.runTests(tests, 'System Health');
  }

  async testDashboardStats() {
    console.log('🔍 Testing Dashboard Statistics...');

    const tests = [
      {
        name: 'Get Dashboard Stats',
        test: async () => {
          const response = await this.makeRequest('GET', '/admin/dashboard/stats');
          this.validateResponse(response, ['totalUsers', 'totalOrganizations', 'totalProjects', 'activeUsers']);
        }
      },
      {
        name: 'Get Recent Activity',
        test: async () => {
          const response = await this.makeRequest('GET', '/admin/dashboard/recent-activity?limit=10');
          this.validateArrayResponse(response);
        }
      },
      {
        name: 'Get Pending Approvals Count',
        test: async () => {
          const response = await this.makeRequest('GET', '/admin/dashboard/pending-approvals');
          this.validateNumberResponse(response);
        }
      }
    ];

    await this.runTests(tests, 'Dashboard Stats');
  }

  async testUserManagement() {
    console.log('🔍 Testing User Management...');

    const tests = [
      {
        name: 'Get Users List',
        test: async () => {
          const response = await this.makeRequest('GET', '/admin/users');
          this.validatePaginatedResponse(response);
        }
      },
      {
        name: 'Get Users with Search',
        test: async () => {
          const response = await this.makeRequest('GET', '/admin/users?search=admin');
          this.validatePaginatedResponse(response);
        }
      },
      {
        name: 'Get Users with Role Filter',
        test: async () => {
          const response = await this.makeRequest('GET', '/admin/users?role=admin');
          this.validatePaginatedResponse(response);
        }
      },
      {
        name: 'Create New User',
        test: async () => {
          const testUser = {
            email: `testuser${Date.now()}@example.com`,
            firstName: 'Test',
            lastName: 'User',
            role: 'partner_user',
            isActive: true
          };
          const response = await this.makeRequest('POST', '/admin/users', testUser);
          this.validateResponse(response, ['id', 'email', 'firstName', 'lastName', 'role']);
        }
      },
      {
        name: 'Export Users',
        test: async () => {
          const response = await this.makeRequest('GET', '/admin/users/export?format=csv');
          this.validateFileResponse(response);
        }
      }
    ];

    await this.runTests(tests, 'User Management');
  }

  async testAuditCenter() {
    console.log('🔍 Testing Audit Center...');

    const tests = [
      {
        name: 'Get Activity Logs',
        test: async () => {
          const filters = {
            dateRange: {
              start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              end: new Date()
            },
            limit: 50
          };
          const response = await this.makeRequest('POST', '/admin/audit/activity', filters);
          this.validatePaginatedResponse(response);
        }
      },
      {
        name: 'Get Security Events',
        test: async () => {
          const filters = {
            dateRange: {
              start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              end: new Date()
            }
          };
          const response = await this.makeRequest('POST', '/admin/audit/security', filters);
          this.validatePaginatedResponse(response);
        }
      },
      {
        name: 'Get Compliance Reports',
        test: async () => {
          const response = await this.makeRequest('GET', '/admin/audit/compliance');
          this.validateArrayResponse(response);
        }
      },
      {
        name: 'Generate Compliance Report',
        test: async () => {
          const reportData = { type: 'security' };
          const response = await this.makeRequest('POST', '/admin/audit/compliance', reportData);
          this.validateResponse(response, ['id', 'name', 'type', 'status', 'createdAt']);
        }
      },
      {
        name: 'Export Audit Data',
        test: async () => {
          const filters = {
            dateRange: {
              start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              end: new Date()
            }
          };
          const response = await this.makeRequest('POST', '/admin/audit/export?format=csv', filters);
          this.validateFileResponse(response);
        }
      }
    ];

    await this.runTests(tests, 'Audit Center');
  }

  async testRoleManagement() {
    console.log('🔍 Testing Role Management...');

    const tests = [
      {
        name: 'Get Roles',
        test: async () => {
          const response = await this.makeRequest('GET', '/admin/roles');
          this.validateArrayResponse(response);
        }
      },
      {
        name: 'Get Capabilities Catalog',
        test: async () => {
          const response = await this.makeRequest('GET', '/admin/catalog/caps');
          this.validateArrayResponse(response);
        }
      },
      {
        name: 'Get Data Keys Catalog',
        test: async () => {
          const response = await this.makeRequest('GET', '/admin/catalog/data-keys');
          this.validateArrayResponse(response);
        }
      },
      {
        name: 'Get Dashboards',
        test: async () => {
          const response = await this.makeRequest('GET', '/admin/dashboards');
          this.validateArrayResponse(response);
        }
      }
    ];

    await this.runTests(tests, 'Role Management');
  }

  async testErrorHandling() {
    console.log('🔍 Testing Error Handling...');

    const tests = [
      {
        name: 'Unauthorized Access (No Token)',
        test: async () => {
          try {
            await axios.get(`${BASE_URL}/admin/health/system`);
            throw new Error('Should have failed with 401');
          } catch (error) {
            if (error.response?.status === 401) {
              this.recordTest('Unauthorized Access Test', true, 'Correctly returned 401');
            } else {
              throw error;
            }
          }
        }
      },
      {
        name: 'Invalid User ID',
        test: async () => {
          try {
            await this.makeRequest('GET', '/admin/users/invalid-id');
            throw new Error('Should have failed with 404');
          } catch (error) {
            if (error.response?.status === 404) {
              this.recordTest('Invalid User ID Test', true, 'Correctly returned 404');
            } else {
              throw error;
            }
          }
        }
      },
      {
        name: 'Invalid Request Body',
        test: async () => {
          try {
            await this.makeRequest('POST', '/admin/users', { invalid: 'data' });
            throw new Error('Should have failed with 400');
          } catch (error) {
            if (error.response?.status === 400) {
              this.recordTest('Invalid Request Body Test', true, 'Correctly returned 400');
            } else {
              throw error;
            }
          }
        }
      }
    ];

    await this.runTests(tests, 'Error Handling');
  }

  async makeRequest(method, endpoint, data = null) {
    const url = `${BASE_URL}${endpoint}`;

    // In a real implementation, you would get a valid JWT token
    // For now, we'll skip authentication for testing
    const config = {
      method,
      url,
      data,
      timeout: 10000
    };

    return await axios(config);
  }

  validateResponse(response, requiredFields) {
    if (!response || typeof response !== 'object') {
      throw new Error('Response is not an object');
    }

    requiredFields.forEach(field => {
      if (!(field in response)) {
        throw new Error(`Missing required field: ${field}`);
      }
    });
  }

  validateArrayResponse(response) {
    if (!Array.isArray(response)) {
      throw new Error('Response is not an array');
    }
  }

  validatePaginatedResponse(response) {
    this.validateArrayResponse(response.data);
    this.validateResponse(response.pagination, ['total', 'page', 'limit', 'totalPages']);
  }

  validateNumberResponse(response) {
    if (typeof response !== 'number') {
      throw new Error('Response is not a number');
    }
  }

  validateFileResponse(response) {
    if (!response.headers['content-type']) {
      throw new Error('Missing content-type header');
    }
  }

  async runTests(tests, category) {
    console.log(`\n📂 ${category} Tests:`);

    for (const test of tests) {
      try {
        await test.test();
        this.recordTest(test.name, true, 'PASSED');
      } catch (error) {
        this.recordTest(test.name, false, error.message);
      }
    }
  }

  recordTest(name, passed, message) {
    this.testResults.total++;
    if (passed) {
      this.testResults.passed++;
    } else {
      this.testResults.failed++;
    }

    this.testResults.tests.push({
      name,
      passed,
      message
    });

    const status = passed ? '✅' : '❌';
    console.log(`  ${status} ${name}: ${message}`);
  }

  printSummary() {
    console.log('\n📊 Test Summary:');
    console.log(`Total Tests: ${this.testResults.total}`);
    console.log(`Passed: ${this.testResults.passed}`);
    console.log(`Failed: ${this.testResults.failed}`);
    console.log(`Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(1)}%`);

    if (this.testResults.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults.tests
        .filter(test => !test.passed)
        .forEach(test => {
          console.log(`  • ${test.name}: ${test.message}`);
        });
    }

    console.log('\n🎉 Testing Complete!');
  }
}

// Database connectivity test
async function testDatabaseConnection() {
  console.log('🔍 Testing Database Connection...');

  try {
    const result = await db.pool.query('SELECT 1 as test');
    if (result.rows[0].test === 1) {
      console.log('  ✅ Database connection successful');
      return true;
    } else {
      console.log('  ❌ Database query returned unexpected result');
      return false;
    }
  } catch (error) {
    console.log(`  ❌ Database connection failed: ${error.message}`);
    return false;
  }
}

// Main test execution
async function runAdminDashboardTests() {
  console.log('🧪 Admin Dashboard Testing Suite\n');
  console.log('=' * 50);

  // Test database connection first
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    console.log('\n❌ Cannot proceed with tests - database connection failed');
    process.exit(1);
  }

  // Run all tests
  const tester = new AdminDashboardTester();
  await tester.runAllTests();

  process.exit(tester.testResults.failed > 0 ? 1 : 0);
}

// Export for use in other test files
module.exports = { AdminDashboardTester, runAdminDashboardTests };

// Run tests if called directly
if (require.main === module) {
  runAdminDashboardTests();
}
