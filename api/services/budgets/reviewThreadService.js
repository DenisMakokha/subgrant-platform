const db = require('../../config/database');
const PartnerBudgetRepository = require('../../repositories/partnerBudgetRepository');
const ReviewThreadRepository = require('../../repositories/reviewThreadRepository');
const AuditLogRepository = require('../../repositories/auditLogRepository');
const NotificationRepository = require('../../repositories/notificationRepository');

class ReviewThreadService {
  static async getThread(budgetId) {
    const budget = await PartnerBudgetRepository.findById(budgetId);
    if (!budget) {
      ReviewThreadService.throwError('Budget not found', 404);
    }

    const thread = await ReviewThreadRepository.findThreadWithComments('budget', budgetId);
    if (thread) {
      return thread;
    }

    return {
      id: null,
      entityType: 'budget',
      entityId: budgetId,
      comments: []
    };
  }

  static async addComment({ budgetId, actorId, kind = 'COMMENT', body, attachments }) {
    if (!body || !body.trim()) {
      ReviewThreadService.throwError('Comment body is required', 400);
    }

    return ReviewThreadService.withTransaction(async (client) => {
      const budget = await PartnerBudgetRepository.findById(budgetId, client);
      if (!budget) {
        ReviewThreadService.throwError('Budget not found', 404);
      }

      const thread = await ReviewThreadRepository.ensureThread('budget', budgetId, actorId, client);
      const comment = await ReviewThreadRepository.addComment({
        threadId: thread.id,
        authorUserId: actorId,
        kind,
        body,
        attachments: attachments || null
      }, client);

      await ReviewThreadService.recordAudit({
        actionKey: 'BUDGET_COMMENT_ADDED',
        actorId,
        budget,
        payload: { commentId: comment.id }
      }, client);

      await ReviewThreadService.notify({
        budget,
        actorId,
        templateKey: 'budget_comment_added',
        payload: { budgetId: budget.id, commentId: comment.id },
        client
      });

      return ReviewThreadRepository.findThreadWithComments('budget', budgetId, client);
    });
  }

  static async resolveComments({ budgetId, actorId, commentIds }) {
    if (!Array.isArray(commentIds) || commentIds.length === 0) {
      ReviewThreadService.throwError('comment_ids must be a non-empty array', 400);
    }

    return ReviewThreadService.withTransaction(async (client) => {
      const budget = await PartnerBudgetRepository.findById(budgetId, client);
      if (!budget) {
        ReviewThreadService.throwError('Budget not found', 404);
      }

      const thread = await ReviewThreadRepository.findThreadWithComments('budget', budgetId, client);
      if (!thread) {
        ReviewThreadService.throwError('No review thread exists for this budget', 404);
      }

      const missing = commentIds.filter(
        (commentId) => !thread.comments.some((comment) => comment.id === commentId)
      );
      if (missing.length) {
        ReviewThreadService.throwError(`Comments not owned by this budget: ${missing.join(', ')}`, 400);
      }

      await ReviewThreadRepository.resolveComments(commentIds, actorId, client);

      await ReviewThreadService.recordAudit({
        actionKey: 'BUDGET_COMMENT_RESOLVED',
        actorId,
        budget,
        payload: { resolvedCommentIds: commentIds }
      }, client);

      await ReviewThreadService.notify({
        budget,
        actorId,
        templateKey: 'budget_comment_resolved',
        payload: { budgetId: budget.id, commentIds },
        client
      });

      return ReviewThreadRepository.findThreadWithComments('budget', budgetId, client);
    });
  }

  static async notify({ budget, actorId, templateKey, payload, client }) {
    const recipients = new Set();

    if (budget.createdBy) {
      recipients.add(budget.createdBy);
    }

    recipients.delete(actorId);

    const tasks = Array.from(recipients).map((userId) =>
      NotificationRepository.create({
        userId,
        channel: 'IN_APP',
        templateKey,
        payloadJson: payload
      }, client)
    );

    await Promise.all(tasks);
  }

  static async recordAudit({ actionKey, actorId, budget, payload }, client) {
    await AuditLogRepository.create({
      actorUserId: actorId,
      actionKey,
      entityType: 'budget',
      entityId: budget.id,
      fromState: null,
      toState: null,
      payloadJson: payload
    }, client);
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

  static throwError(message, status = 400) {
    const error = new Error(message);
    error.status = status;
    throw error;
  }
}

module.exports = ReviewThreadService;