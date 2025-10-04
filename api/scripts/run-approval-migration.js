const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

// Load environment variables from api/.env
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
    logger.info('🚀 Starting Approval System Migration...\n');
    
    // Read the SQL migration file
    const sqlPath = path.join(__dirname, 'migrations', 'create-approval-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the migration
    logger.info('📝 Creating approval system tables...');
    await client.query(sql);
    
    logger.info('✅ Migration completed successfully!\n');
    
    // Verify the migration
    logger.info('🔍 Verifying tables created...');
    const tablesResult = await client.query(`
      SELECT 
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
        AND table_name LIKE 'approval_%'
      ORDER BY table_name
    `);
    
    logger.info('\n📊 Tables Created:');
    tablesResult.rows.forEach(row => {
      logger.info(`   ✓ ${row.table_name} (${row.column_count} columns)`);
    });
    
    // Verify workflows
    const workflowsResult = await client.query(`
      SELECT 
        w.name,
        w.entity_type,
        COUNT(s.id) as step_count
      FROM approval_workflows w
      LEFT JOIN approval_steps s ON w.id = s.workflow_id
      GROUP BY w.id, w.name, w.entity_type
      ORDER BY w.name
    `);
    
    logger.info('\n📋 Workflows Created:');
    workflowsResult.rows.forEach(row => {
      logger.info(`   ✓ ${row.name} (${row.entity_type}) - ${row.step_count} steps`);
    });
    
    logger.info('\n🎉 Approval System is ready to use!');
    
  } catch (error) {
    logger.error('❌ Migration failed:', error.message);
    logger.error('\nFull error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
runMigration();
