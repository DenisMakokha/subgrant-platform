const ApprovalProviderI = require('../interfaces/ApprovalProviderI');
const { v4: uuidv4 } = require('uuid');
const ApprovalRepository = require('../repositories/approvalRepository');
const ApprovalPolicyRepository = require('../repositories/approvalPolicyRepository');
const db = require('../config/database');

class InternalApprovalProvider extends ApprovalProviderI {
  /**
   * Submit an approval request
   * @param {import('../interfaces/ApprovalProviderI').ApprovalSubmitInput} input - Approval input
   * @returns {Promise<import('../interfaces/ApprovalProviderI').ApprovalSubmitResult>} Approval result
   */
  async submit(input) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Get the policy
      const policy = await ApprovalPolicyRepository.findById(input.policyId, client);
      if (!policy) {
        throw new Error(`Policy not found: ${input.policyId}`);
      }
      
      // Parse the internal config
      const internalConfig = policy.configJson.internal;
      if (!internalConfig) {
        throw new Error('Invalid internal policy config');
      }
      
      // Check if auto-approve conditions are met
      let autoApproved = false;
      if (internalConfig.autoApproveIf) {
        const { amountLte } = internalConfig.autoApproveIf;
        if (amountLte && input.meta.amount <= amountLte) {
          autoApproved = true;
        }
      }
      
      let approvalRef;
      if (autoApproved) {
        // Create an auto-approved approval
        const approvalData = {
          id: uuidv4(),
          policyId: input.policyId,
          entityType: input.entityType,
          entityId: input.entityId,
          provider: 'internal',
          approvalRef: `auto-${uuidv4()}`,
          status: 'APPROVED',
          assigneeRole: null,
          step: 1,
          totalSteps: 1,
          amount: input.meta.amount,
          requestedBy: input.meta.requestedBy,
          decidedBy: input.meta.requestedBy,
          decidedAt: new Date(),
          comment: 'Auto-approved based on policy rules'
        };
        
        const approval = await ApprovalRepository.create(approvalData, client);
        approvalRef = approval.approvalRef;
        
        // Call domain action for auto-approved items
        await this.domainApply(approval, client);
      } else {
        // Create a regular approval
        const firstStep = internalConfig.steps[0];
        if (!firstStep) {
          throw new Error('No steps defined in policy');
        }
        
        const approvalData = {
          id: uuidv4(),
          policyId: input.policyId,
          entityType: input.entityType,
          entityId: input.entityId,
          provider: 'internal',
          approvalRef: uuidv4(),
          status: 'PENDING',
          assigneeRole: firstStep.assignee_role,
          step: 1,
          totalSteps: internalConfig.steps.length,
          amount: input.meta.amount,
          requestedBy: input.meta.requestedBy,
          requestedAt: new Date()
        };
        
        const approval = await ApprovalRepository.create(approvalData, client);
        approvalRef = approval.approvalRef;
      }
      
      await client.query('COMMIT');
      return { approvalRef };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Cancel an approval request
   * @param {string} approvalRef - Approval reference
   * @returns {Promise<void>}
   */
  async cancel(approvalRef) {
    // In a real implementation, this would cancel the approval
    console.log(`Canceling approval: ${approvalRef}`);
  }

  /**
   * Approve an approval request
   * @param {string} approvalId - Approval ID
   * @param {string} userId - User ID
   * @param {string} [comment] - Approval comment
   * @returns {Promise<void>}
   */
  async approve(approvalId, userId, comment) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Get the approval
      const approval = await ApprovalRepository.findById(approvalId, client);
      if (!approval) {
        throw new Error(`Approval not found: ${approvalId}`);
      }
      
      // Get the policy
      const policy = await ApprovalPolicyRepository.findById(approval.policyId, client);
      if (!policy) {
        throw new Error(`Policy not found: ${approval.policyId}`);
      }
      
      // Parse the internal config
      const internalConfig = policy.configJson.internal;
      if (!internalConfig) {
        throw new Error('Invalid internal policy config');
      }
      
      // Check if this is the final step
      if (approval.step < approval.totalSteps) {
        // Move to next step
        const nextStep = internalConfig.steps[approval.step];
        if (!nextStep) {
          throw new Error(`Next step not found: ${approval.step}`);
        }
        
        await ApprovalRepository.updateStatus(
          approvalId,
          'PENDING',
          {
            step: approval.step + 1,
            assigneeRole: nextStep.assignee_role,
            decidedBy: userId,
            decidedAt: new Date(),
            comment
          },
          client
        );
      } else {
        // Final approval
        await ApprovalRepository.updateStatus(
          approvalId,
          'APPROVED',
          {
            decidedBy: userId,
            decidedAt: new Date(),
            comment
          },
          client
        );
        
        // Call domain action for approved items
        await this.domainApply({ ...approval, status: 'APPROVED' }, client);
      }
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Reject an approval request
   * @param {string} approvalId - Approval ID
   * @param {string} userId - User ID
   * @param {string} [comment] - Rejection comment
   * @returns {Promise<void>}
   */
  async reject(approvalId, userId, comment) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Update approval status to REJECTED
      await ApprovalRepository.updateStatus(
        approvalId,
        'REJECTED',
        {
          decidedBy: userId,
          decidedAt: new Date(),
          comment
        },
        client
      );
      
      // Get the approval for domain action
      const approval = await ApprovalRepository.findById(approvalId, client);
      
      // Call domain reject action
      await this.domainReject(approval, client);
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Call domain action for approved items
   * @param {any} approval - Approval object
   * @param {any} client - Database client
   * @returns {Promise<void>}
   */
  async domainApply(approval, client) {
    // In a real implementation, this would call the appropriate domain action
    // based on the entity type:
    // - contract.mark_approved()
    // - pb.approved()
    // - fundrequest.approved()
    // - etc.
    console.log(`Applying domain action for ${approval.entityType} ${approval.entityId}`);
  }

  /**
   * Call domain action for rejected items
   * @param {any} approval - Approval object
   * @param {any} client - Database client
   * @returns {Promise<void>}
   */
  async domainReject(approval, client) {
    // In a real implementation, this would call the appropriate domain action
    // for rejected items
    console.log(`Rejecting ${approval.entityType} ${approval.entityId}`);
  }
}

module.exports = InternalApprovalProvider;