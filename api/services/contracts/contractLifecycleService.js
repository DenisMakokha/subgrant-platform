const { v4: uuidv4 } = require('uuid');
const db = require('../../config/database');
const ContractRepository = require('../../repositories/contractRepository');
const ContractTemplateRepository = require('../../repositories/contractTemplateRepository');
const PartnerBudgetRepository = require('../../repositories/partnerBudgetRepository');
const PartnerBudgetLineRepository = require('../../repositories/partnerBudgetLineRepository');
const PartnerBudget = require('../../repositories/partnerBudgetRepository'); // legacy compatibility
const AuditLogRepository = require('../../repositories/auditLogRepository');
const NotificationRepository = require('../../repositories/notificationRepository');

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

class ContractLifecycleService {
  static async createContract({ projectId, partnerId, partnerBudgetId, templateId, number, title, actorId }) {
    return ContractLifecycleService.withTransaction(async (client) => {
      await ContractLifecycleService.ensureApprovedBudget({ partnerBudgetId, partnerId }, client);
      const template = await ContractTemplateRepository.findById(templateId, client);
      if (!template || !template.active) {
        ContractLifecycleService.throwError('Template not found or inactive', 404);
      }

      const contractId = uuidv4();
      const contract = await ContractRepository.create({
        id: contractId,
        projectId,
        partnerId,
        partnerBudgetId,
        templateId,
        number: number ?? ContractLifecycleService.randomNumber(),
        title: title ?? 'Grant Agreement',
        state: STATES.DRAFT,
        substatusJson: {},
        metadataJson: {},
        createdBy: actorId
      }, client);

      await ContractLifecycleService.recordAudit({
        actorId,
        actionKey: 'CONTRACT_CREATED',
        before: null,
        after: contract
      }, client);

      return contract;
    });
  }

  static async generate({ contractId, actorId, renderedDocxKey, mergePreview }) {
    return ContractLifecycleService.transition(contractId, actorId, async ({ contract, client }) => {
      ContractLifecycleService.assertState(contract.state, STATES.DRAFT, 'Only draft contracts can be generated');
      if (!renderedDocxKey) {
        ContractLifecycleService.throwError('renderedDocxKey is required', 400);
      }

      const updated = await ContractRepository.updateFields(contractId, {
        state: STATES.GENERATED,
        generated_docx_key: renderedDocxKey,
        metadata_json: mergePreview ? {
          ...contract.metadataJson,
          mergePreview
        } : contract.metadataJson
      }, client);

      await ContractLifecycleService.recordAudit({
        actorId,
        actionKey: 'CONTRACT_GENERATED',
        before: contract,
        after: updated
      }, client);

      await ContractLifecycleService.notify(contract.partnerId, 'contract.generated', { contractId }, client);

      return updated;
    });
  }

  static async submitForApproval({ contractId, actorId, approvalProvider, approvalRef }) {
    return ContractLifecycleService.transition(contractId, actorId, async ({ contract, client }) => {
      ContractLifecycleService.assertState(contract.state, STATES.GENERATED, 'Contract must be generated first');

      const updated = await ContractRepository.updateFields(contractId, {
        state: STATES.SUBMITTED_FOR_APPROVAL,
        approval_provider: approvalProvider,
        approval_ref: approvalRef
      }, client);

      await ContractLifecycleService.recordAudit({
        actorId,
        actionKey: 'CONTRACT_SUBMITTED_FOR_APPROVAL',
        before: contract,
        after: updated
      }, client);

      await ContractLifecycleService.notify(contract.partnerId, 'contract.submitted_for_approval', { contractId }, client);

      return updated;
    });
  }

  static async markApproved({ contractId, actorId, approvedDocxKey }) {
    return ContractLifecycleService.transition(contractId, actorId, async ({ contract, client }) => {
      ContractLifecycleService.assertState(contract.state, STATES.SUBMITTED_FOR_APPROVAL, 'Contract must be submitted for approval first');

      const updated = await ContractRepository.updateFields(contractId, {
        state: STATES.APPROVED,
        approved_docx_key: approvedDocxKey ?? contract.generatedDocxKey
      }, client);

      await ContractLifecycleService.recordAudit({
        actorId,
        actionKey: 'CONTRACT_APPROVED',
        before: contract,
        after: updated
      }, client);

      await ContractLifecycleService.notify(contract.partnerId, 'contract.approved', { contractId }, client);

      return updated;
    });
  }

  static async sendForSign({ contractId, actorId, envelopeId, substatusJson }) {
    return ContractLifecycleService.transition(contractId, actorId, async ({ contract, client }) => {
      ContractLifecycleService.assertState(contract.state, STATES.APPROVED, 'Contract must be approved before sending for sign');

      const updated = await ContractRepository.updateFields(contractId, {
        state: STATES.SENT_FOR_SIGN,
        docusign_envelope_id: envelopeId ?? contract.docusignEnvelopeId,
        substatus_json: substatusJson ?? { signingProgress: 'sent' }
      }, client);

      await ContractLifecycleService.recordAudit({
        actorId,
        actionKey: 'CONTRACT_SENT_FOR_SIGN',
        before: contract,
        after: updated
      }, client);

      await ContractLifecycleService.notify(contract.partnerId, 'contract.sent_for_sign', { contractId }, client);

      return updated;
    });
  }

