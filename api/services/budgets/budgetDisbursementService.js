const { v4: uuidv4 } = require('uuid');
const PartnerBudgetRepository = require('../../repositories/partnerBudgetRepository');
const PartnerBudgetLineRepository = require('../../repositories/partnerBudgetLineRepository');

class BudgetDisbursementService {
  static async seedDefaultSchedule({ budgetId, actorId, client }) {
    const budget = await PartnerBudgetRepository.findById(budgetId, client);
    if (!budget) {
      BudgetDisbursementService.throwError('Budget not found', 404);
    }

    const existing = await client.query(
      'SELECT id FROM disbursements WHERE budget_id = $1 LIMIT 1',
      [budgetId]
    );
    if (existing.rows.length) {
      return existing.rows;
    }

    const lines = await PartnerBudgetLineRepository.findByBudget(budgetId, client);
    const total = BudgetDisbursementService.computeTotal(lines);
    if (total <= 0) {
      BudgetDisbursementService.throwError('Cannot seed disbursement schedule for zero total budget', 400);
    }

    const schedule = BudgetDisbursementService.buildSchedule({
      rulesJson: budget.rulesJson,
      total,
      budgetId,
      currency: budget.currency,
      actorId
    });

    const inserted = [];
    for (const tranche of schedule) {
      const result = await client.query(
        `
          INSERT INTO disbursements (
            id,
            budget_id,
            title,
            description,
            tranche_number,
            amount,
            currency,
            planned_date,
            status,
            created_by,
            updated_by,
            created_at,
            updated_at
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            'planned',
            $9,
            $9,
            now(),
            now()
          )
          RETURNING *
        `,
        [
          uuidv4(),
          budgetId,
          tranche.title,
          tranche.description,
          tranche.trancheNumber,
          tranche.amount,
          tranche.currency,
          tranche.plannedDate,
          actorId
        ]
      );
      inserted.push(result.rows[0]);
    }

    return inserted;
  }

  static computeTotal(lines) {
    return lines.reduce((sum, line) => {
      const qty = Number(line.qty) || 0;
      const unitCost = Number(line.unitCost) || 0;
      return sum + qty * unitCost;
    }, 0);
  }

  static buildSchedule({ rulesJson, total, budgetId, currency, actorId }) {
    const rules = BudgetDisbursementService.parseRules(rulesJson);
    if (rules?.disbursementPlan?.tranches?.length) {
      return BudgetDisbursementService.fromRules({
        tranches: rules.disbursementPlan.tranches,
        total,
        currency
      });
    }
    return BudgetDisbursementService.generateDefaultSchedule({ total, currency, budgetId, actorId });
  }

  static parseRules(rulesJson) {
    if (!rulesJson) {
      return null;
    }
    try {
      return typeof rulesJson === 'string' ? JSON.parse(rulesJson) : rulesJson;
    } catch {
      return null;
    }
  }

  static fromRules({ tranches, total, currency }) {
    return tranches.map((tranche, index) => {
      const amount = BudgetDisbursementService.resolveTrancheAmount({
        tranche,
        total
      });

      return {
        title: tranche.title || `Tranche ${index + 1}`,
        description: tranche.description || null,
        trancheNumber: index + 1,
        amount,
        currency,
        plannedDate: tranche.plannedDate || BudgetDisbursementService.defaultPlannedDate(index)
      };
    });
  }

  static resolveTrancheAmount({ tranche, total }) {
    if (tranche.absolute !== undefined) {
      const absolute = Number(tranche.absolute);
      if (!Number.isFinite(absolute) || absolute <= 0) {
        BudgetDisbursementService.throwError('Invalid absolute tranche amount in rules', 400);
      }
      return absolute;
    }

    if (tranche.percentage !== undefined) {
      const percent = Number(tranche.percentage);
      if (!Number.isFinite(percent) || percent <= 0 || percent > 100) {
        BudgetDisbursementService.throwError('Invalid percentage tranche amount in rules', 400);
      }
      return Number((total * (percent / 100)).toFixed(2));
    }

    BudgetDisbursementService.throwError('Tranche definition missing amount', 400);
  }

  static generateDefaultSchedule({ total, currency, budgetId }) {
    const trancheCount = 3;
    const baseAmount = Number((total / trancheCount).toFixed(2));
    const schedule = [];

    for (let i = 0; i < trancheCount; i += 1) {
      const plannedDate = BudgetDisbursementService.defaultPlannedDate(i);
      schedule.push({
        title: `Tranche ${i + 1}`,
        description: `Auto-generated tranche for budget ${budgetId}`,
        trancheNumber: i + 1,
        amount: baseAmount,
        currency,
        plannedDate
      });
    }

    const distributed = baseAmount * trancheCount;
    const delta = Number((total - distributed).toFixed(2));
    if (delta !== 0) {
      schedule[schedule.length - 1].amount = Number((schedule[schedule.length - 1].amount + delta).toFixed(2));
    }

    return schedule;
  }

  static defaultPlannedDate(offsetIndex) {
    const date = new Date();
    date.setMonth(date.getMonth() + offsetIndex * 3);
    return date.toISOString().split('T')[0];
  }

  static throwError(message, status = 400) {
    const error = new Error(message);
    error.status = status;
    throw error;
  }
}

module.exports = BudgetDisbursementService;