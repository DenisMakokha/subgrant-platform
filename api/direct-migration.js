const { Client } = require('pg');
const fs = require('fs');

async function runMigration() {
  const client = new Client({
    user: 'subgrant_user',
    host: 'localhost',
    database: 'subgrant_platform',
    password: 'subgrant_password',
    port: 5432,
  });

  try {
    console.log('Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected successfully');

    // Read SQL file
    const sql = fs.readFileSync('./scripts/create_forum_tables.sql', 'utf8');
    console.log(`📄 Loaded SQL file (${sql.length} characters)`);

    // Execute migration
    console.log('🚀 Running Forum migration...');
    await client.query(sql);

    console.log('✅ Forum migration completed successfully!');
    console.log('📊 Created:');
    console.log('   - 6 Forum categories');
    console.log('   - 16 Forum tags');
    console.log('   - All Forum database tables');

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('PostgreSQL server is not running on localhost:5432');
    } else if (error.code === '28P01') {
      console.error('Authentication failed - check credentials');
    } else if (error.code === '3D000') {
      console.error('Database "subgrant_platform" does not exist');
    } else if (error.code === 'ENOTFOUND') {
      console.error('Cannot resolve hostname "localhost"');
    }
    
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
