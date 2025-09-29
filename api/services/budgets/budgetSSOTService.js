const { v4: uuidv4 } = require('uuid');
const db = require('../../config/database');
const PartnerBudgetSSOTRepository = require('../../repositories/partnerBudgetSSOTRepository');
const PartnerBudgetLineSSOTRepository = require('../../repositories/partnerBudgetLineSSOTRepository');
const BudgetTemplateRepository = require('../../repositories/budgetTemplateRepository');
const BudgetTemplateLineRepository = require('../../repositories/budgetTemplateLineRepository');
const AuditLogRepository = require('../../repositories/auditLogRepository');
const ActionIdempotencyRepository = require('../../repositories/actionIdempotencyRepository');

class BudgetSSOTService {
  /**
   * Create a new budget in the SSOT system
   * @param {object} params - Budget creation parameters
   * @param {string} params.projectId - Project ID
   * @param {string} params.partnerId - Partner ID
   * @param {string} params.currency - Currency code
   * @param {string} params.templateId - Template ID (optional)
   * @param {object} params.rulesJson - Budget rules
   * @param {string} params.actorId - User creating the budget
   * @returns {object} Created budget
   */
  static async createBudget({ projectId, partnerId, currency, templateId, rulesJson, actorId }) {
    return BudgetSSOTService.withTransaction(async (client) => {
      const budgetId = uuidv4();
      
      const budget = await PartnerBudgetSSOTRepository.create({
        id: budgetId,
        projectId,
        partnerId,
        templateId,
        currency,
        ceilingTotal: 0, // Will be updated when lines are added
        status: 'DRAFT',
        rulesJson,
        createdBy: actorId,
        createdAt: new Date(),
        updatedAt: new Date()
      }, client);
      
      // Record audit log
      await AuditLogRepository.create({
        actorUserId: actorId,
        actionKey: 'BUDGET_SSOT_CREATED',
        entityType: 'budget_ssot',
        entityId: budgetId,
        payloadJson: { budget }
      }, client);
      
      return budget;
    });
  }
  
  /**
   * Update an existing budget
   * @param {string} budgetId - Budget ID
   * @param {object} updates - Budget updates
   * @param {string} actorId - User updating the budget
   * @returns {object} Updated budget
   */
  static async updateBudget(budgetId, updates, actorId) {
    return BudgetSSOTService.withTransaction(async (client) => {
      const current = await PartnerBudgetSSOTRepository.findById(budgetId, client);
      if (!current) {
        throw BudgetSSOTService.error('Budget not found', 404);
      }
      
      // Prevent updates to locked budgets
      if (current.status === 'LOCKED') {
        throw BudgetSSOTService.error('Cannot update locked budget', 409);
      }
      
      const updated = await PartnerBudgetSSOTRepository.update(budgetId, {
        ...updates,
        updatedAt: new Date()
      }, client);
      
      if (!updated) {
        throw BudgetSSOTService.error('Budget update failed', 500);
      }
      
      // Record audit log
      await AuditLogRepository.create({
        actorUserId: actorId,
        actionKey: 'BUDGET_SSOT_UPDATED',
        entityType: 'budget_ssot',
        entityId: budgetId,
        fromState: JSON.stringify(current),
        toState: JSON.stringify(updated),
        payloadJson: { updates }
      }, client);
      
      return updated;
    });
  }
  
