const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function runMigration() {
  try {
    console.log('Running reported issues migration...');
    
    const migrationPath = path.join(__dirname, 'migrations', 'create-reported-issues-table.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    await db.pool.query(sql);
    
    console.log('✅ Reported issues migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
