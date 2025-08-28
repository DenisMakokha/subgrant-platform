const emailService = require('./emailService');

// In-memory storage for notifications (in a real application, this would be a database)
let notifications = [];

// Function to create a notification
const createNotification = async (notificationData) => {
  const notification = {
    id: generateId(),
    type: notificationData.type || 'info',
    title: notificationData.title,
    message: notificationData.message,
    priority: notificationData.priority || 'normal',
    audienceType: notificationData.audienceType || 'user',
    audienceId: notificationData.audienceId,
    relatedEntityType: notificationData.relatedEntityType,
    relatedEntityId: notificationData.relatedEntityId,
    scheduledAt: notificationData.scheduledAt || new Date(),
    sentAt: null,
    createdAt: new Date(),
    createdBy: notificationData.createdBy,
  };

  // Add to notifications array
  notifications.push(notification);

  // Send email notification if email is provided
  if (notificationData.email) {
    await emailService.sendNotificationEmail(notificationData.email, notification);
  }

  // In a real application, you would send the notification immediately or schedule it
  console.log('Notification created:', notification);

  return notification;
};

// Function to get notifications for a user
const getUserNotifications = async (userId) => {
  // Filter notifications for the user
  const userNotifications = notifications.filter(
    (notification) =>
      (notification.audienceType === 'user' && notification.audienceId === userId) ||
      (notification.audienceType === 'role' && notification.audienceId === getUserRole(userId)) ||
      notification.audienceType === 'all'
  );

  // Sort by created date (newest first)
  userNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return userNotifications;
};

// Function to mark a notification as read
const markNotificationAsRead = async (notificationId, userId) => {
  const notification = notifications.find(
    (n) => n.id === notificationId && 
           ((n.audienceType === 'user' && n.audienceId === userId) ||
            (n.audienceType === 'role' && n.audienceId === getUserRole(userId)) ||
            n.audienceType === 'all')
  );

  if (notification) {
    // In a real application, you would update the database
    console.log(`Notification ${notificationId} marked as read for user ${userId}`);
    return true;
  }

  return false;
};

// Function to send email notification
const sendEmailNotification = async (email, subject, message) => {
  return await emailService.sendEmail(email, subject, message);
};

// Function to send SMS notification
const sendSMSNotification = async (phoneNumber, message) => {
  // In a real application, you would use an SMS service
  // For now, we'll just log it
  console.log(`SMS sent to ${phoneNumber}: ${message}`);
  return true;
};

// Helper function to generate a random ID
const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Helper function to get user role (in a real application, this would come from the database)
const getUserRole = (userId) => {
  // This is a placeholder implementation
  return 'partner_user';
};

// Export the functions
module.exports = {
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
  sendEmailNotification,
  sendSMSNotification,
};