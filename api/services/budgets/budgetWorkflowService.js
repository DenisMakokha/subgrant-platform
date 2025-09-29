const db = require('../../config/database');
const PartnerBudgetRepository = require('../../repositories/partnerBudgetRepository');
const PartnerBudgetLineRepository = require('../../repositories/partnerBudgetLineRepository');
const ReviewThreadRepository = require('../../repositories/reviewThreadRepository');
const AuditLogRepository = require('../../repositories/auditLogRepository');
const NotificationRepository = require('../../repositories/notificationRepository');
const ActionIdempotencyRepository = require('../../repositories/actionIdempotencyRepository');

const STATUS_FLOW = [
  'DRAFT',
  'SUBMITTED',
  'REVISION_REQUESTED'
];

class BudgetWorkflowService {
  static async submitBudget({ budgetId, actorId, idempotencyKey, requestHash }) {
    return BudgetWorkflowService.transition({
      budgetId,
      actorId,
      targetStatus: 'SUBMITTED',
      actionKey: 'BUDGET_SUBMITTED',
      idempotencyKey,
      requestHash,
      notificationTemplate: 'budget_submitted'
    });
  }

  static async requestRevisions({ budgetId, actorId, commentBody, idempotencyKey, requestHash }) {
    return BudgetWorkflowService.transition({
      budgetId,
      actorId,
      targetStatus: 'REVISION_REQUESTED',
      actionKey: 'BUDGET_REVISION_REQUESTED',
      idempotencyKey,
      requestHash,
      notificationTemplate: 'budget_revision_requested',
      reviewComment: { kind: 'REQUEST_CHANGES', body: commentBody }
    });
  }

  static async approveStage({ budgetId }) {
    return {
      budgetId,
      status: 'PENDING_APPROVAL_SETUP',
      message: 'Approval workflow placeholder until client confirmation is received.'
    };
  }

  static async transition({
    budgetId,
    actorId,
    targetStatus,
    actionKey,
    idempotencyKey,
    requestHash,
    notificationTemplate,
    reviewComment,
    postTransition
  }) {
    return BudgetWorkflowService.withTransaction(async (client) => {
      if (idempotencyKey) {
        const existing = await ActionIdempotencyRepository.findByKey(idempotencyKey, client);
        if (existing?.responseJson) {
          return existing.responseJson;
        }

        const reserved = await ActionIdempotencyRepository.reserve({
          key: idempotencyKey,
          actionKey,
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

      const current = await PartnerBudgetRepository.findById(budgetId, client);
      if (!current) {
        throw BudgetWorkflowService.error('Budget not found', 404);
      }

      BudgetWorkflowService.assertTransitionAllowed(current.status, targetStatus);

      const updated = await PartnerBudgetRepository.transitionStatus(budgetId, targetStatus, actorId, client);
      if (!updated) {
        throw BudgetWorkflowService.error('Budget update failed', 500);
      }

      if (reviewComment?.body) {
        const thread = await ReviewThreadRepository.ensureThread('budget', budgetId, actorId, client);
        await ReviewThreadRepository.addComment({
          threadId: thread.id,
          authorUserId: actorId,
          kind: reviewComment.kind || 'COMMENT',
          body: reviewComment.body,
          attachments: reviewComment.attachments || null,
          legacy: { isResolved: false }
        }, client);
      }

      await BudgetWorkflowService.recordAudit({
        actionKey,
        actorId,
        budgetBefore: current,
        budgetAfter: updated
      }, client);

      await NotificationRepository.create({
        userId: updated.partnerId,
        channel: 'IN_APP',
        templateKey: notificationTemplate,
        payloadJson: { budgetId: updated.id, status: updated.status }
      }, client);

      if (typeof postTransition === 'function') {
        await postTransition({ budget: updated, actorId, client });
      }

      const response = { budget: updated };
      if (idempotencyKey) {
        await ActionIdempotencyRepository.markCompleted(idempotencyKey, response, client);
      }
      return response;
    });
  }


  static buildSnapshot(budget) {
    return {
      status: budget.status,
      ceilingTotal: budget.ceilingTotal,
      currency: budget.currency,
      rulesJson: budget.rulesJson,
      projectId: budget.projectId,
      partnerId: budget.partnerId,
      updatedAt: budget.updatedAt
    };
  }

  static computeDiff(before, after) {
    const diff = {};
    Object.keys(after).forEach((key) => {
      const beforeValue = before[key];
      const afterValue = after[key];
      const bothJson = typeof beforeValue === 'object' || typeof afterValue === 'object';
      const serialisedBefore = bothJson ? JSON.stringify(beforeValue ?? null) : beforeValue;
      const serialisedAfter = bothJson ? JSON.stringify(afterValue ?? null) : afterValue;

      if (serialisedBefore !== serialisedAfter) {
        diff[key] = {
          from: beforeValue ?? null,
          to: afterValue ?? null
        };
      }
    });
    return diff;
  }

  static async recordAudit({ actionKey, actorId, budgetBefore, budgetAfter }, client) {
    const beforeSnapshot = BudgetWorkflowService.buildSnapshot(budgetBefore);
    const afterSnapshot = BudgetWorkflowService.buildSnapshot(budgetAfter);
    const diff = BudgetWorkflowService.computeDiff(beforeSnapshot, afterSnapshot);

    await AuditLogRepository.create({
      actorUserId: actorId,
      actionKey,
      entityType: 'budget',
      entityId: budgetAfter.id,
      fromState: JSON.stringify(beforeSnapshot),
      toState: JSON.stringify(afterSnapshot),
      payloadJson: {
        diff,
        ceilingTotal: budgetAfter.ceilingTotal,
        projectId: budgetAfter.projectId,
        partnerId: budgetAfter.partnerId
      }
    }, client);
  }

  static assertTransitionAllowed(currentStatus, targetStatus) {
    const currentIndex = STATUS_FLOW.indexOf(currentStatus);
    const targetIndex = STATUS_FLOW.indexOf(targetStatus);

    if (currentIndex === -1 || targetIndex === -1) {
      throw BudgetWorkflowService.error(`Invalid status transition ${currentStatus} -> ${targetStatus}`, 400);
    }
    if (targetIndex <= currentIndex && !(currentStatus === 'REVISION_REQUESTED' && targetStatus === 'DRAFT')) {
      throw BudgetWorkflowService.error(`Status transition ${currentStatus} -> ${targetStatus} not allowed`, 409);
    }
    if (currentStatus === 'REVISION_REQUESTED' && targetStatus !== 'DRAFT' && targetStatus !== 'SUBMITTED') {
      throw BudgetWorkflowService.error('Budget must return to draft before resubmission', 409);
    }
  }

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

  static error(message, status = 400) {
    const err = new Error(message);
    err.status = status;
    return err;
  }
}

module.exports = BudgetWorkflowService;