#!/usr/bin/env node

// Test database connection for Sub-Grant Management Platform

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

async function testConnection() {
  logger.info('Testing database connection...');
  logger.info('Database configuration:');
  logger.info(`  Host: ${dbConfig.host}`);
  logger.info(`  Port: ${dbConfig.port}`);
  logger.info(`  Database: ${dbConfig.database}`);
  logger.info(`  User: ${dbConfig.user}`);
  logger.info('---------------------------');

  const pool = new Pool(dbConfig);

  try {
    // Test connection
    const client = await pool.connect();
    logger.info('✓ Database connection successful');
    
    // Test basic query
    const result = await client.query('SELECT version()');
    logger.info('✓ Basic query executed successfully');
    logger.info(`  PostgreSQL version: ${result.rows[0].version}`);
    
    // Test UUID extension
    const uuidResult = await client.query('SELECT gen_random_uuid()');
    logger.info('✓ UUID extension is working');
    logger.info(`  Sample UUID: ${uuidResult.rows[0].gen_random_uuid}`);
    
    // Test table existence
    const tableResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    logger.info(`✓ Found ${tableResult.rows.length} tables in the database`);
    if (tableResult.rows.length > 0) {
      logger.info('  Tables:');
      tableResult.rows.forEach(row => {
        logger.info(`    - ${row.table_name}`);
      });
    }
    
    client.release();
  } catch (err) {
    logger.error('✗ Database connection failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
  
  logger.info('---------------------------');
  logger.info('Database connection test completed successfully!');
}

// Run the test if this script is executed directly
if (require.main === module) {
  testConnection();
}

module.exports = testConnection;