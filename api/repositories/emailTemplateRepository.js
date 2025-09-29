const db = require('../config/database');

class EmailTemplateRepository {
  static async create(template, client = db.pool) {
    const query = `
      INSERT INTO email_templates (
        id,
        tenant_id,
        name,
        key,
        subject_tpl,
        body_html_tpl,
        body_text_tpl,
        layout_html,
        version,
        active,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    
    const values = [
      template.id,
      template.tenantId || null,
      template.name,
      template.key,
      template.subjectTpl,
      template.bodyHtmlTpl,
      template.bodyTextTpl || null,
      template.layoutHtml || null,
      template.version || 1,
      template.active !== undefined ? template.active : true,
      template.createdAt || new Date(),
      template.updatedAt || new Date()
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
    if (updates.name !== undefined) {
      fields.push(`name = $${index++}`);
      values.push(updates.name);
    }
    if (updates.key !== undefined) {
      fields.push(`key = $${index++}`);
      values.push(updates.key);
    }
    if (updates.subjectTpl !== undefined) {
      fields.push(`subject_tpl = $${index++}`);
      values.push(updates.subjectTpl);
    }
    if (updates.bodyHtmlTpl !== undefined) {
      fields.push(`body_html_tpl = $${index++}`);
      values.push(updates.bodyHtmlTpl);
    }
    if (updates.bodyTextTpl !== undefined) {
      fields.push(`body_text_tpl = $${index++}`);
      values.push(updates.bodyTextTpl);
    }
    if (updates.layoutHtml !== undefined) {
      fields.push(`layout_html = $${index++}`);
      values.push(updates.layoutHtml);
    }
    if (updates.version !== undefined) {
      fields.push(`version = $${index++}`);
      values.push(updates.version);
    }
    if (updates.active !== undefined) {
      fields.push(`active = $${index++}`);
      values.push(updates.active);
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
      UPDATE email_templates
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
      FROM email_templates
      WHERE id = $1
    `;
    const result = await client.query(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  }
  
  static async findByKey(key, tenantId = null, client = db.pool) {
    const query = `
      SELECT *
      FROM email_templates
      WHERE key = $1 AND (tenant_id = $2 OR (tenant_id IS NULL AND $2 IS NULL))
      ORDER BY version DESC
      LIMIT 1
    `;
    const result = await client.query(query, [key, tenantId]);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  }
  
  static async findByTenantAndKey(tenantId, key, client = db.pool) {
    const query = `
      SELECT *
      FROM email_templates
      WHERE tenant_id = $1 AND key = $2
      ORDER BY version DESC
      LIMIT 1
    `;
    const result = await client.query(query, [tenantId, key]);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  }
  
  static async findGlobalByKey(key, client = db.pool) {
    const query = `
      SELECT *
      FROM email_templates
      WHERE tenant_id IS NULL AND key = $1
      ORDER BY version DESC
      LIMIT 1
    `;
    const result = await client.query(query, [key]);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  }
  
  static async findAll(client = db.pool) {
    const query = `
      SELECT *
      FROM email_templates
      ORDER BY key, tenant_id, version DESC
    `;
    const result = await client.query(query);
    return result.rows;
  }
  
  static async findActive(client = db.pool) {
    const query = `
      SELECT *
      FROM email_templates
      WHERE active = true
      ORDER BY key, tenant_id, version DESC
    `;
    const result = await client.query(query);
    return result.rows;
  }
  
  static async delete(id, client = db.pool) {
    const query = `
      DELETE FROM email_templates
      WHERE id = $1
    `;
    await client.query(query, [id]);
  }
}

module.exports = EmailTemplateRepository;