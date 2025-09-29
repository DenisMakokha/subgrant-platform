// CI checks script for the SSOT system

const { CAPABILITIES } = require('../registry/capabilities');
const { DATA_KEYS } = require('../registry/dataKeys');
const { FEATURE_FLAGS } = require('../registry/featureFlags');
const db = require('../config/database');

/**
 * Check that all capabilities are properly defined
 */
async function checkCapabilities() {
  console.log('Checking capabilities...');
  
  // Check that all capabilities have descriptions
  for (const cap of CAPABILITIES) {
    if (!cap.description) {
      throw new Error(`Capability ${cap.key} is missing description`);
    }
    
    if (!cap.scope) {
      throw new Error(`Capability ${cap.key} is missing scope`);
    }
    
    if (!Array.isArray(cap.data_keys)) {
      throw new Error(`Capability ${cap.key} has invalid data_keys format`);
    }
  }
  
  console.log('✓ All capabilities are properly defined');
  return true;
}

/**
 * Check that all data keys are properly defined
 */
async function checkDataKeys() {
  console.log('Checking data keys...');
  
  // Check that all data keys have descriptions
  for (const key of DATA_KEYS) {
    if (!key.description) {
      throw new Error(`Data key ${key.key} is missing description`);
    }
    
    if (!Array.isArray(key.params)) {
      throw new Error(`Data key ${key.key} has invalid params format`);
    }
  }
  
  console.log('✓ All data keys are properly defined');
  return true;
}

/**
 * Check that all feature flags are properly defined
 */
async function checkFeatureFlags() {
  console.log('Checking feature flags...');
  
  // Check that all feature flags have descriptions
  for (const flag of FEATURE_FLAGS) {
    if (!flag.description) {
      throw new Error(`Feature flag ${flag.key} is missing description`);
    }
    
    if (typeof flag.defaultValue !== 'boolean') {
      throw new Error(`Feature flag ${flag.key} has invalid defaultValue`);
    }
  }
  
  console.log('✓ All feature flags are properly defined');
  return true;
}

/**
 * Check database connectivity
 */
async function checkDatabase() {
  console.log('Checking database connectivity...');
  
  const client = await db.pool.connect();
  try {
    await client.query('SELECT 1');
    console.log('✓ Database connectivity OK');
    return true;
  } catch (error) {
    throw new Error(`Database connectivity check failed: ${error.message}`);
  } finally {
    client.release();
  }
}

/**
 * Check that required tables exist
 */
async function checkTables() {
  console.log('Checking required tables...');
  
  const requiredTables = [
    'roles',
    'dashboards',
    'approval_policies',
    'approvals',
    'fund_requests'
  ];
  
  const client = await db.pool.connect();
  try {
    for (const table of requiredTables) {
      const result = await client.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)",
        [table]
      );
      
      if (!result.rows[0].exists) {
        throw new Error(`Required table ${table} does not exist`);
      }
    }
    
    console.log('✓ All required tables exist');
    return true;
  } catch (error) {
    throw new Error(`Table check failed: ${error.message}`);
  } finally {
    client.release();
  }
}

/**
 * Run all CI checks
 */
async function runCiChecks() {
  try {
    console.log('Running CI checks...');
    
    await checkCapabilities();
    await checkDataKeys();
    await checkFeatureFlags();
    await checkDatabase();
    await checkTables();
    
    console.log('✓ All CI checks passed');
    return true;
  } catch (error) {
    console.error('CI checks failed:', error.message);
    process.exit(1);
  }
}

// Run the CI checks if this file is executed directly
if (require.main === module) {
  runCiChecks()
    .then(() => {
      console.log('CI checks completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('CI checks failed:', error);
      process.exit(1);
    });
}

module.exports = { 
  checkCapabilities, 
  checkDataKeys, 
  checkFeatureFlags, 
  checkDatabase, 
  checkTables, 
  runCiChecks 
};