  /**
   * Add budget lines to a budget
   * @param {string} budgetId - Budget ID
   * @param {array} lines - Budget lines to add
   * @param {string} actorId - User adding the lines
   * @returns {array} Created budget lines
   */
  static async addBudgetLines(budgetId, lines, actorId) {
    return BudgetSSOTService.withTransaction(async (client) => {
      const budget = await PartnerBudgetSSOTRepository.findById(budgetId, client);
      if (!budget) {
        throw BudgetSSOTService.error('Budget not found', 404);
      }
      
      // Prevent adding lines to locked budgets
      if (budget.status === 'LOCKED') {
        throw BudgetSSOTService.error('Cannot add lines to locked budget', 409);
      }
      
      const createdLines = [];
      let total = 0;
      
      for (const line of lines) {
        const lineId = uuidv4();
        const createdLine = await PartnerBudgetLineSSOTRepository.create({
          id: lineId,
          budgetId,
          templateLineId: line.templateLineId,
          categoryId: line.categoryId,
          description: line.description,
          unit: line.unit,
          qty: line.qty,
          unitCost: line.unitCost,
          currency: line.currency || budget.currency,
          periodFrom: line.periodFrom,
          periodTo: line.periodTo,
          notes: line.notes,
          status: line.status || 'DRAFT',
          createdBy: actorId,
          createdAt: new Date()
        }, client);
        
        createdLines.push(createdLine);
        total += (line.qty || 0) * (line.unitCost || 0);
      }
      
      // Update budget ceiling total
      const updatedBudget = await PartnerBudgetSSOTRepository.update(budgetId, {
        ceilingTotal: total,
        updatedAt: new Date()
      }, client);
      
      // Record audit log
      await AuditLogRepository.create({
        actorUserId: actorId,
        actionKey: 'BUDGET_SSOT_LINES_ADDED',
        entityType: 'budget_ssot',
        entityId: budgetId,
        payloadJson: { lines: createdLines, total }
      }, client);
      
      return { budget: updatedBudget, lines: createdLines };
    });
  }
  
  /**
   * Update budget lines
   * @param {array} lineUpdates - Array of line updates { id, ...updates }
   * @param {string} actorId - User updating the lines
   * @returns {array} Updated budget lines
   */
  static async updateBudgetLines(lineUpdates, actorId) {
    return BudgetSSOTService.withTransaction(async (client) => {
      const updatedLines = [];
      
      for (const update of lineUpdates) {
        const { id, ...updates } = update;
        
        const current = await PartnerBudgetLineSSOTRepository.findById(id, client);
        if (!current) {
          throw BudgetSSOTService.error(`Budget line ${id} not found`, 404);
        }
        
        // Check if the parent budget is locked
        const budget = await PartnerBudgetSSOTRepository.findById(current.budgetId, client);
        if (budget && budget.status === 'LOCKED') {
          throw BudgetSSOTService.error('Cannot update lines in locked budget', 409);
        }
        
        const updated = await PartnerBudgetLineSSOTRepository.update(id, updates, client);
        if (updated) {
          updatedLines.push(updated);
        }
      }
      
      // Record audit log
      await AuditLogRepository.create({
        actorUserId: actorId,
        actionKey: 'BUDGET_SSOT_LINES_UPDATED',
        entityType: 'budget_line_ssot',
        entityId: lineUpdates.map(u => u.id).join(','),
        payloadJson: { updates: lineUpdates }
      }, client);
      
      return updatedLines;
    });
  }
  
  /**
   * Delete budget lines
   * @param {array} lineIds - Array of line IDs to delete
   * @param {string} actorId - User deleting the lines
   * @returns {object} Deletion result
   */
  static async deleteBudgetLines(lineIds, actorId) {
    return BudgetSSOTService.withTransaction(async (client) => {
      for (const lineId of lineIds) {
        const current = await PartnerBudgetLineSSOTRepository.findById(lineId, client);
        if (!current) {
          throw BudgetSSOTService.error(`Budget line ${lineId} not found`, 404);
        }
        
        // Check if the parent budget is locked
        const budget = await PartnerBudgetSSOTRepository.findById(current.budgetId, client);
        if (budget && budget.status === 'LOCKED') {
          throw BudgetSSOTService.error('Cannot delete lines from locked budget', 409);
        }
        
        await PartnerBudgetLineSSOTRepository.delete(lineId, client);
      }
      
      // Record audit log
      await AuditLogRepository.create({
        actorUserId: actorId,
        actionKey: 'BUDGET_SSOT_LINES_DELETED',
        entityType: 'budget_line_ssot',
        entityId: lineIds.join(','),
        payloadJson: { lineIds }
      }, client);
      
      return { deleted: lineIds.length };
    });
  }
  
  /**
   * Get a budget with its lines
   * @param {string} budgetId - Budget ID
   * @returns {object} Budget with lines
   */
  static async getBudgetWithLines(budgetId) {
    const client = await db.pool.connect();
    try {
      const budget = await PartnerBudgetSSOTRepository.findById(budgetId, client);
      if (!budget) {
        return null;
      }
      
      const lines = await PartnerBudgetLineSSOTRepository.findByBudget(budgetId, client);
      
      return {
        ...budget,
        lines
      };
    } finally {
      client.release();
    }
  }
  
