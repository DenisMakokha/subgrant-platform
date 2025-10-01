#!/usr/bin/env node

// Run base tables migration for admin dashboard

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

async function runBaseMigration() {
  console.log('🚀 Running Base Tables Migration for Admin Dashboard...');
  console.log('=' .repeat(60));

  const pool = new Pool(dbConfig);

  try {
    const client = await pool.connect();

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migrations', '00_base_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded:', migrationPath);
    console.log('📏 Script length:', migrationSQL.length, 'characters');

    // Execute the migration
    console.log('\n🔄 Executing migration...');
    await client.query(migrationSQL);
    console.log('✅ Migration executed successfully');

    // Verify tables were created
    console.log('\n🔍 Verifying created tables:');

    const tables = ['users', 'organizations', 'projects', 'approvals', 'audit_log', 'financial_assessments'];
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

    client.release();

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }

  console.log('\n' + '=' .repeat(60));
  console.log('✅ Base Tables Migration completed successfully!');
  console.log('\n📝 Summary:');
  console.log('  - Users table created');
  console.log('  - Organizations table created');
  console.log('  - Projects table created');
  console.log('  - Approvals table created');
  console.log('  - Audit log table created');
  console.log('  - Financial assessments table created');
  console.log('  - Indexes created for performance');
  console.log('  - Triggers created for updated_at columns');
  console.log('  - Sample data inserted for testing');
}

// Run the migration if this script is executed directly
if (require.main === module) {
  runBaseMigration();
}

module.exports = runBaseMigration;
