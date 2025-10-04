#!/usr/bin/env node

// Check audit_log table columns

const { Pool } = require('pg');
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

async function checkAuditLogColumns() {
  logger.info('🔍 Checking audit_log table columns...');
  logger.info('=' .repeat(50));

  const pool = new Pool(dbConfig);

  try {
    const client = await pool.connect();

    // Check if audit_log table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'audit_log'
      );
    `);

    if (!tableExists.rows[0].exists) {
      logger.info('❌ audit_log table does not exist');
      client.release();
      await pool.end();
      return;
    }

    logger.info('✅ audit_log table exists');

    // Get column information
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'audit_log'
      ORDER BY ordinal_position;
    `);

    logger.info('\n📋 Table columns:');
    columns.rows.forEach(col => {
      logger.info(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(required)'}`);
    });

    // Check if we can insert a test record
    logger.info('\n🧪 Testing insert operation:');
    try {
      await client.query(`
        INSERT INTO audit_log (action, entity_type, entity_id, metadata)
        VALUES ('test', 'test', 1, '{"test": true}')
      `);
      logger.info('  ✅ Insert test successful');

      // Clean up test record
      await client.query(`DELETE FROM audit_log WHERE action = 'test'`);
      logger.info('  ✅ Test cleanup successful');
    } catch (error) {
      logger.info(`  ❌ Insert test failed: ${error.message}`);
    }

    client.release();

  } catch (error) {
    logger.error('❌ Database query failed:', error.message);
    logger.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }

  logger.info('\n' + '=' .repeat(50));
  logger.info('✅ Audit log table check completed!');
}

// Run the check if this script is executed directly
if (require.main === module) {
  checkAuditLogColumns();
}

module.exports = checkAuditLogColumns;
