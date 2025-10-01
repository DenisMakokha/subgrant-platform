const PartnerBudgetRepository = require('../repositories/partnerBudgetRepository');
const PartnerBudgetSSOTRepository = require('../repositories/partnerBudgetSSOTRepository');

/**
 * Budget model - SSOT-enabled wrapper around PartnerBudgetRepository
 * Maintains backward compatibility while using SSOT implementation
 */
class Budget {
  constructor(data) {
    this.id = data.id;
    this.projectId = data.projectId || data.project_id;
    this.partnerId = data.partnerId || data.partner_id || data.organization_id;
    this.currency = data.currency;
    this.ceilingTotal = data.ceilingTotal || data.ceiling_total || data.total_amount;
    this.status = data.status;
    this.rulesJson = data.rulesJson || data.rules_json || {};
    this.createdBy = data.createdBy || data.created_by;
    this.createdAt = data.createdAt || data.created_at;
    this.updatedAt = data.updatedAt || data.updated_at;

    // Legacy compatibility fields
    this.organization_id = this.partnerId;
    this.total_amount = this.ceilingTotal;
    this.created_at = this.createdAt;
    this.updated_at = this.updatedAt;
    this.created_by = this.createdBy;
  }

  // Static methods for KPI calculations using SSOT
  static async countAll() {
    const result = await PartnerBudgetRepository.findByProject();
    return result.length;
  }

  static async countApproved() {
    const result = await PartnerBudgetRepository.findByStatus('APPROVED');
    return result.length;
  }

  static async countByOrganization(organizationId) {
    const result = await PartnerBudgetRepository.findByPartner(organizationId);
    return result.length;
  }

  static async countApprovedByOrganization(organizationId) {
    const result = await PartnerBudgetRepository.findByPartner(organizationId);
    return result.filter(budget => budget.status === 'APPROVED').length;
  }

  static async countByProject(projectId) {
    const result = await PartnerBudgetRepository.findByProject(projectId);
    return result.length;
  }

  static async countApprovedByProject(projectId) {
    const result = await PartnerBudgetRepository.findByProject(projectId);
    return result.filter(budget => budget.status === 'APPROVED').length;
  }

  static async getTotalAmount() {
    const result = await PartnerBudgetRepository.findByStatus('APPROVED');
    return result.reduce((sum, budget) => sum + (parseFloat(budget.ceilingTotal) || 0), 0);
  }

  static async getTotalAmountByOrganization(organizationId) {
    const result = await PartnerBudgetRepository.findByPartner(organizationId);
    const approvedBudgets = result.filter(budget => budget.status === 'APPROVED');
    return approvedBudgets.reduce((sum, budget) => sum + (parseFloat(budget.ceilingTotal) || 0), 0);
  }

  static async getTotalAmountByProject(projectId) {
    const result = await PartnerBudgetRepository.findByProject(projectId);
    const approvedBudgets = result.filter(budget => budget.status === 'APPROVED');
    return approvedBudgets.reduce((sum, budget) => sum + (parseFloat(budget.ceilingTotal) || 0), 0);
  }

  // Instance methods
  static async create(budgetData) {
    const payload = {
      id: budgetData.id || require('uuid').v4(),
      projectId: budgetData.project_id,
      partnerId: budgetData.organization_id || budgetData.partner_id,
      currency: budgetData.currency,
      ceilingTotal: budgetData.total_amount || budgetData.ceiling_total,
      status: budgetData.status || 'DRAFT',
      rulesJson: budgetData.rules_json || {},
      createdBy: budgetData.created_by
    };

    const result = await PartnerBudgetRepository.create(payload);
    return new Budget(result);
  }

  static async findById(id) {
    const result = await PartnerBudgetRepository.findById(id);
    return result ? new Budget(result) : null;
  }

  static async findByOrganization(organizationId) {
    const results = await PartnerBudgetRepository.findByPartner(organizationId);
    return results.map(row => new Budget(row));
  }

  static async findByProject(projectId) {
    const results = await PartnerBudgetRepository.findByProject(projectId);
    return results.map(row => new Budget(row));
  }

  static async findByPartnerAndProject(partnerId, projectId) {
    const results = await PartnerBudgetRepository.findByPartnerAndProject(partnerId, projectId);
    return results.map(row => new Budget(row));
  }

  async update(updateData) {
    const mappedUpdates = {};
    if (updateData.total_amount !== undefined) mappedUpdates.ceilingTotal = updateData.total_amount;
    if (updateData.ceiling_total !== undefined) mappedUpdates.ceilingTotal = updateData.ceiling_total;
    if (updateData.organization_id !== undefined) mappedUpdates.partnerId = updateData.organization_id;
    if (updateData.partner_id !== undefined) mappedUpdates.partnerId = updateData.partner_id;
    if (updateData.project_id !== undefined) mappedUpdates.projectId = updateData.project_id;
    if (updateData.currency !== undefined) mappedUpdates.currency = updateData.currency;
    if (updateData.status !== undefined) mappedUpdates.status = updateData.status;
    if (updateData.rules_json !== undefined) mappedUpdates.rulesJson = updateData.rules_json;

    const result = await PartnerBudgetRepository.update(this.id, mappedUpdates);
    if (!result) {
      throw new Error('Budget not found');
    }

    Object.assign(this, result);
    return this;
  }

  async delete() {
    await PartnerBudgetRepository.delete(this.id);
    return this;
  }

  static async deleteById(id) {
    const budget = await Budget.findById(id);
    if (!budget) {
      return null;
    }
    
    await PartnerBudgetRepository.delete(id);
    return budget;
  }

  // SSOT-specific methods
  static async findFromSSOT(id) {
    const result = await PartnerBudgetSSOTRepository.findById(id);
    return result ? new Budget(result) : null;
  }

  static async listFromSSOT(filters = {}) {
    const results = await PartnerBudgetSSOTRepository.list(filters);
    return results.map(row => new Budget(row));
  }

  // Transition methods
  async transitionStatus(nextStatus, actorId) {
    const result = await PartnerBudgetRepository.transitionStatus(this.id, nextStatus, actorId);
    if (!result) {
      throw new Error('Budget not found');
    }

    Object.assign(this, result);
    return this;
  }

  async lock() {
    const result = await PartnerBudgetRepository.lockBudget(this.id);
    if (!result) {
      throw new Error('Budget not found');
    }

    Object.assign(this, result);
    return this;
  }
}

module.exports = Budget;