const { v4: uuidv4 } = require('uuid');

class EventHooksService {
  constructor(db, notificationService) {
    this.db = db;
    this.notificationService = notificationService;
    this.subscribers = new Map();
    this.eventQueue = [];
    this.isProcessing = false;
  }

  subscribe(eventType, callback) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }
    this.subscribers.get(eventType).push(callback);
  }

  unsubscribe(eventType, callback) {
    if (this.subscribers.has(eventType)) {
      const callbacks = this.subscribers.get(eventType);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
    }
  }

  async emit(eventType, data) {
    this.eventQueue.push({ 
      type: eventType, 
      data, 
      timestamp: new Date() 
    });

    if (!this.isProcessing) {
      this.processEvents();
    }
  }

  async processEvents() {
    if (this.isProcessing || this.eventQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      const callbacks = this.subscribers.get(event.type) || [];

    for (const callback of callbacks) {
      try {
        await callback(event.data, event.timestamp);
      } catch (error) {
        console.error(`Error processing event ${event.type}:`, error);
      }
    }

    this.isProcessing = false;
  }

  async onGrantCreated(grantData) {
    const eventData = {
      grantId: grantData.id,
      grantNumber: grantData.grant_number,
      createdBy: grantData.created_by,
      timestamp: new Date()
    };

    this.emit('grant_created', eventData);
  }

  async onBudgetUpdated(budgetData) {
    const eventData = {
      budgetId: budgetData.id,
      grantId: budgetData.grant_id,
      updatedBy: budgetData.updated_by
    };

    this.emit('budget_updated', eventData);
  }

  async onContractUpdated(contractData) {
    const eventData = {
      contractId: contractData.id,
      grantId: contractData.grant_id,
      status: contractData.status,
      updatedBy: contractData.updated_by
    };

    this.emit('contract_updated', eventData);
  }

  async onDisbursementUpdated(disbursementData) {
    const eventData = {
      disbursementId: disbursementData.id,
      contractId: disbursementData.contract_id,
      amount: disbursementData.amount,
      status: disbursementData.status,
      timestamp: new Date()
    };

    this.emit('disbursement_updated', eventData);
  }

  async onAnalyticsRefresh() {
    this.emit('analytics_refresh', {
      timestamp: new Date(),
      scope: 'all'
    });
  }

  async onUserAction(actionData) {
    const eventData = {
      actionId: actionData.id,
      userId: actionData.user_id,
      actionType: actionData.action_type,
      metadata: actionData.metadata
    };

    this.emit('user_action', eventData);
  }

  registerDefaultHooks() {
    this.subscribe('grant_created', (data) => {
      console.log('Grant created:', data);
    });
  }

  async getEventStatistics() {
    const query = `
      SELECT 
        event_type,
        COUNT(*) as count,
        MIN(timestamp) as first_occurrence,
        MAX(timestamp) as last_occurrence
      FROM event_logs
      WHERE timestamp >= NOW() - INTERVAL '24 HOURS'
      GROUP BY event_type
      ORDER BY count DESC
    `;

    const result = await this.db.query(query);
    return result.rows;
  }

  async cleanupOldEvents(retentionDays = 30) {
    const query = `
      DELETE FROM event_logs 
      WHERE timestamp < NOW() - INTERVAL '${retentionDays} DAYS'
    `;

    const result = await this.db.query(query);
    return result.rowCount;
  }
}

module.exports = EventHooksService;