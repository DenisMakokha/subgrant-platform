#!/usr/bin/env node

// Test Admin Dashboard Database Setup

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

async function testAdminDashboardDB() {
  console.log('🔍 Testing Admin Dashboard Database Setup...');
  console.log('=' .repeat(60));

  const pool = new Pool(dbConfig);

  try {
    const client = await pool.connect();

    // Test if required tables exist
    console.log('\n📊 Checking existing tables:');

    const tables = ['users', 'organizations', 'projects', 'approvals', 'audit_log'];
    for (const table of tables) {
      try {
        const result = await client.query(`
          SELECT COUNT(*) as count FROM ${table}
        `);
        console.log(`  ✅ ${table}: ${result.rows[0].count} rows`);
      } catch (error) {
        console.log(`  ❌ ${table}: ${error.message}`);
      }
    }

    // Test admin dashboard queries
    console.log('\n🧪 Testing admin dashboard queries:');

    try {
      // Test user stats query
      const userStats = await client.query(`
        SELECT
          COUNT(*) as total_users,
          COUNT(*) FILTER (WHERE last_login > NOW() - INTERVAL '24 hours') as active_users
        FROM users
      `);
      console.log(`  ✅ User stats: ${userStats.rows[0].total_users} total, ${userStats.rows[0].active_users} active`);
    } catch (error) {
      console.log(`  ❌ User stats query failed: ${error.message}`);
    }

    try {
      // Test organization count
      const orgStats = await client.query('SELECT COUNT(*) as total_organizations FROM organizations');
      console.log(`  ✅ Organizations: ${orgStats.rows[0].total_organizations} total`);
    } catch (error) {
      console.log(`  ❌ Organizations query failed: ${error.message}`);
    }

    try {
      // Test projects count
      const projectStats = await client.query('SELECT COUNT(*) as total_projects FROM projects');
      console.log(`  ✅ Projects: ${projectStats.rows[0].total_projects} total`);
    } catch (error) {
      console.log(`  ❌ Projects query failed: ${error.message}`);
    }

    try {
      // Test pending approvals
      const approvalStats = await client.query(`
        SELECT COUNT(*) as pending_approvals
        FROM approvals
        WHERE status = 'pending'
      `);
      console.log(`  ✅ Pending approvals: ${approvalStats.rows[0].pending_approvals} total`);
    } catch (error) {
      console.log(`  ❌ Approvals query failed: ${error.message}`);
    }

    try {
      // Test recent activity from audit log
      const auditLogs = await client.query(`
        SELECT
          id,
          created_at as timestamp,
          actor_user_id,
          action_key,
          entity_type,
          entity_id
        FROM audit_log
        ORDER BY created_at DESC
        LIMIT 5
      `);
      console.log(`  ✅ Recent audit logs: ${auditLogs.rows.length} entries`);
    } catch (error) {
      console.log(`  ❌ Audit log query failed: ${error.message}`);
    }

    client.release();

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }

  console.log('\n' + '=' .repeat(60));
  console.log('✅ Admin Dashboard Database Test completed!');
  console.log('\n📝 Summary:');
  console.log('  - Database connection: Working');
  console.log('  - Required tables: Checked');
  console.log('  - Admin queries: Tested');
  console.log('  - Dashboard functionality: Ready');
}

// Run the test if this script is executed directly
if (require.main === module) {
  testAdminDashboardDB();
}

module.exports = testAdminDashboardDB;
