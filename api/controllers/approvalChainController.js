const db = require('../config/database');
const logger = require('../utils/logger');
const { ValidationError, NotFoundError } = require('../errors');
const { sanitizeInput } = require('../middleware/sanitization');
const { logApiCall, logError } = require('../services/observabilityService');

// ==================== WORKFLOW MANAGEMENT ====================

/**
 * Get all approval workflows
 */
exports.getWorkflows = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      const { entity_type, is_active } = req.query;
      
      let query = `
        SELECT w.*, 
               COUNT(s.id) as step_count,
               u.email as created_by_name
        FROM approval_workflows w
        LEFT JOIN approval_steps s ON w.id = s.workflow_id
        LEFT JOIN users u ON w.created_by = u.id
        WHERE 1=1
      `;
      
      const params = [];
      
      if (entity_type) {
        params.push(entity_type);
        query += ` AND w.entity_type = $${params.length}`;
      }
      
      if (is_active !== undefined) {
        params.push(is_active === 'true');
        query += ` AND w.is_active = $${params.length}`;
      }
      
      query += ` GROUP BY w.id, u.email ORDER BY w.created_at DESC`;
      
      const result = await db.pool.query(query, params);
      
      logApiCall('GET', '/api/approvals/workflows', 200, Date.now() - startTime, req.user.id);
      res.json(result.rows);
    } catch (error) {
      logError(error, 'getWorkflows', { userId: req.user.id });
      
      // Return empty array if table doesn't exist (graceful degradation)
      if (error.code === '42P01') { // PostgreSQL: undefined_table
        logger.warn('approval_workflows table does not exist, returning empty array');
        logApiCall('GET', '/api/approvals/workflows', 200, Date.now() - startTime, req.user.id);
        return res.json([]);
      }
      
      logApiCall('GET', '/api/approvals/workflows', 500, Date.now() - startTime, req.user.id);
      next(error);
    }
  }
];

/**
 * Get single workflow with steps
 */
exports.getWorkflowById = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      const { id } = req.params;
      
      // Get workflow
      const workflowResult = await db.pool.query(
        `SELECT w.*, u.email as created_by_name
         FROM approval_workflows w
         LEFT JOIN users u ON w.created_by = u.id
         WHERE w.id = $1`,
        [id]
      );
      
      if (workflowResult.rows.length === 0) {
        throw new NotFoundError('Workflow not found');
      }
      
      // Get steps
      const stepsResult = await db.pool.query(
        `SELECT s.*, 
                u1.email as approver_user_name,
                u2.email as escalation_to_name
         FROM approval_steps s
         LEFT JOIN users u1 ON s.approver_user_id = u1.id
         LEFT JOIN users u2 ON s.escalation_to = u2.id
         WHERE s.workflow_id = $1
         ORDER BY s.step_order`,
        [id]
      );
      
      const workflow = workflowResult.rows[0];
      workflow.steps = stepsResult.rows;
      
      logApiCall('GET', `/api/approvals/workflows/${id}`, 200, Date.now() - startTime, req.user.id);
      res.json(workflow);
    } catch (error) {
      logError(error, 'getWorkflowById', { userId: req.user.id, workflowId: req.params.id });
      logApiCall('GET', `/api/approvals/workflows/${req.params.id}`, 500, Date.now() - startTime, req.user.id);
      next(error);
    }
  }
];

/**
 * Create new workflow
 */
