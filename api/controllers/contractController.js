const ContractRepository = require('../repositories/contractRepository');
const ContractTemplateRepository = require('../repositories/contractTemplateRepository');
const ContractLifecycleService = require('../services/contracts/contractLifecycleService');
const ContractArtifact = require('../models/contractArtifact');
const { validate } = require('../middleware/validation');
const { ContractSchema, ContractTemplateSchema, ContractArtifactSchema } = require('../schemas/contractSchemas');
const { ValidationError, NotFoundError } = require('../errors');
const { sanitizeInput } = require('../middleware/sanitization');
const { logApiCall, logError } = require('../services/observabilityService');

function toHttpError(error, fallbackStatus = 500) {
  if (error && typeof error.status === 'number') {
    return { status: error.status, message: error.message || 'Internal server error' };
  }
  return { status: fallbackStatus, message: (error && error.message) || 'Internal server error' };
}

/**
 * Template catalogue ---------------------------------------------------------
 */
exports.getContractTemplates = async (req, res) => {
  try {
    const templates = await ContractTemplateRepository.findActive();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: (error && error.message) || 'Failed to load templates' });
  }
};

/**
 * CRUD + lifecycle -----------------------------------------------------------
 */
exports.createContract = [
  sanitizeInput,
  validate(ContractSchema.omit({ id: true, status: true, state_json: true, substatus_json: true, created_by: true, created_at: true, updated_at: true })),
  async (req, res, next) => {
    const startTime = Date.now();
    try {
      const actorId = req.user.id;
      const {
        project_id,
        partner_id,
        partner_budget_id,
        template_id,
        number,
        title
      } = req.body;

      const contract = await ContractLifecycleService.createContract({
        projectId: project_id,
        partnerId: partner_id,
        partnerBudgetId: partner_budget_id,
        templateId: template_id,
        number,
        title,
        actorId
      });

      // Log successful API call
      logApiCall('POST', '/contracts', 201, Date.now() - startTime, actorId);

      res.status(201).json(contract);
    } catch (error) {
      // Log error
      logError(error, 'createContract', { userId: req.user.id });
      
      // Log failed API call
      logApiCall('POST', '/contracts', 500, Date.now() - startTime, req.user.id);
      
      next(error);
    }
  }
];

exports.listContracts = async (req, res) => {
  try {
    const contracts = await ContractRepository.list({
      projectId: req.query.project_id,
      partnerId: req.query.partner_id,
      state: req.query.state
    });
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ error: (error && error.message) || 'Failed to list contracts' });
  }
};

exports.getContractById = async (req, res) => {
  try {
    const contract = await ContractRepository.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    res.json(contract);
  } catch (error) {
    res.status(500).json({ error: (error && error.message) || 'Failed to fetch contract' });
  }
};

exports.generateContract = async (req, res) => {
  try {
    const actorId = req.user.id;
    const { generated_docx_key, merge_preview } = req.body;
    const contract = await ContractLifecycleService.generate({
      contractId: req.params.id,
      actorId,
      renderedDocxKey: generated_docx_key,
      mergePreview: merge_preview
    });
    res.json(contract);
  } catch (error) {
    const { status, message } = toHttpError(error, 500);
    res.status(status).json({ error: message });
  }
};

exports.submitForApproval = async (req, res) => {
  try {
    const actorId = req.user.id;
    const { approval_provider, approval_ref } = req.body;
    const contract = await ContractLifecycleService.submitForApproval({
      contractId: req.params.id,
      actorId,
      approvalProvider: approval_provider,
      approvalRef: approval_ref
    });
    res.json(contract);
  } catch (error) {
    const { status, message } = toHttpError(error, 500);
    res.status(status).json({ error: message });
  }
};

exports.markApproved = async (req, res) => {
  try {
    const actorId = req.user.id;
    const { approved_docx_key } = req.body;
    const contract = await ContractLifecycleService.markApproved({
      contractId: req.params.id,
      actorId,
      approvedDocxKey: approved_docx_key
    });
    res.json(contract);
  } catch (error) {
    const { status, message } = toHttpError(error, 500);
    res.status(status).json({ error: message });
  }
};

exports.sendForSign = async (req, res) => {
  try {
    const actorId = req.user.id;
    const { docusign_envelope_id, substatus_json } = req.body;
    const contract = await ContractLifecycleService.sendForSign({
      contractId: req.params.id,
      actorId,
      envelopeId: docusign_envelope_id,
      substatusJson: substatus_json
    });
    res.json(contract);
  } catch (error) {
    const { status, message } = toHttpError(error, 500);
    res.status(status).json({ error: message });
  }
};

exports.markSigned = async (req, res) => {
  try {
    const actorId = req.user.id;
    const { signed_pdf_key, substatus_json } = req.body;
    const contract = await ContractLifecycleService.markSigned({
      contractId: req.params.id,
      actorId,
      signedPdfKey: signed_pdf_key,
      substatusJson: substatus_json
    });
    res.json(contract);
  } catch (error) {
    const { status, message } = toHttpError(error, 500);
    res.status(status).json({ error: message });
  }
};

exports.activateContract = async (req, res) => {
  try {
    const actorId = req.user.id;
    const contract = await ContractLifecycleService.activate({
      contractId: req.params.id,
      actorId
    });
    res.json(contract);
  } catch (error) {
    const { status, message } = toHttpError(error, 500);
    res.status(status).json({ error: message });
  }
};

exports.cancelContract = async (req, res) => {
  try {
    const actorId = req.user.id;
    const { reason } = req.body;
    const contract = await ContractLifecycleService.cancel({
      contractId: req.params.id,
      actorId,
      reason
    });
    res.json(contract);
  } catch (error) {
    const { status, message } = toHttpError(error, 500);
    res.status(status).json({ error: message });
  }
};

/**
 * Artifacts ------------------------------------------------------------------
 */
exports.listArtifacts = async (req, res) => {
  try {
    const artifacts = await ContractArtifact.findByContractId(req.params.contractId);
    res.json(artifacts);
  } catch (error) {
    res.status(500).json({ error: (error && error.message) || 'Failed to list artifacts' });
  }
};

exports.getLatestArtifact = async (req, res) => {
  try {
    const artifact = await ContractArtifact.findLatestByContractId(req.params.contractId);
    if (!artifact) {
      return res.status(404).json({ error: 'No artifacts found for this contract' });
    }
    res.json(artifact);
  } catch (error) {
    res.status(500).json({ error: (error && error.message) || 'Failed to fetch latest artifact' });
  }
};

exports.downloadArtifact = async (req, res) => {
  try {
    const artifact = await ContractArtifact.findById(req.params.artifactId);
    if (!artifact) {
      return res.status(404).json({ error: 'Artifact not found' });
    }

    res.setHeader('Content-Type', artifact.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${artifact.document_name || artifact.name}"`);
    res.send(`Artifact ${artifact.id} content retrieval not implemented yet.`);
  } catch (error) {
    res.status(500).json({ error: (error && error.message) || 'Failed to download artifact' });
  }
};