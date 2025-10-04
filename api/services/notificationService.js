const uuid = require('uuid');
const NotificationEventRepository = require('../repositories/notificationEventRepository');
const NotificationTemplateRepository = require('../repositories/notificationTemplateRepository');
const NotificationPreferencesRepository = require('../repositories/notificationPreferencesRepository');
const NotificationOutboxRepository = require('../repositories/notificationOutboxRepository');
const NotificationJobsRepository = require('../repositories/notificationJobsRepository');
const NotificationInboxRepository = require('../repositories/notificationInboxRepository');
const db = require('../config/database');
const logger = require('../utils/logger');

class NotificationService {
  /**
   * Emit a notification event
   * @param {string} eventKey - The event key
   * @param {object} payload - The event payload
   * @param {object} context - Context with tenantId and actorUserId
   * @returns {object} The created outbox item
   */
  static async emitNotification(eventKey, payload, context = {}) {
    const outboxItem = {
      id: uuid.v4(),
      tenantId: context.tenantId || null,
      eventKey,
      payload,
      createdBy: context.actorUserId || null,
      createdAt: new Date(),
      status: 'PENDING',
      attempts: 0
    };
    
    return await NotificationOutboxRepository.create(outboxItem);
  }
  
  /**
   * Process pending outbox items (Fanout worker)
   * @param {number} limit - Maximum number of items to process
   * @returns {number} Number of processed items
   */
  static async processOutbox(limit = 100) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Get pending outbox items
      const pendingItems = await NotificationOutboxRepository.findPending(limit, client);
      let processedCount = 0;
      