exports.createWorkflow = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    const client = await db.pool.connect();
    
    try {
      const { name, description, entity_type, steps } = req.body;
      const userId = req.user.id;
      
      // Validation
      if (!name || !entity_type || !steps || steps.length === 0) {
        throw new ValidationError('name, entity_type, and steps are required');
      }
      
      await client.query('BEGIN');
      
      // Create workflow
      const workflowResult = await client.query(
        `INSERT INTO approval_workflows (name, description, entity_type, created_by)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [name, description, entity_type, userId]
      );
      
      const workflowId = workflowResult.rows[0].id;
      
      // Create steps
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        await client.query(
          `INSERT INTO approval_steps (
            workflow_id, step_order, step_name, approver_type, 
            approver_role_id, approver_user_id, approval_type, 
            required_approvers, conditions, escalation_hours, escalation_to
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            workflowId,
            i + 1,
            step.step_name,
            step.approver_type,
            step.approver_role_id || null,
            step.approver_user_id || null,
            step.approval_type || 'sequential',
            step.required_approvers || 1,
            step.conditions ? JSON.stringify(step.conditions) : null,
            step.escalation_hours || null,
            step.escalation_to || null
          ]
        );
      }
      
      await client.query('COMMIT');
      
      logApiCall('POST', '/api/approvals/workflows', 201, Date.now() - startTime, userId);
      res.status(201).json(workflowResult.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      logError(error, 'createWorkflow', { userId: req.user.id });
      logApiCall('POST', '/api/approvals/workflows', 500, Date.now() - startTime, req.user.id);
      next(error);
    } finally {
      client.release();
    }
  }
];

/**
 * Update workflow
 */
