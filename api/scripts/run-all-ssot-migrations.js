const runBudgetSSOTMigrations = require('./run-budget-ssot-migrations');
const runContractSSOTMigrations = require('./run-contract-ssot-migrations');
const runEmailSSOTMigrations = require('./run-email-ssot-migrations');

async function runAllSSOTMigrations() {
  try {
    console.log('🚀 Running All SSOT Migrations...');
    console.log('=' .repeat(60));
    
    // Run Budget SSOT migrations
    console.log('\n📦 Running Budget SSOT Migrations...');
    await runBudgetSSOTMigrations(false);
    
    // Run Contract SSOT migrations
    console.log('\n📦 Running Contract SSOT Migrations...');
    await runContractSSOTMigrations(false);
    
    // Run Email SSOT migrations
    console.log('\n📦 Running Email SSOT Migrations...');
    await runEmailSSOTMigrations(false);
    
    console.log('\n' + '=' .repeat(60));
    console.log('✅ All SSOT Migrations completed successfully!');
    console.log('\n📝 Summary:');
    console.log('  - Budget SSOT migrations executed');
    console.log('  - Contract SSOT migrations executed');
    console.log('  - Email SSOT migrations executed');
  } catch (error) {
    console.error('❌ Error running SSOT migrations:', error);
    process.exit(1);
  } finally {
    // Close the database connection after all migrations are done
    const db = require('../config/database');
    await db.pool.end();
  }
}

// Run all migrations if this script is executed directly
if (require.main === module) {
  runAllSSOTMigrations();
}

module.exports = runAllSSOTMigrations;