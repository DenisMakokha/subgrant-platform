#!/usr/bin/env node

// Test database connection for Sub-Grant Management Platform

const { Pool } = require('pg');
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

async function testConnection() {
  console.log('Testing database connection...');
  console.log('Database configuration:');
  console.log(`  Host: ${dbConfig.host}`);
  console.log(`  Port: ${dbConfig.port}`);
  console.log(`  Database: ${dbConfig.database}`);
  console.log(`  User: ${dbConfig.user}`);
  console.log('---------------------------');

  const pool = new Pool(dbConfig);

  try {
    // Test connection
    const client = await pool.connect();
    console.log('✓ Database connection successful');
    
    // Test basic query
    const result = await client.query('SELECT version()');
    console.log('✓ Basic query executed successfully');
    console.log(`  PostgreSQL version: ${result.rows[0].version}`);
    
    // Test UUID extension
    const uuidResult = await client.query('SELECT gen_random_uuid()');
    console.log('✓ UUID extension is working');
    console.log(`  Sample UUID: ${uuidResult.rows[0].gen_random_uuid}`);
    
    // Test table existence
    const tableResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    console.log(`✓ Found ${tableResult.rows.length} tables in the database`);
    if (tableResult.rows.length > 0) {
      console.log('  Tables:');
      tableResult.rows.forEach(row => {
        console.log(`    - ${row.table_name}`);
      });
    }
    
    client.release();
  } catch (err) {
    console.error('✗ Database connection failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
  
  console.log('---------------------------');
  console.log('Database connection test completed successfully!');
}

// Run the test if this script is executed directly
if (require.main === module) {
  testConnection();
}

module.exports = testConnection;