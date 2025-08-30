const db = require('../config/database');

class OrganizationComplianceDocument {
  constructor(data) {
    this.id = data.id;
    this.organization_id = data.organization_id;
    this.document_type_id = data.document_type_id;
    this.document_id = data.document_id;
    this.status = data.status;
    this.submitted_at = data.submitted_at;
    this.approved_at = data.approved_at;
    this.approved_by = data.approved_by;
    this.rejection_reason = data.rejection_reason;
    this.rejection_category = data.rejection_category;
    this.rejection_details = data.rejection_details;
    this.required_actions = data.required_actions;
    this.due_date = data.due_date;
    this.expiration_date = data.expiration_date;
    this.review_status = data.review_status;
    this.review_comments = data.review_comments;
    this.reviewed_at = data.reviewed_at;
    this.reviewed_by = data.reviewed_by;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create a new organization compliance document
  static async create(complianceData) {
    const query = `
      INSERT INTO organization_compliance_documents (
        organization_id, document_type_id, document_id, status, submitted_at, approved_at,
        approved_by, rejection_reason, rejection_category, rejection_details, required_actions,
        due_date, expiration_date, review_status, review_comments, reviewed_at, reviewed_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *;
    `;
    
    const values = [
      complianceData.organization_id,
      complianceData.document_type_id,
      complianceData.document_id,
      complianceData.status || 'pending',
      complianceData.submitted_at,
      complianceData.approved_at,
      complianceData.approved_by,
      complianceData.rejection_reason,
      complianceData.rejection_category,
      complianceData.rejection_details,
      complianceData.required_actions,
      complianceData.due_date,
      complianceData.expiration_date,
      complianceData.review_status || 'not_reviewed',
      complianceData.review_comments,
      complianceData.reviewed_at,
      complianceData.reviewed_by
    ];
    
    const result = await db.pool.query(query, values);
    return new OrganizationComplianceDocument(result.rows[0]);
  }

  // Find compliance document by ID
  static async findById(id) {
    const query = 'SELECT * FROM organization_compliance_documents WHERE id = $1';
    const result = await db.pool.query(query, [id]);
    return result.rows.length ? new OrganizationComplianceDocument(result.rows[0]) : null;
  }

  // Find compliance documents by organization
  static async findByOrganization(organizationId) {
    const query = `
      SELECT ocd.*, cdt.name as document_type_name, cdt.description as document_type_description
      FROM organization_compliance_documents ocd
      JOIN compliance_document_types cdt ON ocd.document_type_id = cdt.id
      WHERE ocd.organization_id = $1
      ORDER BY cdt.name
    `;
    const result = await db.pool.query(query, [organizationId]);
    return result.rows.map(row => new OrganizationComplianceDocument(row));
  }

  // Find compliance documents by organization and status
  static async findByOrganizationAndStatus(organizationId, status) {
    const query = `
      SELECT ocd.*, cdt.name as document_type_name, cdt.description as document_type_description
      FROM organization_compliance_documents ocd
      JOIN compliance_document_types cdt ON ocd.document_type_id = cdt.id
      WHERE ocd.organization_id = $1 AND ocd.status = $2
      ORDER BY cdt.name
    `;
    const result = await db.pool.query(query, [organizationId, status]);
    return result.rows.map(row => new OrganizationComplianceDocument(row));
  }

  // Find compliance document by organization and document type
  static async findByOrganizationAndType(organizationId, documentTypeId) {
    const query = `
      SELECT ocd.*, cdt.name as document_type_name, cdt.description as document_type_description
      FROM organization_compliance_documents ocd
      JOIN compliance_document_types cdt ON ocd.document_type_id = cdt.id
      WHERE ocd.organization_id = $1 AND ocd.document_type_id = $2
      ORDER BY cdt.name
    `;
    const result = await db.pool.query(query, [organizationId, documentTypeId]);
    return result.rows.length ? new OrganizationComplianceDocument(result.rows[0]) : null;
  }

  // Find all compliance documents
  static async findAll() {
    const query = `
      SELECT ocd.*, cdt.name as document_type_name, cdt.description as document_type_description
      FROM organization_compliance_documents ocd
      JOIN compliance_document_types cdt ON ocd.document_type_id = cdt.id
      ORDER BY ocd.organization_id, cdt.name
    `;
    const result = await db.pool.query(query);
    return result.rows.map(row => new OrganizationComplianceDocument(row));
  }

  // Update compliance document
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
    const query = `UPDATE organization_compliance_documents SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${index} RETURNING *`;
    const result = await db.pool.query(query, values);
    return result.rows.length ? new OrganizationComplianceDocument(result.rows[0]) : null;
  }

