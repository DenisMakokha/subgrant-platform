const { v4: uuidv4 } = require('uuid');
const db = require('../../config/database');
const ContractSSOTRepository = require('../../repositories/contractSSOTRepository');
const ContractTemplateSSOTRepository = require('../../repositories/contractTemplateSSOTRepository');
const PartnerBudgetSSOTRepository = require('../../repositories/partnerBudgetSSOTRepository');
const PartnerBudgetLineSSOTRepository = require('../../repositories/partnerBudgetLineSSOTRepository');
const AuditLogRepository = require('../../repositories/auditLogRepository');
const ActionIdempotencyRepository = require('../../repositories/actionIdempotencyRepository');

const STATES = {
  DRAFT: 'DRAFT',
  GENERATED: 'GENERATED',
  SUBMITTED_FOR_APPROVAL: 'SUBMITTED_FOR_APPROVAL',
  APPROVED: 'APPROVED',
  SENT_FOR_SIGN: 'SENT_FOR_SIGN',
  SIGNED: 'SIGNED',
  ACTIVE: 'ACTIVE',
  CANCELLED: 'CANCELLED'
};

class ContractSSOTService {
  /**
   * Create a new contract in the SSOT system
   * @param {object} params - Contract creation parameters
   * @param {string} params.projectId - Project ID
   * @param {string} params.partnerId - Partner ID
   * @param {string} params.budgetId - Budget ID
   * @param {string} params.templateId - Template ID
   * @param {string} params.number - Contract number
   * @param {string} params.title - Contract title
   * @param {string} params.actorId - User creating the contract
   * @returns {object} Created contract
   */
  static async createContract({ projectId, partnerId, budgetId, templateId, number, title, actorId }) {
    return ContractSSOTService.withTransaction(async (client) => {
      // Ensure budget is approved
      await ContractSSOTService.ensureApprovedBudget({ budgetId, partnerId }, client);
      
      // Validate template
      const template = await ContractTemplateSSOTRepository.findById(templateId, client);
      if (!template || !template.active) {
        ContractSSOTService.throwError('Template not found or inactive', 404);
      }
      
      const contractId = uuidv4();
      const contract = await ContractSSOTRepository.create({
        id: contractId,
        projectId,
        partnerId,
        budgetId,
        templateId,
        number: number ?? ContractSSOTService.randomNumber(),
        title: title ?? 'Grant Agreement',
        state: STATES.DRAFT,
        substatusJson: {},
        metadataJson: {},
        createdBy: actorId,
        createdAt: new Date(),
        updatedAt: new Date()
      }, client);
      
      await ContractSSOTService.recordAudit({
        actorId,
        actionKey: 'CONTRACT_SSOT_CREATED',
        before: null,
        after: contract
      }, client);
      
      return contract;
    });
  }
  
  /**
   * Generate contract document
   * @param {string} contractId - Contract ID
   * @param {string} actorId - User generating the contract
   * @param {string} renderedDocxKey - Generated document key
   * @param {object} mergePreview - Merge preview data
   * @returns {object} Updated contract
   */
  static async generate({ contractId, actorId, renderedDocxKey, mergePreview }) {
    return ContractSSOTService.transition(contractId, actorId, async ({ contract, client }) => {
      ContractSSOTService.assertState(contract.state, STATES.DRAFT, 'Only draft contracts can be generated');
      if (!renderedDocxKey) {
        ContractSSOTService.throwError('renderedDocxKey is required', 400);
      }
      
      const updated = await ContractSSOTRepository.update(contractId, {
        state: STATES.GENERATED,
        generatedDocxKey: renderedDocxKey,
        metadataJson: mergePreview ? {
          ...contract.metadataJson,
          mergePreview
        } : contract.metadataJson,
        updatedAt: new Date()
      }, client);
      
      await ContractSSOTService.recordAudit({
        actorId,
        actionKey: 'CONTRACT_SSOT_GENERATED',
        before: contract,
        after: updated
      }, client);
      
      return updated;
    });
  }
  
  /**
   * Submit contract for approval
   * @param {string} contractId - Contract ID
   * @param {string} actorId - User submitting the contract
   * @param {string} approvalProvider - Approval provider
   * @param {string} approvalRef - Approval reference
   * @returns {object} Updated contract
   */
  static async submitForApproval({ contractId, actorId, approvalProvider, approvalRef }) {
    return ContractSSOTService.transition(contractId, actorId, async ({ contract, client }) => {
      ContractSSOTService.assertState(contract.state, STATES.GENERATED, 'Contract must be generated first');
      
      const updated = await ContractSSOTRepository.update(contractId, {
        state: STATES.SUBMITTED_FOR_APPROVAL,
        approvalProvider,
        approvalRef,
        updatedAt: new Date()
      }, client);
      
      await ContractSSOTService.recordAudit({
        actorId,
        actionKey: 'CONTRACT_SSOT_SUBMITTED_FOR_APPROVAL',
        before: contract,
        after: updated
      }, client);
      
      return updated;
    });
  }
  
