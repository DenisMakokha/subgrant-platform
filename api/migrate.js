const { Pool } = require('pg');
const fs = require('fs');
const logger = require('utils/logger');

const pool = new Pool({
  user: 'subgrant_user',
  host: 'localhost',
  database: 'subgrant_platform', 
  password: 'subgrant_password',
  port: 5432,
});

(async () => {
  try {
    logger.info('Connecting to database...');
    const client = await pool.connect();
    
    logger.info('Testing connection...');
    await client.query('SELECT 1');
    logger.info('Database connected successfully');
    
    logger.info('Reading SQL file...');
    const sqlPath = 'scripts/create_forum_tables.sql';
    logger.info('SQL path:', sqlPath);
    const sql = fs.readFileSync(sqlPath, 'utf8');
    logger.info(`SQL file loaded (${sql.length} characters)`);
    
    logger.info('Executing migration...');
    await client.query(sql);
    
    logger.info('✅ Forum migration completed successfully!');
    logger.info('Created:');
    logger.info('- 6 Forum categories');
    logger.info('- 16 Forum tags');
    logger.info('- All Forum database tables');
    
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
})();
