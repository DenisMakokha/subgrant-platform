const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');
const { requireRole, requirePermission } = require('../middleware/rbac');

// Get notifications for the current user
router.get('/', requireRole(['system_administrator', 'accountant', 'budget_holder', 'finance_manager', 'partner_user', 'auditor']), async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await notificationService.getUserNotifications(userId);
    res.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark a notification as read
router.put('/:id/read', requireRole(['system_administrator', 'accountant', 'budget_holder', 'finance_manager', 'partner_user', 'auditor']), async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;
    
    const success = await notificationService.markNotificationAsRead(notificationId, userId);
    
    if (success) {
      res.json({ message: 'Notification marked as read' });
    } else {
      res.status(404).json({ error: 'Notification not found' });
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Create a new notification (admin only)
router.post('/', requireRole(['system_administrator']), async (req, res) => {
  try {
    const { type, title, message, priority, audienceType, audienceId, relatedEntityType, relatedEntityId, scheduledAt } = req.body;
    
    // Validate required fields
    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }
    
    const notificationData = {
      type,
      title,
      message,
      priority,
      audienceType,
      audienceId,
      relatedEntityType,
      relatedEntityId,
      scheduledAt,
      createdBy: req.user.id,
    };
    
    const notification = await notificationService.createNotification(notificationData);
    res.status(201).json({ notification });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

module.exports = router;