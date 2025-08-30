const db = require('../config/database');

class ComplianceDocumentType {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.organization_type = data.organization_type;
    this.is_required = data.is_required;
    this.is_active = data.is_active;
    // Parse JSON fields if they are strings
    this.allowed_mime_types = typeof data.allowed_mime_types === 'string'
      ? JSON.parse(data.allowed_mime_types)
      : data.allowed_mime_types || [];
    this.max_file_size = data.max_file_size;
    this.required_fields = typeof data.required_fields === 'string'
      ? JSON.parse(data.required_fields)
      : data.required_fields || [];
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.created_by = data.created_by;
    this.updated_by = data.updated_by;
  }

  // Create a new compliance document type
  static async create(documentTypeData) {
    const query = `
      INSERT INTO compliance_document_types (
        name, description, organization_type, is_required, is_active, allowed_mime_types, max_file_size, required_fields, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;
    
    const values = [
      documentTypeData.name,
      documentTypeData.description,
      documentTypeData.organization_type,
      documentTypeData.is_required || true,
      documentTypeData.is_active || true,
      // Convert arrays to JSON strings for storage
      documentTypeData.allowed_mime_types ? JSON.stringify(documentTypeData.allowed_mime_types) : null,
      documentTypeData.max_file_size,
      // Convert arrays to JSON strings for storage
      documentTypeData.required_fields ? JSON.stringify(documentTypeData.required_fields) : null,
      documentTypeData.created_by,
      documentTypeData.updated_by
    ];
    
    const result = await db.pool.query(query, values);
    return new ComplianceDocumentType(result.rows[0]);
  }

  // Find document type by ID
  static async findById(id) {
    const query = 'SELECT * FROM compliance_document_types WHERE id = $1';
    const result = await db.pool.query(query, [id]);
    return result.rows.length ? new ComplianceDocumentType(result.rows[0]) : null;
  }

  // Find document types by organization type
  static async findByOrganizationType(organizationType) {
    const query = 'SELECT * FROM compliance_document_types WHERE organization_type = $1 AND is_active = true ORDER BY name';
    const result = await db.pool.query(query, [organizationType]);
    return result.rows.map(row => new ComplianceDocumentType(row));
  }

  // Find all document types
  static async findAll() {
    const query = 'SELECT * FROM compliance_document_types ORDER BY name';
    const result = await db.pool.query(query);
    return result.rows.map(row => new ComplianceDocumentType(row));
  }

  // Find required document types by organization type
  static async findRequiredByOrganizationType(organizationType) {
    const query = 'SELECT * FROM compliance_document_types WHERE organization_type = $1 AND is_required = true AND is_active = true ORDER BY name';
    const result = await db.pool.query(query, [organizationType]);
    return result.rows.map(row => new ComplianceDocumentType(row));
  }

  // Update document type
  static async update(id, updateData) {
    const fields = [];
    const values = [];
    let index = 1;

    // Process update data, converting arrays to JSON strings for storage
    const processedUpdateData = { ...updateData };
    
    if (processedUpdateData.allowed_mime_types) {
      processedUpdateData.allowed_mime_types = JSON.stringify(processedUpdateData.allowed_mime_types);
    }
    
    if (processedUpdateData.required_fields) {
      processedUpdateData.required_fields = JSON.stringify(processedUpdateData.required_fields);
    }

    for (const key in processedUpdateData) {
      if (processedUpdateData.hasOwnProperty(key) && key !== 'id') {
        fields.push(`${key} = $${index}`);
        values.push(processedUpdateData[key]);
        index++;
      }
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);
    const query = `UPDATE compliance_document_types SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${index} RETURNING *`;
    const result = await db.pool.query(query, values);
    return result.rows.length ? new ComplianceDocumentType(result.rows[0]) : null;
  }

  // Delete document type
  static async delete(id) {
    const query = 'DELETE FROM compliance_document_types WHERE id = $1 RETURNING *';
    const result = await db.pool.query(query, [id]);
    return result.rows.length ? new ComplianceDocumentType(result.rows[0]) : null;
  }
}

module.exports = ComplianceDocumentType;