const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Database connection
const db = require('../config/database');
const logger = require('../utils/logger');

async function runBudgetSSOTMigrations(shouldClosePool = true) {
  try {
    logger.info('Running Budget SSOT migrations...');
    
    // Get the migration directory
    const migrationDir = path.join(__dirname, 'migrations', '2025Q4_budget_ssot');
    
    // Check if migration directory exists
    if (!fs.existsSync(migrationDir)) {
      logger.info('Migration directory does not exist:', migrationDir);
      return;
    }
    
    // Get all SQL files in the migration directory
    const files = fs.readdirSync(migrationDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    if (files.length === 0) {
      logger.info('No migration files found');
      return;
    }
    
    logger.info(`Found ${files.length} migration files`);
    
    // Run each migration file
    for (const file of files) {
      const filePath = path.join(migrationDir, file);
      logger.info(`Running migration: ${file}`);
      
      // Read the SQL file
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Execute the SQL
      await db.pool.query(sql);
      logger.info(`Successfully ran migration: ${file}`);
    }
    
    logger.info('All Budget SSOT migrations completed successfully');
  } catch (error) {
    logger.error('Error running Budget SSOT migrations:', error);
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
  runBudgetSSOTMigrations();
}

module.exports = runBudgetSSOTMigrations;