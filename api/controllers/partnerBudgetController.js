const BudgetDraftService = require('../services/budgets/budgetDraftService');
const BudgetValidationService = require('../services/budgets/budgetValidationService');
const BudgetWorkflowService = require('../services/budgets/budgetWorkflowService');
const ReviewThreadService = require('../services/budgets/reviewThreadService');
const PartnerBudgetRepository = require('../repositories/partnerBudgetRepository');
const PartnerBudgetTemplateRepository = require('../repositories/partnerBudgetTemplateRepository');
const PartnerBudgetLineRepository = require('../repositories/partnerBudgetLineRepository');
const { validate } = require('../middleware/validation');
const { BudgetSchema, BudgetLineSchema } = require('../schemas/budgetSchemas');
const { ValidationError, NotFoundError } = require('../errors');
const { sanitizeInput } = require('../middleware/sanitization');
const { logApiCall, logError } = require('../services/observabilityService');

function getIdempotencyKey(req) {
  return req.headers['idempotency-key'] || null;
}

function getRequestHash(req) {
  try {
    return Buffer.from(JSON.stringify(req.body || {})).toString('base64');
  } catch {
    return null;
  }
}

exports.createBudget = [
  sanitizeInput,
  validate(BudgetSchema.omit({ id: true, created_by: true, created_at: true, updated_at: true })),
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      const actorId = req.user.id;
      const { project_id, partner_id, currency, rules_json, lines } = req.body;

      const result = await BudgetDraftService.createDraft({
        actorId,
        projectId: project_id,
        partnerId: partner_id,
        currency,
        rulesJson: rules_json,
        lines
      });

      // Log successful API call
      logApiCall('POST', '/partner-budgets', 201, Date.now() - startTime, actorId);

      res.status(201).json(result);
    } catch (error) {
      // Log error
      logError(error, 'createBudget', { userId: req.user.id });
      
      // Log failed API call
      logApiCall('POST', '/partner-budgets', 500, Date.now() - startTime, req.user.id);
      
      next(error);
    }
  }
];

exports.updateBudget = [
  sanitizeInput,
  validate(BudgetSchema.partial().omit({ id: true, created_by: true, created_at: true, updated_at: true })),
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      const actorId = req.user.id;
      const budgetId = req.params.id;
      const { lines, currency, rules_json } = req.body;

      const result = await BudgetDraftService.updateDraft({
        budgetId,
        actorId,
        lines,
        updates: { currency, rulesJson: rules_json }
      });

      // Log successful API call
      logApiCall('PUT', `/partner-budgets/${budgetId}`, 200, Date.now() - startTime, actorId);

      res.json(result);
    } catch (error) {
      // Log error
      logError(error, 'updateBudget', { userId: req.user.id, budgetId });
      
      // Log failed API call
      logApiCall('PUT', `/partner-budgets/${budgetId}`, 500, Date.now() - startTime, req.user.id);
      
      next(error);
    }
  }
];

exports.getBudgetById = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      const budgetId = req.params.id;
      const budget = await BudgetDraftService.hydrateBudget(budgetId);
      if (!budget) {
        // Log failed API call
        logApiCall('GET', `/partner-budgets/${budgetId}`, 404, Date.now() - startTime, req.user.id);
        throw new NotFoundError('Budget not found');
      }
      
      // Log successful API call
      logApiCall('GET', `/partner-budgets/${budgetId}`, 200, Date.now() - startTime, req.user.id);
      
      res.json(budget);
    } catch (error) {
      // Log error
      logError(error, 'getBudgetById', { userId: req.user.id, budgetId });
      
      // Log failed API call
      logApiCall('GET', `/partner-budgets/${budgetId}`, 500, Date.now() - startTime, req.user.id);
      
      next(error);
    }
  }
];

exports.getBudgetsByPartner = async (req, res, next) => {
  try {
    const partnerId = req.params.partner_id;
    const budgets = await PartnerBudgetRepository.findByPartner(partnerId);
    res.json(budgets);
  } catch (error) {
    next(error);
  }
};

exports.getBudgetsByProject = async (req, res, next) => {
  try {
    const projectId = req.params.project_id;
    const budgets = await PartnerBudgetRepository.findByProject(projectId);
    res.json(budgets);
  } catch (error) {
    next(error);
  }
};

