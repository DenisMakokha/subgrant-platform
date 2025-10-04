const BudgetSSOTService = require('../services/budgets/budgetSSOTService');
const approvalIntegrationService = require('../services/approvalIntegrationService');
const logger = require('../utils/logger');

class BudgetSSOTController {
  /**
   * Create a new budget
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  static async createBudget(req, res, next) {
    try {
      const { projectId, partnerId, currency, templateId, rulesJson } = req.body;
      const actorId = req.user.id;
      
      const budget = await BudgetSSOTService.createBudget({
        projectId,
        partnerId,
        currency,
        templateId,
        rulesJson,
        actorId
      });
      
      res.status(201).json({
        success: true,
        data: budget
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Update a budget
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  static async updateBudget(req, res, next) {
    try {
      const { id: budgetId } = req.params;
      const updates = req.body;
      const actorId = req.user.id;
      
      const budget = await BudgetSSOTService.updateBudget(budgetId, updates, actorId);
      
      res.json({
        success: true,
        data: budget
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Add budget lines
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  static async addBudgetLines(req, res, next) {
    try {
      const { id: budgetId } = req.params;
      const { lines } = req.body;
      const actorId = req.user.id;
      
      const result = await BudgetSSOTService.addBudgetLines(budgetId, lines, actorId);
      
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Update budget lines
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  static async updateBudgetLines(req, res, next) {
    try {
      const { updates } = req.body;
      const actorId = req.user.id;
      
      const updatedLines = await BudgetSSOTService.updateBudgetLines(updates, actorId);
      
      res.json({
        success: true,
        data: updatedLines
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Delete budget lines
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  static async deleteBudgetLines(req, res, next) {
    try {
      const { lineIds } = req.body;
      const actorId = req.user.id;
      
      const result = await BudgetSSOTService.deleteBudgetLines(lineIds, actorId);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get a budget with its lines
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  static async getBudgetWithLines(req, res, next) {
    try {
      const { id: budgetId } = req.params;
      
      const budget = await BudgetSSOTService.getBudgetWithLines(budgetId);
      
      if (!budget) {
        return res.status(404).json({
          success: false,
          error: 'Budget not found'
        });
      }
      
      res.json({
        success: true,
        data: budget
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * List budgets by project
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  static async listBudgetsByProject(req, res, next) {
    try {
      const { projectId } = req.params;
      
      const budgets = await BudgetSSOTService.listBudgetsByProject(projectId);
      
      res.json({
        success: true,
        data: budgets
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * List budgets by partner
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  static async listBudgetsByPartner(req, res, next) {
    try {
      const { partnerId } = req.params;
      
      const budgets = await BudgetSSOTService.listBudgetsByPartner(partnerId);
      
      res.json({
        success: true,
        data: budgets
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Transition budget status
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  static async transitionStatus(req, res, next) {
    try {
      const { id: budgetId } = req.params;
      const { nextStatus, idempotencyKey, requestHash } = req.body;
      const actorId = req.user.id;
      
      const result = await BudgetSSOTService.transitionStatus(
        budgetId, 
        nextStatus, 
        actorId, 
        idempotencyKey, 
        requestHash
      );
      
      // If transitioning to 'submitted' or 'pending_approval', create approval request
      if (nextStatus === 'submitted' || nextStatus === 'pending_approval') {
        try {
          // Get budget details for metadata
          const budget = await BudgetSSOTService.getBudgetWithLines(budgetId);
          
          if (budget) {
            const approvalRequest = await approvalIntegrationService.createApprovalRequest({
              entityType: 'budget',
              entityId: budgetId,
              userId: actorId,
              metadata: {
                ceiling_total: budget.ceiling_total,
                project_id: budget.project_id,
                partner_id: budget.partner_id,
                currency: budget.currency
              }
            });
            
            if (approvalRequest) {
              // Link approval request to budget
              await approvalIntegrationService.linkApprovalToEntity(
                'partner_budgets',
                budgetId,
                approvalRequest.id
              );
              
              // Add approval_request_id to response
              result.approval_request_id = approvalRequest.id;
            }
          }
        } catch (approvalError) {
          logger.error('Error creating approval request for budget:', approvalError);
          // Continue without approval - don't fail the status transition
        }
      }
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Submit budget for approval
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  static async submitForApproval(req, res, next) {
    try {
      const { id: budgetId } = req.params;
      const actorId = req.user.id;
      
      // Transition to pending_approval status
      const result = await BudgetSSOTService.transitionStatus(
        budgetId,
        'pending_approval',
        actorId
      );
      
      // Get budget details for metadata
      const budget = await BudgetSSOTService.getBudgetWithLines(budgetId);
      
      if (budget) {
        try {
          const approvalRequest = await approvalIntegrationService.createApprovalRequest({
            entityType: 'budget',
            entityId: budgetId,
            userId: actorId,
            metadata: {
              ceiling_total: budget.ceiling_total,
              project_id: budget.project_id,
              partner_id: budget.partner_id,
              currency: budget.currency,
              line_count: budget.lines?.length || 0
            }
          });
          
          if (approvalRequest) {
            // Link approval request to budget
            await approvalIntegrationService.linkApprovalToEntity(
              'partner_budgets',
              budgetId,
              approvalRequest.id
            );
            
            // Add approval_request_id to response
            result.approval_request_id = approvalRequest.id;
          }
        } catch (approvalError) {
          logger.error('Error creating approval request for budget:', approvalError);
          // Continue without approval
        }
      }
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = BudgetSSOTController;