const db = require('../config/database');

class NotificationTemplateRepository {
  static async create(template, client = db.pool) {
    const query = `
      INSERT INTO notif_templates (
        id,
        tenant_id,
        event_key,
        channel,
        lang,
        subject_tpl,
        body_tpl,
        layout_tpl,
        version,
        active,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    
    const values = [
      template.id,
      template.tenantId || null,
      template.eventKey,
      template.channel,
      template.lang || 'en',
      template.subjectTpl || null,
      template.bodyTpl,
      template.layoutTpl || null,
      template.version || 1,
      template.active !== undefined ? template.active : true,
      template.createdAt || new Date()
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
    if (updates.eventKey !== undefined) {
      fields.push(`event_key = $${index++}`);
      values.push(updates.eventKey);
    }
    if (updates.channel !== undefined) {
      fields.push(`channel = $${index++}`);
      values.push(updates.channel);
    }
    if (updates.lang !== undefined) {
      fields.push(`lang = $${index++}`);
      values.push(updates.lang);
    }
    if (updates.subjectTpl !== undefined) {
      fields.push(`subject_tpl = $${index++}`);
      values.push(updates.subjectTpl);
    }
    if (updates.bodyTpl !== undefined) {
      fields.push(`body_tpl = $${index++}`);
      values.push(updates.bodyTpl);
    }
    if (updates.layoutTpl !== undefined) {
      fields.push(`layout_tpl = $${index++}`);
      values.push(updates.layoutTpl);
    }
    if (updates.version !== undefined) {
      fields.push(`version = $${index++}`);
      values.push(updates.version);
    }
    if (updates.active !== undefined) {
      fields.push(`active = $${index++}`);
      values.push(updates.active);
    }
    
    if (fields.length === 0) {
      return this.findById(id, client);
    }
    
    values.push(id);
    
    const query = `
      UPDATE notif_templates
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
      FROM notif_templates
      WHERE id = $1
    `;
    const result = await client.query(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  }
  
  static async findByEventKey(eventKey, client = db.pool) {
    const query = `
      SELECT *
      FROM notif_templates
      WHERE event_key = $1
      ORDER BY lang, channel, version DESC
    `;
    const result = await client.query(query, [eventKey]);
    return result.rows;
  }
  
  static async findByTenantAndEvent(tenantId, eventKey, client = db.pool) {
    const query = `
      SELECT *
      FROM notif_templates
      WHERE tenant_id = $1 AND event_key = $2
      ORDER BY lang, channel, version DESC
    `;
    const result = await client.query(query, [tenantId, eventKey]);
    return result.rows;
  }
  
  static async findGlobalTemplatesByEvent(eventKey, client = db.pool) {
    const query = `
      SELECT *
      FROM notif_templates
      WHERE tenant_id IS NULL AND event_key = $1
      ORDER BY lang, channel, version DESC
    `;
    const result = await client.query(query, [eventKey]);
    return result.rows;
  }
  
  static async findAll(client = db.pool) {
    const query = `
      SELECT *
      FROM notif_templates
      ORDER BY event_key, lang, channel, version DESC
    `;
    const result = await client.query(query);
    return result.rows;
  }
  
  static async findActive(client = db.pool) {
    const query = `
      SELECT *
      FROM notif_templates
      WHERE active = true
      ORDER BY event_key, lang, channel, version DESC
    `;
    const result = await client.query(query);
    return result.rows;
  }
}

module.exports = NotificationTemplateRepository;