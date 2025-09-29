const PartnerBudgetRepository = require('../../repositories/partnerBudgetRepository');
const PartnerBudgetTemplateRepository = require('../../repositories/partnerBudgetTemplateRepository');
const PartnerBudgetLineRepository = require('../../repositories/partnerBudgetLineRepository');

class BudgetValidationService {
  static async validateDraft(budgetId, client) {
    const budget = await PartnerBudgetRepository.findById(budgetId, client);
    if (!budget) {
      return BudgetValidationService.result(['Budget not found']);
    }

    const templates = await PartnerBudgetTemplateRepository.findByBudget(budgetId, client);
    const lines = await PartnerBudgetLineRepository.findByBudget(budgetId, client);

    const errors = [];
    const warnings = [];

    BudgetValidationService.validateCurrencyConsistency(budget, lines, errors);
    BudgetValidationService.validateTotals(budget, lines, errors, warnings);
    BudgetValidationService.validateRequiredTemplates(templates, lines, errors);
    BudgetValidationService.validateLineValues(lines, errors);

    const ruleErrors = BudgetValidationService.applyRulesJson(budget.rulesJson, templates, lines);
    if (Array.isArray(ruleErrors) && ruleErrors.length) {
      errors.push(...ruleErrors);
    }

    return BudgetValidationService.result(errors, warnings);
  }

  static validateCurrencyConsistency(budget, lines, errors) {
    const mismatched = lines.filter(line => line.currency && line.currency !== budget.currency);
    if (mismatched.length) {
      errors.push(
        `Line currencies (${mismatched.map(l => l.currency).join(', ')}) must match budget currency ${budget.currency}`
      );
    }
  }

  static validateTotals(budget, lines, errors, warnings) {
    const total = lines.reduce((sum, line) => sum + ((Number(line.qty) || 0) * (Number(line.unitCost) || 0)), 0);
    if (total > budget.ceilingTotal) {
      errors.push(`Aggregate line total ${total.toFixed(2)} exceeds ceiling ${budget.ceilingTotal.toFixed(2)}`);
    } else if (budget.ceilingTotal - total > budget.ceilingTotal * 0.1) {
      warnings.push(`Budget ceiling not fully allocated. Remaining ${(budget.ceilingTotal - total).toFixed(2)}`);
    }
  }

  static validateRequiredTemplates(templates, lines, errors) {
    const lineTemplateIds = new Set(lines.map(line => line.templateId));
    const missing = templates
      .filter(template => template.required && !lineTemplateIds.has(template.id))
      .map(template => template.category || template.id);

    if (missing.length) {
      errors.push(`Required template categories missing lines: ${missing.join(', ')}`);
    }
  }

  static validateLineValues(lines, errors) {
    lines.forEach((line) => {
      if (!line.description || !line.description.trim()) {
        errors.push(`Line ${line.id} requires a description`);
      }
      if (!line.qty || line.qty <= 0) {
        errors.push(`Line ${line.id} must have quantity > 0`);
      }
      if (line.unitCost === undefined || line.unitCost < 0) {
        errors.push(`Line ${line.id} must have non-negative unit cost`);
      }
    });
  }

  static applyRulesJson(rulesJson, templates, lines) {
    if (!rulesJson) {
      return [];
    }
    const errors = [];
    try {
      const rules = typeof rulesJson === 'string' ? JSON.parse(rulesJson) : rulesJson;

      if (Array.isArray(rules?.categoryCaps)) {
        rules.categoryCaps.forEach((capRule) => {
          const templateIds = templates
            .filter(template => template.category === capRule.category)
            .map(template => template.id);

          if (!templateIds.length) {
            return;
          }

          const total = lines
            .filter(line => templateIds.includes(line.templateId))
            .reduce((sum, line) => sum + ((Number(line.qty) || 0) * (Number(line.unitCost) || 0)), 0);

          if (capRule.max && total > capRule.max) {
            errors.push(`Category ${capRule.category} total ${total.toFixed(2)} exceeds cap ${capRule.max.toFixed(2)}`);
          }
        });
      }

      if (rules?.maxLinesPerCategory) {
        Object.entries(rules.maxLinesPerCategory).forEach(([category, limit]) => {
          const templateIds = templates
            .filter(template => template.category === category)
            .map(template => template.id);
          const count = lines.filter(line => templateIds.includes(line.templateId)).length;
          if (count > limit) {
            errors.push(`Category ${category} has ${count} lines, exceeding limit ${limit}`);
          }
        });
      }
    } catch (error) {
      errors.push(`Rules validation error: ${error.message}`);
    }

    return errors;
  }

  static result(errors, warnings = []) {
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

module.exports = BudgetValidationService;