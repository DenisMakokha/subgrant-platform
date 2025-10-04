const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
require('dotenv').config();

logger.info('Environment variables loaded:');
logger.info('DB_HOST:', process.env.DB_HOST);
logger.info('DB_PORT:', process.env.DB_PORT);
logger.info('DB_NAME:', process.env.DB_NAME);
logger.info('DB_USER:', process.env.DB_USER);

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'subgrant_platform',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function runMigration() {
  try {
    logger.info('🔄 Starting Forum database migration...');
    
    // Test database connection first
    logger.info('📡 Testing database connection...');
    await pool.query('SELECT NOW()');
    logger.info('✅ Database connection successful');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create_forum_tables.sql');
    logger.info('📄 Reading SQL file:', sqlPath);
    const sql = fs.readFileSync(sqlPath, 'utf8');
    logger.info('📝 SQL file loaded, length:', sql.length, 'characters');
    
    // Execute the migration
    logger.info('🚀 Executing migration...');
    await pool.query(sql);
    
    logger.info('✅ Forum database migration completed successfully!');
    logger.info('📊 Created tables:');
    logger.info('   - forum_categories (6 categories)');
    logger.info('   - forum_tags (16 tags)');
    logger.info('   - forum_topics');
    logger.info('   - forum_posts');
    logger.info('   - forum_attachments');
    logger.info('   - forum_votes');
    logger.info('   - forum_subscriptions');
    logger.info('   - forum_reports');
    
  } catch (error) {
    logger.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
