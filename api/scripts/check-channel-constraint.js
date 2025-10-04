const db = require('../config/database');
const logger = require('../utils/logger');

async function checkChannelConstraint() {
  try {
    // Check the constraint definition
    const constraintResult = await db.pool.query(`
      SELECT pg_get_constraintdef(oid) as definition 
      FROM pg_constraint 
      WHERE conname = 'notifications_channel_check1'
    `);
    
    if (constraintResult.rows.length > 0) {
      logger.info('Channel constraint definition:', constraintResult.rows[0].definition);
    } else {
      logger.info('Constraint not found');
    }

    // Let's also check if there are existing notifications to see what channel values are used
    const existingResult = await db.pool.query('SELECT DISTINCT channel FROM notifications LIMIT 10');
    logger.info('Existing channel values:', existingResult.rows.map(r => r.channel));

    // Try different channel values
    const testChannels = ['email', 'sms', 'push', 'web', 'app', 'notification'];
    
    const userId = '4836100e-1508-4f56-903b-392be9420202'; // From previous test
    
    for (const channel of testChannels) {
      try {
        const testResult = await db.pool.query(`
          INSERT INTO notifications (user_id, channel, template_key)
          VALUES ($1, $2, $3)
          RETURNING id
        `, [userId, channel, 'test']);
        
        logger.info(`✅ Channel '${channel}' works`);
        
        // Clean up
        await db.pool.query('DELETE FROM notifications WHERE id = $1', [testResult.rows[0].id]);
        
      } catch (error) {
        logger.info(`❌ Channel '${channel}' failed: ${error.message}`);
      }
    }

    process.exit(0);
  } catch (error) {
    logger.error('Error:', error);
    process.exit(1);
  }
}

checkChannelConstraint();
