const InternalApprovalProvider = require('../providers/InternalApprovalProvider');
const ApprovalMaxProvider = require('../providers/ApprovalMaxProvider');
const ApprovalRepository = require('../repositories/approvalRepository');
const ApprovalPolicyRepository = require('../repositories/approvalPolicyRepository');
const { ValidationError, NotFoundError } = require('../errors');
const { sanitizeInput } = require('../middleware/sanitization');
const { logApiCall, logError } = require('../services/observabilityService');

// Provider factory
const getApprovalProvider = (providerType) => {
  switch (providerType) {
    case 'internal':
      return new InternalApprovalProvider();
    case 'approvalmax':
      return new ApprovalMaxProvider();
    default:
      throw new Error(`Unknown provider type: ${providerType}`);
  }
};

exports.requestApproval = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      const { entityType, entityId, docUri, title, meta, policyId } = req.body;
      const userId = req.user.id;
      
      // Validate required fields
      if (!entityType || !entityId || !title || !policyId) {
        // Log failed API call
        logApiCall('POST', '/approvals/request', 400, Date.now() - startTime, userId);
        throw new ValidationError('entityType, entityId, title, and policyId are required');
      }
      
      // Get the policy
      const policy = await ApprovalPolicyRepository.findById(policyId);
      if (!policy) {
        // Log failed API call
        logApiCall('POST', '/approvals/request', 404, Date.now() - startTime, userId);
        throw new NotFoundError(`Policy not found: ${policyId}`);
      }
      
      // Get the provider
      const provider = getApprovalProvider(policy.provider);
      
      // Submit the approval request
      const input = {
        entityType,
        entityId,
        docUri,
        title,
        meta: { ...meta, requestedBy: userId },
        policyId
      };
      
      const result = await provider.submit(input);
      
      // Log successful API call
      logApiCall('POST', '/approvals/request', 201, Date.now() - startTime, userId);
      
      res.status(201).json(result);
    } catch (error) {
      // Log error
      logError(error, 'requestApproval', { userId: req.user.id });
      
      // Log failed API call
      logApiCall('POST', '/approvals/request', 500, Date.now() - startTime, req.user.id);
      
      next(error);
    }
  }
];

exports.approveApproval = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      const { id } = req.params;
      const { comment } = req.body;
      const userId = req.user.id;
      
      // Get the approval
      const approval = await ApprovalRepository.findById(id);
      if (!approval) {
        // Log failed API call
        logApiCall('POST', `/approvals/${id}/approve`, 404, Date.now() - startTime, userId);
        throw new NotFoundError(`Approval not found: ${id}`);
      }
      
      // Get the provider
      const provider = getApprovalProvider(approval.provider);
      
      // Approve the request
      if (provider.approve) {
        await provider.approve(id, userId, comment);
      } else {
        // Fallback to direct approval
        await ApprovalRepository.updateStatus(
          id,
          'APPROVED',
          {
            decidedBy: userId,
            decidedAt: new Date(),
            comment
          }
        );
      }
      
      // Log successful API call
      logApiCall('POST', `/approvals/${id}/approve`, 200, Date.now() - startTime, userId);
      
      res.json({ message: 'Approval approved successfully' });
    } catch (error) {
      // Log error
      logError(error, 'approveApproval', { userId: req.user.id, approvalId: req.params.id });
      
      // Log failed API call
      logApiCall('POST', `/approvals/${req.params.id}/approve`, 500, Date.now() - startTime, req.user.id);
      
      next(error);
    }
  }
];

exports.rejectApproval = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      const { id } = req.params;
      const { comment } = req.body;
      const userId = req.user.id;
      
      // Get the approval
      const approval = await ApprovalRepository.findById(id);
      if (!approval) {
        // Log failed API call
        logApiCall('POST', `/approvals/${id}/reject`, 404, Date.now() - startTime, userId);
        throw new NotFoundError(`Approval not found: ${id}`);
      }
      
      // Get the provider
      const provider = getApprovalProvider(approval.provider);
      
      // Reject the request
      if (provider.reject) {
        await provider.reject(id, userId, comment);
      } else {
        // Fallback to direct rejection
        await ApprovalRepository.updateStatus(
          id,
          'REJECTED',
          {
            decidedBy: userId,
            decidedAt: new Date(),
            comment
          }
        );
      }
      
      // Log successful API call
      logApiCall('POST', `/approvals/${id}/reject`, 200, Date.now() - startTime, userId);
      
      res.json({ message: 'Approval rejected successfully' });
    } catch (error) {
      // Log error
      logError(error, 'rejectApproval', { userId: req.user.id, approvalId: req.params.id });
      
      // Log failed API call
      logApiCall('POST', `/approvals/${req.params.id}/reject`, 500, Date.now() - startTime, req.user.id);
      
      next(error);
    }
  }
];

exports.getApprovalQueue = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      const { role, scope } = req.query;
      
      if (!role) {
        // Log failed API call
        logApiCall('GET', '/approvals/queue', 400, Date.now() - startTime, req.user.id);
        throw new ValidationError('role parameter is required');
      }
      
      // Get pending approvals for the role
      const approvals = await ApprovalRepository.findPendingByRole(role);
      
      // Log successful API call
      logApiCall('GET', '/approvals/queue', 200, Date.now() - startTime, req.user.id);
      
      res.json(approvals);
    } catch (error) {
      // Log error
      logError(error, 'getApprovalQueue', { userId: req.user.id });
      
      // Log failed API call
      logApiCall('GET', '/approvals/queue', 500, Date.now() - startTime, req.user.id);
      
      next(error);
    }
  }
];