exports.updateWorkflow = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    const client = await db.pool.connect();
    
    try {
      const { id } = req.params;
      const { name, description, is_active, steps } = req.body;
      
      await client.query('BEGIN');
      
      // Update workflow
      await client.query(
        `UPDATE approval_workflows 
         SET name = COALESCE($1, name),
             description = COALESCE($2, description),
             is_active = COALESCE($3, is_active),
             updated_at = NOW()
         WHERE id = $4`,
        [name, description, is_active, id]
      );
      
      // If steps provided, update them
      if (steps) {
        // Delete existing steps
        await client.query('DELETE FROM approval_steps WHERE workflow_id = $1', [id]);
        
        // Insert new steps
        for (let i = 0; i < steps.length; i++) {
          const step = steps[i];
          await client.query(
            `INSERT INTO approval_steps (
              workflow_id, step_order, step_name, approver_type, 
              approver_role_id, approver_user_id, approval_type, 
              required_approvers, conditions, escalation_hours, escalation_to
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
              id,
              i + 1,
              step.step_name,
              step.approver_type,
              step.approver_role_id || null,
              step.approver_user_id || null,
              step.approval_type || 'sequential',
              step.required_approvers || 1,
              step.conditions ? JSON.stringify(step.conditions) : null,
              step.escalation_hours || null,
              step.escalation_to || null
            ]
          );
        }
      }
      
      await client.query('COMMIT');
      
      logApiCall('PUT', `/api/approvals/workflows/${id}`, 200, Date.now() - startTime, req.user.id);
      res.json({ message: 'Workflow updated successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      logError(error, 'updateWorkflow', { userId: req.user.id, workflowId: req.params.id });
      logApiCall('PUT', `/api/approvals/workflows/${req.params.id}`, 500, Date.now() - startTime, req.user.id);
      next(error);
    } finally {
      client.release();
    }
  }
];

/**
 * Delete workflow
 */
exports.deleteWorkflow = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      const { id } = req.params;
      
      // Check if workflow has active requests
      const activeRequests = await db.pool.query(
        `SELECT COUNT(*) as count FROM approval_requests 
         WHERE workflow_id = $1 AND status = 'pending'`,
        [id]
      );
      
      if (parseInt(activeRequests.rows[0].count) > 0) {
        throw new ValidationError('Cannot delete workflow with active approval requests');
      }
      
      await db.pool.query('DELETE FROM approval_workflows WHERE id = $1', [id]);
      
      logApiCall('DELETE', `/api/approvals/workflows/${id}`, 200, Date.now() - startTime, req.user.id);
      res.json({ message: 'Workflow deleted successfully' });
    } catch (error) {
      logError(error, 'deleteWorkflow', { userId: req.user.id, workflowId: req.params.id });
      logApiCall('DELETE', `/api/approvals/workflows/${req.params.id}`, 500, Date.now() - startTime, req.user.id);
      next(error);
    }
  }
];

// ==================== APPROVAL REQUESTS ====================

/**
 * Create approval request
 */
exports.createRequest = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    const client = await db.pool.connect();
    
    try {
      const { workflow_id, entity_type, entity_id, metadata } = req.body;
      const userId = req.user.id;
      
      // Validation
      if (!workflow_id || !entity_type || !entity_id) {
        throw new ValidationError('workflow_id, entity_type, and entity_id are required');
      }
      
      await client.query('BEGIN');
      
      // Create approval request
      const requestResult = await client.query(
        `INSERT INTO approval_requests (
          workflow_id, entity_type, entity_id, submitted_by, metadata
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
        [workflow_id, entity_type, entity_id, userId, metadata ? JSON.stringify(metadata) : null]
      );
      
      const requestId = requestResult.rows[0].id;
      
      // Get first step approvers
      const firstStep = await client.query(
        `SELECT * FROM approval_steps 
         WHERE workflow_id = $1 AND step_order = 1`,
        [workflow_id]
      );
      
      if (firstStep.rows.length > 0) {
        const step = firstStep.rows[0];
        
        // Get approvers based on type
        let approvers = [];
        if (step.approver_type === 'role') {
          // Get users with this role
          const roleUsers = await client.query(
            `SELECT id FROM users WHERE role = $1 AND is_active = true`,
            [step.approver_role_id]
          );
          approvers = roleUsers.rows.map(u => u.id);
        } else if (step.approver_type === 'user') {
          approvers = [step.approver_user_id];
        }
        
        // Send notifications to approvers
        for (const approverId of approvers) {
          await client.query(
            `INSERT INTO approval_notifications (
              request_id, recipient_id, notification_type, channel
            ) VALUES ($1, $2, 'new_request', 'email')`,
            [requestId, approverId]
          );
        }
      }
      
      await client.query('COMMIT');
      
      logApiCall('POST', '/api/approvals/request', 201, Date.now() - startTime, userId);
      res.status(201).json(requestResult.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      logError(error, 'createRequest', { userId: req.user.id });
      logApiCall('POST', '/api/approvals/request', 500, Date.now() - startTime, req.user.id);
      next(error);
    } finally {
      client.release();
    }
  }
];

/**
 * Get approval queue for current user
 */
exports.getQueue = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const { entity_type, status, sort_by = 'submitted_at', order = 'DESC' } = req.query;
      
      let query = `
        SELECT DISTINCT ON (ar.id)
          ar.*,
          w.name as workflow_name,
          s.step_name,
          s.step_order,
          u.email as submitted_by_name,
          u.email as submitted_by_email
        FROM approval_requests ar
        JOIN approval_workflows w ON ar.workflow_id = w.id
        JOIN approval_steps s ON w.id = s.workflow_id AND ar.current_step = s.step_order
        JOIN users u ON ar.submitted_by = u.id
        WHERE ar.status = 'pending'
          AND (
            (s.approver_type = 'role' AND s.approver_role_id = $1)
            OR (s.approver_type = 'user' AND s.approver_user_id = $2)
          )
      `;
      
      const params = [userRole, userId];
      
      if (entity_type) {
        params.push(entity_type);
        query += ` AND ar.entity_type = $${params.length}`;
      }
      
      if (status) {
        params.push(status);
        query += ` AND ar.status = $${params.length}`;
      }
      
      query += ` ORDER BY ar.id, ar.${sort_by} ${order}`;
      
      const result = await db.pool.query(query, params);
      
      logApiCall('GET', '/api/approvals/queue', 200, Date.now() - startTime, userId);
      res.json(result.rows);
    } catch (error) {
      logError(error, 'getQueue', { userId: req.user.id });
      logApiCall('GET', '/api/approvals/queue', 500, Date.now() - startTime, req.user.id);
      next(error);
    }
  }
];

/**
 * Get approval request details
 */
