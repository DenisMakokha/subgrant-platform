const FundRequestRepository = require('../repositories/fundRequestRepository');
const NotificationService = require('../services/notificationService');
const { v4: uuidv4 } = require('uuid');
const { ValidationError, NotFoundError } = require('../errors');
const { sanitizeInput } = require('../middleware/sanitization');
const { logApiCall, logError } = require('../services/observabilityService');

// Import registries
const { ACTIONS } = require('../registry/actions');

// Action service for SSOT endpoints
const getActionService = (key) => {
  // For fund request actions
  if (key.startsWith('fundRequest.')) {
    return {
      async executeAction(payload, user) {
        switch (key) {
          case 'fundRequest.create':
            const { projectId, partnerId, amount, currency, purpose, period_start, period_end } = payload;
            
            // Validate required fields
            if (!projectId || !partnerId || !amount || !purpose) {
              throw new Error('projectId, partnerId, amount, and purpose are required');
            }
            
            // Validate amount is a positive number
            const amountNum = Number(amount);
            if (isNaN(amountNum) || amountNum <= 0) {
              throw new Error('amount must be a positive number');
            }
            
            const fundRequestData = {
              id: uuidv4(),
              projectId,
              partnerId,
              amount: amountNum,
              currency: currency || 'USD',
              purpose,
              periodFrom: period_start || null,
              periodTo: period_end || null,
              createdBy: user.id
            };
            
            const fundRequest = await FundRequestRepository.create(fundRequestData);
            return fundRequest;
            
          default:
            throw new Error(`Unknown action key: ${key}`);
        }
      }
    };
  }
  // For notifications
  if (key.startsWith('notification.')) {
    return {
      async executeAction(payload, user) {
        switch (key) {
          case 'notification.markAsRead':
            const { notificationId } = payload;
            
            // Validate required fields
            if (!notificationId) {
              throw new Error('notificationId is required');
            }
            
            // Mark notification as read using the notification service
            const markedNotification = await NotificationService.markAsRead(notificationId);
            return markedNotification;
            
          case 'notification.markAllAsRead':
            // Mark all notifications as read for the current user
            const markedNotifications = await NotificationService.markAllAsRead(user.id);
            return { message: `Marked ${markedNotifications.length} notifications as read` };
            
          default:
            throw new Error(`Unknown action key: ${key}`);
        }
      }
    };
  }
  
  // For other action keys, we would return appropriate services
  throw new Error(`Action service not implemented for key: ${key}`);
};

exports.executeAction = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      const { actionKey, payload } = req.body;
      const user = req.user;
      
      // Validate that the action key exists in our registry
      const action = ACTIONS.find(a => a.key === actionKey);
      if (!action) {
        // Log failed API call
        logApiCall('POST', '/ssot/action', 404, Date.now() - startTime, user.id);
        throw new NotFoundError(`Action key not found: ${actionKey}`);
      }
      
      // Get the appropriate service and execute action
      const service = getActionService(actionKey);
      const result = await service.executeAction(payload, user);
      
      // Log successful API call
      logApiCall('POST', '/ssot/action', 201, Date.now() - startTime, user.id);
      
      res.status(201).json({ ok: true, data: result });
    } catch (error) {
      // Log error
      logError(error, 'executeAction', { userId: req.user.id, actionKey: req.body.actionKey });
      
      // Log failed API call
      logApiCall('POST', '/ssot/action', 500, Date.now() - startTime, req.user.id);
      
      next(error);
    }
  }
];