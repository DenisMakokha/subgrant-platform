#!/usr/bin/env node

const { Pool } = require('pg');
const dotenv = require('dotenv');
const logger = require('../utils/logger');

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'subgrant_platform',
  user: process.env.DB_USER || 'subgrant_user',
  password: process.env.DB_PASSWORD || 'subgrant_password',
};

async function checkSchema() {
  const pool = new Pool(dbConfig);
  
  try {
    const client = await pool.connect();
    
    // Check organizations table structure
    logger.info('📋 Organizations table columns:');
    const columnsResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'organizations' 
      ORDER BY ordinal_position
    `);
    columnsResult.rows.forEach(row => {
      logger.info(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : ''} ${row.column_default || ''}`);
    });
    
    // Check if organization_status enum exists
    logger.info('\n🔍 Checking for organization_status enum:');
    const enumResult = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'organization_status'
      ) as enum_exists
    `);
    logger.info(`  Enum exists: ${enumResult.rows[0].enum_exists}`);
    
    // Check current status values in organizations table
    logger.info('\n📊 Current status values:');
    const statusResult = await client.query(`
      SELECT status, COUNT(*) as count 
      FROM organizations 
      GROUP BY status 
      ORDER BY count DESC
    `);
    statusResult.rows.forEach(row => {
      logger.info(`  "${row.status}": ${row.count} organizations`);
    });
    
    client.release();
  } catch (error) {
    logger.error('❌ Schema check failed:', error.message);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  checkSchema();
}

module.exports = checkSchema;
