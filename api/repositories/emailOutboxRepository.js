const db = require('../config/database');

class EmailOutboxRepository {
  static async create(outboxItem, client = db.pool) {
    const query = `
      INSERT INTO email_outbox (
        id,
        tenant_id,
        template_id,
        sender_id,
        provider_id,
        to_addresses,
        cc_addresses,
        bcc_addresses,
        subject,
        body_html,
        body_text,
        attachments,
        metadata,
        priority,
        scheduled_for,
        created_by,
        created_at,
        processed_at,
        status,
        attempts,
        last_error
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *
    `;
    
    const values = [
      outboxItem.id,
      outboxItem.tenantId || null,
      outboxItem.templateId || null,
      outboxItem.senderId || null,
      outboxItem.providerId || null,
      outboxItem.toAddresses,
      outboxItem.ccAddresses || [],
      outboxItem.bccAddresses || [],
      outboxItem.subject,
      outboxItem.bodyHtml || null,
      outboxItem.bodyText || null,
      outboxItem.attachments || null,
      outboxItem.metadata || {},
      outboxItem.priority || 'normal',
      outboxItem.scheduledFor || null,
      outboxItem.createdBy || null,
      outboxItem.createdAt || new Date(),
      outboxItem.processedAt || null,
      outboxItem.status || 'PENDING',
      outboxItem.attempts || 0,
      outboxItem.lastError || null
    ];
    
    const result = await client.query(query, values);
    return result.rows[0];
  }
  
  static async update(id, updates, client = db.pool) {
    const fields = [];
    const values = [];
    let index = 1;
    
    if (updates.tenantId !== undefined) {
      fields.push(`tenant_id = $${index++}`);
      values.push(updates.tenantId);
    }
    if (updates.templateId !== undefined) {
      fields.push(`template_id = $${index++}`);
      values.push(updates.templateId);
    }
    if (updates.senderId !== undefined) {
      fields.push(`sender_id = $${index++}`);
      values.push(updates.senderId);
    }
    if (updates.providerId !== undefined) {
      fields.push(`provider_id = $${index++}`);
      values.push(updates.providerId);
    }
    if (updates.toAddresses !== undefined) {
      fields.push(`to_addresses = $${index++}`);
      values.push(updates.toAddresses);
    }
    if (updates.ccAddresses !== undefined) {
      fields.push(`cc_addresses = $${index++}`);
      values.push(updates.ccAddresses);
    }
    if (updates.bccAddresses !== undefined) {
      fields.push(`bcc_addresses = $${index++}`);
      values.push(updates.bccAddresses);
    }
    if (updates.subject !== undefined) {
      fields.push(`subject = $${index++}`);
      values.push(updates.subject);
    }
    if (updates.bodyHtml !== undefined) {
      fields.push(`body_html = $${index++}`);
      values.push(updates.bodyHtml);
    }
    if (updates.bodyText !== undefined) {
      fields.push(`body_text = $${index++}`);
      values.push(updates.bodyText);
    }
    if (updates.attachments !== undefined) {
      fields.push(`attachments = $${index++}`);
      values.push(updates.attachments);
    }
    if (updates.metadata !== undefined) {
      fields.push(`metadata = $${index++}`);
      values.push(updates.metadata);
    }
    if (updates.priority !== undefined) {
      fields.push(`priority = $${index++}`);
      values.push(updates.priority);
    }
    if (updates.scheduledFor !== undefined) {
      fields.push(`scheduled_for = $${index++}`);
      values.push(updates.scheduledFor);
    }
    if (updates.createdBy !== undefined) {
      fields.push(`created_by = $${index++}`);
      values.push(updates.createdBy);
    }
    if (updates.processedAt !== undefined) {
      fields.push(`processed_at = $${index++}`);
      values.push(updates.processedAt);
    }
    if (updates.status !== undefined) {
      fields.push(`status = $${index++}`);
      values.push(updates.status);
    }
    if (updates.attempts !== undefined) {
      fields.push(`attempts = $${index++}`);
      values.push(updates.attempts);
    }
    if (updates.lastError !== undefined) {
      fields.push(`last_error = $${index++}`);
      values.push(updates.lastError);
    }
    
    if (fields.length === 0) {
      return this.findById(id, client);
    }
    
    values.push(id);
    
    const query = `
      UPDATE email_outbox
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
      FROM email_outbox
      WHERE id = $1
    `;
    const result = await client.query(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  }
  
  static async findPending(limit = 100, client = db.pool) {
    const query = `
      SELECT *
      FROM email_outbox
      WHERE status = 'PENDING'
      ORDER BY created_at ASC
      LIMIT $1
    `;
    const result = await client.query(query, [limit]);
    return result.rows;
  }
  
  static async findProcessing(limit = 100, client = db.pool) {
    const query = `
      SELECT *
      FROM email_outbox
      WHERE status = 'PROCESSING'
      ORDER BY created_at ASC
      LIMIT $1
    `;
    const result = await client.query(query, [limit]);
    return result.rows;
  }
  
  static async findFailed(limit = 100, client = db.pool) {
    const query = `
      SELECT *
      FROM email_outbox
      WHERE status = 'FAILED'
      ORDER BY created_at ASC
      LIMIT $1
    `;
    const result = await client.query(query, [limit]);
    return result.rows;
  }
  
  static async findAll(limit = 100, client = db.pool) {
    const query = `
      SELECT *
      FROM email_outbox
      ORDER BY created_at DESC
      LIMIT $1
    `;
    const result = await client.query(query, [limit]);
    return result.rows;
  }
  
  static async countByStatus(client = db.pool) {
    const query = `
      SELECT status, COUNT(*) as count
      FROM email_outbox
      GROUP BY status
    `;
    const result = await client.query(query);
    return result.rows;
  }
  
  static async delete(id, client = db.pool) {
    const query = `
      DELETE FROM email_outbox
      WHERE id = $1
    `;
    await client.query(query, [id]);
  }
}

module.exports = EmailOutboxRepository;