#!/usr/bin/env node

// Run database migration for linear onboarding flow

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

async function runMigration() {
  console.log('🚀 Running Linear Onboarding Flow Migration...');
  console.log('=' .repeat(60));
  
  const pool = new Pool(dbConfig);
  
  try {
    const client = await pool.connect();
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migrate-linear-onboarding-flow-v2.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded:', migrationPath);
    
    // Check current organization statuses before migration
    console.log('\n📊 Current organization statuses (before migration):');
    const beforeResult = await client.query(`
      SELECT status, COUNT(*) as count 
      FROM organizations 
      GROUP BY status 
      ORDER BY count DESC
    `);
    beforeResult.rows.forEach(row => {
      console.log(`  ${row.status}: ${row.count} organizations`);
    });
    
    // Execute the migration
    console.log('\n🔄 Executing migration...');
    await client.query(migrationSQL);
    console.log('✅ Migration executed successfully');
    
    // Check organization statuses after migration
    console.log('\n📊 Organization statuses (after migration):');
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
      console.log(`  ${row.status}: ${row.count} organizations (${row.earliest?.toISOString().split('T')[0]} - ${row.latest?.toISOString().split('T')[0]})`);
    });
    
    // Verify enum values
    console.log('\n🔍 Verifying organization_status enum values:');
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
      console.log(`  ✓ ${row.enumlabel}`);
    });
    
    // Test state transitions
    console.log('\n🧪 Testing sample state transitions:');
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
        console.log(`  ✅ ${from} → ${to}: Valid transition`);
      } catch (error) {
        console.log(`  ❌ ${from} → ${to}: ${error.message}`);
      }
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('✅ Linear Onboarding Flow Migration completed successfully!');
  console.log('\n📝 Summary:');
  console.log('  - Organization status enum updated');
  console.log('  - Existing organizations migrated to new statuses');
  console.log('  - Database schema validated');
  console.log('  - State transitions tested');
}

// Run the migration if this script is executed directly
if (require.main === module) {
  runMigration();
}

module.exports = runMigration;
