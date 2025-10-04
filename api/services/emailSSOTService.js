const nodemailer = require('nodemailer');
const uuid = require('uuid');
const Mustache = require('mustache');
const EmailTemplateRepository = require('../repositories/emailTemplateRepository');
const EmailSenderRepository = require('../repositories/emailSenderRepository');
const EmailProviderRepository = require('../repositories/emailProviderRepository');
const EmailOutboxRepository = require('../repositories/emailOutboxRepository');
const EmailDeliveryRepository = require('../repositories/emailDeliveryRepository');
const EmailSuppressionRepository = require('../repositories/emailSuppressionRepository');
const EmailPreferenceRepository = require('../repositories/emailPreferenceRepository');
const EmailDigestRepository = require('../repositories/emailDigestRepository');
const db = require('../config/database');
const logger = require('../utils/logger');

class EmailSSOTService {
  /**
   * Send an email
   * @param {object} emailData - Email data including to, subject, body
   * @param {object} context - Context with tenantId and actorUserId
   * @returns {object} The created outbox item
   */
  static async sendEmail(emailData, context = {}) {
    // Check if recipient is suppressed
    const suppression = await EmailSuppressionRepository.findByEmail(
      emailData.to, 
      context.tenantId
    );
    
    if (suppression) {
      throw new Error(`Email address ${emailData.to} is suppressed: ${suppression.reason}`);
    }
    
    // Create outbox item
    const outboxItem = {
      id: uuid.v4(),
      tenantId: context.tenantId || null,
      toAddresses: Array.isArray(emailData.to) ? emailData.to : [emailData.to],
      ccAddresses: emailData.cc || [],
      bccAddresses: emailData.bcc || [],
      subject: emailData.subject,
      bodyHtml: emailData.bodyHtml,
      bodyText: emailData.bodyText,
      templateId: emailData.templateId || null,
      metadata: emailData.metadata || {},
      priority: emailData.priority || 'normal',
      createdBy: context.actorUserId || null,
      createdAt: new Date(),
      status: 'PENDING',
      attempts: 0
    };
    
    return await EmailOutboxRepository.create(outboxItem);
  }
  
  /**
   * Process pending outbox items
   * @param {number} limit - Maximum number of items to process
   * @returns {number} Number of processed items
   */
  static async processOutbox(limit = 100) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Get pending outbox items
      const pendingItems = await EmailOutboxRepository.findPending(limit, client);
      let processedCount = 0;
      
      for (const item of pendingItems) {
        try {
          // Update status to PROCESSING
          await EmailOutboxRepository.update(item.id, { 
            status: 'PROCESSING',
            processedAt: new Date()
          }, client);
          
          // Process the email
          await this.processEmailItem(item, client);
          
          // Mark outbox item as SENT
          await EmailOutboxRepository.update(item.id, { 
            status: 'SENT', 
            processedAt: new Date() 
          }, client);
          
          processedCount++;
        } catch (error) {
          logger.error(`Error processing outbox item ${item.id}:`, error);
          await EmailOutboxRepository.update(item.id, { 
            status: 'FAILED', 
            lastError: error.message,
            attempts: item.attempts + 1
          }, client);
        }
      }
      
