const ContractSSOTService = require('../services/contracts/contractSSOTService');

class ContractSSOTController {
  /**
   * Create a new contract
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  static async createContract(req, res, next) {
    try {
      const { projectId, partnerId, budgetId, templateId, number, title } = req.body;
      const actorId = req.user.id;
      
      const contract = await ContractSSOTService.createContract({
        projectId,
        partnerId,
        budgetId,
        templateId,
        number,
        title,
        actorId
      });
      
      res.status(201).json({
        success: true,
        data: contract
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Generate contract document
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  static async generate(req, res, next) {
    try {
      const { id: contractId } = req.params;
      const { renderedDocxKey, mergePreview } = req.body;
      const actorId = req.user.id;
      
      const contract = await ContractSSOTService.generate({
        contractId,
        actorId,
        renderedDocxKey,
        mergePreview
      });
      
      res.json({
        success: true,
        data: contract
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Submit contract for approval
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  static async submitForApproval(req, res, next) {
    try {
      const { id: contractId } = req.params;
      const { approvalProvider, approvalRef } = req.body;
      const actorId = req.user.id;
      
      const contract = await ContractSSOTService.submitForApproval({
        contractId,
        actorId,
        approvalProvider,
        approvalRef
      });
      
      res.json({
        success: true,
        data: contract
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Mark contract as approved
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  static async markApproved(req, res, next) {
    try {
      const { id: contractId } = req.params;
      const { approvedDocxKey } = req.body;
      const actorId = req.user.id;
      
      const contract = await ContractSSOTService.markApproved({
        contractId,
        actorId,
        approvedDocxKey
      });
      
      res.json({
        success: true,
        data: contract
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Send contract for signing
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  static async sendForSign(req, res, next) {
    try {
      const { id: contractId } = req.params;
      const { envelopeId, substatusJson } = req.body;
      const actorId = req.user.id;
      
      const contract = await ContractSSOTService.sendForSign({
        contractId,
        actorId,
        envelopeId,
        substatusJson
      });
      
      res.json({
        success: true,
        data: contract
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Mark contract as signed
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  static async markSigned(req, res, next) {
    try {
      const { id: contractId } = req.params;
      const { signedPdfKey, substatusJson } = req.body;
      const actorId = req.user.id;
      
      const contract = await ContractSSOTService.markSigned({
        contractId,
        actorId,
        signedPdfKey,
        substatusJson
      });
      
      res.json({
        success: true,
        data: contract
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Activate contract
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  static async activate(req, res, next) {
    try {
      const { id: contractId } = req.params;
      const actorId = req.user.id;
      
      const contract = await ContractSSOTService.activate({
        contractId,
        actorId
      });
      
      res.json({
        success: true,
        data: contract
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Cancel contract
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  static async cancel(req, res, next) {
    try {
      const { id: contractId } = req.params;
      const { reason } = req.body;
      const actorId = req.user.id;
      
      const contract = await ContractSSOTService.cancel({
        contractId,
        actorId,
        reason
      });
      
      res.json({
        success: true,
        data: contract
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get contract with budget details
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  static async getContractWithBudget(req, res, next) {
    try {
      const { id: contractId } = req.params;
      
      const contract = await ContractSSOTService.getContractWithBudget(contractId);
      
      if (!contract) {
        return res.status(404).json({
          success: false,
          error: 'Contract not found'
        });
      }
      
      res.json({
        success: true,
        data: contract
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * List contracts by project
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  static async listContractsByProject(req, res, next) {
    try {
      const { projectId } = req.params;
      
      const contracts = await ContractSSOTService.listContractsByProject(projectId);
      
      res.json({
        success: true,
        data: contracts
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * List contracts by partner
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  static async listContractsByPartner(req, res, next) {
    try {
      const { partnerId } = req.params;
      
      const contracts = await ContractSSOTService.listContractsByPartner(partnerId);
      
      res.json({
        success: true,
        data: contracts
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * List contracts by state
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  static async listContractsByState(req, res, next) {
    try {
      const { state } = req.params;
      
      const contracts = await ContractSSOTService.listContractsByState(state);
      
      res.json({
        success: true,
        data: contracts
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ContractSSOTController;