exports.getRequestById = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      const { id } = req.params;
      
      // Get request
      const requestResult = await db.pool.query(
        `SELECT ar.*, 
                w.name as workflow_name,
                u.email as submitted_by_name
         FROM approval_requests ar
         JOIN approval_workflows w ON ar.workflow_id = w.id
         JOIN users u ON ar.submitted_by = u.id
         WHERE ar.id = $1`,
        [id]
      );
      
      if (requestResult.rows.length === 0) {
        throw new NotFoundError('Approval request not found');
      }
      
      // Get actions history
      const actionsResult = await db.pool.query(
        `SELECT aa.*, 
                u.email as approver_name,
                s.step_name
         FROM approval_actions aa
         JOIN users u ON aa.approver_id = u.id
         JOIN approval_steps s ON aa.step_id = s.id
         WHERE aa.request_id = $1
         ORDER BY aa.acted_at DESC`,
        [id]
      );
      
      const request = requestResult.rows[0];
      request.actions = actionsResult.rows;
      
      logApiCall('GET', `/api/approvals/${id}`, 200, Date.now() - startTime, req.user.id);
      res.json(request);
    } catch (error) {
      logError(error, 'getRequestById', { userId: req.user.id, requestId: req.params.id });
      logApiCall('GET', `/api/approvals/${req.params.id}`, 500, Date.now() - startTime, req.user.id);
      next(error);
    }
  }
];

/**
 * Approve request
 */
exports.approveRequest = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    const client = await db.pool.connect();
    
    try {
      const { id } = req.params;
      const { comments } = req.body;
      const userId = req.user.id;
      
      await client.query('BEGIN');
      
      // Get request and current step
      const requestResult = await client.query(
        `SELECT ar.*, s.*, w.id as workflow_id
         FROM approval_requests ar
         JOIN approval_workflows w ON ar.workflow_id = w.id
         JOIN approval_steps s ON w.id = s.workflow_id AND ar.current_step = s.step_order
         WHERE ar.id = $1 AND ar.status = 'pending'`,
        [id]
      );
      
      if (requestResult.rows.length === 0) {
        throw new NotFoundError('Approval request not found or already processed');
      }
      
      const request = requestResult.rows[0];
      
      // Record action
      await client.query(
        `INSERT INTO approval_actions (
          request_id, step_id, step_order, approver_id, action, comments
        ) VALUES ($1, $2, $3, $4, 'approved', $5)`,
        [id, request.id, request.current_step, userId, comments]
      );
      
      // Check if there are more steps
      const nextStepResult = await client.query(
        `SELECT * FROM approval_steps 
         WHERE workflow_id = $1 AND step_order = $2`,
        [request.workflow_id, request.current_step + 1]
      );
      
      if (nextStepResult.rows.length > 0) {
        // Move to next step
        await client.query(
          `UPDATE approval_requests 
           SET current_step = current_step + 1, updated_at = NOW()
           WHERE id = $1`,
          [id]
        );
        
        // Notify next approvers
        const nextStep = nextStepResult.rows[0];
        let approvers = [];
        if (nextStep.approver_type === 'role') {
          const roleUsers = await client.query(
            `SELECT id FROM users WHERE role = $1 AND is_active = true`,
            [nextStep.approver_role_id]
          );
          approvers = roleUsers.rows.map(u => u.id);
        } else if (nextStep.approver_type === 'user') {
          approvers = [nextStep.approver_user_id];
        }
        
        for (const approverId of approvers) {
          await client.query(
            `INSERT INTO approval_notifications (
              request_id, recipient_id, notification_type, channel
            ) VALUES ($1, $2, 'new_request', 'email')`,
            [id, approverId]
          );
        }
      } else {
        // Final approval - mark as approved
        await client.query(
          `UPDATE approval_requests 
           SET status = 'approved', completed_at = NOW(), updated_at = NOW()
           WHERE id = $1`,
          [id]
        );
        
        // Notify submitter
        await client.query(
          `INSERT INTO approval_notifications (
            request_id, recipient_id, notification_type, channel
          ) VALUES ($1, $2, 'approved', 'email')`,
          [id, request.submitted_by]
        );
      }
      
      await client.query('COMMIT');
      
      logApiCall('POST', `/api/approvals/${id}/approve`, 200, Date.now() - startTime, userId);
      res.json({ message: 'Request approved successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      logError(error, 'approveRequest', { userId: req.user.id, requestId: req.params.id });
      logApiCall('POST', `/api/approvals/${req.params.id}/approve`, 500, Date.now() - startTime, req.user.id);
      next(error);
    } finally {
      client.release();
    }
  }
];