exports.validateBudget = async (req, res, next) => {
  try {
    const budgetId = req.params.id;
    const validation = await BudgetValidationService.validateDraft(budgetId);
    res.json(validation);
  } catch (error) {
    next(error);
  }
};

exports.getBudgetTemplates = async (req, res, next) => {
  try {
    const budgetId = req.params.id;
    const templates = await PartnerBudgetTemplateRepository.findByBudget(budgetId);
    res.json(templates);
  } catch (error) {
    next(error);
  }
};

exports.getBudgetLines = async (req, res, next) => {
  try {
    const budgetId = req.params.id;
    const lines = await PartnerBudgetLineRepository.findByBudget(budgetId);
    res.json(lines);
  } catch (error) {
    next(error);
  }
};

exports.submitBudget = [
  sanitizeInput,
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      const actorId = req.user.id;
      const budgetId = req.params.id;

      const response = await BudgetWorkflowService.submitBudget({
        budgetId,
        actorId,
        idempotencyKey: getIdempotencyKey(req),
        requestHash: getRequestHash(req)
      });

      // Log successful API call
      logApiCall('POST', `/partner-budgets/${budgetId}/submit`, 200, Date.now() - startTime, actorId);

      res.json(response);
    } catch (error) {
      // Log error
      logError(error, 'submitBudget', { userId: req.user.id, budgetId });
      
      // Log failed API call
      logApiCall('POST', `/partner-budgets/${budgetId}/submit`, 500, Date.now() - startTime, req.user.id);
      
      next(error);
    }
  }
];

exports.requestRevisions = async (req, res, next) => {
  try {
    const actorId = req.user.id;
    const budgetId = req.params.id;
    const { comment } = req.body;

    const response = await BudgetWorkflowService.requestRevisions({
      budgetId,
      actorId,
      commentBody: comment,
      idempotencyKey: getIdempotencyKey(req),
      requestHash: getRequestHash(req)
    });

    res.json(response);
  } catch (error) {
    next(error);
  }
};

exports.approveAsAccountant = async (req, res, next) => {
  try {
    const actorId = req.user.id;
    const budgetId = req.params.id;
    const { comment } = req.body;

    const response = await BudgetWorkflowService.approveStage({
      budgetId,
      actorId,
      role: 'accountant',
      commentBody: comment,
      idempotencyKey: getIdempotencyKey(req),
      requestHash: getRequestHash(req)
    });

    res.json(response);
  } catch (error) {
    next(error);
  }
};

exports.approveAsBudgetHolder = async (req, res, next) => {
  try {
    const actorId = req.user.id;
    const budgetId = req.params.id;
    const { comment } = req.body;

    const response = await BudgetWorkflowService.approveStage({
      budgetId,
      actorId,
      role: 'budget_holder',
      commentBody: comment,
      idempotencyKey: getIdempotencyKey(req),
      requestHash: getRequestHash(req)
    });

    res.json(response);
  } catch (error) {
    next(error);
  }
};

exports.approveAsFinanceManager = async (req, res, next) => {
  try {
    const actorId = req.user.id;
    const budgetId = req.params.id;
    const { comment } = req.body;

    const response = await BudgetWorkflowService.approveStage({
      budgetId,
      actorId,
      role: 'finance_manager',
      commentBody: comment,
      idempotencyKey: getIdempotencyKey(req),
      requestHash: getRequestHash(req)
    });

    res.json(response);
  } catch (error) {
    next(error);
  }
};

exports.getReviewThread = async (req, res, next) => {
  try {
    const budgetId = req.params.id;
    const thread = await ReviewThreadService.getThread(budgetId);
    res.json(thread);
  } catch (error) {
    next(error);
  }
};

exports.createReviewComment = async (req, res, next) => {
  try {
    const actorId = req.user.id;
    const budgetId = req.params.id;
    const { body, kind, attachments } = req.body;

    const thread = await ReviewThreadService.addComment({
      budgetId,
      actorId,
      kind,
      body,
      attachments
    });

    res.json(thread);
  } catch (error) {
    next(error);
  }
};

exports.resolveReviewComments = async (req, res, next) => {
  try {
    const actorId = req.user.id;
    const budgetId = req.params.id;
    const { comment_ids } = req.body;

    const thread = await ReviewThreadService.resolveComments({
      budgetId,
      actorId,
      commentIds: comment_ids
    });

    res.json(thread);
  } catch (error) {
    next(error);
  }
};