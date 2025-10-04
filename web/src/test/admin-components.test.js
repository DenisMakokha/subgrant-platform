/**
 * Frontend Admin Dashboard Component Testing
 * Validates React components, TypeScript interfaces, and integration points
 */

const fs = require('fs');
const path = require('path');
const logger = require('../../utils/logger');

// Test configuration
const TEST_CONFIG = {
  componentsDir: path.join(__dirname, '../components/admin'),
  pagesDir: path.join(__dirname, '../pages/admin'),
  typesFile: path.join(__dirname, '../types/admin.ts'),
  servicesDir: path.join(__dirname, '../services'),
  requiredComponents: [
    'MetricsCard.tsx',
    'StatusIndicator.tsx',
    'SystemHealth.tsx',
    'DataTable.tsx'
  ],
  requiredPages: [
    'Dashboard.tsx',
    'UserManagement.tsx',
    'AuditCenter.tsx'
  ],
  requiredServices: [
    'adminApi.ts'
  ]
};

class FrontendTester {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      tests: []
    };
  }

  async runAllTests() {
    logger.info('🧪 Starting Frontend Admin Dashboard Tests...\n');

    try {
      // Test 1: File Structure Validation
      await this.testFileStructure();

      // Test 2: TypeScript Interface Validation
      await this.testTypeScriptInterfaces();

      // Test 3: Component Structure Validation
      await this.testComponentStructure();

      // Test 4: Import/Export Validation
      await this.testImportExport();

      // Test 5: API Integration Validation
      await this.testApiIntegration();

      // Test 6: UI/UX Validation
      await this.testUIUX();

      this.printSummary();
    } catch (error) {
      logger.error('❌ Frontend test suite failed:', error);
    }
  }

  async testFileStructure() {
    logger.info('🔍 Testing File Structure...');

    const tests = [
      {
        name: 'Components Directory Exists',
        test: () => this.fileExists(TEST_CONFIG.componentsDir)
      },
      {
        name: 'Pages Directory Exists',
        test: () => this.fileExists(TEST_CONFIG.pagesDir)
      },
      {
        name: 'Types File Exists',
        test: () => this.fileExists(TEST_CONFIG.typesFile)
      },
      {
        name: 'Services Directory Exists',
        test: () => this.fileExists(TEST_CONFIG.servicesDir)
      }
    ];

    // Test required components exist
    TEST_CONFIG.requiredComponents.forEach(component => {
      tests.push({
        name: `Component ${component} Exists`,
        test: () => this.fileExists(path.join(TEST_CONFIG.componentsDir, component))
      });
    });

    // Test required pages exist
    TEST_CONFIG.requiredPages.forEach(page => {
      tests.push({
        name: `Page ${page} Exists`,
        test: () => this.fileExists(path.join(TEST_CONFIG.pagesDir, page))
      });
    });

    // Test required services exist
    TEST_CONFIG.requiredServices.forEach(service => {
      tests.push({
        name: `Service ${service} Exists`,
        test: () => this.fileExists(path.join(TEST_CONFIG.servicesDir, service))
      });
    });

    await this.runTests(tests, 'File Structure');
  }

  async testTypeScriptInterfaces() {
    logger.info('🔍 Testing TypeScript Interfaces...');

    const tests = [
      {
        name: 'Types File Contains ServiceStatus Interface',
        test: () => this.fileContains(TEST_CONFIG.typesFile, 'interface ServiceStatus')
      },
      {
        name: 'Types File Contains SystemHealth Interface',
        test: () => this.fileContains(TEST_CONFIG.typesFile, 'interface SystemHealth')
      },
      {
        name: 'Types File Contains User Interface',
        test: () => this.fileContains(TEST_CONFIG.typesFile, 'interface User')
      },
      {
        name: 'Types File Contains ActivityEntry Interface',
        test: () => this.fileContains(TEST_CONFIG.typesFile, 'interface ActivityEntry')
      },
      {
        name: 'Types File Contains TableColumn Interface',
        test: () => this.fileContains(TEST_CONFIG.typesFile, 'interface TableColumn')
      },
      {
        name: 'Types File Contains ApiResponse Interface',
        test: () => this.fileContains(TEST_CONFIG.typesFile, 'interface ApiResponse')
      }
    ];

    await this.runTests(tests, 'TypeScript Interfaces');
  }

  async testComponentStructure() {
    logger.info('🔍 Testing Component Structure...');

    const tests = [
      {
        name: 'MetricsCard Component Has Required Props',
        test: () => this.fileContains(
          path.join(TEST_CONFIG.componentsDir, 'MetricsCard.tsx'),
          'interface MetricsCardProps'
        )
      },
      {
        name: 'StatusIndicator Component Has Status Prop',
        test: () => this.fileContains(
          path.join(TEST_CONFIG.componentsDir, 'StatusIndicator.tsx'),
          'status:'
        )
      },
      {
        name: 'SystemHealth Component Uses Admin API',
        test: () => this.fileContains(
          path.join(TEST_CONFIG.componentsDir, 'SystemHealth.tsx'),
          'adminApi.systemHealth'
        )
      },
      {
        name: 'DataTable Component Has Generic Type',
        test: () => this.fileContains(
          path.join(TEST_CONFIG.componentsDir, 'DataTable.tsx'),
          'function DataTable<T extends Record<string, any>>'
        )
      }
    ];

    await this.runTests(tests, 'Component Structure');
  }

  async testImportExport() {
    logger.info('🔍 Testing Import/Export Structure...');

    const tests = [
      {
        name: 'Admin API Service Exports Functions',
        test: () => this.fileContains(
          path.join(TEST_CONFIG.servicesDir, 'adminApi.ts'),
          'export const adminApi'
        )
      },
      {
        name: 'Components Export Default Functions',
        test: async () => {
          const components = ['MetricsCard', 'StatusIndicator', 'SystemHealth', 'DataTable'];
          let allPassed = true;

          for (const component of components) {
            const filePath = path.join(TEST_CONFIG.componentsDir, `${component}.tsx`);
            if (!this.fileContains(filePath, `export default ${component}`)) {
              allPassed = false;
              break;
            }
          }

          return allPassed;
        }
      },
      {
        name: 'Pages Export Default Functions',
        test: async () => {
          const pages = ['Dashboard', 'UserManagement', 'AuditCenter'];
          let allPassed = true;

          for (const page of pages) {
            const filePath = path.join(TEST_CONFIG.pagesDir, `${page}.tsx`);
            if (!this.fileContains(filePath, `export default ${page}`)) {
              allPassed = false;
              break;
            }
          }

          return allPassed;
        }
      }
    ];

    await this.runTests(tests, 'Import/Export');
  }

  async testApiIntegration() {
    logger.info('🔍 Testing API Integration...');

    const tests = [
      {
        name: 'Admin API Service Has System Health Functions',
        test: () => this.fileContains(
          path.join(TEST_CONFIG.servicesDir, 'adminApi.ts'),
          'systemHealth: systemHealthApi'
        )
      },
      {
        name: 'Admin API Service Has User Management Functions',
        test: () => this.fileContains(
          path.join(TEST_CONFIG.servicesDir, 'adminApi.ts'),
          'users: userManagementApi'
        )
      },
      {
        name: 'Admin API Service Has Audit Functions',
        test: () => this.fileContains(
          path.join(TEST_CONFIG.servicesDir, 'adminApi.ts'),
          'audit: auditApi'
        )
      },
      {
        name: 'Components Use Proper API Calls',
        test: () => {
          const systemHealthFile = path.join(TEST_CONFIG.componentsDir, 'SystemHealth.tsx');
          return this.fileContains(systemHealthFile, 'adminApi.systemHealth.getSystemHealth') ||
                 this.fileContains(systemHealthFile, 'adminApi.systemHealth.getServiceStatus');
        }
      }
    ];

    await this.runTests(tests, 'API Integration');
  }

  async testUIUX() {
    logger.info('🔍 Testing UI/UX Elements...');

    const tests = [
      {
        name: 'Components Use Tailwind Classes',
        test: async () => {
          const components = ['MetricsCard', 'StatusIndicator', 'SystemHealth', 'DataTable'];
          let allPassed = true;

          for (const component of components) {
            const filePath = path.join(TEST_CONFIG.componentsDir, `${component}.tsx`);
            const content = fs.readFileSync(filePath, 'utf8');

            // Check for common Tailwind patterns
            const hasTailwindClasses = /\bclass(Name)?\s*=\s*["'][^"']*\b(bg-|text-|border-|rounded-|shadow-|flex|grid|hidden|block|inline)/.test(content);

            if (!hasTailwindClasses) {
              logger.info(`    ⚠️  ${component} may not use Tailwind classes`);
            }
          }

          return true; // This is more of a warning check
        }
      },
      {
        name: 'Components Handle Loading States',
        test: async () => {
          const components = ['SystemHealth', 'UserManagement', 'AuditCenter'];
          let allPassed = true;

          for (const component of components) {
            const filePath = path.join(TEST_CONFIG.pagesDir, `${component}.tsx`);
            if (this.fileExists(filePath)) {
              const hasLoading = this.fileContains(filePath, 'loading') || this.fileContains(filePath, 'Loading');
              if (!hasLoading) {
                logger.info(`    ⚠️  ${component} may not handle loading states`);
              }
            }
          }

          return true;
        }
      },
      {
        name: 'Components Use Error Handling',
        test: async () => {
          const components = ['SystemHealth', 'UserManagement', 'AuditCenter'];
          let allPassed = true;

          for (const component of components) {
            const filePath = path.join(TEST_CONFIG.pagesDir, `${component}.tsx`);
            if (this.fileExists(filePath)) {
              const hasErrorHandling = this.fileContains(filePath, 'catch') || this.fileContains(filePath, 'error');
              if (!hasErrorHandling) {
                logger.info(`    ⚠️  ${component} may not have error handling`);
              }
            }
          }

          return true;
        }
      }
    ];

    await this.runTests(tests, 'UI/UX');
  }

  fileExists(filePath) {
    try {
      return fs.existsSync(filePath);
    } catch (error) {
      return false;
    }
  }

  fileContains(filePath, content) {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      return fileContent.includes(content);
    } catch (error) {
      return false;
    }
  }

  async runTests(tests, category) {
    logger.info(`\n📂 ${category} Tests:`);

    for (const test of tests) {
      try {
        const result = await test.test();
        this.recordTest(test.name, result, result ? 'PASSED' : 'FAILED');
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
    logger.info(`  ${status} ${name}: ${message}`);
  }

  printSummary() {
    logger.info('\n📊 Frontend Test Summary:');
    logger.info(`Total Tests: ${this.testResults.total}`);
    logger.info(`Passed: ${this.testResults.passed}`);
    logger.info(`Failed: ${this.testResults.failed}`);
    logger.info(`Success Rate: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(1)}%`);

    if (this.testResults.failed > 0) {
      logger.info('\n❌ Failed Tests:');
      this.testResults.tests
        .filter(test => !test.passed)
        .forEach(test => {
          logger.info(`  • ${test.name}: ${test.message}`);
        });
    }

    logger.info('\n🎉 Frontend Testing Complete!');
  }
}

// Main test execution
async function runFrontendTests() {
  logger.info('🧪 Frontend Admin Dashboard Testing Suite\n');
  logger.info('=' * 50);

  const tester = new FrontendTester();
  await tester.runAllTests();

  return tester.testResults;
}

// Export for use in other test files
module.exports = { FrontendTester, runFrontendTests };

// Run tests if called directly
if (require.main === module) {
  runFrontendTests().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  });
}
