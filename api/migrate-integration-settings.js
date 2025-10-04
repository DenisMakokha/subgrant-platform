const { Client } = require('pg');
const fs = require('fs');
const logger = require('utils/logger');

async function runIntegrationSettingsMigration() {
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
    const sql = fs.readFileSync('./scripts/create_integration_settings_table.sql', 'utf8');
    logger.info(`📄 Loaded SQL file (${sql.length} characters)`);

    // Execute migration
    logger.info('🚀 Running Integration Settings migration...');
    await client.query(sql);

    logger.info('✅ Integration Settings migration completed successfully!');
    logger.info('📊 Created:');
    logger.info('   - integration_settings table');
    logger.info('   - Default integration types (DocuSign, SendGrid, Custom SMTP, etc.)');
    logger.info('   - Indexes and triggers for performance');

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

runIntegrationSettingsMigration();
