// Domain glue service for approvals

const FundRequestRepository = require('../repositories/fundRequestRepository');
const PartnerBudgetRepository = require('../repositories/partnerBudgetRepository');
const ContractRepository = require('../repositories/contractRepository');
const ApprovalRepository = require('../repositories/approvalRepository');
const db = require('../config/database');

/**
 * Apply approval to a fund request
 * @param {string} entityId - Fund request ID
 * @param {any} client - Database client
 * @returns {Promise<void>}
 */
async function applyFundRequestApproval(entityId, client) {
  // Update fund request status to approved
  await FundRequestRepository.updateStatus(entityId, 'approved', client);
  
  // In a real implementation, this might trigger other actions like:
  // - Creating a disbursement record
  // - Sending notifications
  // - Updating related entities
  
  console.log(`Applied approval to fund request ${entityId}`);
}

/**
 * Reject a fund request
 * @param {string} entityId - Fund request ID
 * @param {any} client - Database client
 * @returns {Promise<void>}
 */
async function rejectFundRequest(entityId, client) {
  // Update fund request status to rejected
  await FundRequestRepository.updateStatus(entityId, 'rejected', client);
  
  console.log(`Rejected fund request ${entityId}`);
}

/**
 * Apply approval to a partner budget
 * @param {string} entityId - Partner budget ID
 * @param {any} client - Database client
 * @returns {Promise<void>}
 */
async function applyPartnerBudgetApproval(entityId, client) {
  // Update partner budget status to approved
  await PartnerBudgetRepository.transitionStatus(entityId, 'APPROVED', null, client);
  
  console.log(`Applied approval to partner budget ${entityId}`);
}

/**
 * Reject a partner budget
 * @param {string} entityId - Partner budget ID
 * @param {any} client - Database client
 * @returns {Promise<void>}
 */
async function rejectPartnerBudget(entityId, client) {
  // Update partner budget status to rejected
  await PartnerBudgetRepository.transitionStatus(entityId, 'REJECTED', null, client);
  
  console.log(`Rejected partner budget ${entityId}`);
}

/**
 * Apply approval to a contract
 * @param {string} entityId - Contract ID
 * @param {any} client - Database client
 * @returns {Promise<void>}
 */
async function applyContractApproval(entityId, client) {
  // Update contract status to approved
  await ContractRepository.updateStatus(entityId, 'APPROVED', client);
  
  console.log(`Applied approval to contract ${entityId}`);
}

/**
 * Reject a contract
 * @param {string} entityId - Contract ID
 * @param {any} client - Database client
 * @returns {Promise<void>}
 */
async function rejectContract(entityId, client) {
  // Update contract status to rejected
  await ContractRepository.updateStatus(entityId, 'REJECTED', client);
  
  console.log(`Rejected contract ${entityId}`);
}

/**
 * Handle approval decision (approve or reject)
 * @param {string} approvalId - Approval ID
 * @param {string} decision - 'APPROVE' or 'REJECT'
 * @param {string} userId - User ID making the decision
 * @param {string} comment - Decision comment
 * @returns {Promise<void>}
 */
async function handleApprovalDecision(approvalId, decision, userId, comment) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    
    // Get the approval
    const approval = await ApprovalRepository.findById(approvalId, client);
    if (!approval) {
      throw new Error(`Approval not found: ${approvalId}`);
    }
    
    // Update approval status
    await ApprovalRepository.updateStatus(
      approvalId,
      decision === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      {
        decidedBy: userId,
        decidedAt: new Date(),
        comment
      },
      client
    );
    
    // Apply or reject based on entity type
    if (decision === 'APPROVE') {
      switch (approval.entityType) {
        case 'fund_request':
          await applyFundRequestApproval(approval.entityId, client);
          break;
        case 'partner_budget':
          await applyPartnerBudgetApproval(approval.entityId, client);
          break;
        case 'contract':
          await applyContractApproval(approval.entityId, client);
          break;
        default:
          console.warn(`Unknown entity type for approval: ${approval.entityType}`);
      }
    } else {
      switch (approval.entityType) {
        case 'fund_request':
          await rejectFundRequest(approval.entityId, client);
          break;
        case 'partner_budget':
          await rejectPartnerBudget(approval.entityId, client);
          break;
        case 'contract':
          await rejectContract(approval.entityId, client);
          break;
        default:
          console.warn(`Unknown entity type for approval: ${approval.entityType}`);
      }
    }
    
    await client.query('COMMIT');
    console.log(`Handled ${decision} decision for approval ${approvalId}`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  handleApprovalDecision,
  applyFundRequestApproval,
  rejectFundRequest,
  applyPartnerBudgetApproval,
  rejectPartnerBudget,
  applyContractApproval,
  rejectContract
};