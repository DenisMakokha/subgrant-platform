const FundRequestRepository = require('../repositories/fundRequestRepository');
const NotificationService = require('../services/notificationService');
const ReconciliationService = require('../services/reconciliationService');
const PartnerBudgetLineRepository = require('../repositories/partnerBudgetLineRepository');
const PartnerBudgetRepository = require('../repositories/partnerBudgetRepository');
const ContractRepository = require('../repositories/contractRepository');
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
  
  // For reconciliation data
  if (key.startsWith('recon.')) {
    return {
      async getData(params, user) {
        const normalizedKey = key.replace('/', '.');
        
        switch (normalizedKey) {
          case 'recon.summary':
            if (!params.partnerBudgetId) {
              throw new Error('partnerBudgetId is required');
            }
            const summary = await ReconciliationService.getReconciliationSummary(params.partnerBudgetId);
            return summary;
            
          case 'recon.evidence':
            if (!params.partnerBudgetLineId) {
              throw new Error('partnerBudgetLineId is required');
            }
            const evidence = await ReconciliationService.getEvidenceByBudgetLine(params.partnerBudgetLineId);
            return { items: evidence };
            
          case 'budget.lines.approved':
            if (!params.partnerBudgetId) {
              throw new Error('partnerBudgetId is required');
            }
            const lines = await PartnerBudgetLineRepository.findByBudget(params.partnerBudgetId);
            const approvedLines = lines.map(line => ({
              id: line.id,
              category: line.description, // Using description as category for now
              description: line.description,
              total: line.total,
              spentCumulative: 0, // Will be calculated by reconciliation service
              remaining: line.total,
              evidenceCount: 0
            }));
            return { items: approvedLines };
            
          default:
            throw new Error(`Unknown data key: ${key}`);
        }
      }
    };
  }
  
  // For budget data
  if (key.startsWith('budget.')) {
    return {
      async getData(params, user) {
        const normalizedKey = key.replace('/', '.');
        
        switch (normalizedKey) {
          case 'budget.pb.summary':
            if (!params.partnerId || !params.projectId) {
              throw new Error('partnerId and projectId are required');
            }
            // Get partner budget summary
            const budgets = await PartnerBudgetRepository.findByPartnerAndProject(
              params.partnerId,
              params.projectId
            );
            const totalApproved = budgets.reduce((sum, budget) => sum + (budget.ceilingTotal || 0), 0);
            const totalSpent = 0; // Would need reconciliation data
            return {
              partnerId: params.partnerId,
              projectId: params.projectId,
              totalApproved,
              totalSpent,
              totalRemaining: totalApproved - totalSpent,
              budgetCount: budgets.length
            };
            
          case 'budget.lines':
            if (!params.partnerBudgetId) {
              throw new Error('partnerBudgetId is required');
            }
            const lines = await PartnerBudgetLineRepository.findByBudget(params.partnerBudgetId);
            return { items: lines };
            
          default:
            throw new Error(`Unknown data key: ${key}`);
        }
      }
    };
  }
  
  // For contract data
  if (key.startsWith('contract.')) {
    return {
      async getData(params, user) {
        const normalizedKey = key.replace('/', '.');
        
        switch (normalizedKey) {
          case 'contract.list':
            if (!params.partnerId || !params.projectId) {
              throw new Error('partnerId and projectId are required');
            }
            const contracts = await ContractRepository.findByPartnerAndProject(
              params.partnerId,
              params.projectId
            );
            return { items: contracts };
            
          case 'contract.files':
            if (!params.contractId) {
              throw new Error('contractId is required');
            }
            // Return placeholder for contract files
            return { items: [], message: 'Contract files endpoint needs implementation' };
            
          default:
            throw new Error(`Unknown data key: ${key}`);
        }
      }
    };
  }
  
  // For report data
  if (key.startsWith('report.')) {
    return {
      async getData(params, user) {
        const normalizedKey = key.replace('/', '.');
        
        switch (normalizedKey) {
          case 'report.schedule':
            if (!params.projectId || !params.partnerId) {
              throw new Error('projectId and partnerId are required');
            }
            // Return placeholder for report schedule
            return { items: [], message: 'Report schedule endpoint needs implementation' };
            
          case 'report.history':
            if (!params.projectId || !params.partnerId) {
              throw new Error('projectId and partnerId are required');
            }
            // Return placeholder for report history
            return { items: [], message: 'Report history endpoint needs implementation' };
            
          default:
            throw new Error(`Unknown data key: ${key}`);
        }
      }
    };
  }
  
  // For approval data
  if (key.startsWith('approval.')) {
    return {
      async getData(params, user) {
        const normalizedKey = key.replace('/', '.');
        
        switch (normalizedKey) {
          case 'approval.queue':
            if (!params.role || !params.scope) {
              throw new Error('role and scope are required');
            }
            // Return placeholder for approval queue
            return { items: [], message: 'Approval queue endpoint needs implementation' };
            
          default:
            throw new Error(`Unknown data key: ${key}`);
        }
      }
    };
  }
  
  // For admin data
  if (key.startsWith('admin.')) {
    return {
      async getData(params, user) {
        const normalizedKey = key.replace('/', '.');
        
        switch (normalizedKey) {
          case 'admin.kpis':
            // Return placeholder for admin KPIs
            return {
              totalPartners: 0,
              totalProjects: 0,
              totalBudgets: 0,
              totalContracts: 0,
              totalDisbursements: 0,
              message: 'Admin KPIs endpoint needs implementation'
            };
            
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

// Export the getDataService function for testing
exports.getDataService = getDataService;