const fs = require('fs');
const path = require('path');
const db = require('../config/database');
const logger = require('../utils/logger');

async function runMigration() {
  try {
    logger.info('Running reported issues migration...');
    
    const migrationPath = path.join(__dirname, 'migrations', 'create-reported-issues-table.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    await db.pool.query(sql);
    
    logger.info('✅ Reported issues migration completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
