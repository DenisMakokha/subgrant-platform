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
    console.log('🚀 Starting Organization Workflows Migration...\n');
    
    // Read the SQL migration file
    const sqlPath = path.join(__dirname, 'migrations', 'add-organization-workflows.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the migration
    console.log('📝 Adding organization workflow support...');
    await client.query(sql);
    
    console.log('✅ Migration completed successfully!\n');
    
    // Verify the migration
    console.log('🔍 Verifying changes...\n');
    
    // Check columns added
    const columnsResult = await client.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'approval_workflows'
        AND column_name IN ('organization_id', 'is_default', 'parent_workflow_id', 'metadata')
      ORDER BY column_name
    `);
    
    console.log('📊 Columns Added to approval_workflows:');
    columnsResult.rows.forEach(row => {
      console.log(`   ✓ ${row.column_name} (${row.data_type})`);
    });
    
    // Check view created
    const viewResult = await client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.views
      WHERE table_name = 'v_active_workflows'
    `);
    
    if (viewResult.rows[0].count > 0) {
      console.log('\n📑 View Created:');
      console.log('   ✓ v_active_workflows');
    }
    
    // Check function created
    const functionResult = await client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.routines
      WHERE routine_name = 'get_workflow_for_entity'
    `);
    
    if (functionResult.rows[0].count > 0) {
      console.log('\n⚙️ Function Created:');
      console.log('   ✓ get_workflow_for_entity()');
    }
    
    // Check audit table
    const auditResult = await client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_name = 'approval_workflow_audit'
    `);
    
    if (auditResult.rows[0].count > 0) {
      console.log('\n📋 Audit Table Created:');
      console.log('   ✓ approval_workflow_audit');
    }
    
    // Show workflow statistics
    const statsResult = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_default = true) as defaults,
        COUNT(*) FILTER (WHERE organization_id IS NOT NULL) as org_specific,
        COUNT(*) FILTER (WHERE is_active = true) as active
      FROM approval_workflows
    `);
    
    const stats = statsResult.rows[0];
    console.log('\n📈 Workflow Statistics:');
    console.log(`   Total Workflows: ${stats.total}`);
    console.log(`   Default Workflows: ${stats.defaults}`);
    console.log(`   Organization-Specific: ${stats.org_specific}`);
    console.log(`   Active Workflows: ${stats.active}`);
    
    console.log('\n🎉 Organization workflow system is ready!');
    console.log('\n📌 Features Enabled:');
    console.log('   ✓ Organization-specific workflow overrides');
    console.log('   ✓ Automatic fallback to default workflows');
    console.log('   ✓ Condition-based routing support');
    console.log('   ✓ Workflow audit trail');
    console.log('   ✓ Helper function for workflow lookup');
    
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
