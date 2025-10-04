const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const logger = require('utils/logger');

const pool = new Pool({
  user: process.env.DB_USER || 'subgrant_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'subgrant_platform', 
  password: process.env.DB_PASSWORD || 'subgrant_password',
  port: process.env.DB_PORT || 5432,
});

async function runMigration() {
  try {
    logger.info('Connecting to PostgreSQL database...');
    const client = await pool.connect();
    
    logger.info('Testing connection...');
    await client.query('SELECT 1');
    logger.info('✅ Database connected successfully');
    
    logger.info('Running organizations table migration...');
    const sqlPath = path.join(__dirname, 'scripts', 'migrate-organizations.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await client.query(sql);
    logger.info('✅ Organizations migration completed successfully!');
    
    // Also add owner_user_id column if it doesn't exist
    logger.info('Adding owner_user_id column...');
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
    
    logger.info('✅ Owner user ID column added successfully!');
    
    client.release();
    
  } catch (error) {
    logger.error('❌ Migration failed:');
    logger.error('Error:', error.message);
    logger.error('Code:', error.code);
    
    if (error.code === 'ECONNREFUSED') {
      logger.error('PostgreSQL server is not running');
    } else if (error.code === '28P01') {
      logger.error('Authentication failed - check username/password');
    } else if (error.code === '3D000') {
      logger.error('Database does not exist');
    }
  } finally {
    await pool.end();
    logger.info('Database connection closed');
  }
}

runMigration();
