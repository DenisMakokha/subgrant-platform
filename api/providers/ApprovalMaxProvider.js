const ApprovalProviderI = require('../interfaces/ApprovalProviderI');
const logger = require('../utils/logger');

class ApprovalMaxProvider extends ApprovalProviderI {
  /**
   * Submit an approval request
   * @param {import('../interfaces/ApprovalProviderI').ApprovalSubmitInput} input - Approval input
   * @returns {Promise<import('../interfaces/ApprovalProviderI').ApprovalSubmitResult>} Approval result
   */
  async submit(input) {
    // In a real implementation, this would create an external approval
    // and store the approval_ref
    logger.info(`Submitting to ApprovalMax: ${input.title}`);
    return { approvalRef: `approvalmax-${Date.now()}` };
  }

  /**
   * Cancel an approval request
   * @param {string} approvalRef - Approval reference
   * @returns {Promise<void>}
   */
  async cancel(approvalRef) {
    // In a real implementation, this would cancel the external approval
    logger.info(`Canceling ApprovalMax approval: ${approvalRef}`);
  }
}

module.exports = ApprovalMaxProvider;