      await client.query('COMMIT');
      return processedCount;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Process a single email item
   * @param {object} item - The outbox item to process
   * @param {object} client - Database client
   */
  static async processEmailItem(item, client) {
    // Get provider
    let provider = null;
    if (item.providerId) {
      provider = await EmailProviderRepository.findById(item.providerId, client);
    } else {
      // Get default provider for tenant
      const providers = await EmailProviderRepository.findActiveByTenant(item.tenantId, client);
      provider = providers[0] || null;
    }
    
    if (!provider) {
      throw new Error('No email provider configured');
    }
    
    // Get sender
    let sender = null;
    if (item.senderId) {
      sender = await EmailSenderRepository.findById(item.senderId, client);
    } else if (provider.defaultSender) {
      sender = await EmailSenderRepository.findById(provider.defaultSender, client);
    } else {
      // Get default sender for tenant
      const senders = await EmailSenderRepository.findActive(client);
      sender = senders.find(s => 
        s.tenantId === item.tenantId || (s.tenantId === null && item.tenantId === null)
      ) || null;
    }
    
    if (!sender) {
      throw new Error('No email sender configured');
    }
    
    // Create transporter based on provider
    const transporter = this.createTransporter(provider);
    
    // Process each recipient
    const allRecipients = [
      ...item.toAddresses,
      ...item.ccAddresses,
      ...item.bccAddresses
    ];
    
    for (const recipient of allRecipients) {
      // Check if recipient is suppressed
      const suppression = await EmailSuppressionRepository.findByEmail(
        recipient, 
        item.tenantId,
        client
      );
      
      if (suppression) {
        // Create delivery record with SUPPRESSED status
        const delivery = {
          id: uuid.v4(),
          outboxId: item.id,
          tenantId: item.tenantId,
          toAddress: recipient,
          status: 'SUPPRESSED',
          errorMessage: `Email address suppressed: ${suppression.reason}`,
          createdAt: new Date()
        };
        
        await EmailDeliveryRepository.create(delivery, client);
        continue;
      }
      
      // Create delivery record
      const delivery = {
        id: uuid.v4(),
        outboxId: item.id,
        tenantId: item.tenantId,
        providerId: provider.id,
        toAddress: recipient,
        status: 'QUEUED',
        createdAt: new Date()
      };
      
      await EmailDeliveryRepository.create(delivery, client);
      
      try {
        // Send email
        const mailOptions = {
          from: `"${sender.displayName || sender.name}" <${sender.email}>`,
          to: item.toAddresses.join(', '),
          cc: item.ccAddresses.length > 0 ? item.ccAddresses.join(', ') : undefined,
          bcc: item.bccAddresses.length > 0 ? item.bccAddresses.join(', ') : undefined,
          subject: item.subject,
          html: item.bodyHtml,
          text: item.bodyText
        };
        
        if (sender.replyTo) {
          mailOptions.replyTo = sender.replyTo;
        }
        
        const info = await transporter.sendMail(mailOptions);
        
        // Update delivery record
        await EmailDeliveryRepository.update(delivery.id, {
          messageId: info.messageId,
          status: 'SENT',
          sentAt: new Date(),
          providerData: info
        }, client);
      } catch (error) {
        // Update delivery record with error
        await EmailDeliveryRepository.update(delivery.id, {
          status: 'FAILED',
          errorMessage: error.message,
          errorAt: new Date()
        }, client);
        
        throw error;
      }
    }
  }
  
  /**
   * Create transporter based on provider configuration
   * @param {object} provider - The provider configuration
   * @returns {object} Nodemailer transporter
   */
  static createTransporter(provider) {
    const config = provider.configJson;
    
    switch (provider.providerType) {
      case 'smtp':
        return nodemailer.createTransporter({
          host: config.host,
          port: config.port,
          secure: config.secure,
          auth: {
            user: config.user,
            pass: config.pass
          }
        });
      
      case 'sendgrid':
        return nodemailer.createTransporter({
          service: 'SendGrid',
          auth: {
            user: 'apikey',
            pass: config.apiKey
          }
        });
      
      case 'ses':
        // For SES, you would typically use the AWS SDK
        // This is a simplified example
        return nodemailer.createTransporter({
          service: 'SES',
          auth: {
            user: config.accessKeyId,
            pass: config.secretAccessKey
          }
        });
      
      default:
        throw new Error(`Unsupported provider type: ${provider.providerType}`);
    }
  }
  
  /**
   * Render email template with data
   * @param {string} templateId - The template ID
   * @param {object} data - The data to render with
   * @param {string} tenantId - The tenant ID
   * @returns {object} Rendered subject and body
   */
  static async renderTemplate(templateId, data, tenantId = null) {
    const template = await EmailTemplateRepository.findById(templateId);
    
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }
    
    // Render subject and body
    const subject = Mustache.render(template.subjectTpl, data);
    const bodyHtml = Mustache.render(template.bodyHtmlTpl, data);
    const bodyText = template.bodyTextTpl ? 
      Mustache.render(template.bodyTextTpl, data) : null;
    