  /**
   * Mark contract as approved
   * @param {string} contractId - Contract ID
   * @param {string} actorId - User approving the contract
   * @param {string} approvedDocxKey - Approved document key
   * @returns {object} Updated contract
   */
  static async markApproved({ contractId, actorId, approvedDocxKey }) {
    return ContractSSOTService.transition(contractId, actorId, async ({ contract, client }) => {
      ContractSSOTService.assertState(contract.state, STATES.SUBMITTED_FOR_APPROVAL, 'Contract must be submitted for approval first');
      
      const updated = await ContractSSOTRepository.update(contractId, {
        state: STATES.APPROVED,
        approvedDocxKey: approvedDocxKey ?? contract.generatedDocxKey,
        updatedAt: new Date()
      }, client);
      
      await ContractSSOTService.recordAudit({
        actorId,
        actionKey: 'CONTRACT_SSOT_APPROVED',
        before: contract,
        after: updated
      }, client);
      
      return updated;
    });
  }
  
  /**
   * Send contract for signing
   * @param {string} contractId - Contract ID
   * @param {string} actorId - User sending the contract
   * @param {string} envelopeId - Envelope ID
   * @param {object} substatusJson - Substatus JSON
   * @returns {object} Updated contract
   */
  static async sendForSign({ contractId, actorId, envelopeId, substatusJson }) {
    return ContractSSOTService.transition(contractId, actorId, async ({ contract, client }) => {
      ContractSSOTService.assertState(contract.state, STATES.APPROVED, 'Contract must be approved before sending for sign');
      
      const updated = await ContractSSOTRepository.update(contractId, {
        state: STATES.SENT_FOR_SIGN,
        docusignEnvelopeId: envelopeId ?? contract.docusignEnvelopeId,
        substatusJson: substatusJson ?? { signingProgress: 'sent' },
        updatedAt: new Date()
      }, client);
      
      await ContractSSOTService.recordAudit({
        actorId,
        actionKey: 'CONTRACT_SSOT_SENT_FOR_SIGN',
        before: contract,
        after: updated
      }, client);
      
      return updated;
    });
  }
  
  /**
   * Mark contract as signed
   * @param {string} contractId - Contract ID
   * @param {string} actorId - User marking the contract
   * @param {string} signedPdfKey - Signed PDF key
   * @param {object} substatusJson - Substatus JSON
   * @returns {object} Updated contract
   */
  static async markSigned({ contractId, actorId, signedPdfKey, substatusJson }) {
    return ContractSSOTService.transition(contractId, actorId, async ({ contract, client }) => {
      ContractSSOTService.assertState(contract.state, STATES.SENT_FOR_SIGN, 'Contract must be sent for sign first');
      
      const updated = await ContractSSOTRepository.update(contractId, {
        state: STATES.SIGNED,
        signedPdfKey: signedPdfKey ?? contract.signedPdfKey,
        substatusJson: substatusJson ?? { signingProgress: 'completed' },
        updatedAt: new Date()
      }, client);
      
      await ContractSSOTService.recordAudit({
        actorId,
        actionKey: 'CONTRACT_SSOT_SIGNED',
        before: contract,
        after: updated
      }, client);
      
      return updated;
    });
  }
  
  /**
   * Activate contract
   * @param {string} contractId - Contract ID
   * @param {string} actorId - User activating the contract
   * @returns {object} Updated contract
   */
  static async activate({ contractId, actorId }) {
    return ContractSSOTService.transition(contractId, actorId, async ({ contract, client }) => {
      ContractSSOTService.assertState(contract.state, STATES.SIGNED, 'Contract must be fully signed before activation');
      
      const updated = await ContractSSOTRepository.update(contractId, {
        state: STATES.ACTIVE,
        updatedAt: new Date()
      }, client);
      
      await ContractSSOTService.recordAudit({
        actorId,
        actionKey: 'CONTRACT_SSOT_ACTIVATED',
        before: contract,
        after: updated
      }, client);
      
      // Lock the associated budget
      await PartnerBudgetSSOTRepository.update(contract.budgetId, { status: 'LOCKED' }, client);
      
      return updated;
    });
  }
  
  /**
   * Cancel contract
   * @param {string} contractId - Contract ID
   * @param {string} actorId - User canceling the contract
   * @param {string} reason - Cancellation reason
   * @returns {object} Updated contract
   */
  static async cancel({ contractId, actorId, reason }) {
    return ContractSSOTService.transition(contractId, actorId, async ({ contract, client }) => {
      const allowedStates = [
        STATES.DRAFT,
        STATES.GENERATED,
        STATES.SUBMITTED_FOR_APPROVAL,
        STATES.APPROVED,
        STATES.SENT_FOR_SIGN
      ];
      if (!allowedStates.includes(contract.state)) {
        ContractSSOTService.throwError('Only pre-sign contracts can be cancelled', 409);
      }
      
      const updated = await ContractSSOTRepository.update(contractId, {
        state: STATES.CANCELLED,
        substatusJson: {
          ...contract.substatusJson,
          cancelledAt: new Date().toISOString(),
          reason: reason || null
        },
        updatedAt: new Date()
      }, client);
      
      await ContractSSOTService.recordAudit({
        actorId,
        actionKey: 'CONTRACT_SSOT_CANCELLED',
        before: contract,
        after: updated
      }, client);
      
      return updated;
    });
  }
  
