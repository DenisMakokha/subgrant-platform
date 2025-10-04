const db = require('../config/database');
const logger = require('../utils/logger');

async function checkConstraints() {
  try {
    // Check table constraints
    const constraintsResult = await db.pool.query(`
      SELECT constraint_name, constraint_type, column_name
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.constraint_column_usage ccu 
        ON tc.constraint_name = ccu.constraint_name
      WHERE tc.table_name = 'notifications'
    `);
    
    logger.info('Notifications table constraints:');
    constraintsResult.rows.forEach(row => {
      logger.info(`- ${row.constraint_name}: ${row.constraint_type} (${row.column_name})`);
    });

    // Check column details
    const columnsResult = await db.pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'notifications' 
      ORDER BY ordinal_position
    `);
    
    logger.info('\nColumn details:');
    columnsResult.rows.forEach(row => {
      logger.info(`- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
    });

    // Try a simple insert to see what fails
    logger.info('\nTesting simple insert...');
    
    // First get a user
    const userResult = await db.pool.query('SELECT id FROM users LIMIT 1');
    if (userResult.rows.length === 0) {
      logger.info('No users found');
      return;
    }
    
    const userId = userResult.rows[0].id;
    logger.info('Using user ID:', userId);
    
    // Try the insert
    const insertResult = await db.pool.query(`
      INSERT INTO notifications (user_id, channel, template_key, payload_json)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, [userId, 'in_app', 'test', JSON.stringify({title: 'Test'})]);
    
    logger.info('Insert successful! ID:', insertResult.rows[0].id);

    process.exit(0);
  } catch (error) {
    logger.error('Error:', error);
    process.exit(1);
  }
}

checkConstraints();
