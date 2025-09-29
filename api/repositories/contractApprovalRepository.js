const db = require('../config/database');

class ContractApprovalRepository {
  static async create(approval, client = db.pool) {
    const query = `
      INSERT INTO contract_approvals (
        id,
        contract_id,
        approver_id,
        status,
        comments,
        approved_at,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [
      approval.id,
      approval.contractId,
      approval.approverId,
      approval.status || 'PENDING',
      approval.comments || null,
      approval.approvedAt || null,
      approval.createdAt || new Date()
    ];
    
    const result = await client.query(query, values);
    return result.rows[0];
  }
  
  static async update(id, updates, client = db.pool) {
    const fields = [];
    const values = [];
    let index = 1;
    
    if (updates.contractId !== undefined) {
      fields.push(`contract_id = $${index++}`);
      values.push(updates.contractId);
    }
    if (updates.approverId !== undefined) {
      fields.push(`approver_id = $${index++}`);
      values.push(updates.approverId);
    }
    if (updates.status !== undefined) {
      fields.push(`status = $${index++}`);
      values.push(updates.status);
    }
    if (updates.comments !== undefined) {
      fields.push(`comments = $${index++}`);
      values.push(updates.comments);
    }
    if (updates.approvedAt !== undefined) {
      fields.push(`approved_at = $${index++}`);
      values.push(updates.approvedAt);
    }
    
    if (fields.length === 0) {
      return this.findById(id, client);
    }
    
    values.push(id);
    
    const query = `
      UPDATE contract_approvals
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
      FROM contract_approvals
      WHERE id = $1
    `;
    const result = await client.query(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  }
  
  static async findByContract(contractId, client = db.pool) {
    const query = `
      SELECT *
      FROM contract_approvals
      WHERE contract_id = $1
      ORDER BY created_at
    `;
    const result = await client.query(query, [contractId]);
    return result.rows;
  }
  
  static async findByApprover(approverId, client = db.pool) {
    const query = `
      SELECT *
      FROM contract_approvals
      WHERE approver_id = $1
      ORDER BY created_at DESC
    `;
    const result = await client.query(query, [approverId]);
    return result.rows;
  }
  
  static async findByContractAndApprover(contractId, approverId, client = db.pool) {
    const query = `
      SELECT *
      FROM contract_approvals
      WHERE contract_id = $1 AND approver_id = $2
    `;
    const result = await client.query(query, [contractId, approverId]);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  }
  
  static async findByStatus(status, client = db.pool) {
    const query = `
      SELECT *
      FROM contract_approvals
      WHERE status = $1
      ORDER BY created_at DESC
    `;
    const result = await client.query(query, [status]);
    return result.rows;
  }
  
  static async delete(id, client = db.pool) {
    const query = `
      DELETE FROM contract_approvals
      WHERE id = $1
    `;
    await client.query(query, [id]);
  }
}

module.exports = ContractApprovalRepository;