    return {
      subject,
      bodyHtml,
      bodyText
    };
  }
  
  /**
   * Add email to suppression list
   * @param {string} email - The email address to suppress
   * @param {string} reason - The reason for suppression
   * @param {object} context - Context with tenantId and actorUserId
   * @returns {object} The created suppression
   */
  static async suppressEmail(email, reason, context = {}) {
    const suppression = {
      id: uuid.v4(),
      tenantId: context.tenantId || null,
      email,
      reason,
      suppressedAt: new Date(),
      createdBy: context.actorUserId || null,
      active: true
    };
    
    return await EmailSuppressionRepository.create(suppression);
  }
  
  /**
   * Remove email from suppression list
   * @param {string} email - The email address to unsuppress
   * @param {object} context - Context with tenantId
   */
  static async unsuppressEmail(email, context = {}) {
    const suppression = await EmailSuppressionRepository.findByEmail(
      email, 
      context.tenantId
    );
    
    if (suppression) {
      await EmailSuppressionRepository.update(suppression.id, { active: false });
    }
  }
  
  /**
   * Get user email preferences
   * @param {string} userId - The user ID
   * @param {string} emailType - The email type
   * @returns {object} The email preferences
   */
  static async getEmailPreferences(userId, emailType) {
    return await EmailPreferenceRepository.findByUserAndType(userId, emailType);
  }
  
  /**
   * Update user email preferences
   * @param {string} userId - The user ID
   * @param {string} emailType - The email type
   * @param {object} preferences - The preferences to update
   * @returns {object} The updated preferences
   */
  static async updateEmailPreferences(userId, emailType, preferences) {
    const existing = await EmailPreferenceRepository.findByUserAndType(userId, emailType);
    
    if (existing) {
      return await EmailPreferenceRepository.update(userId, emailType, preferences);
    } else {
      const newPreferences = {
        id: uuid.v4(),
        userId,
        emailType,
        ...preferences
      };
      
      return await EmailPreferenceRepository.create(newPreferences);
    }
  }
  
  /**
   * Process email digests
   * @param {number} limit - Maximum number of digests to process
   * @returns {number} Number of processed digests
   */
  static async processDigests(limit = 100) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Get digests that are due for processing
      const dueDigests = await EmailDigestRepository.findDueForProcessing(limit, client);
      let processedCount = 0;
      
      for (const digest of dueDigests) {
        try {
          // Process the digest
          await this.processDigest(digest, client);
          
          // Update next run time based on frequency
          let nextRunAt = new Date();
          switch (digest.frequency) {
            case 'daily':
              nextRunAt.setDate(nextRunAt.getDate() + 1);
              break;
            case 'weekly':
              nextRunAt.setDate(nextRunAt.getDate() + 7);
              break;
            case 'monthly':
              nextRunAt.setMonth(nextRunAt.getMonth() + 1);
              break;
            default:
              nextRunAt.setDate(nextRunAt.getDate() + 1);
          }
          
          // Update digest record
          await EmailDigestRepository.update(digest.id, {
            lastRunAt: new Date(),
            nextRunAt,
            itemsJson: [] // Clear items after processing
          }, client);
          
          processedCount++;
        } catch (error) {
          logger.error(`Error processing digest ${digest.id}:`, error);
          // Continue with other digests
        }
      }
      
      await client.query('COMMIT');
      return processedCount;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Process a single digest
   * @param {object} digest - The digest to process
   * @param {object} client - Database client
   */
  static async processDigest(digest, client) {
    // This is a simplified implementation
    // In a real system, you would collect items for the digest
    // and send them as a single email
    
    if (!digest.itemsJson || digest.itemsJson.length === 0) {
      return;
    }
    
    // Create outbox item for digest email
    const outboxItem = {
      id: uuid.v4(),
      tenantId: digest.tenantId,
      toAddresses: [digest.userId], // In a real system, you'd get the user's email
      subject: `Your ${digest.emailType} digest`,
      bodyHtml: `<p>You have ${digest.itemsJson.length} items in your digest:</p>
                 <ul>
                   ${digest.itemsJson.map(item => `<li>${item.title}</li>`).join('')}
                 </ul>`,
      metadata: {
        digestId: digest.id,
        itemsCount: digest.itemsJson.length
      },
      priority: 'normal',
      createdAt: new Date(),
      status: 'PENDING',
      attempts: 0
    };
    
    await EmailOutboxRepository.create(outboxItem, client);
  }
}

module.exports = EmailSSOTService;