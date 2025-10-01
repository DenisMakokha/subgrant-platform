const FundRequestRepository = require('../repositories/fundRequestRepository');
const NotificationService = require('../services/notificationService');
const ReconciliationService = require('../services/reconciliationService');
const PartnerBudgetLineRepository = require('../repositories/partnerBudgetLineRepository');
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
            
          case 'fundRequest.submit':
            const { fundRequestId } = payload;
            
            if (!fundRequestId) {
              throw new Error('fundRequestId is required');
            }
            
            const submittedRequest = await FundRequestRepository.updateStatus(fundRequestId, 'SUBMITTED');
            return submittedRequest;
            
          case 'fundRequest.approve':
            const { fundRequestId: approveRequestId } = payload;
            
            if (!approveRequestId) {
              throw new Error('fundRequestId is required');
            }
            
            const approvedRequest = await FundRequestRepository.updateStatus(approveRequestId, 'APPROVED');
            return approvedRequest;
            
          case 'fundRequest.reject':
            const { fundRequestId: rejectRequestId } = payload;
            
            if (!rejectRequestId) {
              throw new Error('fundRequestId is required');
            }
            
            const rejectedRequest = await FundRequestRepository.updateStatus(rejectRequestId, 'REJECTED');
            return rejectedRequest;
            
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
  
  // For reconciliation actions
  if (key.startsWith('recon.')) {
    return {
      async executeAction(payload, user) {
        switch (key) {
          case 'recon.upload':
            const { partnerBudgetLineId, amount, spentAt, documentBuffer, documentName, note } = payload;
            
            // Validate required fields
            if (!partnerBudgetLineId || !amount || !spentAt) {
              throw new Error('partnerBudgetLineId, amount, and spentAt are required');
            }
            
            // Validate amount is a positive number
            const amountNum = Number(amount);
            if (isNaN(amountNum) || amountNum <= 0) {
              throw new Error('amount must be a positive number');
            }
            
            const evidence = await ReconciliationService.uploadEvidence({
              partnerBudgetLineId,
              amount: amountNum,
              spentAt,
              documentBuffer: documentBuffer || null,
              documentName: documentName || 'evidence',
              note,
              actorId: user.id
            });
            
            return evidence;
            
          case 'recon.delete':
            const { evidenceId } = payload;
            
            if (!evidenceId) {
              throw new Error('evidenceId is required');
            }
            
            const deletedEvidence = await ReconciliationService.deleteEvidence(evidenceId, user.id);
            return deletedEvidence;
            
          default:
            throw new Error(`Unknown action key: ${key}`);
        }
      }
    };
  }
  
  // For budget line actions
  if (key.startsWith('line.')) {
    return {
      async executeAction(payload, user) {
        switch (key) {
          case 'line.create':
            const { partnerBudgetId, templateId, description, unit, qty, unitCost, currency } = payload;
            
            // Validate required fields
            if (!partnerBudgetId || !templateId || !description || !qty || !unitCost) {
              throw new Error('partnerBudgetId, templateId, description, qty, and unitCost are required');
            }
            
            const lineData = {
              id: uuidv4(),
              partnerBudgetId,
              templateId,
              description,
              unit: unit || 'unit',
              qty: Number(qty),
              unitCost: Number(unitCost),
              currency: currency || 'USD',
              createdBy: user.id
            };
            
            const line = await PartnerBudgetLineRepository.create(lineData);
            return line;
            
          case 'line.update':
            const { lineId, updates } = payload;
            
            if (!lineId) {
              throw new Error('lineId is required');
            }
            
            // For now, we'll just return a placeholder since update method needs to be implemented
            return { message: 'Line update endpoint needs implementation', lineId, updates };
            
          case 'line.submit':
            const { lineIds } = payload;
            
            if (!Array.isArray(lineIds) || lineIds.length === 0) {
              throw new Error('lineIds array is required');
            }
            
            const submittedLines = await PartnerBudgetLineRepository.updateStatus(lineIds, 'SUBMITTED');
            return submittedLines;
            
          default:
            throw new Error(`Unknown action key: ${key}`);
        }
      }
    };
  }
  
  // For contract actions
  if (key.startsWith('contract.')) {
    return {
      async executeAction(payload, user) {
        switch (key) {
          case 'contract.view':
            // Return placeholder for contract view
            return { message: 'Contract view action needs implementation' };
            
          case 'contract.sign':
            // Return placeholder for contract sign
            return { message: 'Contract sign action needs implementation' };
            
          default:
            throw new Error(`Unknown action key: ${key}`);
        }
      }
    };
  }
  
  // For approval actions
  if (key.startsWith('approval.')) {
    return {
      async executeAction(payload, user) {
        switch (key) {
          case 'approval.act':
            const { entityType, entityId, action } = payload;
            
            if (!entityType || !entityId || !action) {
              throw new Error('entityType, entityId, and action are required');
            }
            
            // Return placeholder for approval action
            return {
              message: 'Approval action endpoint needs implementation',
              entityType,
              entityId,
              action,
              approvedBy: user.id
            };
            
          default:
            throw new Error(`Unknown action key: ${key}`);
        }
      }
    };
  }
  
  // For wizard actions
  if (key.startsWith('wizard.')) {
    return {
      async executeAction(payload, user) {
        switch (key) {
          case 'wizard.admin':
            // Return placeholder for admin wizard
            return { message: 'Admin wizard action needs implementation' };
            
          default:
            throw new Error(`Unknown action key: ${key}`);
        }
      }
    };
  }
  
  // For report actions
  if (key.startsWith('report.')) {
    return {
      async executeAction(payload, user) {
        switch (key) {
          case 'report.generate.financial':
            // Return placeholder for financial report generation
            return { message: 'Financial report generation needs implementation' };
            
          case 'report.submit.narrative':
            // Return placeholder for narrative report submission
            return { message: 'Narrative report submission needs implementation' };
            
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

// Export the getActionService function for testing
exports.getActionService = getActionService;