  // Delete compliance document
  static async delete(id) {
    const query = 'DELETE FROM organization_compliance_documents WHERE id = $1 RETURNING *';
    const result = await db.pool.query(query, [id]);
    return result.rows.length ? new OrganizationComplianceDocument(result.rows[0]) : null;
  }

  // Get compliance status summary for an organization
  static async getComplianceStatusSummary(organizationId) {
    const query = `
      SELECT 
        COUNT(*) as total_documents,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_documents,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_documents,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_documents,
        COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted_documents
      FROM organization_compliance_documents
      WHERE organization_id = $1
    `;
    const result = await db.pool.query(query, [organizationId]);
    return result.rows[0];
  }

  // Get overdue compliance documents for an organization
  static async getOverdueDocuments(organizationId) {
    const query = `
      SELECT ocd.*, cdt.name as document_type_name, cdt.description as document_type_description
      FROM organization_compliance_documents ocd
      JOIN compliance_document_types cdt ON ocd.document_type_id = cdt.id
      WHERE ocd.organization_id = $1 
        AND ocd.status IN ('pending', 'submitted')
        AND ocd.due_date < CURRENT_DATE
      ORDER BY ocd.due_date
    `;
    const result = await db.pool.query(query, [organizationId]);
    return result.rows.map(row => new OrganizationComplianceDocument(row));
  }

  // Get expired compliance documents for an organization
  static async getExpiredDocuments(organizationId) {
    const query = `
      SELECT ocd.*, cdt.name as document_type_name, cdt.description as document_type_description
      FROM organization_compliance_documents ocd
      JOIN compliance_document_types cdt ON ocd.document_type_id = cdt.id
      WHERE ocd.organization_id = $1
        AND ocd.status = 'approved'
        AND ocd.expiration_date < CURRENT_DATE
      ORDER BY ocd.expiration_date
    `;
    const result = await db.pool.query(query, [organizationId]);
    return result.rows.map(row => new OrganizationComplianceDocument(row));
  }

  // Get compliance documents with due dates within the specified number of days
  static async getUpcomingDueDocuments(days) {
    const query = `
      SELECT ocd.*, cdt.name as document_type_name, cdt.description as document_type_description, o.name as organization_name
      FROM organization_compliance_documents ocd
      JOIN compliance_document_types cdt ON ocd.document_type_id = cdt.id
      JOIN organizations o ON ocd.organization_id = o.id
      WHERE ocd.status IN ('pending', 'submitted')
        AND ocd.due_date <= CURRENT_DATE + INTERVAL '${days} days'
        AND ocd.due_date >= CURRENT_DATE
      ORDER BY ocd.due_date
    `;
    const result = await db.pool.query(query);
    return result.rows.map(row => new OrganizationComplianceDocument(row));
  }

  // Get compliance documents with expiration dates within the specified number of days
  static async getUpcomingExpirationDocuments(days) {
    const query = `
      SELECT ocd.*, cdt.name as document_type_name, cdt.description as document_type_description, o.name as organization_name
      FROM organization_compliance_documents ocd
      JOIN compliance_document_types cdt ON ocd.document_type_id = cdt.id
      JOIN organizations o ON ocd.organization_id = o.id
      WHERE ocd.status = 'approved'
        AND ocd.expiration_date <= CURRENT_DATE + INTERVAL '${days} days'
        AND ocd.expiration_date >= CURRENT_DATE
      ORDER BY ocd.expiration_date
    `;
    const result = await db.pool.query(query);
    return result.rows.map(row => new OrganizationComplianceDocument(row));
  }