  /**
   * Get contract with budget details
   * @param {string} contractId - Contract ID
   * @returns {object} Contract with budget details
   */
  static async getContractWithBudget(contractId) {
    const client = await db.pool.connect();
    try {
      const contract = await ContractSSOTRepository.findById(contractId, client);
      if (!contract) {
        return null;
      }
      
      const budget = await PartnerBudgetSSOTRepository.findById(contract.budgetId, client);
      const budgetLines = await PartnerBudgetLineSSOTRepository.findByBudget(contract.budgetId, client);
      
      return {
        ...contract,
        budget: {
          ...budget,
          lines: budgetLines
        }
      };
    } finally {
      client.release();
    }
  }
  
  /**
   * List contracts by project
   * @param {string} projectId - Project ID
   * @returns {array} Contracts for the project
   */
  static async listContractsByProject(projectId) {
    const client = await db.pool.connect();
    try {
      return await ContractSSOTRepository.findByProject(projectId, client);
    } finally {
      client.release();
    }
  }
  
  /**
   * List contracts by partner
   * @param {string} partnerId - Partner ID
   * @returns {array} Contracts for the partner
   */
  static async listContractsByPartner(partnerId) {
    const client = await db.pool.connect();
    try {
      return await ContractSSOTRepository.findByPartner(partnerId, client);
    } finally {
      client.release();
    }
  }
  
  /**
   * List contracts by state
   * @param {string} state - Contract state
   * @returns {array} Contracts with the specified state
   */
  static async listContractsByState(state) {
    const client = await db.pool.connect();
    try {
      return await ContractSSOTRepository.findByState(state, client);
    } finally {
      client.release();
    }
  }
  
  // --- helpers ----------------------------------------------------------------
  
  /**
   * Ensure budget is approved
   * @param {object} params - Budget parameters
   * @param {string} params.budgetId - Budget ID
   * @param {string} params.partnerId - Partner ID
   * @param {object} client - Database client
   */
  static async ensureApprovedBudget({ budgetId, partnerId }, client) {
    const budget = await PartnerBudgetSSOTRepository.findById(budgetId, client);
    if (!budget) {
      ContractSSOTService.throwError('Budget not found', 404);
    }
    if (budget.partnerId !== partnerId) {
      ContractSSOTService.throwError('Budget does not belong to partner', 409);
    }
    if (budget.status !== 'APPROVED' && budget.status !== 'LOCKED') {
      ContractSSOTService.throwError('Budget must be approved before contract creation', 400);
    }
  }
  
  /**
   * Record audit log
   * @param {object} params - Audit parameters
   * @param {string} params.actorId - Actor ID
   * @param {string} params.actionKey - Action key
   * @param {object} params.before - State before action
   * @param {object} params.after - State after action
   * @param {object} client - Database client
   */
  static async recordAudit({ actorId, actionKey, before, after }, client) {
    await AuditLogRepository.create({
      actorUserId: actorId,
      actionKey,
      entityType: 'contract_ssot',
      entityId: after?.id ?? before?.id,
      fromState: before ? before.state : null,
      toState: after ? after.state : null,
      payloadJson: {
        before,
        after
      }
    }, client);
  }
  
  /**
   * Transition contract state
   * @param {string} contractId - Contract ID
   * @param {string} actorId - Actor ID
   * @param {function} callback - Transition callback
   * @returns {Promise} Transition result
   */
  static async transition(contractId, actorId, callback) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      const contract = await ContractSSOTRepository.findById(contractId, client);
      if (!contract) {
        ContractSSOTService.throwError('Contract not found', 404);
      }
      
      const result = await callback({ contract, client });
      
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
   * Execute database transaction
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
   * Generate random contract number
   * @returns {string} Random contract number
   */
  static randomNumber() {
    return `CN-${new Date().getFullYear()}-${Math.floor(Math.random() * 1_000_000)
      .toString()
      .padStart(6, '0')}`;
  }
  
  /**
   * Assert contract state
   * @param {string} actual - Actual state
   * @param {string} expected - Expected state
   * @param {string} message - Error message
   */
  static assertState(actual, expected, message) {
    if (actual !== expected) {
      ContractSSOTService.throwError(message ?? `Contract must be in ${expected} state`, 409);
    }
  }
  
  /**
   * Throw error with status code
   * @param {string} message - Error message
   * @param {number} status - HTTP status code
   * @returns {Error} Error object
   */
  static throwError(message, status = 400) {
    const error = new Error(message);
    error.status = status;
    throw error;
  }
}

module.exports = ContractSSOTService;