/**
 * Reject request
 */
exports.rejectRequest = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    const client = await db.pool.connect();
    
    try {
      const { id } = req.params;
      const { comments } = req.body;
      const userId = req.user.id;
      
      if (!comments) {
        throw new ValidationError('Comments are required for rejection');
      }
      
      await client.query('BEGIN');
      
      // Get request
      const requestResult = await client.query(
        `SELECT ar.*, s.id as step_id
         FROM approval_requests ar
         JOIN approval_workflows w ON ar.workflow_id = w.id
         JOIN approval_steps s ON w.id = s.workflow_id AND ar.current_step = s.step_order
         WHERE ar.id = $1 AND ar.status = 'pending'`,
        [id]
      );
      
      if (requestResult.rows.length === 0) {
        throw new NotFoundError('Approval request not found or already processed');
      }
      
      const request = requestResult.rows[0];
      
      // Record action
      await client.query(
        `INSERT INTO approval_actions (
          request_id, step_id, step_order, approver_id, action, comments
        ) VALUES ($1, $2, $3, $4, 'rejected', $5)`,
        [id, request.step_id, request.current_step, userId, comments]
      );
      
      // Mark as rejected
      await client.query(
        `UPDATE approval_requests 
         SET status = 'rejected', completed_at = NOW(), updated_at = NOW()
         WHERE id = $1`,
        [id]
      );
      
      // Notify submitter
      await client.query(
        `INSERT INTO approval_notifications (
          request_id, recipient_id, notification_type, channel
        ) VALUES ($1, $2, 'rejected', 'email')`,
        [id, request.submitted_by]
      );
      
      await client.query('COMMIT');
      
      logApiCall('POST', `/api/approvals/${id}/reject`, 200, Date.now() - startTime, userId);
      res.json({ message: 'Request rejected successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      logError(error, 'rejectRequest', { userId: req.user.id, requestId: req.params.id });
      logApiCall('POST', `/api/approvals/${req.params.id}/reject`, 500, Date.now() - startTime, req.user.id);
      next(error);
    } finally {
      client.release();
    }
  }
];

/**
 * Cancel request (by submitter)
 */
exports.cancelRequest = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // Verify submitter
      const result = await db.pool.query(
        `UPDATE approval_requests 
         SET status = 'cancelled', completed_at = NOW(), updated_at = NOW()
         WHERE id = $1 AND submitted_by = $2 AND status = 'pending'
         RETURNING *`,
        [id, userId]
      );
      
      if (result.rows.length === 0) {
        throw new NotFoundError('Approval request not found or cannot be cancelled');
      }
      
      logApiCall('POST', `/api/approvals/${id}/cancel`, 200, Date.now() - startTime, userId);
      res.json({ message: 'Request cancelled successfully' });
    } catch (error) {
      logError(error, 'cancelRequest', { userId: req.user.id, requestId: req.params.id });
      logApiCall('POST', `/api/approvals/${req.params.id}/cancel`, 500, Date.now() - startTime, req.user.id);
      next(error);
    }
  }
];

// ==================== DELEGATION ====================

/**
 * Get delegations
 */
exports.getDelegations = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      const userId = req.user.id;
      
      const result = await db.pool.query(
        `SELECT d.*,
                u1.email as delegator_name,
                u2.email as delegate_name
         FROM approval_delegates d
         JOIN users u1 ON d.delegator_id = u1.id
         JOIN users u2 ON d.delegate_id = u2.id
         WHERE d.delegator_id = $1 OR d.delegate_id = $1
         ORDER BY d.start_date DESC`,
        [userId]
      );
      
      logApiCall('GET', '/api/approvals/delegates', 200, Date.now() - startTime, userId);
      res.json(result.rows);
    } catch (error) {
      logError(error, 'getDelegations', { userId: req.user.id });
      logApiCall('GET', '/api/approvals/delegates', 500, Date.now() - startTime, req.user.id);
      next(error);
    }
  }
];

