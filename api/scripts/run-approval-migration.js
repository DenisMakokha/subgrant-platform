const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

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
    console.log('🚀 Starting Approval System Migration...\n');
    
    // Read the SQL migration file
    const sqlPath = path.join(__dirname, 'migrations', 'create-approval-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the migration
    console.log('📝 Creating approval system tables...');
    await client.query(sql);
    
    console.log('✅ Migration completed successfully!\n');
    
    // Verify the migration
    console.log('🔍 Verifying tables created...');
    const tablesResult = await client.query(`
      SELECT 
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
        AND table_name LIKE 'approval_%'
      ORDER BY table_name
    `);
    
    console.log('\n📊 Tables Created:');
    tablesResult.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name} (${row.column_count} columns)`);
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
    
    console.log('\n📋 Workflows Created:');
    workflowsResult.rows.forEach(row => {
      console.log(`   ✓ ${row.name} (${row.entity_type}) - ${row.step_count} steps`);
    });
    
    console.log('\n🎉 Approval System is ready to use!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
runMigration();
