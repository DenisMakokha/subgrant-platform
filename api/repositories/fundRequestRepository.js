const db = require('../config/database');

const FUND_REQUEST_COLUMNS = [
  'id',
  'project_id',
  'partner_id',
  'amount',
  'currency',
  'purpose',
  'period_from',
  'period_to',
  'status',
  'requested_at',
  'approved_at',
  'rejected_at',
  'paid_at',
  'created_by',
  'created_at',
  'updated_at'
];

class FundRequestRepository {
  static async create(fundRequest, client = db.pool) {
    const query = `
      INSERT INTO fund_requests (
        id,
        project_id,
        partner_id,
        amount,
        currency,
        purpose,
        period_from,
        period_to,
        status,
        requested_at,
        created_by,
        created_at,
        updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, now(), $10, now(), now()
      )
      RETURNING ${FUND_REQUEST_COLUMNS.join(', ')}
    `;

    const values = [
      fundRequest.id,
      fundRequest.projectId,
      fundRequest.partnerId,
      fundRequest.amount,
      fundRequest.currency,
      fundRequest.purpose,
      fundRequest.periodFrom,
      fundRequest.periodTo,
      fundRequest.status || 'draft',
      fundRequest.createdBy
    ];

    const result = await client.query(query, values);
    return FundRequestRepository.mapRow(result.rows[0]);
  }

  static async findByProjectAndPartner(projectId, partnerId, client = db.pool) {
    const query = `
      SELECT ${FUND_REQUEST_COLUMNS.join(', ')}
      FROM fund_requests
      WHERE project_id = $1 AND partner_id = $2
      ORDER BY requested_at DESC
    `;
    
    const result = await client.query(query, [projectId, partnerId]);
    return result.rows.map(FundRequestRepository.mapRow);
  }

  static async findById(id, client = db.pool) {
    const query = `
      SELECT ${FUND_REQUEST_COLUMNS.join(', ')}
      FROM fund_requests
      WHERE id = $1
    `;
    
    const result = await client.query(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return FundRequestRepository.mapRow(result.rows[0]);
  }

  static async update(id, updates, client = db.pool) {
    const fields = [];
    const values = [];
    let index = 1;

    // Add updated_at timestamp
    updates.updatedAt = new Date();

    Object.keys(updates).forEach(key => {
      const column = FundRequestRepository.mapFieldToColumn(key);
      if (column) {
        fields.push(`${column} = $${index++}`);
        values.push(updates[key]);
      }
    });

    if (fields.length === 0) {
      return FundRequestRepository.findById(id, client);
    }

    const query = `
      UPDATE fund_requests
      SET ${fields.join(', ')}
      WHERE id = $${index}
      RETURNING ${FUND_REQUEST_COLUMNS.join(', ')}
    `;
    values.push(id);

    const result = await client.query(query, values);
    if (result.rows.length === 0) {
      return null;
    }
    return FundRequestRepository.mapRow(result.rows[0]);
  }

  static mapRow(row) {
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      projectId: row.project_id,
      partnerId: row.partner_id,
      amount: row.amount,
      currency: row.currency,
      purpose: row.purpose,
      periodFrom: row.period_from,
      periodTo: row.period_to,
      status: row.status,
      requestedAt: row.requested_at,
      approvedAt: row.approved_at,
      rejectedAt: row.rejected_at,
      paidAt: row.paid_at,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  static mapFieldToColumn(field) {
    const fieldToColumnMap = {
      projectId: 'project_id',
      partnerId: 'partner_id',
      periodFrom: 'period_from',
      periodTo: 'period_to',
      requestedAt: 'requested_at',
      approvedAt: 'approved_at',
      rejectedAt: 'rejected_at',
      paidAt: 'paid_at',
      createdBy: 'created_by',
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    };
    
    return fieldToColumnMap[field] || field;
  }
}

module.exports = FundRequestRepository;