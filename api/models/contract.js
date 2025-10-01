const ContractRepository = require('../repositories/contractRepository');
const ContractSSOTRepository = require('../repositories/contractSSOTRepository');

/**
 * Contract model - SSOT-enabled wrapper around ContractRepository
 * Maintains backward compatibility while using SSOT implementation
 */
class Contract {
  constructor(data) {
    this.id = data.id;
    this.projectId = data.projectId || data.project_id;
    this.partnerId = data.partnerId || data.partner_id;
    this.partnerBudgetId = data.partnerBudgetId || data.partner_budget_id || data.budget_id;
    this.templateId = data.templateId || data.template_id;
    this.number = data.number;
    this.title = data.title;
    this.state = data.state || data.status;
    this.substatusJson = data.substatusJson || data.substatus_json || {};
    this.approvalProvider = data.approvalProvider || data.approval_provider;
    this.approvalRef = data.approvalRef || data.approval_ref;
    this.docusignEnvelopeId = data.docusignEnvelopeId || data.docusign_envelope_id || data.envelope_id;
    this.generatedDocxKey = data.generatedDocxKey || data.generated_docx_key;
    this.approvedDocxKey = data.approvedDocxKey || data.approved_docx_key;
    this.signedPdfKey = data.signedPdfKey || data.signed_pdf_key;
    this.metadataJson = data.metadataJson || data.metadata_json || {};
    this.createdBy = data.createdBy || data.created_by;
    this.createdAt = data.createdAt || data.created_at;
    this.updatedAt = data.updatedAt || data.updated_at;

    // Legacy compatibility fields
    this.budget_id = this.partnerBudgetId;
    this.template_id = this.templateId;
    this.status = this.state;
    this.envelope_id = this.docusignEnvelopeId;
    this.created_at = this.createdAt;
    this.updated_at = this.updatedAt;
    this.created_by = this.createdBy;
  }

  static async create(contractData) {
    const payload = {
      id: contractData.id || require('uuid').v4(),
      projectId: contractData.project_id,
      partnerId: contractData.partner_id,
      partnerBudgetId: contractData.budget_id || contractData.partner_budget_id,
      templateId: contractData.template_id,
      number: contractData.number,
      title: contractData.title,
      state: contractData.status || contractData.state || 'DRAFT',
      substatusJson: contractData.substatus_json || {},
      metadataJson: contractData.metadata_json || { description: contractData.description },
      createdBy: contractData.created_by
    };

    const result = await ContractRepository.create(payload);
    return new Contract(result);
  }

  static async findById(id) {
    const result = await ContractRepository.findById(id);
    return result ? new Contract(result) : null;
  }

  static async findByBudgetId(budgetId) {
    // Use partner_budget_id for SSOT compatibility
    const filters = { partnerBudgetId: budgetId };
    const results = await ContractRepository.list(filters);
    return results.map(row => new Contract(row));
  }

  static async findByEnvelopeId(envelopeId) {
    const filters = { docusignEnvelopeId: envelopeId };
    const results = await ContractRepository.list(filters);
    return results.length > 0 ? new Contract(results[0]) : null;
  }

  static async findAll(filters = {}) {
    // Map legacy filter names to SSOT names
    const mappedFilters = {};
    if (filters.status) mappedFilters.state = filters.status;
    if (filters.budget_id) mappedFilters.partnerBudgetId = filters.budget_id;
    if (filters.partner_id) mappedFilters.partnerId = filters.partner_id;
    if (filters.project_id) mappedFilters.projectId = filters.project_id;

    const results = await ContractRepository.list(mappedFilters);
    return results.map(row => new Contract(row));
  }

  async update(updateData) {
    // Map legacy field names to SSOT names
    const mappedUpdates = {};
    if (updateData.status !== undefined) mappedUpdates.state = updateData.status;
    if (updateData.title !== undefined) mappedUpdates.title = updateData.title;
    if (updateData.template_id !== undefined) mappedUpdates.templateId = updateData.template_id;
    if (updateData.envelope_id !== undefined) mappedUpdates.docusignEnvelopeId = updateData.envelope_id;
    if (updateData.partner_id !== undefined) mappedUpdates.partnerId = updateData.partner_id;
    if (updateData.project_id !== undefined) mappedUpdates.projectId = updateData.project_id;
    if (updateData.budget_id !== undefined) mappedUpdates.partnerBudgetId = updateData.budget_id;
    if (updateData.substatus_json !== undefined) mappedUpdates.substatusJson = updateData.substatus_json;
    if (updateData.metadata_json !== undefined) mappedUpdates.metadataJson = updateData.metadata_json;

    // Include direct SSOT field updates
    Object.keys(updateData).forEach(key => {
      if (!mappedUpdates[key] && updateData[key] !== undefined) {
        mappedUpdates[key] = updateData[key];
      }
    });

    const result = await ContractRepository.update(this.id, mappedUpdates);
    if (!result) {
      throw new Error('Contract not found');
    }

    Object.assign(this, result);
    return this;
  }

  async delete() {
    await ContractRepository.delete(this.id);
    return this;
  }

  static async deleteById(id) {
    const contract = await Contract.findById(id);
    if (!contract) {
      return null;
    }
    
    await ContractRepository.delete(id);
    return contract;
  }

  // Legacy compatibility methods
  static async findByPartnerAndProject(partnerId, projectId) {
    return await ContractRepository.findByPartnerAndProject(partnerId, projectId);
  }

  static async updateFields(id, updates) {
    return await ContractRepository.updateFields(id, updates);
  }

  static async updateState(id, state) {
    return await ContractRepository.updateState(id, state);
  }

  static async updateSubstatus(id, substatusJson) {
    return await ContractRepository.updateSubstatus(id, substatusJson);
  }

  static async setApproval(id, provider, reference) {
    return await ContractRepository.setApproval(id, provider, reference);
  }

  static async setEnvelope(id, envelopeId) {
    return await ContractRepository.setEnvelope(id, envelopeId);
  }

  static async setDocumentKey(id, column, key) {
    return await ContractRepository.setDocumentKey(id, column, key);
  }

  static async setMetadata(id, metadataJson) {
    return await ContractRepository.setMetadata(id, metadataJson);
  }

  // SSOT-specific methods
  static async findFromSSOT(id) {
    const result = await ContractSSOTRepository.findById(id);
    return result ? new Contract(result) : null;
  }

  static async listFromSSOT(filters = {}) {
    const results = await ContractSSOTRepository.list(filters);
    return results.map(row => new Contract(row));
  }
}

module.exports = Contract;