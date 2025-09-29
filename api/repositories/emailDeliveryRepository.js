const db = require('../config/database');

class EmailDeliveryRepository {
  static async create(delivery, client = db.pool) {
    const query = `
      INSERT INTO email_deliveries (
        id,
        outbox_id,
        tenant_id,
        provider_id,
        message_id,
        to_address,
        status,
        sent_at,
        delivered_at,
        opened_at,
        clicked_at,
        bounced_at,
        bounce_reason,
        spam_reported_at,
        error_message,
        provider_data,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `;
    
    const values = [
      delivery.id,
      delivery.outboxId,
      delivery.tenantId || null,
      delivery.providerId || null,
      delivery.messageId || null,
      delivery.toAddress,
      delivery.status || 'QUEUED',
      delivery.sentAt || null,
      delivery.deliveredAt || null,
      delivery.openedAt || null,
      delivery.clickedAt || null,
      delivery.bouncedAt || null,
      delivery.bounceReason || null,
      delivery.spamReportedAt || null,
      delivery.errorMessage || null,
      delivery.providerData || null,
      delivery.createdAt || new Date(),
      delivery.updatedAt || new Date()
    ];
    
    const result = await client.query(query, values);
    return result.rows[0];
  }
  
  static async update(id, updates, client = db.pool) {
    const fields = [];
    const values = [];
    let index = 1;
    
    if (updates.outboxId !== undefined) {
      fields.push(`outbox_id = $${index++}`);
      values.push(updates.outboxId);
    }
    if (updates.tenantId !== undefined) {
      fields.push(`tenant_id = $${index++}`);
      values.push(updates.tenantId);
    }
    if (updates.providerId !== undefined) {
      fields.push(`provider_id = $${index++}`);
      values.push(updates.providerId);
    }
    if (updates.messageId !== undefined) {
      fields.push(`message_id = $${index++}`);
      values.push(updates.messageId);
    }
    if (updates.toAddress !== undefined) {
      fields.push(`to_address = $${index++}`);
      values.push(updates.toAddress);
    }
    if (updates.status !== undefined) {
      fields.push(`status = $${index++}`);
      values.push(updates.status);
    }
    if (updates.sentAt !== undefined) {
      fields.push(`sent_at = $${index++}`);
      values.push(updates.sentAt);
    }
    if (updates.deliveredAt !== undefined) {
      fields.push(`delivered_at = $${index++}`);
      values.push(updates.deliveredAt);
    }
    if (updates.openedAt !== undefined) {
      fields.push(`opened_at = $${index++}`);
      values.push(updates.openedAt);
    }
    if (updates.clickedAt !== undefined) {
      fields.push(`clicked_at = $${index++}`);
      values.push(updates.clickedAt);
    }
    if (updates.bouncedAt !== undefined) {
      fields.push(`bounced_at = $${index++}`);
      values.push(updates.bouncedAt);
    }
    if (updates.bounceReason !== undefined) {
      fields.push(`bounce_reason = $${index++}`);
      values.push(updates.bounceReason);
    }
    if (updates.spamReportedAt !== undefined) {
      fields.push(`spam_reported_at = $${index++}`);
      values.push(updates.spamReportedAt);
    }
    if (updates.errorMessage !== undefined) {
      fields.push(`error_message = $${index++}`);
      values.push(updates.errorMessage);
    }
    if (updates.providerData !== undefined) {
      fields.push(`provider_data = $${index++}`);
      values.push(updates.providerData);
    }
    if (updates.updatedAt !== undefined) {
      fields.push(`updated_at = $${index++}`);
      values.push(updates.updatedAt);
    }
    
    if (fields.length === 0) {
      return this.findById(id, client);
    }
    
    values.push(id);
    
    const query = `
      UPDATE email_deliveries
      SET ${fields.join(', ')}
      WHERE id = $${index}
      RETURNING *
    `;
    
    const result = await client.query(query, values);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  }
  
  static async findById(id, client = db.pool) {
    const query = `
      SELECT *
      FROM email_deliveries
      WHERE id = $1
    `;
    const result = await client.query(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  }
  
  static async findByOutboxId(outboxId, client = db.pool) {
    const query = `
      SELECT *
      FROM email_deliveries
      WHERE outbox_id = $1
      ORDER BY created_at ASC
    `;
    const result = await client.query(query, [outboxId]);
    return result.rows;
  }
  
  static async findByStatus(status, limit = 100, client = db.pool) {
    const query = `
      SELECT *
      FROM email_deliveries
      WHERE status = $1
      ORDER BY created_at ASC
      LIMIT $2
    `;
    const result = await client.query(query, [status, limit]);
    return result.rows;
  }
  
  static async findByEmail(toAddress, client = db.pool) {
    const query = `
      SELECT *
      FROM email_deliveries
      WHERE to_address = $1
      ORDER BY created_at DESC
    `;
    const result = await client.query(query, [toAddress]);
    return result.rows;
  }
  
  static async findAll(limit = 100, client = db.pool) {
    const query = `
      SELECT *
      FROM email_deliveries
      ORDER BY created_at DESC
      LIMIT $1
    `;
    const result = await client.query(query, [limit]);
    return result.rows;
  }
  
  static async countByStatus(client = db.pool) {
    const query = `
      SELECT status, COUNT(*) as count
      FROM email_deliveries
      GROUP BY status
    `;
    const result = await client.query(query);
    return result.rows;
  }
  
  static async delete(id, client = db.pool) {
    const query = `
      DELETE FROM email_deliveries
      WHERE id = $1
    `;
    await client.query(query, [id]);
  }
}

module.exports = EmailDeliveryRepository;