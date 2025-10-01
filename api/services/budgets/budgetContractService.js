const crypto = require('crypto');
const ContractRepository = require('../../repositories/contractRepository');
const { v4: uuidv4 } = require('uuid');

const CONTRACT_SELECT = `
  SELECT id FROM contracts
  WHERE partner_budget_id = $1
  ORDER BY created_at DESC
  LIMIT 1
`;

const ARTIFACT_INSERT = `
  INSERT INTO contract_artifacts (
    id,
    contract_id,
    document_uri,
    document_name,
    mime_type,
    version,
    checksum,
    created_at
  )
  VALUES (
    gen_random_uuid(),
    $1,
    $2,
    $3,
    'text/plain',
    $4,
    $5,
    now()
  )
  RETURNING *
`;

const PROJECT_SELECT = `
  SELECT name
  FROM projects
  WHERE id = $1
`;

const ORGANIZATION_SELECT = `
  SELECT name
  FROM organizations
  WHERE id = $1
`;

class BudgetContractService {
  static async provisionContract({ budget, actorId, client }) {
    const existing = await client.query(CONTRACT_SELECT, [budget.id]);
    if (existing.rows.length) {
      return existing.rows[0];
    }

    const projectName = await BudgetContractService.lookupProjectName(budget.projectId, client);
    const partnerName = await BudgetContractService.lookupPartnerName(budget.partnerId, client);

    const title = `Grant Agreement – ${projectName ?? budget.projectId}`;
    const description = [
      `Partner: ${partnerName ?? budget.partnerId}`,
      `Budget ID: ${budget.id}`,
      `Currency: ${budget.currency}`,
      `Ceiling Total: ${Number(budget.ceilingTotal || 0).toFixed(2)}`
    ].join('\n');

    const templateId = BudgetContractService.resolveTemplateId(budget);

    // Use SSOT-enabled ContractRepository
    const contractPayload = {
      id: uuidv4(),
      projectId: budget.projectId,
      partnerId: budget.partnerId,
      partnerBudgetId: budget.id,
      templateId: templateId,
      number: null, // Will be generated later
      title: title,
      state: 'DRAFT',
      substatusJson: {},
      metadataJson: { description },
      createdBy: actorId
    };

    const contract = await ContractRepository.create(contractPayload, client);

    const summary = BudgetContractService.buildContractSummary({
      contract,
      projectName,
      partnerName,
      budget
    });

    const checksum = crypto.createHash('md5').update(summary).digest('hex');
    const documentUri = `generated://${contract.id}/contract-summary.txt`;
    const artifactName = `${contract.id}-summary.txt`;

    await client.query(ARTIFACT_INSERT, [
      contract.id,
      documentUri,
      artifactName,
      1,
      checksum
    ]);

    return contract;
  }

  static resolveTemplateId(budget) {
    if (!budget.rulesJson) {
      return 'standard-subgrant';
    }
    try {
      const rules = typeof budget.rulesJson === 'string'
        ? JSON.parse(budget.rulesJson)
        : budget.rulesJson;
      if (rules?.contractTemplateId) {
        return rules.contractTemplateId;
      }
    } catch (error) {
      // fall through to default template
    }
    return 'standard-subgrant';
  }

  static async lookupProjectName(projectId, client) {
    if (!projectId) {
      return null;
    }
    const result = await client.query(PROJECT_SELECT, [projectId]);
    return result.rows[0]?.name ?? null;
  }

  static async lookupPartnerName(organizationId, client) {
    if (!organizationId) {
      return null;
    }
    const result = await client.query(ORGANIZATION_SELECT, [organizationId]);
    return result.rows[0]?.name ?? null;
  }

  static buildContractSummary({ contract, projectName, partnerName, budget }) {
    const lines = [
      `Contract ID: ${contract.id}`,
      `Budget ID: ${budget.id}`,
      `Project: ${projectName ?? 'Unknown project'}`,
      `Partner: ${partnerName ?? 'Unknown partner'}`,
      `Currency: ${budget.currency}`,
      `Ceiling Total: ${Number(budget.ceilingTotal || 0).toFixed(2)}`,
      `Status: ${contract.status}`,
      `Template: ${contract.template_id}`,
      `Created At: ${contract.created_at}`
    ];
    return lines.join('\n');
  }
}

module.exports = BudgetContractService;