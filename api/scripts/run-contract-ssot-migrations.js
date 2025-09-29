const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Database connection
const db = require('../config/database');

async function runContractSSOTMigrations(shouldClosePool = true) {
  try {
    console.log('Running Contract SSOT migrations...');
    
    // Get the migration directory
    const migrationDir = path.join(__dirname, 'migrations', '2025Q4_contract_ssot');
    
    // Check if migration directory exists
    if (!fs.existsSync(migrationDir)) {
      console.log('Migration directory does not exist:', migrationDir);
      return;
    }
    
    // Get all SQL files in the migration directory
    const files = fs.readdirSync(migrationDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    if (files.length === 0) {
      console.log('No migration files found');
      return;
    }
    
    console.log(`Found ${files.length} migration files`);
    
    // Run each migration file
    for (const file of files) {
      const filePath = path.join(migrationDir, file);
      console.log(`Running migration: ${file}`);
      
      // Read the SQL file
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Execute the SQL
      await db.pool.query(sql);
      console.log(`Successfully ran migration: ${file}`);
    }
    
    console.log('All Contract SSOT migrations completed successfully');
  } catch (error) {
    console.error('Error running Contract SSOT migrations:', error);
    process.exit(1);
  } finally {
    // Close the database connection only if shouldClosePool is true
    if (shouldClosePool) {
      await db.pool.end();
    }
  }
}

// Run the migrations if this script is executed directly
if (require.main === module) {
  runContractSSOTMigrations();
}

module.exports = runContractSSOTMigrations;