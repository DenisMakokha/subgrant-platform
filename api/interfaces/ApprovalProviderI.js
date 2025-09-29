// Approval provider interface

/**
 * @typedef {Object} ApprovalSubmitInput
 * @property {string} entityType - "partner_budget"|"contract"|"fund_request"|"reconciliation"
 * @property {string} entityId - Entity ID
 * @property {string} [docUri] - Document URI
 * @property {string} title - Approval title
 * @property {Record<string, any>} meta - Metadata
 * @property {string} policyId - Policy ID
 */

/**
 * @typedef {Object} ApprovalSubmitResult
 * @property {string} approvalRef - Approval reference
 */

/**
 * @interface ApprovalProviderI
 */
class ApprovalProviderI {
  /**
   * Submit an approval request
   * @param {ApprovalSubmitInput} input - Approval input
   * @returns {Promise<ApprovalSubmitResult>} Approval result
   */
  async submit(input) {
    throw new Error('Not implemented');
  }

  /**
   * Cancel an approval request
   * @param {string} approvalRef - Approval reference
   * @returns {Promise<void>}
   */
  async cancel(approvalRef) {
    throw new Error('Not implemented');
  }
}

module.exports = ApprovalProviderI;