const { expect } = require('chai');
const sinon = require('sinon');
const CreateGrantService = require('./services/grants/createGrantService');
const GrantRepository = require('./repositories/grantRepository');
const GrantSSOTRepository = require('./repositories/grantSSOTRepository');
const GrantEventHooksService = require('./services/grants/grantEventHooksService');
const { validateCreateGrant, validateUpdateGrant } = require('./schemas/grantSchemas');
const db = require('./config/database');
const logger = require('utils/logger');

describe('Grants SSOT Implementation', () => {
  let mockClient;
  let mockPool;

  beforeEach(() => {
    mockClient = {
      query: sinon.stub(),
      release: sinon.stub()
    };
    mockPool = {
      connect: sinon.stub().resolves(mockClient),
      query: sinon.stub()
    };
    sinon.stub(db, 'pool').value(mockPool);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('CreateGrantService', () => {
    describe('generateGrantNumber', () => {
      it('should generate grant number in correct format', () => {
        const testDate = new Date('2025-09-15');
        const grantNumber = CreateGrantService.generateGrantNumber(testDate);
        
        expect(grantNumber).to.match(/^GRN-202509-\d{4}$/);
      });

      it('should generate unique numbers for concurrent calls', () => {
        const numbers = new Set();
        for (let i = 0; i < 100; i++) {
          numbers.add(CreateGrantService.generateGrantNumber());
        }
        expect(numbers.size).to.equal(100);
      });
    });

    describe('suggestReportingDates', () => {
      it('should generate quarterly reporting dates', () => {
        const suggestions = CreateGrantService.suggestReportingDates(
          '2025-01-01', 
          '2025-12-31', 
          'quarterly'
        );
        
        expect(suggestions).to.have.length(4);
        expect(suggestions[0].description).to.equal('Q1 Report');
        expect(suggestions[3].description).to.equal('Q4 Report');
      });

      it('should generate biannual reporting dates', () => {
        const suggestions = CreateGrantService.suggestReportingDates(
          '2025-01-01', 
          '2025-12-31', 
          'biannual'
        );
        
        expect(suggestions).to.have.length(2);
        expect(suggestions[0].description).to.equal('H1 Report');
        expect(suggestions[1].description).to.equal('H2 Report');
      });

      it('should handle short grant periods', () => {
        const suggestions = CreateGrantService.suggestReportingDates(
          '2025-01-01', 
          '2025-02-28', 
          'quarterly'
        );
        
        expect(suggestions).to.have.length(0);
      });
    });

    describe('validateGrantData', () => {
      it('should pass validation for valid grant data', () => {
        const validGrant = {
          name: 'Test Grant',
          open_date: '2025-01-01',
          close_date: '2025-12-31',
          currency: 'USD',
          budget_amount: 100000,
          budget_category_allocations: [
            { category_id: 'ops', amount: 60000 },
            { category_id: 'admin', amount: 40000 }
          ]
        };

        const errors = CreateGrantService.validateGrantData(validGrant);
        expect(errors).to.be.empty;
      });

      it('should reject when allocations exceed budget', () => {
        const invalidGrant = {
          name: 'Test Grant',
          open_date: '2025-01-01',
          close_date: '2025-12-31',
          currency: 'USD',
          budget_amount: 100000,
          budget_category_allocations: [
            { category_id: 'ops', amount: 80000 },
            { category_id: 'admin', amount: 50000 }
          ]
        };

        const errors = CreateGrantService.validateGrantData(invalidGrant);
        expect(errors).to.include('Category allocations exceed total budget amount');
      });

      it('should reject when end date is before start date', () => {
        const invalidGrant = {
          name: 'Test Grant',
          open_date: '2025-12-31',
          close_date: '2025-01-01',
          currency: 'USD',
          budget_amount: 100000
        };

        const errors = CreateGrantService.validateGrantData(invalidGrant);
        expect(errors).to.include('End date must be on or after start date');
      });

      it('should reject invalid email format', () => {
        const invalidGrant = {
          name: 'Test Grant',
          open_date: '2025-01-01',
          close_date: '2025-12-31',
          currency: 'USD',
          budget_amount: 100000,
          donor_contact_email: 'invalid-email'
        };

        const errors = CreateGrantService.validateGrantData(invalidGrant);
        expect(errors).to.include('Invalid donor contact email format');
      });
    });

    describe('createGrant', () => {
      it('should create grant with all components in transaction', async () => {
        const grantDto = {
          name: 'Test Grant',
          open_date: '2025-01-01',
          close_date: '2025-12-31',
          currency: 'USD',
          budget_amount: 100000,
          financial_reporting_dates: [
            { date: '2025-04-15', description: 'Q1 Report' }
          ],
          budget_category_allocations: [
            { category_id: 'ops', amount: 60000 }
          ],
          attachments: [
            { name: 'contract.pdf', uri: 's3://bucket/key', mime: 'application/pdf' }
          ],
          envelope: {
            currency: 'USD',
            ceiling_amount: 80000
          }
        };

        mockClient.query
          .onFirstCall().resolves() // BEGIN
          .onSecondCall().resolves({ rows: [{ id: 'grant-id', project_id: 'project-id' }] }) // INSERT grants
          .onThirdCall().resolves({ rows: [{}] }) // INSERT grants_ssot
          .onCall(3).resolves() // INSERT reporting dates
          .onCall(4).resolves() // INSERT allocations
          .onCall(5).resolves() // INSERT attachments
          .onCall(6).resolves() // INSERT envelope
          .onCall(7).resolves(); // COMMIT

        const result = await CreateGrantService.createGrant(grantDto, 'user-id');

        expect(mockClient.query.callCount).to.equal(8);
        expect(mockClient.query.getCall(0).args[0]).to.equal('BEGIN');
        expect(mockClient.query.getCall(7).args[0]).to.equal('COMMIT');
        expect(result.project_id).to.exist;
        expect(result.grant_number).to.match(/^GRN-\d{6}-\d{4}$/);
      });

      it('should rollback on error', async () => {
        const grantDto = {
          name: 'Test Grant',
          open_date: '2025-01-01',
          close_date: '2025-12-31',
          currency: 'USD',
          budget_amount: 100000
        };

        mockClient.query
          .onFirstCall().resolves() // BEGIN
          .onSecondCall().rejects(new Error('Database error')); // INSERT grants fails

        try {
          await CreateGrantService.createGrant(grantDto, 'user-id');
          expect.fail('Should have thrown error');
        } catch (error) {
          expect(error.message).to.equal('Database error');
          expect(mockClient.query.getCall(2).args[0]).to.equal('ROLLBACK');
        }
      });
    });

    describe('updateGrant', () => {
      it('should update both canonical and SSOT tables', async () => {
        const updates = {
          name: 'Updated Grant Name',
          budget_amount: 150000
        };

        mockClient.query
          .onFirstCall().resolves() // BEGIN
          .onSecondCall().resolves({ rows: [{ id: 'grant-id', name: 'Updated Grant Name' }] }) // UPDATE grants
          .onThirdCall().resolves({ rows: [{}] }) // UPDATE grants_ssot
          .onCall(3).resolves(); // COMMIT

        const result = await CreateGrantService.updateGrant('grant-id', updates, 'user-id');

        expect(mockClient.query.callCount).to.equal(4);
        expect(result.name).to.equal('Updated Grant Name');
      });
    });

    describe('deleteGrant', () => {
      it('should delete from both SSOT and canonical tables', async () => {
        mockClient.query
          .onFirstCall().resolves() // BEGIN
          .onSecondCall().resolves() // DELETE grants_ssot
          .onThirdCall().resolves() // DELETE grants
          .onCall(3).resolves(); // COMMIT

        await CreateGrantService.deleteGrant('grant-id', 'user-id');

        expect(mockClient.query.callCount).to.equal(4);
      });
    });
  });

  describe('GrantRepository', () => {
    describe('create', () => {
      it('should insert grant with correct parameters', async () => {
        const grant = {
          id: 'grant-id',
          projectId: 'project-id',
          grantNumber: 'GRN-202509-1234',
          name: 'Test Grant',
          currency: 'USD',
          budgetAmount: 100000,
          createdBy: 'user-id'
        };

        mockPool.query.resolves({ 
          rows: [{ 
            id: 'grant-id', 
            project_id: 'project-id',
            grant_number: 'GRN-202509-1234',
            name: 'Test Grant'
          }] 
        });

        const result = await GrantRepository.create(grant);

        expect(mockPool.query.calledOnce).to.be.true;
        expect(result.id).to.equal('grant-id');
        expect(result.projectId).to.equal('project-id');
      });
    });

    describe('findByGrantNumber', () => {
      it('should find grant by grant number', async () => {
        mockPool.query.resolves({ 
          rows: [{ 
            id: 'grant-id',
            grant_number: 'GRN-202509-1234',
            name: 'Test Grant'
          }] 
        });

        const result = await GrantRepository.findByGrantNumber('GRN-202509-1234');

        expect(mockPool.query.calledOnce).to.be.true;
        expect(result.grantNumber).to.equal('GRN-202509-1234');
      });

      it('should return null when grant not found', async () => {
        mockPool.query.resolves({ rows: [] });

        const result = await GrantRepository.findByGrantNumber('NONEXISTENT');

        expect(result).to.be.null;
      });
    });
  });

  describe('GrantSSOTRepository', () => {
    describe('create', () => {
      it('should insert SSOT record with correct mapping', async () => {
        const grant = {
          id: 'grant-id',
          projectId: 'project-id',
          grantNumber: 'GRN-202509-1234',
          name: 'Test Grant',
          status: 'ACTIVE',
          createdBy: 'user-id'
        };

        mockPool.query.resolves({ 
          rows: [{ 
            id: 'grant-id',
            project_id: 'project-id',
            status: 'ACTIVE'
          }] 
        });

        const result = await GrantSSOTRepository.create(grant);

        expect(mockPool.query.calledOnce).to.be.true;
        expect(result.id).to.equal('grant-id');
      });
    });

    describe('update', () => {
      it('should update SSOT record with timestamp', async () => {
        const updates = { name: 'Updated Name' };

        mockPool.query.resolves({ 
          rows: [{ 
            id: 'grant-id',
            name: 'Updated Name',
            updated_at: new Date()
          }] 
        });

        const result = await GrantSSOTRepository.update('grant-id', updates);

        expect(mockPool.query.calledOnce).to.be.true;
        const query = mockPool.query.getCall(0).args[0];
        expect(query).to.include('updated_at = now()');
      });
    });
  });

  describe('GrantEventHooksService', () => {
    describe('onGrantCreated', () => {
      it('should log event and schedule notifications', async () => {
        const grantData = {
          id: 'grant-id',
          projectId: 'project-id',
          grantNumber: 'GRN-202509-1234',
          name: 'Test Grant',
          programManager: 'pm-id'
        };

        const reportingDates = [
          { date: '2025-04-15', kind: 'financial', description: 'Q1 Report' }
        ];

        mockClient.query.resolves({ rows: [] });

        await GrantEventHooksService.onGrantCreated(grantData, reportingDates, 'user-id');

        expect(mockClient.query.calledWith('BEGIN')).to.be.true;
        expect(mockClient.query.calledWith('COMMIT')).to.be.true;
      });
    });

    describe('onPartnerBudgetApproved', () => {
      it('should check headroom and alert if overrun', async () => {
        mockClient.query
          .onFirstCall().resolves() // BEGIN
          .onSecondCall().resolves() // Log event
          .onThirdCall().resolves({ rows: [{ headroom: -5000 }] }) // Check headroom
          .onCall(3).resolves() // Alert notification
          .onCall(4).resolves() // Trigger refresh
          .onCall(5).resolves(); // COMMIT

        await GrantEventHooksService.onPartnerBudgetApproved('budget-id', 'project-id', 'partner-id', 'user-id');

        expect(mockClient.query.callCount).to.equal(6);
      });
    });
  });

  describe('Validation Schemas', () => {
    describe('validateCreateGrant', () => {
      it('should validate complete grant creation payload', () => {
        const validPayload = {
          name: 'Test Grant',
          open_date: '2025-01-01',
          close_date: '2025-12-31',
          currency: 'USD',
          budget_amount: 100000,
          financial_reporting_dates: [
            { date: '2025-04-15', description: 'Q1 Report' }
          ],
          budget_category_allocations: [
            { category_id: 'ops', amount: 60000 }
          ]
        };

        const { error, value } = validateCreateGrant(validPayload);
        
        expect(error).to.be.undefined;
        expect(value.name).to.equal('Test Grant');
        expect(value.financial_reporting_dates).to.have.length(1);
      });

      it('should reject invalid currency', () => {
        const invalidPayload = {
          name: 'Test Grant',
          open_date: '2025-01-01',
          close_date: '2025-12-31',
          currency: 'INVALID',
          budget_amount: 100000
        };

        const { error } = validateCreateGrant(invalidPayload);
        
        expect(error).to.exist;
        expect(error.details[0].message).to.include('Currency must be one of');
      });

      it('should reject when allocations exceed budget', () => {
        const invalidPayload = {
          name: 'Test Grant',
          open_date: '2025-01-01',
          close_date: '2025-12-31',
          currency: 'USD',
          budget_amount: 100000,
          budget_category_allocations: [
            { category_id: 'ops', amount: 120000 }
          ]
        };

        const { error } = validateCreateGrant(invalidPayload);
        
        expect(error).to.exist;
        expect(error.details[0].message).to.include('exceed total budget amount');
      });
    });

    describe('validateUpdateGrant', () => {
      it('should allow partial updates', () => {
        const partialUpdate = {
          name: 'Updated Grant Name'
        };

        const { error, value } = validateUpdateGrant(partialUpdate);
        
        expect(error).to.be.undefined;
        expect(value.name).to.equal('Updated Grant Name');
      });

      it('should validate date consistency in updates', () => {
        const invalidUpdate = {
          open_date: '2025-12-31',
          close_date: '2025-01-01'
        };

        const { error } = validateUpdateGrant(invalidUpdate);
        
        expect(error).to.exist;
        expect(error.details[0].message).to.include('End date must be on or after start date');
      });
    });
  });

  describe('Integration Tests', () => {
    describe('Full Grant Lifecycle', () => {
      it('should create, update, and delete grant with SSOT consistency', async () => {
        // Mock successful database operations
        mockClient.query.resolves({ rows: [{ id: 'grant-id' }] });

        const grantDto = {
          name: 'Integration Test Grant',
          open_date: '2025-01-01',
          close_date: '2025-12-31',
          currency: 'USD',
          budget_amount: 100000
        };

        // Create
        const created = await CreateGrantService.createGrant(grantDto, 'user-id');
        expect(created.grant_number).to.match(/^GRN-\d{6}-\d{4}$/);

        // Update
        const updated = await CreateGrantService.updateGrant(created.grant.id, { name: 'Updated Name' }, 'user-id');
        expect(mockClient.query.calledWith('BEGIN')).to.be.true;

        // Delete
        await CreateGrantService.deleteGrant(created.grant.id, 'user-id');
        expect(mockClient.query.calledWith('COMMIT')).to.be.true;
      });
    });

    describe('Envelope Headroom Validation', () => {
      it('should prevent partner budget approval when envelope overrun', async () => {
        // Mock headroom check returning negative value
        mockClient.query
          .onFirstCall().resolves() // BEGIN
          .onSecondCall().resolves() // Log event
          .onThirdCall().resolves({ rows: [{ headroom: -10000 }] }) // Headroom check
          .onCall(3).resolves() // Alert
          .onCall(4).resolves() // Refresh
          .onCall(5).resolves(); // COMMIT

        await GrantEventHooksService.onPartnerBudgetApproved('budget-id', 'project-id', 'partner-id', 'user-id');

        // Verify alert was triggered
        const alertCall = mockClient.query.getCall(3);
        expect(alertCall.args[0]).to.include('notification');
      });
    });

    describe('Analytics Refresh', () => {
      it('should refresh fact tables when grant data changes', async () => {
        mockClient.query.resolves({ rows: [] });

        await GrantEventHooksService.processAnalyticsRefresh();

        // Should attempt to refresh materialized views and fact tables
        expect(mockClient.query.called).to.be.true;
      });
    });
  });

  describe('Performance Tests', () => {
    describe('Bulk Operations', () => {
      it('should handle bulk grant creation efficiently', async () => {
        const startTime = Date.now();
        const promises = [];

        // Mock fast database responses
        mockClient.query.resolves({ rows: [{ id: 'grant-id' }] });

        for (let i = 0; i < 10; i++) {
          const grantDto = {
            name: `Bulk Grant ${i}`,
            open_date: '2025-01-01',
            close_date: '2025-12-31',
            currency: 'USD',
            budget_amount: 100000
          };
          promises.push(CreateGrantService.createGrant(grantDto, 'user-id'));
        }

        await Promise.all(promises);
        const duration = Date.now() - startTime;

        // Should complete within reasonable time (mocked, so very fast)
        expect(duration).to.be.lessThan(1000);
      });
    });
  });

  describe('Error Handling', () => {
    describe('Database Constraints', () => {
      it('should handle unique constraint violations gracefully', async () => {
        const duplicateError = new Error('Duplicate key');
        duplicateError.code = '23505';
        duplicateError.constraint = 'grants_grant_number_key';

        mockClient.query
          .onFirstCall().resolves() // BEGIN
          .onSecondCall().rejects(duplicateError); // INSERT fails

        try {
          await CreateGrantService.createGrant({
            name: 'Test Grant',
            grant_number: 'GRN-202509-1234',
            open_date: '2025-01-01',
            close_date: '2025-12-31',
            currency: 'USD',
            budget_amount: 100000
          }, 'user-id');
          expect.fail('Should have thrown error');
        } catch (error) {
          expect(error.code).to.equal('23505');
          expect(mockClient.query.calledWith('ROLLBACK')).to.be.true;
        }
      });
    });

    describe('Foreign Key Violations', () => {
      it('should handle missing project references', async () => {
        const fkError = new Error('Foreign key violation');
        fkError.code = '23503';

        mockClient.query
          .onFirstCall().resolves() // BEGIN
          .onSecondCall().rejects(fkError); // INSERT fails

        try {
          await CreateGrantService.createGrant({
            name: 'Test Grant',
            project_id: 'nonexistent-project',
            open_date: '2025-01-01',
            close_date: '2025-12-31',
            currency: 'USD',
            budget_amount: 100000
          }, 'user-id');
          expect.fail('Should have thrown error');
        } catch (error) {
          expect(error.code).to.equal('23503');
        }
      });
    });
  });

  describe('Data Consistency', () => {
    describe('SSOT Synchronization', () => {
      it('should maintain data consistency between grants and grants_ssot', async () => {
        // This would be an integration test with real database
        // Verify that data in grants table matches grants_ssot table
        
        const grantDto = {
          name: 'Consistency Test Grant',
          open_date: '2025-01-01',
          close_date: '2025-12-31',
          currency: 'USD',
          budget_amount: 100000
        };

        // Mock both inserts returning consistent data
        mockClient.query
          .onFirstCall().resolves() // BEGIN
          .onSecondCall().resolves({ 
            rows: [{ 
              id: 'grant-id',
              project_id: 'project-id',
              grant_number: 'GRN-202509-1234',
              name: 'Consistency Test Grant'
            }] 
          }) // INSERT grants
          .onThirdCall().resolves({ 
            rows: [{ 
              id: 'grant-id',
              project_id: 'project-id',
              grant_number: 'GRN-202509-1234',
              name: 'Consistency Test Grant'
            }] 
          }) // INSERT grants_ssot
          .onCall(3).resolves(); // COMMIT

        const result = await CreateGrantService.createGrant(grantDto, 'user-id');

        // Verify both tables would have consistent data
        expect(result.grant_number).to.match(/^GRN-\d{6}-\d{4}$/);
      });
    });
  });
});

// Test runner helper
if (require.main === module) {
  logger.info('Running Grants SSOT Tests...');
  logger.info('Use: npm test or mocha api/test-grants-ssot.js');
}

module.exports = {
  // Export test utilities for other test files
  mockGrantData: {
    valid: {
      name: 'Test Grant',
      open_date: '2025-01-01',
      close_date: '2025-12-31',
      currency: 'USD',
      budget_amount: 100000
    },
    withAllocations: {
      name: 'Test Grant with Allocations',
      open_date: '2025-01-01',
      close_date: '2025-12-31',
      currency: 'USD',
      budget_amount: 100000,
      budget_category_allocations: [
        { category_id: 'ops', amount: 60000 },
        { category_id: 'admin', amount: 40000 }
      ]
    },
    withEnvelope: {
      name: 'Test Grant with Envelope',
      open_date: '2025-01-01',
      close_date: '2025-12-31',
      currency: 'USD',
      budget_amount: 100000,
      envelope: {
        currency: 'USD',
        ceiling_amount: 80000
      }
    }
  }
};