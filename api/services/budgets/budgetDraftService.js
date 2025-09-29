const { v4: uuidv4 } = require('uuid');
const db = require('../../config/database');
const PartnerBudgetRepository = require('../../repositories/partnerBudgetRepository');
const PartnerBudgetTemplateRepository = require('../../repositories/partnerBudgetTemplateRepository');
const PartnerBudgetLineRepository = require('../../repositories/partnerBudgetLineRepository');

class BudgetDraftService {
  static async createDraft({ actorId, projectId, partnerId, currency, rulesJson, lines }) {
    return BudgetDraftService.withTransaction(async (client) => {
      const budgetId = uuidv4();
      const draft = await PartnerBudgetRepository.create({
        id: budgetId,
        projectId,
        partnerId,
        currency,
        ceilingTotal: BudgetDraftService.calculateTotal(lines),
        status: 'DRAFT',
        rulesJson,
        createdBy: actorId,
        createdAt: new Date()
      }, client);

      if (Array.isArray(lines) && lines.length > 0) {
        await BudgetDraftService.persistLines({
          partnerBudgetId: budgetId,
          lines,
          actorId,
          client
        });
      }

      return BudgetDraftService.hydrateBudget(draft.id, client);
    });
  }

  static async updateDraft({ budgetId, actorId, lines, updates }) {
    return BudgetDraftService.withTransaction(async (client) => {
      const current = await PartnerBudgetRepository.findById(budgetId, client);
      if (!current) {
        throw BudgetDraftService.error('Budget not found', 404);
      }
      if (current.status !== 'DRAFT') {
        throw BudgetDraftService.error('Only draft budgets can be updated', 409);
      }

      const ceilingTotal = lines ? BudgetDraftService.calculateTotal(lines) : current.ceilingTotal;

      await PartnerBudgetRepository.update(budgetId, {
        currency: updates?.currency || current.currency,
        ceilingTotal,
        rulesJson: updates?.rulesJson || current.rulesJson
      }, client);

      if (Array.isArray(lines)) {
        await BudgetDraftService.persistLines({
          partnerBudgetId: budgetId,
          lines,
          actorId,
          client
        });
      }

      return BudgetDraftService.hydrateBudget(budgetId, client);
    });
  }

  static async persistLines({ partnerBudgetId, lines, actorId, client }) {
    const templates = await PartnerBudgetTemplateRepository.findByBudget(partnerBudgetId, client);
    const templateMap = new Map(templates.map(t => [t.id, t]));

    const normalizedLines = lines.map((line) => {
      if (!templateMap.has(line.templateId)) {
        throw BudgetDraftService.error(`Template ${line.templateId} not found for budget ${partnerBudgetId}`, 400);
      }
      return {
        id: line.id || uuidv4(),
        partnerBudgetId,
        templateId: line.templateId,
        description: line.description,
        unit: line.unit,
        qty: line.qty,
        unitCost: line.unitCost,
        currency: line.currency,
        periodFrom: line.periodFrom || null,
        periodTo: line.periodTo || null,
        notes: line.notes || null,
        status: line.status || 'DRAFT',
        createdBy: actorId,
        createdAt: new Date()
      };
    });

    await PartnerBudgetLineRepository.replaceBudgetLines(partnerBudgetId, normalizedLines, client);
  }

  static calculateTotal(lines = []) {
    return lines.reduce((sum, line) => {
      const qty = Number(line.qty) || 0;
      const unitCost = Number(line.unitCost) || 0;
      return sum + qty * unitCost;
    }, 0);
  }

  static async hydrateBudget(id, client = db.pool) {
    const budget = await PartnerBudgetRepository.findById(id, client);
    if (!budget) {
      return null;
    }
    const templates = await PartnerBudgetTemplateRepository.findByBudget(id, client);
    const lines = await PartnerBudgetLineRepository.findByBudget(id, client);
    return {
      ...budget,
      templates,
      lines
    };
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

module.exports = BudgetDraftService;