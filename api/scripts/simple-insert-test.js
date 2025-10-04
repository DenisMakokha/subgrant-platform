const db = require('../config/database');
const logger = require('../utils/logger');

async function testInsert() {
  try {
    // Get a user
    const userResult = await db.pool.query('SELECT id FROM users LIMIT 1');
    if (userResult.rows.length === 0) {
      logger.info('No users found');
      return;
    }
    
    const userId = userResult.rows[0].id;
    logger.info('Using user ID:', userId);
    
    // Try the insert with minimal data
    logger.info('Testing insert...');
    const insertResult = await db.pool.query(`
      INSERT INTO notifications (user_id, channel, template_key)
      VALUES ($1, $2, $3)
      RETURNING id, user_id, channel, template_key, created_at
    `, [userId, 'in_app', 'test']);
    
    logger.info('Insert successful!', insertResult.rows[0]);

    // Clean up
    await db.pool.query('DELETE FROM notifications WHERE id = $1', [insertResult.rows[0].id]);
    logger.info('Test notification cleaned up');

    process.exit(0);
  } catch (error) {
    logger.error('Error:', error.message);
    logger.error('Detail:', error.detail);
    logger.error('Hint:', error.hint);
    process.exit(1);
  }
}

testInsert();
