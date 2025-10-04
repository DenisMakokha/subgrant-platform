const MeReport = require('./models/meReport');
const FinancialReport = require('./models/financialReport');
const Receipt = require('./models/receipt');
const logger = require('utils/logger');

async function testReportingFunctionality() {
  try {
    logger.info('Testing ME Report functionality...');
    
    // Create a new ME report
    const meReportData = {
      budget_id: '12345678-1234-1234-1234-123456789012',
      title: 'Q1 ME Report',
      description: 'ME report for Q1',
      report_date: new Date().toISOString().split('T')[0],
      indicators: {
        'indicator_1': 100,
        'indicator_2': 95
      },
      status: 'draft',
      created_by: '12345678-1234-1234-1234-123456789012',
      updated_by: '12345678-1234-1234-1234-123456789012'
    };
    
    const meReport = await MeReport.create(meReportData);
    logger.info('Created ME report:', meReport);
    
    // Update the ME report
    const updatedMeReport = await meReport.update({
      status: 'submitted',
      submitted_at: new Date()
    });
    logger.info('Updated ME report:', updatedMeReport);
    
    logger.info('\nTesting Financial Report functionality...');
    
    // Create a new financial report
    const financialReportData = {
      budget_id: '12345678-1234-1234-1234-123456789012',
      title: 'Q1 Financial Report',
      description: 'Financial report for Q1',
      report_date: new Date().toISOString().split('T')[0],
      total_spent: 50000,
      variance: 2000,
      status: 'draft',
      created_by: '12345678-1234-1234-1234-123456789012',
      updated_by: '12345678-1234-1234-1234-123456789012'
    };
    
    const financialReport = await FinancialReport.create(financialReportData);
    logger.info('Created financial report:', financialReport);
    
    // Update the financial report
    const updatedFinancialReport = await financialReport.update({
      status: 'submitted',
      submitted_at: new Date()
    });
    logger.info('Updated financial report:', updatedFinancialReport);
    
    logger.info('\nTesting Receipt functionality...');
    
    // Create a new receipt
    const receiptData = {
      financial_report_id: financialReport.id,
      budget_line_id: '12345678-1234-1234-1234-123456789012',
      amount: 10000,
      currency: 'USD',
      description: 'Office supplies',
      document_uri: 'https://example.com/receipt1.pdf',
      document_name: 'receipt1.pdf',
      mime_type: 'application/pdf',
      created_by: '12345678-1234-1234-1234-123456789012'
    };
    
    const receipt = await Receipt.create(receiptData);
    logger.info('Created receipt:', receipt);
    
    // Get receipts for the financial report
    const receipts = await Receipt.findByFinancialReportId(financialReport.id);
    logger.info('Receipts for financial report:', receipts);
    
    logger.info('\nAll tests passed!');
  } catch (error) {
    logger.error('Test failed:', error);
  }
}

// Run the test
testReportingFunctionality();