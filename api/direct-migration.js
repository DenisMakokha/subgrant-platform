const { Client } = require('pg');
const fs = require('fs');
const logger = require('utils/logger');

async function runMigration() {
  const client = new Client({
    user: 'subgrant_user',
    host: 'localhost',
    database: 'subgrant_platform',
    password: 'subgrant_password',
    port: 5432,
  });

  try {
    logger.info('Connecting to PostgreSQL...');
    await client.connect();
    logger.info('✅ Connected successfully');

    // Read SQL file
    const sql = fs.readFileSync('./scripts/create_forum_tables.sql', 'utf8');
    logger.info(`📄 Loaded SQL file (${sql.length} characters)`);

    // Execute migration
    logger.info('🚀 Running Forum migration...');
    await client.query(sql);

    logger.info('✅ Forum migration completed successfully!');
    logger.info('📊 Created:');
    logger.info('   - 6 Forum categories');
    logger.info('   - 16 Forum tags');
    logger.info('   - All Forum database tables');

  } catch (error) {
    logger.error('❌ Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      logger.error('PostgreSQL server is not running on localhost:5432');
    } else if (error.code === '28P01') {
      logger.error('Authentication failed - check credentials');
    } else if (error.code === '3D000') {
      logger.error('Database "subgrant_platform" does not exist');
    } else if (error.code === 'ENOTFOUND') {
      logger.error('Cannot resolve hostname "localhost"');
    }
    
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
