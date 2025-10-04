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

async function addIsActiveColumn() {
  const client = await pool.connect();
  
  try {
    logger.info('🔧 Adding is_active column to users table...\n');

    // Check if column exists
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'is_active'
    `);

    if (checkResult.rows.length > 0) {
      logger.info('✅ is_active column already exists in users table');
    } else {
      // Add the column
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN is_active BOOLEAN DEFAULT true NOT NULL
      `);
      logger.info('✅ Added is_active column to users table');

      // Create index
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active)
      `);
      logger.info('✅ Created index on is_active column');

      // Add comment
      await client.query(`
        COMMENT ON COLUMN users.is_active IS 'Indicates whether the user account is active and can log in'
      `);
      logger.info('✅ Added column comment');
    }

    // Verify the column
    const verifyResult = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        column_default, 
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users' 
      AND column_name = 'is_active'
    `);

    logger.info('\n📋 Column details:');
    logger.info(verifyResult.rows[0]);

    // Count active vs inactive users
    const countResult = await client.query(`
      SELECT 
        is_active,
        COUNT(*) as count
      FROM users
      GROUP BY is_active
    `);

    logger.info('\n📊 User status counts:');
    countResult.rows.forEach(row => {
      logger.info(`  ${row.is_active ? 'Active' : 'Inactive'}: ${row.count}`);
    });

    logger.info('\n✅ Migration completed successfully!');

  } catch (error) {
    logger.error('❌ Error adding is_active column:', error.message);
    logger.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

addIsActiveColumn();
