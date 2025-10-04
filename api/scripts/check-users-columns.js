const path = require('path');
const logger = require('../utils/logger');

// Load pg and dotenv from api's node_modules
const { Pool } = require(path.join(__dirname, '../node_modules/pg'));
const dotenv = require(path.join(__dirname, '../node_modules/dotenv'));

// Load environment variables from api/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'subgrant_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function checkUsersColumns() {
  const client = await pool.connect();
  
  try {
    logger.info('🔍 Checking users table columns...\n');

    // Get all columns from users table
    const result = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);

    logger.info('📋 Users table columns:');
    logger.info('─'.repeat(80));
    result.rows.forEach(col => {
      logger.info(`${col.column_name.padEnd(25)} | ${col.data_type.padEnd(20)} | ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    logger.info('─'.repeat(80));
    logger.info(`\nTotal columns: ${result.rows.length}`);

  } catch (error) {
    logger.error('❌ Error checking columns:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkUsersColumns();
