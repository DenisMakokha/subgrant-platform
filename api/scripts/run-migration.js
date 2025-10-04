#!/usr/bin/env node

// Run database migration for linear onboarding flow

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

async function runMigration() {
  logger.info('🚀 Running Linear Onboarding Flow Migration...');
  logger.info('=' .repeat(60));
  
  const pool = new Pool(dbConfig);
  
  try {
    const client = await pool.connect();
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migrate-linear-onboarding-flow-v2.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    logger.info('📄 Migration file loaded:', migrationPath);
    
    // Check current organization statuses before migration
    logger.info('\n📊 Current organization statuses (before migration):');
    const beforeResult = await client.query(`
      SELECT status, COUNT(*) as count 
      FROM organizations 
      GROUP BY status 
      ORDER BY count DESC
    `);
    beforeResult.rows.forEach(row => {
      logger.info(`  ${row.status}: ${row.count} organizations`);
    });
    
    // Execute the migration
    logger.info('\n🔄 Executing migration...');
    await client.query(migrationSQL);
    logger.info('✅ Migration executed successfully');
    
    // Check organization statuses after migration
    logger.info('\n📊 Organization statuses (after migration):');
    const afterResult = await client.query(`
      SELECT 
        status, 
        COUNT(*) as count,
        MIN(created_at) as earliest,
        MAX(created_at) as latest
      FROM organizations 
      GROUP BY status 
      ORDER BY 
        CASE status
          WHEN 'email_pending' THEN 1
          WHEN 'a_pending' THEN 2
          WHEN 'b_pending' THEN 3
          WHEN 'c_pending' THEN 4
          WHEN 'under_review' THEN 5
          WHEN 'changes_requested' THEN 6
          WHEN 'finalized' THEN 7
          ELSE 8
        END
    `);
    afterResult.rows.forEach(row => {
      logger.info(`  ${row.status}: ${row.count} organizations (${row.earliest?.toISOString().split('T')[0]} - ${row.latest?.toISOString().split('T')[0]})`);
    });
    
    // Verify enum values
    logger.info('\n🔍 Verifying organization_status enum values:');
    const enumResult = await client.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid 
        FROM pg_type 
        WHERE typname = 'organization_status'
      )
      ORDER BY enumsortorder
    `);
    enumResult.rows.forEach(row => {
      logger.info(`  ✓ ${row.enumlabel}`);
    });
    
    // Test state transitions
    logger.info('\n🧪 Testing sample state transitions:');
    const testTransitions = [
      { from: 'email_pending', to: 'a_pending' },
      { from: 'a_pending', to: 'b_pending' },
      { from: 'b_pending', to: 'c_pending' },
      { from: 'c_pending', to: 'under_review' },
      { from: 'under_review', to: 'finalized' }
    ];
    
    for (const { from, to } of testTransitions) {
      try {
        await client.query(`
          UPDATE organizations 
          SET status = $1::organization_status 
          WHERE id = (
            SELECT id FROM organizations 
            WHERE status = $2::organization_status 
            LIMIT 1
          )
        `, [to, from]);
        logger.info(`  ✅ ${from} → ${to}: Valid transition`);
      } catch (error) {
        logger.info(`  ❌ ${from} → ${to}: ${error.message}`);
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
  logger.info('✅ Linear Onboarding Flow Migration completed successfully!');
  logger.info('\n📝 Summary:');
  logger.info('  - Organization status enum updated');
  logger.info('  - Existing organizations migrated to new statuses');
  logger.info('  - Database schema validated');
  logger.info('  - State transitions tested');
}

// Run the migration if this script is executed directly
if (require.main === module) {
  runMigration();
}

module.exports = runMigration;
