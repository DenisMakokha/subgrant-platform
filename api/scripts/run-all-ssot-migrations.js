const runBudgetSSOTMigrations = require('./run-budget-ssot-migrations');
const runContractSSOTMigrations = require('./run-contract-ssot-migrations');
const runEmailSSOTMigrations = require('./run-email-ssot-migrations');

async function runAllSSOTMigrations() {
  try {
    logger.info('🚀 Running All SSOT Migrations...');
    logger.info('=' .repeat(60));
    
    // Run Budget SSOT migrations
    logger.info('\n📦 Running Budget SSOT Migrations...');
    await runBudgetSSOTMigrations(false);
    
    // Run Contract SSOT migrations
    logger.info('\n📦 Running Contract SSOT Migrations...');
    await runContractSSOTMigrations(false);
    
    // Run Email SSOT migrations
    logger.info('\n📦 Running Email SSOT Migrations...');
    await runEmailSSOTMigrations(false);
    
    logger.info('\n' + '=' .repeat(60));
    logger.info('✅ All SSOT Migrations completed successfully!');
    logger.info('\n📝 Summary:');
    logger.info('  - Budget SSOT migrations executed');
    logger.info('  - Contract SSOT migrations executed');
    logger.info('  - Email SSOT migrations executed');
  } catch (error) {
    logger.error('❌ Error running SSOT migrations:', error);
    process.exit(1);
  } finally {
    // Close the database connection after all migrations are done
    const db = require('../config/database');
const logger = require('../utils/logger');
    await db.pool.end();
  }
}

// Run all migrations if this script is executed directly
if (require.main === module) {
  runAllSSOTMigrations();
}

module.exports = runAllSSOTMigrations;