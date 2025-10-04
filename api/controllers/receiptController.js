const Receipt = require('../models/receipt');
const { validateReceipt } = require('../middleware/validation');
const auditLogger = require('../middleware/auditLogger');
const logger = require('../utils/logger');

class ReceiptController {
  // Create a new receipt
  static async createReceipt(req, res, next) {
    try {
      const receiptData = {
        ...req.body,
        created_by: req.user.id
      };

      // Validate receipt data
      const { error } = validateReceipt(receiptData);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const receipt = await Receipt.create(receiptData);
      
      // Log the receipt creation
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'CREATE_RECEIPT',
          entity_type: 'receipt',
          entity_id: receipt.id,
          before_state: null,
          after_state: receipt,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        logger.error('Error creating audit log:', auditError);
      }
      
      res.status(201).json(receipt);
    } catch (err) {
      next(err);
    }
  }

  // Get a receipt by ID
  static async getReceiptById(req, res, next) {
    try {
      const { id } = req.params;
      const receipt = await Receipt.findById(id);

      if (!receipt) {
        return res.status(404).json({ error: 'Receipt not found' });
      }

      res.json(receipt);
    } catch (err) {
      next(err);
    }
  }

  // Get receipts by financial report ID
  static async getReceiptsByFinancialReportId(req, res, next) {
    try {
      const { financialReportId } = req.params;
      const receipts = await Receipt.findByFinancialReportId(financialReportId);
      res.json(receipts);
    } catch (err) {
      next(err);
    }
  }

  // Get receipts by budget line ID
  static async getReceiptsByBudgetLineId(req, res, next) {
    try {
      const { budgetLineId } = req.params;
      const receipts = await Receipt.findByBudgetLineId(budgetLineId);
      res.json(receipts);
    } catch (err) {
      next(err);
    }
  }

  // Get all receipts with optional filters
  static async getAllReceipts(req, res, next) {
    try {
      const filters = req.query;
      const receipts = await Receipt.findAll(filters);
      res.json(receipts);
    } catch (err) {
      next(err);
    }
  }

  // Update a receipt
  static async updateReceipt(req, res, next) {
    try {
      const { id } = req.params;
      const receipt = await Receipt.findById(id);

      if (!receipt) {
        return res.status(404).json({ error: 'Receipt not found' });
      }

      // Validate receipt data if provided
      if (Object.keys(req.body).length > 0) {
        const { error } = validateReceipt(req.body);
        if (error) {
          return res.status(400).json({ error: error.details[0].message });
        }
      }

      const updateData = {
        ...req.body
      };

      const updatedReceipt = await receipt.update(updateData);
      
      // Log the receipt update
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'UPDATE_RECEIPT',
          entity_type: 'receipt',
          entity_id: id,
          before_state: receipt,
          after_state: updatedReceipt,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        logger.error('Error creating audit log:', auditError);
      }
      
      res.json(updatedReceipt);
    } catch (err) {
      next(err);
    }
  }

  // Delete a receipt
  static async deleteReceipt(req, res, next) {
    try {
      const { id } = req.params;
      const receipt = await Receipt.findById(id);

      if (!receipt) {
        return res.status(404).json({ error: 'Receipt not found' });
      }

      await Receipt.deleteById(id);
      
      // Log the receipt deletion
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'DELETE_RECEIPT',
          entity_type: 'receipt',
          entity_id: id,
          before_state: receipt,
          after_state: null,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        logger.error('Error creating audit log:', auditError);
      }

      res.json({ message: 'Receipt deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ReceiptController;