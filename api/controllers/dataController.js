const FundRequestRepository = require('../repositories/fundRequestRepository');
const NotificationService = require('../services/notificationService');
const registryCache = require('../cache/registryCache');
const { ValidationError, NotFoundError } = require('../errors');
const { sanitizeInput } = require('../middleware/sanitization');
const { logApiCall, logError } = require('../services/observabilityService');

// Import registries
const { DATA_KEYS } = require('../registry/dataKeys');

// Data service for SSOT endpoints
const getDataService = (key) => {
  // For fund requests
  if (key.startsWith('fundRequest.') || key.startsWith('fundRequest/')) {
    return {
      async getData(params, user) {
        // Convert forward slash to dot for consistency
        const normalizedKey = key.replace('/', '.');
        
        switch (normalizedKey) {
          case 'fundRequest.list':
            if (!params.projectId || !params.partnerId) {
              throw new Error('projectId and partnerId are required');
            }
            const fundRequests = await FundRequestRepository.findByProjectAndPartner(
              params.projectId,
              params.partnerId
            );
            return { items: fundRequests };
            
          case 'fundRequest.detail':
            if (!params.fundRequestId) {
              throw new Error('fundRequestId is required');
            }
            const fundRequest = await FundRequestRepository.findById(params.fundRequestId);
            return fundRequest;
            
          default:
            throw new Error(`Unknown data key: ${key}`);
        }
      }
    };
  }
  // For notifications
  if (key.startsWith('notification.')) {
    return {
      async getData(params, user) {
        // Convert forward slash to dot for consistency
        const normalizedKey = key.replace('/', '.');
        
        switch (normalizedKey) {
          case 'notification.list':
            if (!params.userId) {
              // If userId is not provided in params, use the current user's ID
              params.userId = user.id;
            }
            // Get notifications for the user
            const notifications = await NotificationService.getUserNotifications(params.userId);
            return { items: notifications };
            
          case 'notification.detail':
            if (!params.notificationId) {
              throw new Error('notificationId is required');
            }
            // For notification detail, we need to get it from the inbox repository directly
            // since NotificationService doesn't have a method to get a single notification by ID
            const NotificationInboxRepository = require('../repositories/notificationInboxRepository');
            const notification = await NotificationInboxRepository.findById(params.notificationId);
            return notification;
            
          default:
            throw new Error(`Unknown data key: ${key}`);
        }
      }
    };
  }
  
  // For other data keys, we would return appropriate services
  throw new Error(`Data service not implemented for key: ${key}`);
};

exports.getDataByKey = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      const key = req.params[0];
      const params = req.query;
      const user = req.user;
      
      // Normalize key (convert forward slashes to dots)
      const normalizedKey = key.replace(/\//g, '.');
      
      // Create cache key
      const cacheKey = `data:${normalizedKey}:${JSON.stringify(params)}:${user.id}`;
      
      // Try to get from cache first
      const cachedData = registryCache.get(cacheKey);
      if (cachedData) {
        // Log successful API call
        logApiCall('GET', `/ssot/data/${normalizedKey}`, 200, Date.now() - startTime, user.id);
        return res.json(cachedData);
      }
      
      // Validate that the key exists in our registry
      const dataKey = DATA_KEYS.find(k => k.key === normalizedKey);
      if (!dataKey) {
        // Log failed API call
        logApiCall('GET', `/ssot/data/${key}`, 404, Date.now() - startTime, user.id);
        throw new NotFoundError(`Data key not found: ${key}`);
      }
      
      // Validate required parameters
      const missingParams = dataKey.params.filter(param => !params[param]);
      if (missingParams.length > 0) {
        // Log failed API call
        logApiCall('GET', `/ssot/data/${key}`, 400, Date.now() - startTime, user.id);
        throw new ValidationError(`Missing required parameters: ${missingParams.join(', ')}`);
      }
      
      // Get the appropriate service and fetch data
      const service = getDataService(key);
      const data = await service.getData(params, user);
      
      // Cache the result for 5 minutes
      registryCache.set(cacheKey, data, 300000);
      
      // Log successful API call
      logApiCall('GET', `/ssot/data/${key}`, 200, Date.now() - startTime, user.id);
      
      res.json(data);
    } catch (error) {
      // Log error
      logError(error, 'getDataByKey', { userId: req.user.id, key: req.params.key });
      
      // Log failed API call
      logApiCall('GET', `/ssot/data/${req.params.key}`, 500, Date.now() - startTime, req.user.id);
      
      next(error);
    }
  }
];