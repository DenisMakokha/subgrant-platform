const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'subgrant_platform',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    logger.info('🔧 Adding partner_budget_id column to disbursements...\n');
    
    const sqlPath = path.join(__dirname, 'migrations', 'add-partner-budget-id-to-disbursements.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await client.query(sql);
    
    logger.info('✅ Column added successfully!\n');
    
    // Verify
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'disbursements' 
        AND column_name = 'partner_budget_id'
    `);
    
    if (result.rows.length > 0) {
      logger.info('✓ Verified: partner_budget_id column exists');
      logger.info(`  Type: ${result.rows[0].data_type}`);
    }
    
  } catch (error) {
    logger.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
