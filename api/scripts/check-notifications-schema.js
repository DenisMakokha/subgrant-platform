const db = require('../config/database');
const logger = require('../utils/logger');

async function checkSchema() {
  try {
    // Check notifications table columns
    const result = await db.pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'notifications' 
      ORDER BY ordinal_position
    `);
    
    logger.info('Notifications table columns:');
    result.rows.forEach(row => {
      logger.info(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
    });

    // Check if table exists
    const tableExists = await db.pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'notifications'
      )
    `);
    
    logger.info('Table exists:', tableExists.rows[0].exists);

    process.exit(0);
  } catch (error) {
    logger.error('Error:', error);
    process.exit(1);
  }
}

checkSchema();
