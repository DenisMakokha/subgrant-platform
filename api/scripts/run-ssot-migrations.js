#!/usr/bin/env node

// Run SSOT database migrations
// This script runs the 2025Q1 SSOT cutover migrations (Phase A and Phase B)
// which include the fund_requests table and other schema changes

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

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
  console.log('🚀 Running SSOT Database Migrations...');
  console.log('=' .repeat(60));
  
  const pool = new Pool(dbConfig);
  
  try {
    const client = await pool.connect();
    
    // Run Phase A migration (schema bootstrap)
    console.log('\n📦 Running Phase A: Schema Bootstrap...');
    const phaseAPath = path.join(__dirname, 'migrations/2025Q1_ssot_cutover/phaseA.sql');
    if (fs.existsSync(phaseAPath)) {
      const phaseASQL = fs.readFileSync(phaseAPath, 'utf8');
      console.log('📄 Phase A migration file loaded:', phaseAPath);
      
      // Execute Phase A migration
      console.log('🔄 Executing Phase A migration...');
      await client.query(phaseASQL);
      console.log('✅ Phase A migration executed successfully');
    } else {
      console.log('⚠️  Phase A migration file not found, skipping...');
    }
    
    // Run notifications migration
    console.log('\n📦 Running Notifications Schema Migration...');
    const notificationsPath = path.join(__dirname, 'migrations/2025Q1_ssot_cutover/notifications.sql');
    if (fs.existsSync(notificationsPath)) {
      const notificationsSQL = fs.readFileSync(notificationsPath, 'utf8');
      console.log('📄 Notifications migration file loaded:', notificationsPath);
      
      // Execute notifications migration
      console.log('🔄 Executing Notifications migration...');
      await client.query(notificationsSQL);
      console.log('✅ Notifications migration executed successfully');
    } else {
      console.log('⚠️  Notifications migration file not found, skipping...');
    }
    
    // Run Phase B migration (backfill and compatibility)
    console.log('\n📦 Running Phase B: Backfill and Compatibility...');
    const phaseBPath = path.join(__dirname, 'migrations/2025Q1_ssot_cutover/phaseB.sql');
    if (fs.existsSync(phaseBPath)) {
      const phaseBSQL = fs.readFileSync(phaseBPath, 'utf8');
      console.log('📄 Phase B migration file loaded:', phaseBPath);
      
      // Execute Phase B migration
      console.log('🔄 Executing Phase B migration...');
      await client.query(phaseBSQL);
      console.log('✅ Phase B migration executed successfully');
    } else {
      console.log('⚠️  Phase B migration file not found, skipping...');
    }
    
    // Verify fund_requests table exists
    console.log('\n🔍 Verifying fund_requests table...');
    try {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT 1 
          FROM information_schema.tables 
          WHERE table_name = 'fund_requests'
        ) as exists
      `);
      
      if (result.rows[0].exists) {
        console.log('✅ fund_requests table exists');
        
        // Show table structure
        console.log('\n📋 fund_requests table structure:');
        const structureResult = await client.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_name = 'fund_requests'
          ORDER BY ordinal_position
        `);
        structureResult.rows.forEach(row => {
          console.log(`  ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
        });
      } else {
        console.log('❌ fund_requests table does not exist');
      }
    } catch (error) {
      console.log('❌ Error verifying fund_requests table:', error.message);
    }
    
    // Verify notif_inbox table exists
    console.log('\n🔍 Verifying notif_inbox table...');
    try {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT 1 
          FROM information_schema.tables 
          WHERE table_name = 'notif_inbox'
        ) as exists
      `);
      
      if (result.rows[0].exists) {
        console.log('✅ notif_inbox table exists');
      } else {
        console.log('❌ notif_inbox table does not exist');
      }
    } catch (error) {
      console.log('❌ Error verifying notif_inbox table:', error.message);
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ SSOT migrations failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('✅ SSOT Database Migrations completed successfully!');
  console.log('\n📝 Summary:');
  console.log('  - Phase A (Schema Bootstrap) executed');
  console.log('  - Notifications Schema Migration executed');
  console.log('  - Phase B (Backfill and Compatibility) executed');
  console.log('  - fund_requests table verified');
  console.log('  - notif_inbox table verified');
}

// Run the migrations if this script is executed directly
if (require.main === module) {
  runSSOTMigrations();
}

module.exports = runSSOTMigrations;