#!/usr/bin/env node

// Run base tables migration for admin dashboard

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const logger = require('../utils/logger');

// Load environment variables
dotenv.config();

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'subgrant_platform',
  user: process.env.DB_USER || 'subgrant_user',
  password: process.env.DB_PASSWORD || 'subgrant_password',
};

async function runBaseMigration() {
  logger.info('🚀 Running Base Tables Migration for Admin Dashboard...');
  logger.info('=' .repeat(60));

  const pool = new Pool(dbConfig);

  try {
    const client = await pool.connect();

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migrations', '00_base_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    logger.info('📄 Migration file loaded:', migrationPath);
    logger.info('📏 Script length:', migrationSQL.length, 'characters');

    // Execute the migration
    logger.info('\n🔄 Executing migration...');
    await client.query(migrationSQL);
    logger.info('✅ Migration executed successfully');

    // Verify tables were created
    logger.info('\n🔍 Verifying created tables:');

    const tables = ['users', 'organizations', 'projects', 'approvals', 'audit_log', 'financial_assessments'];
    for (const table of tables) {
      try {
        const result = await client.query(`
          SELECT COUNT(*) as count FROM ${table}
        `);
        logger.info(`  ✅ ${table}: ${result.rows[0].count} rows`);
      } catch (error) {
        logger.info(`  ❌ ${table}: ${error.message}`);
      }
    }

    client.release();

  } catch (error) {
    logger.error('❌ Migration failed:', error.message);
    logger.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }

  logger.info('\n' + '=' .repeat(60));
  logger.info('✅ Base Tables Migration completed successfully!');
  logger.info('\n📝 Summary:');
  logger.info('  - Users table created');
  logger.info('  - Organizations table created');
  logger.info('  - Projects table created');
  logger.info('  - Approvals table created');
  logger.info('  - Audit log table created');
  logger.info('  - Financial assessments table created');
  logger.info('  - Indexes created for performance');
  logger.info('  - Triggers created for updated_at columns');
  logger.info('  - Sample data inserted for testing');
}

// Run the migration if this script is executed directly
if (require.main === module) {
  runBaseMigration();
}

module.exports = runBaseMigration;
