const db = require('../config/database');
const crypto = require('crypto');

class Document {
  constructor(data) {
    this.id = data.id;
    this.entity_type = data.entity_type;
    this.entity_id = data.entity_id;
    this.title = data.title;
    this.description = data.description;
    this.document_uri = data.document_uri;
    this.document_name = data.document_name;
    this.mime_type = data.mime_type;
    this.file_size = data.file_size;
    this.version = data.version;
    this.checksum = data.checksum;
    this.uploaded_by = data.uploaded_by;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async create(documentData) {
    const query = `
      INSERT INTO documents (
        entity_type, entity_id, title, description, document_uri, document_name,
        mime_type, file_size, version, checksum, uploaded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;
    `;
    
    // Calculate checksum if not provided
    let checksum = documentData.checksum;
    if (!checksum && documentData.document_uri) {
      // In a real implementation, you would calculate the checksum of the file content
      // For now, we'll generate a mock checksum
      checksum = crypto.createHash('sha256').update(documentData.document_uri).digest('hex');
    }
    
    // If creating a new version of an existing document, increment the version number
    let version = documentData.version || 1;
    if (documentData.entity_type && documentData.entity_id) {
      const latestVersionQuery = `
        SELECT MAX(version) as max_version
        FROM documents
        WHERE entity_type = $1 AND entity_id = $2
      `;
      const latestVersionResult = await db.pool.query(latestVersionQuery, [
        documentData.entity_type,
        documentData.entity_id
      ]);
      
      const latestVersion = latestVersionResult.rows[0]?.max_version || 0;
      version = latestVersion + 1;
    }
    
    const values = [
      documentData.entity_type,
      documentData.entity_id,
      documentData.title,
      documentData.description,
      documentData.document_uri,
      documentData.document_name,
      documentData.mime_type,
      documentData.file_size,
      version,
      checksum,
      documentData.uploaded_by
    ];
    
    const result = await db.pool.query(query, values);
    return new Document(result.rows[0]);
  }

  static async findById(id) {
    const query = 'SELECT * FROM documents WHERE id = $1;';
    const result = await db.pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new Document(result.rows[0]);
  }

  static async findByEntity(entityType, entityId) {
    const query = 'SELECT * FROM documents WHERE entity_type = $1 AND entity_id = $2 ORDER BY version DESC;';
    const result = await db.pool.query(query, [entityType, entityId]);
    
    return result.rows.map(row => new Document(row));
  }

  static async findByUser(userId) {
    const query = 'SELECT * FROM documents WHERE uploaded_by = $1 ORDER BY created_at DESC;';
    const result = await db.pool.query(query, [userId]);
    
    return result.rows.map(row => new Document(row));
  }

  static async findAll(filters = {}) {
    let query = 'SELECT * FROM documents';
    const values = [];
    const conditions = [];
    
    if (filters.entity_type) {
      values.push(filters.entity_type);
      conditions.push(`entity_type = $${values.length}`);
    }
    
    if (filters.entity_id) {
      values.push(filters.entity_id);
      conditions.push(`entity_id = $${values.length}`);
    }
    
    if (filters.uploaded_by) {
      values.push(filters.uploaded_by);
      conditions.push(`uploaded_by = $${values.length}`);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY created_at DESC;';
    
    const result = await db.pool.query(query, values);
    return result.rows.map(row => new Document(row));
  }

  static async update(id, updateData) {
    const fields = [];
    const values = [];
    
    for (const [key, value] of Object.entries(updateData)) {
      if (key !== 'id' && key !== 'created_at') {
        fields.push(`${key} = $${fields.length + 1}`);
        values.push(value);
      }
    }
    
    if (fields.length === 0) {
      return this.findById(id);
    }
    
    values.push(id);
    const query = `
      UPDATE documents 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${values.length}
      RETURNING *;
    `;
    
    const result = await db.pool.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('Document not found');
    }
    
    return new Document(result.rows[0]);
  }

  static async delete(id) {
    const query = 'DELETE FROM documents WHERE id = $1 RETURNING *;';
    const result = await db.pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      throw new Error('Document not found');
    }
    
    return new Document(result.rows[0]);
  }

  static async getVersionHistory(entityType, entityId) {
    const query = 'SELECT * FROM documents WHERE entity_type = $1 AND entity_id = $2 ORDER BY version DESC;';
    const result = await db.pool.query(query, [entityType, entityId]);
    
    return result.rows.map(row => new Document(row));
  }

  static async verifyChecksum(id, fileContent) {
    const document = await this.findById(id);
    if (!document) {
      throw new Error('Document not found');
    }
    
    // Calculate checksum of provided file content
    const calculatedChecksum = crypto.createHash('sha256').update(fileContent).digest('hex');
    
    // Compare with stored checksum
    return calculatedChecksum === document.checksum;
  }
  
  // Get the latest version of a document for a specific entity
  static async getLatestVersion(entityType, entityId) {
    const query = `
      SELECT * FROM documents 
      WHERE entity_type = $1 AND entity_id = $2 
      ORDER BY version DESC 
      LIMIT 1;
    `;
    const result = await db.pool.query(query, [entityType, entityId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new Document(result.rows[0]);
  }
  
  // Get documents with conflicting versions (same entity but different checksums)
  static async getConflictingVersions() {
    const query = `
      SELECT d1.*
      FROM documents d1
      JOIN documents d2 ON d1.entity_type = d2.entity_type AND d1.entity_id = d2.entity_id
      WHERE d1.checksum != d2.checksum
        AND d1.version != d2.version
      GROUP BY d1.id, d1.entity_type, d1.entity_id, d1.title, d1.description, d1.document_uri,
               d1.document_name, d1.mime_type, d1.version, d1.checksum, d1.uploaded_by,
               d1.created_at, d1.updated_at
    `;
    
    const result = await db.pool.query(query);
    return result.rows.map(row => new Document(row));
  }
}

module.exports = Document;