/**
 * Create delegation
 */
exports.createDelegation = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      const { delegate_id, start_date, end_date, reason } = req.body;
      const userId = req.user.id;
      
      if (!delegate_id || !start_date || !end_date) {
        throw new ValidationError('delegate_id, start_date, and end_date are required');
      }
      
      const result = await db.pool.query(
        `INSERT INTO approval_delegates (
          delegator_id, delegate_id, start_date, end_date, reason
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
        [userId, delegate_id, start_date, end_date, reason]
      );
      
      logApiCall('POST', '/api/approvals/delegates', 201, Date.now() - startTime, userId);
      res.status(201).json(result.rows[0]);
    } catch (error) {
      logError(error, 'createDelegation', { userId: req.user.id });
      logApiCall('POST', '/api/approvals/delegates', 500, Date.now() - startTime, req.user.id);
      next(error);
    }
  }
];

/**
 * Delete delegation
 */
exports.deleteDelegation = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      await db.pool.query(
        `DELETE FROM approval_delegates 
         WHERE id = $1 AND delegator_id = $2`,
        [id, userId]
      );
      
      logApiCall('DELETE', `/api/approvals/delegates/${id}`, 200, Date.now() - startTime, userId);
      res.json({ message: 'Delegation deleted successfully' });
    } catch (error) {
      logError(error, 'deleteDelegation', { userId: req.user.id, delegationId: req.params.id });
      logApiCall('DELETE', `/api/approvals/delegates/${req.params.id}`, 500, Date.now() - startTime, req.user.id);
      next(error);
    }
  }
];

// ==================== ANALYTICS ====================

/**
 * Get approval analytics
 */
exports.getAnalytics = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      const { start_date, end_date, entity_type } = req.query;
      
      let dateFilter = '';
      const params = [];
      
      if (start_date && end_date) {
        params.push(start_date, end_date);
        dateFilter = `AND ar.submitted_at BETWEEN $${params.length - 1} AND $${params.length}`;
      }
      
      if (entity_type) {
        params.push(entity_type);
        dateFilter += ` AND ar.entity_type = $${params.length}`;
      }
      
      // Summary stats
      const summaryResult = await db.pool.query(
        `SELECT 
          COUNT(*) as total_requests,
          COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
          COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
          COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
          AVG(EXTRACT(EPOCH FROM (completed_at - submitted_at))/3600) as avg_hours_to_complete
         FROM approval_requests ar
         WHERE 1=1 ${dateFilter}`,
        params
      );
      
      // Bottlenecks (steps taking longest)
      const bottlenecksResult = await db.pool.query(
        `SELECT 
          s.step_name,
          s.step_order,
          COUNT(*) as request_count,
          AVG(EXTRACT(EPOCH FROM (aa.acted_at - ar.submitted_at))/3600) as avg_hours
         FROM approval_requests ar
         JOIN approval_actions aa ON ar.id = aa.request_id
         JOIN approval_steps s ON aa.step_id = s.id
         WHERE 1=1 ${dateFilter}
         GROUP BY s.id, s.step_name, s.step_order
         ORDER BY avg_hours DESC
         LIMIT 10`,
        params
      );
      
      logApiCall('GET', '/api/approvals/analytics', 200, Date.now() - startTime, req.user.id);
      res.json({
        summary: summaryResult.rows[0],
        bottlenecks: bottlenecksResult.rows
      });
    } catch (error) {
      logError(error, 'getAnalytics', { userId: req.user.id });
      logApiCall('GET', '/api/approvals/analytics', 500, Date.now() - startTime, req.user.id);
      next(error);
    }
  }
];

// ==================== ORGANIZATION-SPECIFIC WORKFLOWS ====================

/**
 * Get workflows for a specific organization
 */
exports.getOrganizationWorkflows = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      const { organizationId } = req.params;
      
      const result = await db.pool.query(
        `SELECT w.*, 
                COUNT(s.id) as step_count,
                pw.name as parent_workflow_name,
                o.name as organization_name
         FROM approval_workflows w
         LEFT JOIN approval_steps s ON w.id = s.workflow_id
         LEFT JOIN approval_workflows pw ON w.parent_workflow_id = pw.id
         LEFT JOIN organizations o ON w.organization_id = o.id
         WHERE w.organization_id = $1
         GROUP BY w.id, pw.name, o.name
         ORDER BY w.entity_type, w.created_at DESC`,
        [organizationId]
      );
      
      logApiCall('GET', `/api/approvals/organizations/${organizationId}/workflows`, 200, Date.now() - startTime, req.user.id);
      res.json(result.rows);
    } catch (error) {
      logError(error, 'getOrganizationWorkflows', { userId: req.user.id, organizationId: req.params.organizationId });
      next(error);
    }
  }
];

/**
 * Create organization-specific workflow (override)
 */
exports.createOrganizationWorkflow = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      const { organizationId } = req.params;
      const { name, description, entity_type, parent_workflow_id, steps } = req.body;
      
      if (!name || !entity_type || !steps || steps.length === 0) {
        throw new ValidationError('Name, entity_type, and steps are required');
      }
      
      const client = await db.pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Create workflow
        const workflowResult = await client.query(
          `INSERT INTO approval_workflows 
           (name, description, entity_type, organization_id, parent_workflow_id, is_default, created_by)
           VALUES ($1, $2, $3, $4, $5, false, $6)
           RETURNING *`,
          [name, description, entity_type, organizationId, parent_workflow_id, req.user.id]
        );
        
        const workflow = workflowResult.rows[0];
        
        // Create steps
        for (let i = 0; i < steps.length; i++) {
          const step = steps[i];
          await client.query(
            `INSERT INTO approval_steps 
             (workflow_id, step_name, step_order, approver_type, approver_role_id, 
              approval_type, required_approvers, escalation_hours, conditions)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              workflow.id,
              step.step_name,
              i + 1,
              step.approver_type || 'role',
              step.approver_role_id,
              step.approval_type || 'sequential',
              step.required_approvers || 1,
              step.escalation_hours || 24,
              JSON.stringify(step.conditions || [])
            ]
          );
        }
        
        // Audit log
        await client.query(
          `INSERT INTO approval_workflow_audit 
           (workflow_id, action, changed_by, changes)
           VALUES ($1, 'created', $2, $3)`,
          [workflow.id, req.user.id, JSON.stringify({ organization_id: organizationId, steps: steps.length })]
        );
        
        await client.query('COMMIT');
        
        logApiCall('POST', `/api/approvals/organizations/${organizationId}/workflows`, 201, Date.now() - startTime, req.user.id);
        res.status(201).json(workflow);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      logError(error, 'createOrganizationWorkflow', { userId: req.user.id, organizationId: req.params.organizationId });
      next(error);
    }
  }
];

