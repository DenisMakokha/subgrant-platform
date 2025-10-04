const Disbursement = require('../models/disbursement');
const { validateDisbursement } = require('../middleware/validation');
const currencyService = require('../services/currencyService');
const xeroService = require('../services/xeroService');
const auditLogger = require('../middleware/auditLogger');
const logger = require('../utils/logger');

class DisbursementController {
  // Create a new disbursement
  static async createDisbursement(req, res, next) {
    try {
      const disbursementData = {
        ...req.body,
        created_by: req.user.id,
        updated_by: req.user.id
      };

      // Validate disbursement data
      const { error } = validateDisbursement(disbursementData);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const disbursement = await Disbursement.create(disbursementData);
      
      // Log the disbursement creation
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'CREATE_DISBURSEMENT',
          entity_type: 'disbursement',
          entity_id: disbursement.id,
          before_state: null,
          after_state: disbursement,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        logger.error('Error creating audit log:', auditError);
      }
      
      res.status(201).json(disbursement);
    } catch (err) {
      next(err);
    }
  }

  // Get a disbursement by ID
  static async getDisbursementById(req, res, next) {
    try {
      const { id } = req.params;
      const disbursement = await Disbursement.findById(id);

      if (!disbursement) {
        return res.status(404).json({ error: 'Disbursement not found' });
      }

      res.json(disbursement);
    } catch (err) {
      next(err);
    }
  }

  // Get disbursements by partner budget ID (SSOT)
  static async getDisbursementsByBudgetId(req, res, next) {
    try {
      const { budgetId } = req.params;
      // Now using partner_budget_id from SSOT
      const disbursements = await Disbursement.findByPartnerBudgetId(budgetId);
      res.json(disbursements);
    } catch (err) {
      next(err);
    }
  }

  // Get all disbursements with optional filters
  static async getAllDisbursements(req, res, next) {
    try {
      const filters = req.query;
      const disbursements = await Disbursement.findAll(filters);
      res.json(disbursements);
    } catch (err) {
      next(err);
    }
  }

  // Update a disbursement
  static async updateDisbursement(req, res, next) {
    try {
      const { id } = req.params;
      const disbursement = await Disbursement.findById(id);

      if (!disbursement) {
        return res.status(404).json({ error: 'Disbursement not found' });
      }

      // Validate disbursement data if provided
      if (Object.keys(req.body).length > 0) {
        const { error } = validateDisbursement(req.body);
        if (error) {
          return res.status(400).json({ error: error.details[0].message });
        }
      }

      const updateData = {
        ...req.body,
        updated_by: req.user.id
      };

      const updatedDisbursement = await disbursement.update(updateData);
      
      // Log the disbursement update
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'UPDATE_DISBURSEMENT',
          entity_type: 'disbursement',
          entity_id: id,
          before_state: disbursement,
          after_state: updatedDisbursement,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        logger.error('Error creating audit log:', auditError);
      }
      
      res.json(updatedDisbursement);
    } catch (err) {
      next(err);
    }
  }

  // Delete a disbursement
  static async deleteDisbursement(req, res, next) {
    try {
      const { id } = req.params;
      const disbursement = await Disbursement.findById(id);

      if (!disbursement) {
        return res.status(404).json({ error: 'Disbursement not found' });
      }

      await Disbursement.deleteById(id);
      
      // Log the disbursement deletion
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'DELETE_DISBURSEMENT',
          entity_type: 'disbursement',
          entity_id: id,
          before_state: disbursement,
          after_state: null,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        logger.error('Error creating audit log:', auditError);
      }

      res.json({ message: 'Disbursement deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  // Update disbursement status
  static async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const disbursement = await Disbursement.findById(id);
      
      if (!disbursement) {
        return res.status(404).json({ error: 'Disbursement not found' });
      }
      
      // If status is changing to 'invoiced', create Xero invoice
      if (status === 'invoiced' && disbursement.status !== 'invoiced') {
        try {
          // Get organization details for the disbursement
          // This would typically come from the project or budget associated with the disbursement
          const organization = await Disbursement.getOrganizationForDisbursement(id);
          
          // Create Xero invoice
          const xeroResponse = await xeroService.createDisbursementInvoice(disbursement, organization);
          updateData.invoice_id = xeroResponse.InvoiceID;
        } catch (xeroError) {
          logger.error('Error creating Xero invoice:', xeroError);
          // Depending on requirements, we might want to continue or fail here
        }
      }
      
      // If status is changing to 'paid', reconcile with Xero
      if (status === 'paid' && disbursement.status !== 'paid') {
        try {
          // In a real implementation, we would reconcile with Xero
          logger.info(`Would reconcile Xero payment for disbursement ${disbursement.id}`);
          // const xeroResponse = await xeroService.reconcilePayment(disbursement.invoice_id);
        } catch (xeroError) {
          logger.error('Error reconciling Xero payment:', xeroError);
          // Depending on requirements, we might want to continue or fail here
        }
      }
      
      const updateData = { status };
      
      // If we created a Xero invoice, include the invoice_id in the update
      if (xeroResponse && xeroResponse.InvoiceID) {
        updateData.invoice_id = xeroResponse.InvoiceID;
      }
      
      const updatedDisbursement = await disbursement.update(updateData);
      
      // Log the status update
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'UPDATE_DISBURSEMENT_STATUS',
          entity_type: 'disbursement',
          entity_id: id,
          before_state: disbursement,
          after_state: updatedDisbursement,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        logger.error('Error creating audit log:', auditError);
      }
      
      res.json(updatedDisbursement);
    } catch (err) {
      next(err);
    }
  }

  // Mark disbursement as paid
  static async markAsPaid(req, res, next) {
    try {
      const { id } = req.params;
      const { paid_at } = req.body;
      const disbursement = await Disbursement.findById(id);
      
      if (!disbursement) {
        return res.status(404).json({ error: 'Disbursement not found' });
      }
      
      // Reconcile with Xero before marking as paid
      if (disbursement.invoice_id) {
        try {
          // Reconcile with Xero
          const xeroResponse = await xeroService.reconcilePayment(disbursement.invoice_id);
        } catch (xeroError) {
          logger.error('Error reconciling Xero payment:', xeroError);
          // Depending on requirements, we might want to continue or fail here
        }
      }
      
      const updateData = {
        status: 'paid',
        paid_at: paid_at || new Date()
      };
      
      const updatedDisbursement = await disbursement.update(updateData);
      
      // Log the payment marking
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'MARK_DISBURSEMENT_AS_PAID',
          entity_type: 'disbursement',
          entity_id: id,
          before_state: disbursement,
          after_state: updatedDisbursement,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        logger.error('Error creating audit log:', auditError);
      }
      
      res.json(updatedDisbursement);
    } catch (err) {
      next(err);
    }
  }

  // Mark disbursement as reconciled
  static async markAsReconciled(req, res, next) {
    try {
      const { id } = req.params;
      const disbursement = await Disbursement.findById(id);
      
      if (!disbursement) {
        return res.status(404).json({ error: 'Disbursement not found' });
      }
      
      // Reconcile with Xero before marking as reconciled
      if (disbursement.invoice_id) {
        try {
          // Reconcile with Xero
          const xeroResponse = await xeroService.reconcilePayment(disbursement.invoice_id);
        } catch (xeroError) {
          logger.error('Error reconciling Xero payment:', xeroError);
          // Depending on requirements, we might want to continue or fail here
        }
      }
      
      const updateData = {
        status: 'reconciled',
        reconciled_at: new Date(),
        reconciled_by: req.user.id
      };
      
      const updatedDisbursement = await disbursement.update(updateData);
      
      // Log the reconciliation
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'MARK_DISBURSEMENT_AS_RECONCILED',
          entity_type: 'disbursement',
          entity_id: id,
          before_state: disbursement,
          after_state: updatedDisbursement,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        logger.error('Error creating audit log:', auditError);
      }
      
      res.json(updatedDisbursement);
    } catch (err) {
      next(err);
    }
  }

  // Get total disbursement amount in a specific currency
  static async getTotalAmountInCurrency(req, res, next) {
    try {
      const { targetCurrency } = req.params;
      const { budgetId } = req.query;
      
      // Validate target currency
      const supportedCurrencies = currencyService.getSupportedCurrencies();
      if (!supportedCurrencies.includes(targetCurrency)) {
        return res.status(400).json({ error: `Unsupported currency: ${targetCurrency}` });
      }
      
      // Get disbursements (filtered by budgetId if provided)
      let disbursements;
      if (budgetId) {
        disbursements = await Disbursement.findByBudgetId(budgetId);
      } else {
        disbursements = await Disbursement.findAll();
      }
      
      // Convert all amounts to target currency and sum them up
      let totalAmount = 0;
      for (const disbursement of disbursements) {
        const convertedAmount = await currencyService.convertCurrency(
          disbursement.amount,
          disbursement.currency,
          targetCurrency
        );
        totalAmount += convertedAmount;
      }
      
      res.json({
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        currency: targetCurrency,
        count: disbursements.length
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = DisbursementController;