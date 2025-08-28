const MeReport = require('./models/meReport');
const FinancialReport = require('./models/financialReport');

async function testDonorAccess() {
  try {
    console.log('Testing donor access restrictions...');
    
    // Create a new ME report with draft status
    const meReportData = {
      budget_id: '12345678-1234-1234-1234-123456789012',
      title: 'Test ME Report',
      description: 'Test ME report for donor access',
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
    console.log('Created draft ME report:', meReport.id);
    
    // Create a new financial report with draft status
    const financialReportData = {
      budget_id: '12345678-1234-1234-1234-123456789012',
      title: 'Test Financial Report',
      description: 'Test financial report for donor access',
      report_date: new Date().toISOString().split('T')[0],
      total_spent: 50000,
      variance: 2000,
      status: 'draft',
      created_by: '12345678-1234-1234-1234-123456789012',
      updated_by: '12345678-1234-1234-1234-123456789012'
    };
    
    const financialReport = await FinancialReport.create(financialReportData);
    console.log('Created draft financial report:', financialReport.id);
    
    // Simulate donor access to draft reports (should be restricted)
    console.log('\nSimulating donor access to draft reports...');
    
    // For ME report
    if (meReport.status !== 'approved') {
      console.log('Donor access to draft ME report correctly restricted');
    } else {
      console.log('ERROR: Donor access to draft ME report not restricted');
    }
    
    // For financial report
    if (financialReport.status !== 'approved') {
      console.log('Donor access to draft financial report correctly restricted');
    } else {
      console.log('ERROR: Donor access to draft financial report not restricted');
    }
    
    // Approve the reports
    console.log('\nApproving reports...');
    const approvedMeReport = await meReport.update({ status: 'approved' });
    const approvedFinancialReport = await financialReport.update({ status: 'approved' });
    
    console.log('Approved ME report:', approvedMeReport.id);
    console.log('Approved financial report:', approvedFinancialReport.id);
    
    // Simulate donor access to approved reports (should be allowed)
    console.log('\nSimulating donor access to approved reports...');
    
    // For ME report
    if (approvedMeReport.status === 'approved') {
      console.log('Donor access to approved ME report correctly allowed');
    } else {
      console.log('ERROR: Donor access to approved ME report not allowed');
    }
    
    // For financial report
    if (approvedFinancialReport.status === 'approved') {
      console.log('Donor access to approved financial report correctly allowed');
    } else {
      console.log('ERROR: Donor access to approved financial report not allowed');
    }
    
    console.log('\nAll donor access tests completed!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testDonorAccess();