/**
 * Delete organization workflow (revert to default)
 */
exports.deleteOrganizationWorkflow = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      const { organizationId, workflowId } = req.params;
      
      // Verify workflow belongs to organization
      const checkResult = await db.pool.query(
        `SELECT id FROM approval_workflows 
         WHERE id = $1 AND organization_id = $2`,
        [workflowId, organizationId]
      );
      
      if (checkResult.rows.length === 0) {
        throw new NotFoundError('Organization workflow not found');
      }
      
      // Audit log before deletion
      await db.pool.query(
        `INSERT INTO approval_workflow_audit 
         (workflow_id, action, changed_by, changes)
         VALUES ($1, 'deleted', $2, $3)`,
        [workflowId, req.user.id, JSON.stringify({ organization_id: organizationId })]
      );
      
      // Delete workflow (cascade will delete steps)
      await db.pool.query(
        `DELETE FROM approval_workflows WHERE id = $1`,
        [workflowId]
      );
      
      logApiCall('DELETE', `/api/approvals/organizations/${organizationId}/workflows/${workflowId}`, 200, Date.now() - startTime, req.user.id);
      res.json({ message: 'Organization workflow deleted successfully. Default workflow will be used.' });
    } catch (error) {
      logError(error, 'deleteOrganizationWorkflow', { userId: req.user.id, organizationId: req.params.organizationId, workflowId: req.params.workflowId });
      next(error);
    }
  }
];

