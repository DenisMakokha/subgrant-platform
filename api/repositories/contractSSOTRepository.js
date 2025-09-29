const db = require('../config/database');

class ContractSSOTRepository {
  static async create(contract, client = db.pool) {
    const query = `
      INSERT INTO contracts_ssot (
        id,
        project_id,
        partner_id,
        title,
        description,
        start_date,
        end_date,
        currency,
        total_amount,
        status,
        template_id,
        created_by,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;
    
    const values = [
      contract.id,
      contract.projectId,
      contract.partnerId,
      contract.title,
      contract.description || null,
      contract.startDate,
      contract.endDate,
      contract.currency,
      contract.totalAmount,
      contract.status || 'DRAFT',
      contract.templateId || null,
      contract.createdBy,
      contract.createdAt || new Date(),
      contract.updatedAt || new Date()
    ];
    
    const result = await client.query(query, values);
    return result.rows[0];
  }
  
  static async update(id, updates, client = db.pool) {
    const fields = [];
    const values = [];
    let index = 1;
    
    if (updates.projectId !== undefined) {
      fields.push(`project_id = $${index++}`);
      values.push(updates.projectId);
    }
    if (updates.partnerId !== undefined) {
      fields.push(`partner_id = $${index++}`);
      values.push(updates.partnerId);
    }
    if (updates.title !== undefined) {
      fields.push(`title = $${index++}`);
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${index++}`);
      values.push(updates.description);
    }
    if (updates.startDate !== undefined) {
      fields.push(`start_date = $${index++}`);
      values.push(updates.startDate);
    }
    if (updates.endDate !== undefined) {
      fields.push(`end_date = $${index++}`);
      values.push(updates.endDate);
    }
    if (updates.currency !== undefined) {
      fields.push(`currency = $${index++}`);
      values.push(updates.currency);
    }
    if (updates.totalAmount !== undefined) {
      fields.push(`total_amount = $${index++}`);
      values.push(updates.totalAmount);
    }
    if (updates.status !== undefined) {
      fields.push(`status = $${index++}`);
      values.push(updates.status);
    }
    if (updates.templateId !== undefined) {
      fields.push(`template_id = $${index++}`);
      values.push(updates.templateId);
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
      UPDATE contracts_ssot
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
      FROM contracts_ssot
      WHERE id = $1
    `;
    const result = await client.query(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  }
  
  static async findByProject(projectId, client = db.pool) {
    const query = `
      SELECT *
      FROM contracts_ssot
      WHERE project_id = $1
      ORDER BY created_at DESC
    `;
    const result = await client.query(query, [projectId]);
    return result.rows;
  }
  
  static async findByPartner(partnerId, client = db.pool) {
    const query = `
      SELECT *
      FROM contracts_ssot
      WHERE partner_id = $1
      ORDER BY created_at DESC
    `;
    const result = await client.query(query, [partnerId]);
    return result.rows;
  }
  
  static async findByProjectAndPartner(projectId, partnerId, client = db.pool) {
    const query = `
      SELECT *
      FROM contracts_ssot
      WHERE project_id = $1 AND partner_id = $2
      ORDER BY created_at DESC
    `;
    const result = await client.query(query, [projectId, partnerId]);
    return result.rows;
  }
  
  static async findByStatus(status, client = db.pool) {
    const query = `
      SELECT *
      FROM contracts_ssot
      WHERE status = $1
      ORDER BY updated_at DESC
    `;
    const result = await client.query(query, [status]);
    return result.rows;
  }
  
  static async findByDateRange(startDate, endDate, client = db.pool) {
    const query = `
      SELECT *
      FROM contracts_ssot
      WHERE start_date <= $2 AND end_date >= $1
      ORDER BY start_date
    `;
    const result = await client.query(query, [startDate, endDate]);
    return result.rows;
  }
  
  static async delete(id, client = db.pool) {
    const query = `
      DELETE FROM contracts_ssot
      WHERE id = $1
    `;
    await client.query(query, [id]);
  }
}

module.exports = ContractSSOTRepository;