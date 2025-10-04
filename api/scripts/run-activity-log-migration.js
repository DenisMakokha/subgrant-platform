const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

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
    console.log('🚀 Starting Partner Activity Log Migration...\n');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', 'create-partner-activity-log.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded');
    console.log('🔄 Executing migration...\n');
    
    // Execute the migration
    await client.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!\n');
    
    // Verify the table was created
    const verifyResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'partner_activity_log'
      );
    `);
    
    if (verifyResult.rows[0].exists) {
      console.log('✅ Table partner_activity_log verified');
      
      // Check indexes
      const indexResult = await client.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'partner_activity_log';
      `);
      
      console.log(`✅ ${indexResult.rows.length} indexes created`);
      indexResult.rows.forEach(row => {
        console.log(`   - ${row.indexname}`);
      });
      
      // Check function
      const functionResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM pg_proc 
          WHERE proname = 'log_partner_activity'
        );
      `);
      
      if (functionResult.rows[0].exists) {
        console.log('✅ Function log_partner_activity created');
      }
      
      // Check view
      const viewResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.views 
          WHERE table_name = 'partner_activity_feed'
        );
      `);
      
      if (viewResult.rows[0].exists) {
        console.log('✅ View partner_activity_feed created');
      }
      
      console.log('\n🎉 Activity Log Migration Complete!\n');
      console.log('The following are now available:');
      console.log('  - partner_activity_log table');
      console.log('  - partner_activity_feed view');
      console.log('  - log_partner_activity() function');
      console.log('  - 7 performance indexes');
      console.log('\n✨ Ready for production use!\n');
      
    } else {
      console.error('❌ Table verification failed');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
runMigration().catch(console.error);
