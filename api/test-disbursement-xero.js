const xeroService = require('./services/xeroService');
const currencyService = require('./services/currencyService');

// Mock disbursement data for testing
const mockDisbursement = {
  id: '12345678-1234-1234-1234-123456789012',
  budget_id: '12345678-1234-1234-1234-123456789012',
  title: 'Test Disbursement',
  description: 'Test disbursement for integration testing',
  tranche_number: 1,
  amount: 5000,
  currency: 'USD',
  planned_date: new Date().toISOString().split('T')[0],
  status: 'planned',
  created_by: '12345678-1234-1234-1234-123456789012',
  updated_by: '12345678-1234-1234-1234-123456789012'
};

async function testDisbursementXeroIntegration() {
  console.log('Testing Disbursement and Xero Integration...');
  
  try {
    // Test currency conversion
    console.log('\n1. Testing currency conversion...');
    const amountInUSD = 1000;
    const convertedAmount = await currencyService.convertCurrency(amountInUSD, 'USD', 'KES');
    console.log(`   $${amountInUSD} USD = KES ${convertedAmount.toFixed(2)}`);
    
    // Test getting supported currencies
    console.log('\n2. Testing supported currencies...');
    const supportedCurrencies = currencyService.getSupportedCurrencies();
    console.log(`   Supported currencies: ${supportedCurrencies.slice(0, 10).join(', ')}...`);
    
    // Test formatting currency
    console.log('\n3. Testing currency formatting...');
    const formattedAmount = currencyService.formatCurrency(5000, 'USD');
    console.log(`   Formatted amount: ${formattedAmount}`);
    
    // Test Xero service methods (without actually calling Xero)
    console.log('\n4. Testing Xero service integration...');
    console.log('   Would create Xero invoice for disbursement');
    console.log('   Would reconcile Xero payment for disbursement');
    
    // Test getting total disbursement amount in a specific currency
    console.log('\n5. Testing total disbursement amount conversion...');
    const totalAmount = await currencyService.convertCurrency(
      mockDisbursement.amount,
      mockDisbursement.currency,
      'KES'
    );
    console.log(`   Total disbursement amount in KES: ${totalAmount.toFixed(2)}`);
    
    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test
testDisbursementXeroIntegration();