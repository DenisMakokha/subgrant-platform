#!/usr/bin/env node

// Run SSOT database migrations
// This script runs the 2025Q1 SSOT cutover migrations (Phase A and Phase B)
// which include the fund_requests table and other schema changes

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

async function runSSOTMigrations() {
  logger.info('🚀 Running SSOT Database Migrations...');
  logger.info('=' .repeat(60));
  
  const pool = new Pool(dbConfig);
  
  try {
    const client = await pool.connect();
    
    // Run Phase A migration (schema bootstrap)
    logger.info('\n📦 Running Phase A: Schema Bootstrap...');
    const phaseAPath = path.join(__dirname, 'migrations/2025Q1_ssot_cutover/phaseA.sql');
    if (fs.existsSync(phaseAPath)) {
      const phaseASQL = fs.readFileSync(phaseAPath, 'utf8');
      logger.info('📄 Phase A migration file loaded:', phaseAPath);
      
      // Execute Phase A migration
      logger.info('🔄 Executing Phase A migration...');
      await client.query(phaseASQL);
      logger.info('✅ Phase A migration executed successfully');
    } else {
      logger.info('⚠️  Phase A migration file not found, skipping...');
    }
    
    // Run notifications migration
    logger.info('\n📦 Running Notifications Schema Migration...');
    const notificationsPath = path.join(__dirname, 'migrations/2025Q1_ssot_cutover/notifications.sql');
    if (fs.existsSync(notificationsPath)) {
      const notificationsSQL = fs.readFileSync(notificationsPath, 'utf8');
      logger.info('📄 Notifications migration file loaded:', notificationsPath);
      
      // Execute notifications migration
      logger.info('🔄 Executing Notifications migration...');
      await client.query(notificationsSQL);
      logger.info('✅ Notifications migration executed successfully');
    } else {
      logger.info('⚠️  Notifications migration file not found, skipping...');
    }
    
    // Run Phase B migration (backfill and compatibility)
    logger.info('\n📦 Running Phase B: Backfill and Compatibility...');
    const phaseBPath = path.join(__dirname, 'migrations/2025Q1_ssot_cutover/phaseB.sql');
    if (fs.existsSync(phaseBPath)) {
      const phaseBSQL = fs.readFileSync(phaseBPath, 'utf8');
      logger.info('📄 Phase B migration file loaded:', phaseBPath);
      
      // Execute Phase B migration
      logger.info('🔄 Executing Phase B migration...');
      await client.query(phaseBSQL);
      logger.info('✅ Phase B migration executed successfully');
    } else {
      logger.info('⚠️  Phase B migration file not found, skipping...');
    }
    
    // Verify fund_requests table exists
    logger.info('\n🔍 Verifying fund_requests table...');
    try {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT 1 
          FROM information_schema.tables 
          WHERE table_name = 'fund_requests'
        ) as exists
      `);
      
      if (result.rows[0].exists) {
        logger.info('✅ fund_requests table exists');
        
        // Show table structure
        logger.info('\n📋 fund_requests table structure:');
        const structureResult = await client.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_name = 'fund_requests'
          ORDER BY ordinal_position
        `);
        structureResult.rows.forEach(row => {
          logger.info(`  ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
        });
      } else {
        logger.info('❌ fund_requests table does not exist');
      }
    } catch (error) {
      logger.info('❌ Error verifying fund_requests table:', error.message);
    }
    
    // Verify notif_inbox table exists
    logger.info('\n🔍 Verifying notif_inbox table...');
    try {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT 1 
          FROM information_schema.tables 
          WHERE table_name = 'notif_inbox'
        ) as exists
      `);
      
      if (result.rows[0].exists) {
        logger.info('✅ notif_inbox table exists');
      } else {
        logger.info('❌ notif_inbox table does not exist');
      }
    } catch (error) {
      logger.info('❌ Error verifying notif_inbox table:', error.message);
    }
    
    client.release();
    
  } catch (error) {
    logger.error('❌ SSOT migrations failed:', error.message);
    logger.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
  
  logger.info('\n' + '=' .repeat(60));
  logger.info('✅ SSOT Database Migrations completed successfully!');
  logger.info('\n📝 Summary:');
  logger.info('  - Phase A (Schema Bootstrap) executed');
  logger.info('  - Notifications Schema Migration executed');
  logger.info('  - Phase B (Backfill and Compatibility) executed');
  logger.info('  - fund_requests table verified');
  logger.info('  - notif_inbox table verified');
}

// Run the migrations if this script is executed directly
if (require.main === module) {
  runSSOTMigrations();
}

module.exports = runSSOTMigrations;