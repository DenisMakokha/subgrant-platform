const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  user: process.env.DB_USER || 'subgrant_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'subgrant_platform', 
  password: process.env.DB_PASSWORD || 'subgrant_password',
  port: process.env.DB_PORT || 5432,
});

async function runMigration() {
  try {
    console.log('Connecting to PostgreSQL database...');
    const client = await pool.connect();
    
    console.log('Testing connection...');
    await client.query('SELECT 1');
    console.log('✅ Database connected successfully');
    
    console.log('Running organizations table migration...');
    const sqlPath = path.join(__dirname, 'scripts', 'migrate-organizations.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await client.query(sql);
    console.log('✅ Organizations migration completed successfully!');
    
    // Also add owner_user_id column if it doesn't exist
    console.log('Adding owner_user_id column...');
    await client.query(`
      ALTER TABLE organizations 
      ADD COLUMN IF NOT EXISTS owner_user_id UUID;
    `);
    
    // Add foreign key constraint
    await client.query(`
      ALTER TABLE organizations 
      ADD CONSTRAINT IF NOT EXISTS fk_organizations_owner 
      FOREIGN KEY (owner_user_id) REFERENCES users(id);
    `);
    
    console.log('✅ Owner user ID column added successfully!');
    
    client.release();
    
  } catch (error) {
    console.error('❌ Migration failed:');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('PostgreSQL server is not running');
    } else if (error.code === '28P01') {
      console.error('Authentication failed - check username/password');
    } else if (error.code === '3D000') {
      console.error('Database does not exist');
    }
  } finally {
    await pool.end();
    console.log('Database connection closed');
  }
}

runMigration();
