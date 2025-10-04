const FundRequestRepository = require('../repositories/fundRequestRepository');
const approvalIntegrationService = require('../services/approvalIntegrationService');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

// SSoT endpoints for the frontend
exports.ssotList = async (req, res, next) => {
  try {
    const { projectId, partnerId } = req.query;

    // Validate required query parameters
    if (!projectId || !partnerId) {
      return res.status(400).json({ error: 'projectId and partnerId are required query parameters' });
    }

    const fundRequests = await FundRequestRepository.findByProjectAndPartner(projectId, partnerId);
    
    // Return the fund requests in the format expected by the frontend
    res.json({ items: fundRequests });
  } catch (error) {
    next(error);
  }
};

exports.ssotCreate = async (req, res, next) => {
  try {
    const actorId = req.user.id;
    const { projectId, partnerId, amount, currency, purpose, description, period_start, period_end, status } = req.body;

    // Validate required fields
    if (!projectId || !partnerId || !amount || !currency || !purpose) {
      return res.status(400).json({ error: 'projectId, partnerId, amount, currency, and purpose are required' });
    }

    // Validate amount
    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ error: 'amount must be a positive number' });
    }

    const fundRequestId = uuidv4();
    const fundRequest = {
      id: fundRequestId,
      projectId,
      partnerId,
      amount: amountNum,
      currency,
      purpose,
      description: description || null,
      periodFrom: period_start || null,
      periodTo: period_end || null,
      status: status || 'submitted',
      createdBy: actorId
    };

    const result = await FundRequestRepository.create(fundRequest);
    
    // If status is 'submitted', create approval request
    if (status === 'submitted') {
      try {
        const approvalRequest = await approvalIntegrationService.createApprovalRequest({
          entityType: 'fund_request',
          entityId: fundRequestId,
          userId: actorId,
          metadata: {
            amount: amountNum,
            currency,
            purpose,
            project_id: projectId
          }
        });
        
        if (approvalRequest) {
          // Link approval request to fund request
          await approvalIntegrationService.linkApprovalToEntity(
            'fund_requests',
            fundRequestId,
            approvalRequest.id
          );
          
          // Add approval_request_id to response
          result.approval_request_id = approvalRequest.id;
        }
      } catch (approvalError) {
        logger.error('Error creating approval request:', approvalError);
        // Continue without approval - don't fail the fund request creation
      }
    }
    
    // Return the created fund request in the format expected by the frontend
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

exports.ssotUpdate = async (req, res, next) => {
  try {
    const actorId = req.user.id;
    const { id, amount, currency, purpose, description, period_start, period_end } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'id is required' });
    }

    // Validate amount if provided
    if (amount) {
      const amountNum = Number(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        return res.status(400).json({ error: 'amount must be a positive number' });
      }
    }

    const updates = {
      amount: amount ? Number(amount) : undefined,
      currency,
      purpose,
      description,
      periodFrom: period_start,
      periodTo: period_end,
      updatedBy: actorId
    };

    // Remove undefined values
    Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

    const result = await FundRequestRepository.update(id, updates);
    
    if (!result) {
      return res.status(404).json({ error: 'Fund request not found' });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.ssotSubmit = async (req, res, next) => {
  try {
    const actorId = req.user.id;
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'id is required' });
    }

    // Get fund request details before updating
    const fundRequest = await FundRequestRepository.findById(id);
    if (!fundRequest) {
      return res.status(404).json({ error: 'Fund request not found' });
    }

    // Update status to submitted
    const result = await FundRequestRepository.updateStatus(id, 'submitted');
    
    if (!result) {
      return res.status(404).json({ error: 'Fund request not found' });
    }

    // Create approval request
    try {
      const approvalRequest = await approvalIntegrationService.createApprovalRequest({
        entityType: 'fund_request',
        entityId: id,
        userId: actorId,
        metadata: {
          amount: fundRequest.amount,
          currency: fundRequest.currency,
          purpose: fundRequest.purpose,
          project_id: fundRequest.projectId
        }
      });
      
      if (approvalRequest) {
        // Link approval request to fund request
        await approvalIntegrationService.linkApprovalToEntity(
          'fund_requests',
          id,
          approvalRequest.id
        );
        
        // Add approval_request_id to response
        result.approval_request_id = approvalRequest.id;
      }
    } catch (approvalError) {
      logger.error('Error creating approval request:', approvalError);
      // Continue without approval - don't fail the submission
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

exports.ssotDelete = async (req, res, next) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'id is required' });
    }

    const result = await FundRequestRepository.delete(id);
    
    if (!result) {
      return res.status(404).json({ error: 'Fund request not found' });
    }

    res.json({ success: true, message: 'Fund request deleted successfully' });
  } catch (error) {
    next(error);
  }
};