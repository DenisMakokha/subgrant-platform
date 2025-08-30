const db = require('../config/database');

class ComplianceDocumentTemplate {
  constructor(data) {
    this.id = data.id;
    this.document_type_id = data.document_type_id;
    this.name = data.name;
    this.description = data.description;
    this.template_uri = data.template_uri;
    this.template_name = data.template_name;
    this.mime_type = data.mime_type;
    this.is_active = data.is_active;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.created_by = data.created_by;
    this.updated_by = data.updated_by;
  }

  // Create a new compliance document template
  static async create(templateData) {
    const query = `
      INSERT INTO compliance_document_templates (
        document_type_id, name, description, template_uri, template_name, mime_type, is_active, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    
    const values = [
      templateData.document_type_id,
      templateData.name,
      templateData.description,
      templateData.template_uri,
      templateData.template_name,
      templateData.mime_type,
      templateData.is_active || true,
      templateData.created_by,
      templateData.updated_by
    ];
    
    const result = await db.pool.query(query, values);
    return new ComplianceDocumentTemplate(result.rows[0]);
  }

  // Find template by ID
  static async findById(id) {
    const query = 'SELECT * FROM compliance_document_templates WHERE id = $1';
    const result = await db.pool.query(query, [id]);
    return result.rows.length ? new ComplianceDocumentTemplate(result.rows[0]) : null;
  }

  // Find templates by document type
  static async findByDocumentType(documentTypeId) {
    const query = 'SELECT * FROM compliance_document_templates WHERE document_type_id = $1 AND is_active = true ORDER BY name';
    const result = await db.pool.query(query, [documentTypeId]);
    return result.rows.map(row => new ComplianceDocumentTemplate(row));
  }

  // Find all templates
  static async findAll() {
    const query = 'SELECT * FROM compliance_document_templates ORDER BY name';
    const result = await db.pool.query(query);
    return result.rows.map(row => new ComplianceDocumentTemplate(row));
  }

  // Update template
  static async update(id, updateData) {
    const fields = [];
    const values = [];
    let index = 1;

    for (const key in updateData) {
      if (updateData.hasOwnProperty(key) && key !== 'id') {
        fields.push(`${key} = $${index}`);
        values.push(updateData[key]);
        index++;
      }
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);
    const query = `UPDATE compliance_document_templates SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${index} RETURNING *`;
    const result = await db.pool.query(query, values);
    return result.rows.length ? new ComplianceDocumentTemplate(result.rows[0]) : null;
  }

  // Delete template
  static async delete(id) {
    const query = 'DELETE FROM compliance_document_templates WHERE id = $1 RETURNING *';
    const result = await db.pool.query(query, [id]);
    return result.rows.length ? new ComplianceDocumentTemplate(result.rows[0]) : null;
  }
}

module.exports = ComplianceDocumentTemplate;