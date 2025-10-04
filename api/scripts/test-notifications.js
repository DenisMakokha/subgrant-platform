const db = require('../config/database');
const notificationService = require('../services/notificationService');
const logger = require('../utils/logger');

async function testNotifications() {
  try {
    // Get all users with partner_user role
    const result = await db.pool.query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['partner_user']);
    
    if (result.rows.length === 0) {
      logger.info('No partner users found');
      return;
    }

    const userId = result.rows[0].id;
    logger.info('Creating test notifications for user:', userId);

    // Create some test notifications
    await notificationService.createNotification({
      userId,
      title: 'Welcome to the Platform',
      message: 'Welcome to the Grants Platform! Complete your onboarding to get started.',
      type: 'info',
      category: 'onboarding',
      priority: 'high',
      action_url: '/partner/onboarding',
      action_text: 'Complete Onboarding'
    });

    await notificationService.createNotification({
      userId,
      title: 'Document Upload Required',
      message: 'Please upload the required compliance documents to complete your application.',
      type: 'warning',
      category: 'compliance',
      priority: 'urgent',
      action_url: '/partner/onboarding/section-c',
      action_text: 'Upload Documents'
    });

    await notificationService.createNotification({
      userId,
      title: 'Payment Processed',
      message: 'Your grant payment has been processed successfully.',
      type: 'success',
      category: 'financial',
      priority: 'medium',
      action_url: '/partner/projects/budget',
      action_text: 'View Budget'
    });

    logger.info('Test notifications created successfully');

    // Test fetching notifications
    const notifications = await notificationService.getUserNotifications(userId);
    logger.info('Fetched notifications:', notifications.length);

    // Test unread count
    const unreadCount = await notificationService.getUnreadCount(userId);
    logger.info('Unread count:', unreadCount);

    process.exit(0);
  } catch (error) {
    logger.error('Error:', error);
    process.exit(1);
  }
}

testNotifications();
