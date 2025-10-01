const db = require('../config/database');

/**
 * Approval Integration Service
 * Provides helper functions for integrating approval workflows with existing modules
 */

/**
 * Get active workflow for entity type with organization fallback
 * @param {string} entityType - Type of entity (budget, fund_request, contract, report, grant)
 * @param {string} organizationId - Optional organization ID for org-specific workflows
 * @returns {Promise<string|null>} - Workflow ID or null if not found
 */
async function getWorkflowForEntity(entityType, organizationId = null) {
  try {
    // Try organization-specific workflow first
    if (organizationId) {
      const orgResult = await db.pool.query(
        `SELECT id FROM approval_workflows 
         WHERE entity_type = $1 
           AND organization_id = $2 
           AND is_active = true 
         LIMIT 1`,
        [entityType, organizationId]
      );
      
      if (orgResult.rows.length > 0) {
        console.log(`Using organization-specific workflow for ${entityType} (org: ${organizationId})`);
        return orgResult.rows[0].id;
      }
    }
    
    // Fall back to default workflow
    const defaultResult = await db.pool.query(
      `SELECT id FROM approval_workflows 
       WHERE entity_type = $1 
         AND organization_id IS NULL 
         AND is_default = true 
         AND is_active = true 
       LIMIT 1`,
      [entityType]
    );
    
    if (defaultResult.rows.length > 0) {
      console.log(`Using default workflow for ${entityType}`);
      return defaultResult.rows[0].id;
    }
    
    console.log(`No workflow found for entity type: ${entityType}`);
    return null;
  } catch (error) {
    console.error(`Error getting workflow for ${entityType}:`, error);
    return null;
  }
}

/**
 * Create approval request for an entity
 * @param {Object} params - Parameters
 * @param {string} params.entityType - Type of entity
 * @param {string} params.entityId - ID of the entity
 * @param {string} params.userId - ID of the user submitting
 * @param {string} params.organizationId - Optional organization ID for org-specific workflows
 * @param {Object} params.metadata - Additional metadata
 * @returns {Promise<Object|null>} - Created approval request or null
 */
async function createApprovalRequest({ entityType, entityId, userId, organizationId = null, metadata = {} }) {
  try {
    // Get workflow for entity type (with organization fallback)
    const workflowId = await getWorkflowForEntity(entityType, organizationId);
    
    if (!workflowId) {
      console.log(`No active workflow found for entity type: ${entityType}`);
      return null;
    }
    
    // Create approval request
    const result = await db.pool.query(
      `INSERT INTO approval_requests (
        workflow_id, entity_type, entity_id, submitted_by, metadata
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [workflowId, entityType, entityId, userId, JSON.stringify(metadata)]
    );
    
    // Get first step approvers and send notifications
    const firstStep = await db.pool.query(
      `SELECT * FROM approval_steps 
       WHERE workflow_id = $1 AND step_order = 1`,
      [workflowId]
    );
    
    if (firstStep.rows.length > 0) {
      const step = firstStep.rows[0];
      const requestId = result.rows[0].id;
      
      // Get approvers based on type
      let approvers = [];
      if (step.approver_type === 'role') {
        const roleUsers = await db.pool.query(
          `SELECT id FROM users WHERE role = $1 AND is_active = true`,
          [step.approver_role_id]
        );
        approvers = roleUsers.rows.map(u => u.id);
      } else if (step.approver_type === 'user') {
        approvers = [step.approver_user_id];
      }
      
      // Send notifications to approvers
      for (const approverId of approvers) {
        await db.pool.query(
          `INSERT INTO approval_notifications (
            request_id, recipient_id, notification_type, channel
          ) VALUES ($1, $2, 'new_request', 'email')`,
          [requestId, approverId]
        );
      }
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Error creating approval request:', error);
    throw error;
  }
}

/**
 * Update entity with approval request ID
 * @param {string} tableName - Name of the table
 * @param {string} entityId - ID of the entity
 * @param {string} approvalRequestId - ID of the approval request
 * @returns {Promise<boolean>} - Success status
 */
async function linkApprovalToEntity(tableName, entityId, approvalRequestId) {
  try {
    await db.pool.query(
      `UPDATE ${tableName} 
       SET approval_request_id = $1 
       WHERE id = $2`,
      [approvalRequestId, entityId]
    );
    return true;
  } catch (error) {
    console.error(`Error linking approval to ${tableName}:`, error);
    return false;
  }
}

/**
 * Handle approval completion (approved or rejected)
 * @param {string} approvalRequestId - ID of the approval request
 * @param {string} status - New status (approved or rejected)
 * @returns {Promise<Object>} - Approval request details
 */
async function handleApprovalCompletion(approvalRequestId, status) {
  try {
    // Get approval request details
    const request = await db.pool.query(
      `SELECT * FROM approval_requests WHERE id = $1`,
      [approvalRequestId]
    );
    
    if (request.rows.length === 0) {
      throw new Error('Approval request not found');
    }
    
    const { entity_type, entity_id } = request.rows[0];
    
    // Update entity status based on entity type
    const statusMap = {
      fund_request: status === 'approved' ? 'approved' : 'rejected',
      budget: status === 'approved' ? 'approved' : 'rejected',
      contract: status === 'approved' ? 'approved' : 'rejected',
      report: status === 'approved' ? 'approved' : 'rejected',
      grant: status === 'approved' ? 'approved' : 'rejected'
    };
    
    const tableMap = {
      fund_request: 'fund_requests',
      budget: 'partner_budgets',
      contract: 'contracts',
      report: 'grant_reporting_dates',
      grant: 'grants'
    };
    
    const tableName = tableMap[entity_type];
    const newStatus = statusMap[entity_type];
    
    if (tableName && newStatus) {
      await db.pool.query(
        `UPDATE ${tableName} SET status = $1 WHERE id = $2`,
        [newStatus, entity_id]
      );
    }
    
    return request.rows[0];
  } catch (error) {
    console.error('Error handling approval completion:', error);
    throw error;
  }
}

/**
 * Get approval status for entity
 * @param {string} entityType - Type of entity
 * @param {string} entityId - ID of the entity
 * @returns {Promise<Object|null>} - Approval request or null
 */
async function getApprovalStatus(entityType, entityId) {
  try {
    const result = await db.pool.query(
      `SELECT ar.*, 
              w.name as workflow_name,
              u.name as submitted_by_name
       FROM approval_requests ar
       JOIN approval_workflows w ON ar.workflow_id = w.id
       LEFT JOIN users u ON ar.submitted_by = u.id
       WHERE ar.entity_type = $1 AND ar.entity_id = $2
       ORDER BY ar.created_at DESC
       LIMIT 1`,
      [entityType, entityId]
    );
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting approval status:', error);
    return null;
  }
}

module.exports = {
  getWorkflowForEntity,
  createApprovalRequest,
  linkApprovalToEntity,
  handleApprovalCompletion,
  getApprovalStatus
};
