const db = require('../config/database');

class NotificationJobsRepository {
  static async create(job, client = db.pool) {
    const query = `
      INSERT INTO notif_jobs (
        id,
        outbox_id,
        tenant_id,
        event_key,
        recipient_user,
        email_to,
        channel,
        lang,
        subject,
        body,
        state,
        scheduled_for,
        sent_at,
        error,
        provider_resp,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;
    
    const values = [
      job.id,
      job.outboxId,
      job.tenantId || null,
      job.eventKey,
      job.recipientUser || null,
      job.emailTo || null,
      job.channel,
      job.lang || 'en',
      job.subject || null,
      job.body || null,
      job.state || 'QUEUED',
      job.scheduledFor || null,
      job.sentAt || null,
      job.error || null,
      job.providerResp || null,
      job.createdAt || new Date()
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
    if (updates.eventKey !== undefined) {
      fields.push(`event_key = $${index++}`);
      values.push(updates.eventKey);
    }
    if (updates.recipientUser !== undefined) {
      fields.push(`recipient_user = $${index++}`);
      values.push(updates.recipientUser);
    }
    if (updates.emailTo !== undefined) {
      fields.push(`email_to = $${index++}`);
      values.push(updates.emailTo);
    }
    if (updates.channel !== undefined) {
      fields.push(`channel = $${index++}`);
      values.push(updates.channel);
    }
    if (updates.lang !== undefined) {
      fields.push(`lang = $${index++}`);
      values.push(updates.lang);
    }
    if (updates.subject !== undefined) {
      fields.push(`subject = $${index++}`);
      values.push(updates.subject);
    }
    if (updates.body !== undefined) {
      fields.push(`body = $${index++}`);
      values.push(updates.body);
    }
    if (updates.state !== undefined) {
      fields.push(`state = $${index++}`);
      values.push(updates.state);
    }
    if (updates.scheduledFor !== undefined) {
      fields.push(`scheduled_for = $${index++}`);
      values.push(updates.scheduledFor);
    }
    if (updates.sentAt !== undefined) {
      fields.push(`sent_at = $${index++}`);
      values.push(updates.sentAt);
    }
    if (updates.error !== undefined) {
      fields.push(`error = $${index++}`);
      values.push(updates.error);
    }
    if (updates.providerResp !== undefined) {
      fields.push(`provider_resp = $${index++}`);
      values.push(updates.providerResp);
    }
    
    if (fields.length === 0) {
      return this.findById(id, client);
    }
    
    values.push(id);
    
    const query = `
      UPDATE notif_jobs
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
      FROM notif_jobs
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
      FROM notif_jobs
      WHERE outbox_id = $1
      ORDER BY created_at ASC
    `;
    const result = await client.query(query, [outboxId]);
    return result.rows;
  }
  
  static async findQueued(limit = 100, client = db.pool) {
    const query = `
      SELECT *
      FROM notif_jobs
      WHERE state = 'QUEUED'
      ORDER BY created_at ASC
      LIMIT $1
    `;
    const result = await client.query(query, [limit]);
    return result.rows;
  }
  
  static async findSending(limit = 100, client = db.pool) {
    const query = `
      SELECT *
      FROM notif_jobs
      WHERE state = 'SENDING'
      ORDER BY created_at ASC
      LIMIT $1
    `;
    const result = await client.query(query, [limit]);
    return result.rows;
  }
  
  static async findFailed(limit = 100, client = db.pool) {
    const query = `
      SELECT *
      FROM notif_jobs
      WHERE state = 'FAILED'
      ORDER BY created_at ASC
      LIMIT $1
    `;
    const result = await client.query(query, [limit]);
    return result.rows;
  }
  
  static async findAll(limit = 100, client = db.pool) {
    const query = `
      SELECT *
      FROM notif_jobs
      ORDER BY created_at DESC
      LIMIT $1
    `;
    const result = await client.query(query, [limit]);
    return result.rows;
  }
  
  static async countByState(client = db.pool) {
    const query = `
      SELECT state, COUNT(*) as count
      FROM notif_jobs
      GROUP BY state
    `;
    const result = await client.query(query);
    return result.rows;
  }
}

module.exports = NotificationJobsRepository;