  static async markSigned({ contractId, actorId, signedPdfKey, substatusJson }) {
    return ContractLifecycleService.transition(contractId, actorId, async ({ contract, client }) => {
      ContractLifecycleService.assertState(contract.state, STATES.SENT_FOR_SIGN, 'Contract must be sent for sign first');

      const updated = await ContractRepository.updateFields(contractId, {
        state: STATES.SIGNED,
        signed_pdf_key: signedPdfKey ?? contract.signedPdfKey,
        substatus_json: substatusJson ?? { signingProgress: 'completed' }
      }, client);

      await ContractLifecycleService.recordAudit({
        actorId,
        actionKey: 'CONTRACT_SIGNED',
        before: contract,
        after: updated
      }, client);

      await ContractLifecycleService.notify(contract.partnerId, 'contract.signed', { contractId }, client);

      return updated;
    });
  }

  static async activate({ contractId, actorId }) {
    return ContractLifecycleService.transition(contractId, actorId, async ({ contract, client }) => {
      ContractLifecycleService.assertState(contract.state, STATES.SIGNED, 'Contract must be fully signed before activation');

      const updated = await ContractRepository.updateState(contractId, STATES.ACTIVE, client);

      await ContractLifecycleService.recordAudit({
        actorId,
        actionKey: 'CONTRACT_ACTIVATED',
        before: contract,
        after: updated
      }, client);

      await PartnerBudgetRepository.update(contract.partnerBudgetId, { status: 'LOCKED' }, client);
      await ContractLifecycleService.notify(contract.partnerId, 'contract.activated', { contractId }, client);

      return updated;
    });
  }

  static async cancel({ contractId, actorId, reason }) {
    return ContractLifecycleService.transition(contractId, actorId, async ({ contract, client }) => {
      const allowedStates = [
        STATES.DRAFT,
        STATES.GENERATED,
        STATES.SUBMITTED_FOR_APPROVAL,
        STATES.APPROVED,
        STATES.SENT_FOR_SIGN
      ];
      if (!allowedStates.includes(contract.state)) {
        ContractLifecycleService.throwError('Only pre-sign contracts can be cancelled', 409);
      }

      const updated = await ContractRepository.updateFields(contractId, {
        state: STATES.CANCELLED,
        substatus_json: {
          ...contract.substatusJson,
          cancelledAt: new Date().toISOString(),
          reason: reason || null
        }
      }, client);

      await ContractLifecycleService.recordAudit({
        actorId,
        actionKey: 'CONTRACT_CANCELLED',
        before: contract,
        after: updated
      }, client);

      await ContractLifecycleService.notify(contract.partnerId, 'contract.cancelled', { contractId }, client);

      return updated;
    });
  }

  // --- helpers ----------------------------------------------------------------

  static async ensureApprovedBudget({ partnerBudgetId, partnerId }, client) {
    const budget = await PartnerBudgetRepository.findById(partnerBudgetId, client);
    if (!budget) {
      ContractLifecycleService.throwError('Partner budget not found', 404);
    }
    if (budget.partnerId !== partnerId) {
      ContractLifecycleService.throwError('Budget does not belong to partner', 409);
    }
    if (budget.status !== 'APPROVED' && budget.status !== 'LOCKED') {
      ContractLifecycleService.throwError('Partner budget must be approved before contract creation', 400);
    }
  }

  static async notify(userId, templateKey, payload, client) {
    await NotificationRepository.create({
      userId,
      channel: 'IN_APP',
      templateKey,
      payloadJson: payload
    }, client);
  }

  static async recordAudit({ actorId, actionKey, before, after }, client) {
    await AuditLogRepository.create({
      actorUserId: actorId,
      actionKey,
      entityType: 'contract',
      entityId: after?.id ?? before?.id,
      fromState: before ? before.state : null,
      toState: after ? after.state : null,
      payloadJson: {
        before,
        after
      }
    }, client);
  }

  static async transition(contractId, actorId, callback) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      const contract = await ContractRepository.findById(contractId, client);
      if (!contract) {
        ContractLifecycleService.throwError('Contract not found', 404);
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

  static randomNumber() {
    return `CN-${new Date().getFullYear()}-${Math.floor(Math.random() * 1_000_000)
      .toString()
      .padStart(6, '0')}`;
  }

  static assertState(actual, expected, message) {
    if (actual !== expected) {
      ContractLifecycleService.throwError(message ?? `Contract must be in ${expected} state`, 409);
    }
  }

  static throwError(message, status = 400) {
    const error = new Error(message);
    error.status = status;
    throw error;
  }
}

module.exports = ContractLifecycleService;