  // Get compliance documents with search and filtering capabilities
  static async searchAndFilter(options = {}) {
    const {
      organizationId,
      documentTypeId,
      status,
      reviewStatus,
      searchTerm,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      limit = 50,
      offset = 0
    } = options;
    
    let query = `
      SELECT ocd.*, cdt.name as document_type_name, cdt.description as document_type_description, o.name as organization_name
      FROM organization_compliance_documents ocd
      JOIN compliance_document_types cdt ON ocd.document_type_id = cdt.id
      JOIN organizations o ON ocd.organization_id = o.id
      WHERE 1=1
    `;
    
    const values = [];
    let valueIndex = 1;
    
    if (organizationId) {
      query += ` AND ocd.organization_id = $${valueIndex}`;
      values.push(organizationId);
      valueIndex++;
    }
    
    if (documentTypeId) {
      query += ` AND ocd.document_type_id = $${valueIndex}`;
      values.push(documentTypeId);
      valueIndex++;
    }
    
    if (status) {
      query += ` AND ocd.status = $${valueIndex}`;
      values.push(status);
      valueIndex++;
    }
    
    if (reviewStatus) {
      query += ` AND ocd.review_status = $${valueIndex}`;
      values.push(reviewStatus);
      valueIndex++;
    }
    
    if (searchTerm) {
      query += ` AND (cdt.name ILIKE $${valueIndex} OR o.name ILIKE $${valueIndex})`;
      values.push(`%${searchTerm}%`);
      valueIndex++;
    }
    
    // Add sorting
    query += ` ORDER BY ocd.${sortBy} ${sortOrder}`;
    
    // Add pagination
    query += ` LIMIT $${valueIndex} OFFSET $${valueIndex + 1}`;
    values.push(limit, offset);
    
    const result = await db.pool.query(query, values);
    return result.rows.map(row => new OrganizationComplianceDocument(row));
  }
  
  // Get count of compliance documents with search and filtering capabilities
  static async searchAndFilterCount(options = {}) {
    const {
      organizationId,
      documentTypeId,
      status,
      reviewStatus,
      searchTerm
    } = options;
    
    let query = `
      SELECT COUNT(*) as count
      FROM organization_compliance_documents ocd
      JOIN compliance_document_types cdt ON ocd.document_type_id = cdt.id
      JOIN organizations o ON ocd.organization_id = o.id
      WHERE 1=1
    `;
    
    const values = [];
    let valueIndex = 1;
    
    if (organizationId) {
      query += ` AND ocd.organization_id = $${valueIndex}`;
      values.push(organizationId);
      valueIndex++;
    }
    
    if (documentTypeId) {
      query += ` AND ocd.document_type_id = $${valueIndex}`;
      values.push(documentTypeId);
      valueIndex++;
    }
    
    if (status) {
      query += ` AND ocd.status = $${valueIndex}`;
      values.push(status);
      valueIndex++;
    }
    
    if (reviewStatus) {
      query += ` AND ocd.review_status = $${valueIndex}`;
      values.push(reviewStatus);
      valueIndex++;
    }
    
    if (searchTerm) {
      query += ` AND (cdt.name ILIKE $${valueIndex} OR o.name ILIKE $${valueIndex})`;
      values.push(`%${searchTerm}%`);
      valueIndex++;
    }
    
    const result = await db.pool.query(query, values);
    return parseInt(result.rows[0].count);
  }
  
  // Find compliance documents by document type
  static async findByDocumentType(documentTypeId) {
    const query = `
      SELECT ocd.*, cdt.name as document_type_name, cdt.description as document_type_description, o.name as organization_name
      FROM organization_compliance_documents ocd
      JOIN compliance_document_types cdt ON ocd.document_type_id = cdt.id
      JOIN organizations o ON ocd.organization_id = o.id
      WHERE ocd.document_type_id = $1
      ORDER BY ocd.organization_id, cdt.name
    `;
    const result = await db.pool.query(query, [documentTypeId]);
    return result.rows.map(row => new OrganizationComplianceDocument(row));
  }
}

module.exports = OrganizationComplianceDocument;