  /**
   * List budgets by project
   * @param {string} projectId - Project ID
   * @returns {array} Budgets for the project
   */
  static async listBudgetsByProject(projectId) {
    const client = await db.pool.connect();
    try {
      return await PartnerBudgetSSOTRepository.findByProject(projectId, client);
    } finally {
      client.release();
    }
  }
  
  /**
   * List budgets by partner
   * @param {string} partnerId - Partner ID
   * @returns {array} Budgets for the partner
   */
  static async listBudgetsByPartner(partnerId) {
    const client = await db.pool.connect();
    try {
      return await PartnerBudgetSSOTRepository.findByPartner(partnerId, client);
    } finally {
      client.release();
    }
  }
  
  /**
   * Transition budget status
   * @param {string} budgetId - Budget ID
   * @param {string} nextStatus - Target status
   * @param {string} actorId - User performing the transition
   * @param {string} idempotencyKey - Idempotency key
   * @param {string} requestHash - Request hash
   * @returns {object} Updated budget
   */
  static async transitionStatus(budgetId, nextStatus, actorId, idempotencyKey, requestHash) {
    return BudgetSSOTService.withTransaction(async (client) => {
      if (idempotencyKey) {
        const existing = await ActionIdempotencyRepository.findByKey(idempotencyKey, client);
        if (existing?.responseJson) {
          return existing.responseJson;
        }
        
        const reserved = await ActionIdempotencyRepository.reserve({
          key: idempotencyKey,
          actionKey: 'BUDGET_SSOT_STATUS_TRANSITION',
          actorUserId: actorId,
          requestHash
        }, client);
        
        if (!reserved) {
          const replay = await ActionIdempotencyRepository.findByKey(idempotencyKey, client);
          if (replay?.responseJson) {
            return replay.responseJson;
          }
        }
      }
      
      const current = await PartnerBudgetSSOTRepository.findById(budgetId, client);
      if (!current) {
        throw BudgetSSOTService.error('Budget not found', 404);
      }
      
      // Validate status transition
      BudgetSSOTService.assertStatusTransition(current.status, nextStatus);
      
      const updated = await PartnerBudgetSSOTRepository.update(budgetId, {
        status: nextStatus,
        updatedAt: new Date()
      }, client);
      
      if (!updated) {
        throw BudgetSSOTService.error('Budget update failed', 500);
      }
      
      // Record audit log
      await AuditLogRepository.create({
        actorUserId: actorId,
        actionKey: 'BUDGET_SSOT_STATUS_CHANGED',
        entityType: 'budget_ssot',
        entityId: budgetId,
        fromState: JSON.stringify({ status: current.status }),
        toState: JSON.stringify({ status: updated.status }),
        payloadJson: { from: current.status, to: nextStatus }
      }, client);
      
      const response = { budget: updated };
      if (idempotencyKey) {
        await ActionIdempotencyRepository.markCompleted(idempotencyKey, response, client);
      }
      
      return response;
    });
  }
  
  /**
   * Validate status transition
   * @param {string} currentStatus - Current status
   * @param {string} nextStatus - Target status
   */
  static assertStatusTransition(currentStatus, nextStatus) {
    const validTransitions = {
      'DRAFT': ['SUBMITTED', 'LOCKED'],
      'SUBMITTED': ['APPROVED', 'REJECTED', 'DRAFT'],
      'APPROVED': ['LOCKED'],
      'REJECTED': ['DRAFT'],
      'LOCKED': []
    };
    
    const allowed = validTransitions[currentStatus] || [];
    if (!allowed.includes(nextStatus)) {
      throw BudgetSSOTService.error(
        `Invalid status transition: ${currentStatus} -> ${nextStatus}`, 
        409
      );
    }
  }
  
  /**
   * Execute a database transaction
   * @param {function} callback - Transaction callback
   * @returns {Promise} Transaction result
   */
  static async withTransaction(callback) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Create an error with status code
   * @param {string} message - Error message
   * @param {number} status - HTTP status code
   * @returns {Error} Error object
   */
  static error(message, status = 400) {
    const err = new Error(message);
    err.status = status;
    return err;
  }
}

module.exports = BudgetSSOTService;