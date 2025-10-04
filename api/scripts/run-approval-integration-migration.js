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
    logger.info('🚀 Starting Approval Integration Migration...\n');
    
    // Read the SQL migration file
    const sqlPath = path.join(__dirname, 'migrations', 'add-approval-integration-columns.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the migration
    logger.info('📝 Adding approval_request_id columns to tables...');
    await client.query(sql);
    
    logger.info('✅ Migration completed successfully!\n');
    
    // Verify the migration
    logger.info('🔍 Verifying columns added...');
    const columnsResult = await client.query(`
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_name IN ('fund_requests', 'partner_budgets', 'contracts', 'grant_reporting_dates', 'grants')
        AND column_name = 'approval_request_id'
      ORDER BY table_name
    `);
    
    logger.info('\n📊 Columns Added:');
    columnsResult.rows.forEach(row => {
      logger.info(`   ✓ ${row.table_name}.${row.column_name} (${row.data_type})`);
    });
    
    // Verify indexes
    const indexesResult = await client.query(`
      SELECT 
        tablename,
        indexname
      FROM pg_indexes
      WHERE indexname LIKE '%approval%'
      ORDER BY tablename
    `);
    
    logger.info('\n📑 Indexes Created:');
    indexesResult.rows.forEach(row => {
      logger.info(`   ✓ ${row.indexname} on ${row.tablename}`);
    });
    
    // Verify workflows
    const workflowsResult = await client.query(`
      SELECT 
        w.name,
        w.entity_type,
        COUNT(s.id) as step_count,
        w.is_active
      FROM approval_workflows w
      LEFT JOIN approval_steps s ON w.id = s.workflow_id
      GROUP BY w.id, w.name, w.entity_type, w.is_active
      ORDER BY w.entity_type
    `);
    
    logger.info('\n📋 Approval Workflows:');
    workflowsResult.rows.forEach(row => {
      const status = row.is_active ? '✅' : '⏸️';
      logger.info(`   ${status} ${row.name} (${row.entity_type}) - ${row.step_count} steps`);
    });
    
    logger.info('\n🎉 Approval Integration is ready!');
    logger.info('\n📌 Next Steps:');
    logger.info('   1. Update backend controllers to create approval requests');
    logger.info('   2. Update frontend components to display approval status');
    logger.info('   3. Test approval workflows for each module');
    
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
