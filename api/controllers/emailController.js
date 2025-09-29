const EmailSSOTService = require('../services/emailSSOTService');
const EmailTemplateRepository = require('../repositories/emailTemplateRepository');
const EmailSenderRepository = require('../repositories/emailSenderRepository');
const EmailProviderRepository = require('../repositories/emailProviderRepository');
const EmailOutboxRepository = require('../repositories/emailOutboxRepository');
const EmailDeliveryRepository = require('../repositories/emailDeliveryRepository');
const EmailSuppressionRepository = require('../repositories/emailSuppressionRepository');
const EmailPreferenceRepository = require('../repositories/emailPreferenceRepository');

class EmailController {
  /**
   * Send an email
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  static async sendEmail(req, res) {
    try {
      const { to, subject, bodyHtml, bodyText, templateId, data } = req.body;
      const context = {
        tenantId: req.user.tenantId,
        actorUserId: req.user.id
      };
      
      // If templateId and data are provided, render the template
      let emailData = { to, subject, bodyHtml, bodyText };
      if (templateId && data) {
        const rendered = await EmailSSOTService.renderTemplate(
          templateId, 
          data, 
          req.user.tenantId
        );
        emailData = { to, ...rendered };
      }
      
      const result = await EmailSSOTService.sendEmail(emailData, context);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  /**
   * Get email templates
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  static async getTemplates(req, res) {
    try {
      const templates = await EmailTemplateRepository.findActive();
      res.json({ success: true, data: templates });
    } catch (error) {
      console.error('Error getting templates:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  /**
   * Get email template by ID
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  static async getTemplateById(req, res) {
    try {
      const { id } = req.params;
      const template = await EmailTemplateRepository.findById(id);
      
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      
      res.json({ success: true, data: template });
    } catch (error) {
      console.error('Error getting template:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  /**
   * Create email template
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  static async createTemplate(req, res) {
    try {
      const templateData = req.body;
      const template = await EmailTemplateRepository.create({
        ...templateData,
        tenantId: req.user.tenantId
      });
      
      res.status(201).json({ success: true, data: template });
    } catch (error) {
      console.error('Error creating template:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  /**
   * Update email template
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  static async updateTemplate(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const template = await EmailTemplateRepository.update(id, updates);
      
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      
      res.json({ success: true, data: template });
    } catch (error) {
      console.error('Error updating template:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  /**
   * Delete email template
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  static async deleteTemplate(req, res) {
    try {
      const { id } = req.params;
      
      const template = await EmailTemplateRepository.findById(id);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      
      await EmailTemplateRepository.delete(id);
      res.json({ success: true, message: 'Template deleted successfully' });
    } catch (error) {
      console.error('Error deleting template:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  /**
   * Get email senders
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  static async getSenders(req, res) {
    try {
      const senders = await EmailSenderRepository.findActive();
      res.json({ success: true, data: senders });
    } catch (error) {
      console.error('Error getting senders:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  /**
   * Create email sender
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  static async createSender(req, res) {
    try {
      const senderData = req.body;
      const sender = await EmailSenderRepository.create({
        ...senderData,
        tenantId: req.user.tenantId
      });
      
      res.status(201).json({ success: true, data: sender });
    } catch (error) {
      console.error('Error creating sender:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  /**
   * Get email providers
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  static async getProviders(req, res) {
    try {
      const providers = await EmailProviderRepository.findActive();
      res.json({ success: true, data: providers });
    } catch (error) {
      console.error('Error getting providers:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  /**
   * Create email provider
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  static async createProvider(req, res) {
    try {
      const providerData = req.body;
      const provider = await EmailProviderRepository.create({
        ...providerData,
        tenantId: req.user.tenantId
      });
      
      res.status(201).json({ success: true, data: provider });
    } catch (error) {
      console.error('Error creating provider:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  /**
   * Get email outbox items
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  static async getOutbox(req, res) {
    try {
      const { limit = 100 } = req.query;
      const outboxItems = await EmailOutboxRepository.findAll(parseInt(limit));
      res.json({ success: true, data: outboxItems });
    } catch (error) {
      console.error('Error getting outbox:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  /**
   * Get email deliveries for an outbox item
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  static async getDeliveries(req, res) {
    try {
      const { id } = req.params;
      const deliveries = await EmailDeliveryRepository.findByOutboxId(id);
      res.json({ success: true, data: deliveries });
    } catch (error) {
      console.error('Error getting deliveries:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  /**
   * Get email suppressions
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  static async getSuppressions(req, res) {
    try {
      const suppressions = await EmailSuppressionRepository.findActive();
      res.json({ success: true, data: suppressions });
    } catch (error) {
      console.error('Error getting suppressions:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  /**
   * Add email to suppression list
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  static async suppressEmail(req, res) {
    try {
      const { email, reason } = req.body;
      const context = {
        tenantId: req.user.tenantId,
        actorUserId: req.user.id
      };
      
      const suppression = await EmailSSOTService.suppressEmail(email, reason, context);
      res.status(201).json({ success: true, data: suppression });
    } catch (error) {
      console.error('Error suppressing email:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  /**
   * Remove email from suppression list
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  static async unsuppressEmail(req, res) {
    try {
      const { email } = req.body;
      const context = {
        tenantId: req.user.tenantId
      };
      
      await EmailSSOTService.unsuppressEmail(email, context);
      res.json({ success: true, message: 'Email unsuppressed successfully' });
    } catch (error) {
      console.error('Error unsuppressing email:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  /**
   * Get user email preferences
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  static async getEmailPreferences(req, res) {
    try {
      const { userId, emailType } = req.params;
      const preferences = await EmailSSOTService.getEmailPreferences(userId, emailType);
      
      if (!preferences) {
        return res.status(404).json({ error: 'Preferences not found' });
      }
      
      res.json({ success: true, data: preferences });
    } catch (error) {
      console.error('Error getting email preferences:', error);
      res.status(500).json({ error: error.message });
    }
  }
  
  /**
   * Update user email preferences
   * @param {object} req - Express request object
   * @param {object} res - Express response object
   */
  static async updateEmailPreferences(req, res) {
    try {
      const { userId, emailType } = req.params;
      const preferences = req.body;
      
      const updated = await EmailSSOTService.updateEmailPreferences(userId, emailType, preferences);
      res.json({ success: true, data: updated });
    } catch (error) {
      console.error('Error updating email preferences:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = EmailController;