      for (const item of pendingItems) {
        try {
          // Validate payload against event schema
          const event = await NotificationEventRepository.findByKey(item.eventKey, client);
          if (!event) {
            throw new Error(`Event ${item.eventKey} not found`);
          }
          
          // TODO: Validate payload against event.payload_schema
          
          // Resolve audience via routing rules
          // TODO: Implement routing rules resolution
          // For now, we'll use a simple approach
          const audience = await this.resolveAudience(item.eventKey, item.payload, item.tenantId, client);
          
          // Expand to users
          const users = await this.expandToUsers(audience, item.tenantId, client);
          
          // Create jobs for each user
          for (const userId of users) {
            const prefs = await NotificationPreferencesRepository.findActiveByUser(userId, client);
            
            for (const pref of prefs) {
              if (pref.eventKey === item.eventKey) {
                const job = {
                  id: uuid.v4(),
                  outboxId: item.id,
                  tenantId: item.tenantId,
                  eventKey: item.eventKey,
                  recipientUser: userId,
                  channel: pref.channel,
                  lang: 'en', // TODO: Get user language preference
                  state: 'QUEUED'
                };
                
                await NotificationJobsRepository.create(job, client);
              }
            }
          }
          
          // Mark outbox item as processed
          await NotificationOutboxRepository.update(item.id, { 
            status: 'DONE', 
            processedAt: new Date() 
          }, client);
          
          processedCount++;
        } catch (error) {
          logger.error(`Error processing outbox item ${item.id}:`, error);
          await NotificationOutboxRepository.update(item.id, { 
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
   * Deliver a notification job (Delivery worker)
   * @param {string} jobId - The job ID to deliver
   * @returns {object} The updated job
   */
  static async deliverJob(jobId) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      const job = await NotificationJobsRepository.findById(jobId, client);
      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }
      
      if (job.state !== 'QUEUED') {
        throw new Error(`Job ${jobId} is not in QUEUED state`);
      }
      
      // Update job state to SENDING
      await NotificationJobsRepository.update(jobId, { state: 'SENDING' }, client);
      
      try {
        // Choose template
        const template = await this.chooseTemplate(
          job.tenantId, 
          job.eventKey, 
          job.channel, 
          job.lang, 
          client
        );
        
        if (!template) {
          throw new Error(`No template found for event ${job.eventKey}, channel ${job.channel}, lang ${job.lang}`);
        }
        
        // Render template
        const rendered = this.renderTemplate(template, job);
        
        if (job.channel === 'inapp') {
          // Create inbox entry
          const inboxItem = {
            id: uuid.v4(),
            userId: job.recipientUser,
            tenantId: job.tenantId,
            eventKey: job.eventKey,
            title: rendered.title || 'Notification',
            body: rendered.body,
            linkUrl: rendered.linkUrl || null,
            unread: true
          };
          
          await NotificationInboxRepository.create(inboxItem, client);
          await NotificationJobsRepository.update(jobId, { 
            state: 'SENT', 
            sentAt: new Date() 
          }, client);
        } else if (job.channel === 'email') {
          // TODO: Send email via provider
          // For now, we'll just mark as sent
          await NotificationJobsRepository.update(jobId, { 
            state: 'SENT', 
            sentAt: new Date(),
            providerResp: { status: 'mock_sent' }
          }, client);
        } else {
          throw new Error(`Unsupported channel: ${job.channel}`);
        }
        
        await client.query('COMMIT');
        return await NotificationJobsRepository.findById(jobId, client);
      } catch (error) {
        await NotificationJobsRepository.update(jobId, { 
          state: 'FAILED', 
          error: error.message 
        }, client);
        await client.query('COMMIT');
        return await NotificationJobsRepository.findById(jobId, client);
      }
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Resolve audience for an event
   * @param {string} eventKey - The event key
   * @param {object} payload - The event payload
   * @param {string} tenantId - The tenant ID
   * @param {object} client - Database client
   * @returns {object} The audience
   */
  static async resolveAudience(eventKey, payload, tenantId, client) {
    // TODO: Implement proper audience resolution using routing rules
    // For now, return a default audience
    return {
      roles: [],
      users: [],
      scope: {}
    };
  }
  
  /**
   * Expand audience to concrete user IDs
   * @param {object} audience - The audience
   * @param {string} tenantId - The tenant ID
   * @param {object} client - Database client
   * @returns {string[]} Array of user IDs
   */
  static async expandToUsers(audience, tenantId, client) {
    // TODO: Implement proper user expansion based on roles, scope, etc.
    // For now, return an empty array
    return [];
  }
  
  /**
   * Choose template for a job
   * @param {string} tenantId - The tenant ID
   * @param {string} eventKey - The event key
   * @param {string} channel - The channel
   * @param {string} lang - The language
   * @param {object} client - Database client
   * @returns {object} The template
   */
  static async chooseTemplate(tenantId, eventKey, channel, lang, client) {
    // Try to find tenant-specific template
    if (tenantId) {
      const tenantTemplates = await NotificationTemplateRepository.findByTenantAndEvent(
        tenantId, eventKey, client
      );
      
      const template = tenantTemplates.find(t => 
        t.channel === channel && t.lang === lang && t.active
      );
      
      if (template) {
        return template;
      }
    }
    
    // Fall back to global template
    const globalTemplates = await NotificationTemplateRepository.findGlobalTemplatesByEvent(
      eventKey, client
    );
    
    const template = globalTemplates.find(t => 
      t.channel === channel && t.lang === lang && t.active
    );
    
    return template || null;
  }
  
  /**
   * Render template with payload
   * @param {object} template - The template
   * @param {object} job - The job
   * @returns {object} Rendered content
   */
  static renderTemplate(template, job) {
    // TODO: Implement proper template rendering with Mustache/handlebars
    // For now, return a simple rendered object
    return {
      title: template.subject_tpl || 'Notification',
      body: template.body_tpl || 'You have a new notification',
      linkUrl: null
    };
  }
  
  /**
   * Get user's unread notification count
   * @param {string} userId - The user ID
   * @returns {number} Unread notification count
   */
  static async getUnreadCount(userId) {
    return await NotificationInboxRepository.countUnreadByUser(userId);
  }
  
  /**
   * Get user's notifications
   * @param {string} userId - The user ID
   * @param {boolean} unreadOnly - Whether to fetch only unread notifications
   * @param {number} limit - Maximum number of notifications to fetch
   * @returns {object[]} Array of notifications
   */
  static async getUserNotifications(userId, unreadOnly = false, limit = 100) {
    if (unreadOnly) {
      return await NotificationInboxRepository.findByUserAndUnread(userId, limit);
    } else {
      return await NotificationInboxRepository.findByUser(userId, limit);
    }
  }
  
  /**
   * Mark notification as read
   * @param {string} notificationId - The notification ID
   * @returns {object} Updated notification
   */
  static async markAsRead(notificationId) {
    return await NotificationInboxRepository.markAsRead(notificationId);
  }
  
  /**
   * Mark all notifications as read for a user
   * @param {string} userId - The user ID
   * @returns {object[]} Updated notifications
   */
  static async markAllAsRead(userId) {
    return await NotificationInboxRepository.markAllAsRead(userId);
  }
}

module.exports = NotificationService;