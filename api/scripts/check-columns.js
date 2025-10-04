const db = require('../config/database');
const logger = require('../utils/logger');

async function checkColumns() {
  try {
    const result = await db.pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'notifications' 
      ORDER BY ordinal_position
    `);
    
    logger.info('Notifications table columns:');
    result.rows.forEach(row => {
      logger.info(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // Also check if we have any users
    const usersResult = await db.pool.query('SELECT id, email, role FROM users LIMIT 3');
    logger.info('\nAvailable users:');
    usersResult.rows.forEach(user => {
      logger.info(`- ${user.id}: ${user.email} (${user.role})`);
    });

    process.exit(0);
  } catch (error) {
    logger.error('Error:', error);
    process.exit(1);
  }
}

checkColumns();
