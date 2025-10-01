const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const db = require('../config/database');
const ReconciliationRepository = require('../repositories/reconciliationRepository');
const PartnerBudgetLineRepository = require('../repositories/partnerBudgetLineRepository');
const AuditLogRepository = require('../repositories/auditLogRepository');
const NotificationRepository = require('../repositories/notificationRepository');

class ReconciliationService {
  static async uploadEvidence({ 
    partnerBudgetLineId, 
    amount, 
    spentAt, 
    documentBuffer, 
    documentName, 
    note, 
    actorId 
  }) {
    return ReconciliationService.withTransaction(async (client) => {
      // Validate budget line exists
      const budgetLine = await PartnerBudgetLineRepository.findByBudgetLineId(partnerBudgetLineId, client);
      if (!budgetLine) {
        throw ReconciliationService.error('Budget line not found', 404);
      }

      // Validate amount is positive
      const amountNum = Number(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw ReconciliationService.error('Amount must be a positive number', 400);
      }

      // Validate spent date
      const spentDate = new Date(spentAt);
      if (isNaN(spentDate.getTime())) {
        throw ReconciliationService.error('Invalid spent date', 400);
      }

      // Generate document URI and checksum
      const documentUri = `reconciliation://${partnerBudgetLineId}/${uuidv4()}`;
      const checksum = crypto.createHash('md5').update(documentBuffer).digest('hex');
      const mimeType = ReconciliationService.detectMimeType(documentName);

      const evidenceData = {
        id: uuidv4(),
        partnerBudgetLineId,
        amount: amountNum,
        spentAt: spentDate,
        documentUri,
        documentName,
        mimeType,
        checksum,
        note: note || null,
        createdBy: actorId,
        createdAt: new Date()
      };

      const evidence = await ReconciliationRepository.createEvidence(evidenceData, client);

      // Record audit log
      await AuditLogRepository.create({
        actorUserId: actorId,
        actionKey: 'RECONCILIATION_EVIDENCE_UPLOADED',
        entityType: 'reconciliation_evidence',
        entityId: evidence.id,
        fromState: JSON.stringify({}),
        toState: JSON.stringify({
          partnerBudgetLineId,
          amount: amountNum,
          spentAt: spentDate,
          documentName,
          note
        }),
        payloadJson: {
          budgetLineId: partnerBudgetLineId,
          budgetId: budgetLine.partnerBudgetId
        }
      }, client);

      // Create notification for budget approvers
      await NotificationRepository.create({
        userId: budgetLine.createdBy, // Notify the budget creator
        channel: 'IN_APP',
        templateKey: 'reconciliation_evidence_uploaded',
        payloadJson: {
          evidenceId: evidence.id,
          budgetLineId: partnerBudgetLineId,
          amount: amountNum,
          documentName
        }
      }, client);

      return evidence;
    });
  }

  static async getReconciliationSummary(partnerBudgetId, client = db.pool) {
    const summary = await ReconciliationRepository.getSummaryByBudget(partnerBudgetId, client);
    
    // Calculate overall budget totals
    const totalApproved = summary.reduce((sum, line) => sum + line.total, 0);
    const totalSpent = summary.reduce((sum, line) => sum + line.spentCumulative, 0);
    const totalRemaining = summary.reduce((sum, line) => sum + line.remaining, 0);
    const totalEvidenceCount = summary.reduce((sum, line) => sum + line.evidenceCount, 0);

    return {
      lines: summary,
      totals: {
        approved: totalApproved,
        spent: totalSpent,
        remaining: totalRemaining,
        evidenceCount: totalEvidenceCount
      },
      percentages: {
        spent: totalApproved > 0 ? (totalSpent / totalApproved) * 100 : 0,
        remaining: totalApproved > 0 ? (totalRemaining / totalApproved) * 100 : 0
      }
    };
  }

  static async getEvidenceByBudgetLine(partnerBudgetLineId, client = db.pool) {
    return ReconciliationRepository.findByBudgetLine(partnerBudgetLineId, client);
  }

  static async deleteEvidence(evidenceId, actorId, client = db.pool) {
    return ReconciliationService.withTransaction(async (client) => {
      const evidence = await ReconciliationRepository.deleteEvidence(evidenceId, client);
      if (!evidence) {
        throw ReconciliationService.error('Evidence not found', 404);
      }

      // Record audit log for deletion
      await AuditLogRepository.create({
        actorUserId: actorId,
        actionKey: 'RECONCILIATION_EVIDENCE_DELETED',
        entityType: 'reconciliation_evidence',
        entityId: evidenceId,
        fromState: JSON.stringify({
          partnerBudgetLineId: evidence.partnerBudgetLineId,
          amount: evidence.amount,
          spentAt: evidence.spentAt,
          documentName: evidence.documentName
        }),
        toState: JSON.stringify({}),
        payloadJson: {
          budgetLineId: evidence.partnerBudgetLineId
        }
      }, client);

      return evidence;
    });
  }

  static detectMimeType(filename) {
    const extension = filename.toLowerCase().split('.').pop();
    const mimeTypes = {
      'pdf': 'application/pdf',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
    return mimeTypes[extension] || 'application/octet-stream';
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

module.exports = ReconciliationService;