// ==================== DASHBOARD METRICS ====================

/**
 * Get approval metrics for dashboard
 */
exports.getApprovalMetrics = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      const { timeRange = 'week' } = req.query;
      const userId = req.user.id;
      const userRole = req.user.role;
      
      // Calculate date range
      let dateFilter = '';
      const now = new Date();
      if (timeRange === 'today') {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        dateFilter = `AND ar.created_at >= '${today.toISOString()}'`;
      } else if (timeRange === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = `AND ar.created_at >= '${weekAgo.toISOString()}'`;
      } else if (timeRange === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFilter = `AND ar.created_at >= '${monthAgo.toISOString()}'`;
      }
      
      // Get metrics
      const metricsResult = await db.pool.query(
        `SELECT 
          COUNT(*) FILTER (WHERE ar.status = 'pending') as total_pending,
          COUNT(*) FILTER (WHERE ar.status = 'approved') as total_approved,
          COUNT(*) FILTER (WHERE ar.status = 'rejected') as total_rejected,
          AVG(EXTRACT(EPOCH FROM (ar.completed_at - ar.created_at))/3600) as avg_approval_time_hours,
          COUNT(*) FILTER (WHERE ar.status = 'pending' AND s.approver_role_id = $1) as my_pending,
          COUNT(*) FILTER (WHERE ar.status = 'approved' AND aa.approver_id = $2 AND DATE(aa.acted_at) = CURRENT_DATE) as my_approved_today,
          COUNT(*) FILTER (WHERE ar.status = 'pending' AND ar.created_at < NOW() - INTERVAL '48 hours') as overdue_count,
          CASE 
            WHEN COUNT(*) FILTER (WHERE ar.status IN ('approved', 'rejected')) > 0 
            THEN (COUNT(*) FILTER (WHERE ar.status = 'approved')::FLOAT / COUNT(*) FILTER (WHERE ar.status IN ('approved', 'rejected'))::FLOAT * 100)
            ELSE 0 
          END as approval_rate
         FROM approval_requests ar
         LEFT JOIN approval_steps s ON ar.current_step_id = s.id
         LEFT JOIN approval_actions aa ON ar.id = aa.request_id AND aa.approver_id = $2
         WHERE 1=1 ${dateFilter}`,
        [userRole, userId]
      );
      
      logApiCall('GET', '/api/approvals/metrics', 200, Date.now() - startTime, req.user.id);
      res.json(metricsResult.rows[0]);
    } catch (error) {
      logError(error, 'getApprovalMetrics', { userId: req.user.id });
      next(error);
    }
  }
];

/**
 * Get my pending approvals
 */
exports.getMyPendingApprovals = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      
      const result = await db.pool.query(
        `SELECT 
          ar.*,
          u.email as submitted_by_name,
          s.step_name as current_step_name,
          w.name as workflow_name
         FROM approval_requests ar
         JOIN approval_steps s ON ar.current_step_id = s.id
         JOIN approval_workflows w ON ar.workflow_id = w.id
         JOIN users u ON ar.submitted_by = u.id
         WHERE s.approver_role_id = $1
           AND ar.status = 'pending'
         ORDER BY 
           CASE WHEN ar.priority = 'high' THEN 1
                WHEN ar.priority = 'medium' THEN 2
                ELSE 3 END,
           ar.created_at ASC`,
        [userRole]
      );
      
      logApiCall('GET', '/api/approvals/my-pending', 200, Date.now() - startTime, req.user.id);
      res.json(result.rows);
    } catch (error) {
      logError(error, 'getMyPendingApprovals', { userId: req.user.id });
      next(error);
    }
  }
];

module.exports = exports;
