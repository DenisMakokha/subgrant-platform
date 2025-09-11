const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('Environment variables loaded:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'subgrant_platform',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function runMigration() {
  try {
    console.log('🔄 Starting Forum database migration...');
    
    // Test database connection first
    console.log('📡 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create_forum_tables.sql');
    console.log('📄 Reading SQL file:', sqlPath);
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('📝 SQL file loaded, length:', sql.length, 'characters');
    
    // Execute the migration
    console.log('🚀 Executing migration...');
    await pool.query(sql);
    
    console.log('✅ Forum database migration completed successfully!');
    console.log('📊 Created tables:');
    console.log('   - forum_categories (6 categories)');
    console.log('   - forum_tags (16 tags)');
    console.log('   - forum_topics');
    console.log('   - forum_posts');
    console.log('   - forum_attachments');
    console.log('   - forum_votes');
    console.log('   - forum_subscriptions');
    console.log('   - forum_reports');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
