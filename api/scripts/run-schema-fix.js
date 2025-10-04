#!/usr/bin/env node

// Run schema fixes for linear onboarding flow

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
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

async function runSchemaFix() {
  logger.info('🔧 Running Schema Fixes for Linear Onboarding Flow...');
  logger.info('=' .repeat(60));
  
  const pool = new Pool(dbConfig);
  
  try {
    const client = await pool.connect();
    
    // Read the schema fix SQL file
    const schemaFixPath = path.join(__dirname, 'fix-schema-issues.sql');
    const schemaFixSQL = fs.readFileSync(schemaFixPath, 'utf8');
    
    logger.info('📄 Schema fix file loaded:', schemaFixPath);
    
    // Execute the schema fixes
    logger.info('\n🔄 Executing schema fixes...');
    await client.query(schemaFixSQL);
    logger.info('✅ Schema fixes executed successfully');
    
    client.release();
    
  } catch (error) {
    logger.error('❌ Schema fix failed:', error.message);
    logger.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
  
  logger.info('\n' + '=' .repeat(60));
  logger.info('✅ Schema fixes completed successfully!');
}

if (require.main === module) {
  runSchemaFix();
}

module.exports = runSchemaFix;
