const db = require('../config/database');
const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');

async function testRealNotifications() {
  try {
    // Get a user to test with
    const usersResult = await db.pool.query('SELECT id, email, role FROM users WHERE role = $1 LIMIT 1', ['partner_user']);
    
    if (usersResult.rows.length === 0) {
      logger.info('No partner users found. Creating a test user...');
      
      const createUserResult = await db.pool.query(`
        INSERT INTO users (first_name, last_name, email, role, password_hash)
        VALUES ('Test', 'Partner', 'test@partner.com', 'partner_user', 'dummy_hash')
        ON CONFLICT (email) DO UPDATE SET role = 'partner_user'
        RETURNING id, email, role
      `);
      
      logger.info('Test user created/updated:', createUserResult.rows[0]);
    }

    // Get the user again
    const userResult = await db.pool.query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['partner_user']);
    const userId = userResult.rows[0].id;
    
    logger.info('Testing with user ID:', userId);

    // Create test notifications using the updated service
    logger.info('Creating test notifications...');
    
    const notification1 = await notificationService.createNotification({
      userId,
      title: 'Welcome to the Platform',
      message: 'Welcome to the Grants Platform! Complete your onboarding to get started.',
      type: 'info',
      category: 'onboarding',
      priority: 'high',
      action_url: '/partner/onboarding',
      action_text: 'Complete Onboarding'
    });
    
    logger.info('Created notification 1:', notification1);

    const notification2 = await notificationService.createNotification({
      userId,
      title: 'Document Upload Required',
      message: 'Please upload the required compliance documents.',
      type: 'warning',
      category: 'compliance',
      priority: 'urgent',
      action_url: '/partner/onboarding/section-c',
      action_text: 'Upload Documents'
    });
    
    logger.info('Created notification 2:', notification2);

    // Test fetching notifications
    const notifications = await notificationService.getUserNotifications(userId);
    logger.info('Fetched notifications:', notifications.length);

    // Test unread count
    const unreadCount = await notificationService.getUnreadCount(userId);
    logger.info('Unread count:', unreadCount);

    logger.info('✅ All notification tests passed!');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error:', error);
    process.exit(1);
  }
}

testRealNotifications();
