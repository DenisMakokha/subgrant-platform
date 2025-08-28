const db = require('../config/database');

class ContractArtifact {
  constructor(data) {
    this.id = data.id;
    this.contract_id = data.contract_id;
    this.document_uri = data.document_uri;
    this.document_name = data.document_name;
    this.mime_type = data.mime_type;
    this.version = data.version;
    this.checksum = data.checksum;
    this.created_at = data.created_at;
  }

  static async create(artifactData) {
    const query = `
      INSERT INTO contract_artifacts (
        contract_id, document_uri, document_name, mime_type, version, checksum
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    
    const values = [
      artifactData.contract_id,
      artifactData.document_uri,
      artifactData.document_name,
      artifactData.mime_type,
      artifactData.version || 1,
      artifactData.checksum
    ];
    
    const result = await db.pool.query(query, values);
    return new ContractArtifact(result.rows[0]);
  }

  static async findById(id) {
    const query = 'SELECT * FROM contract_artifacts WHERE id = $1;';
    const result = await db.pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new ContractArtifact(result.rows[0]);
  }

  static async findByContractId(contractId) {
    const query = 'SELECT * FROM contract_artifacts WHERE contract_id = $1 ORDER BY version DESC, created_at DESC;';
    const result = await db.pool.query(query, [contractId]);
    
    return result.rows.map(row => new ContractArtifact(row));
  }

  static async findLatestByContractId(contractId) {
    const query = 'SELECT * FROM contract_artifacts WHERE contract_id = $1 ORDER BY version DESC, created_at DESC LIMIT 1;';
    const result = await db.pool.query(query, [contractId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new ContractArtifact(result.rows[0]);
  }

  static async findAll(filters = {}) {
    let query = 'SELECT * FROM contract_artifacts';
    const values = [];
    const conditions = [];
    
    if (filters.contract_id) {
      values.push(filters.contract_id);
      conditions.push(`contract_id = $${values.length}`);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY version DESC, created_at DESC;';
    
    const result = await db.pool.query(query, values);
    return result.rows.map(row => new ContractArtifact(row));
  }

  async update(updateData) {
    const fields = [];
    const values = [];
    
    for (const [key, value] of Object.entries(updateData)) {
      if (key !== 'id' && key !== 'created_at') {
        fields.push(`${key} = $${fields.length + 1}`);
        values.push(value);
      }
    }
    
    if (fields.length === 0) {
      return this;
    }
    
    values.push(this.id);
    const query = `
      UPDATE contract_artifacts 
      SET ${fields.join(', ')}
      WHERE id = $${values.length}
      RETURNING *;
    `;
    
    const result = await db.pool.query(query, values);
    
    if (result.rows.length === 0) {
      throw new Error('Contract artifact not found');
    }
    
    Object.assign(this, result.rows[0]);
    return this;
  }

  async delete() {
    const query = 'DELETE FROM contract_artifacts WHERE id = $1 RETURNING *;';
    const result = await db.pool.query(query, [this.id]);
    
    if (result.rows.length === 0) {
      throw new Error('Contract artifact not found');
    }
    
    return new ContractArtifact(result.rows[0]);
  }

  static async deleteById(id) {
    const query = 'DELETE FROM contract_artifacts WHERE id = $1 RETURNING *;';
    const result = await db.pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new ContractArtifact(result.rows[0]);
  }
}

module.exports = ContractArtifact;