const db = require('../config/database');

const APPROVAL_COLUMNS = [
  'id',
  'policy_id',
  'entity_type',
  'entity_id',
  'provider',
  'approval_ref',
  'status',
  'assignee_role',
  'step',
  'total_steps',
  'amount',
  'requested_by',
  'requested_at',
  'decided_by',
  'decided_at',
  'comment',
  'metadata_json'
];

class ApprovalRepository {
  static async create(approval, client = db.pool) {
    const query = `
      INSERT INTO approvals (
        id,
        policy_id,
        entity_type,
        entity_id,
        provider,
        approval_ref,
        status,
        assignee_role,
        step,
        total_steps,
        amount,
        requested_by,
        requested_at,
        decided_by,
        decided_at,
        comment,
        metadata_json
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
      )
      RETURNING ${APPROVAL_COLUMNS.join(', ')}
    `;

    const values = [
      approval.id,
      approval.policyId,
      approval.entityType,
      approval.entityId,
      approval.provider,
      approval.approvalRef,
      approval.status || 'PENDING',
      approval.assigneeRole,
      approval.step || 1,
      approval.totalSteps || 1,
      approval.amount,
      approval.requestedBy,
      approval.requestedAt || new Date(),
      approval.decidedBy,
      approval.decidedAt,
      approval.comment,
      approval.metadataJson || {}
    ];

    const result = await client.query(query, values);
    return ApprovalRepository.mapRow(result.rows[0]);
  }

  static async findByEntityId(entityId, client = db.pool) {
    const query = `
      SELECT ${APPROVAL_COLUMNS.join(', ')}
      FROM approvals
      WHERE entity_id = $1
      ORDER BY requested_at DESC
    `;
    const result = await client.query(query, [entityId]);
    return result.rows.map(ApprovalRepository.mapRow);
  }

  static async findById(id, client = db.pool) {
    const query = `
      SELECT ${APPROVAL_COLUMNS.join(', ')}
      FROM approvals
      WHERE id = $1
    `;
    const result = await client.query(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return ApprovalRepository.mapRow(result.rows[0]);
  }

  static async updateStatus(id, status, updates = {}, client = db.pool) {
    const fields = ['status = $2'];
    const values = [id, status];
    let index = 3;

    if (updates.decidedBy !== undefined) {
      fields.push(`decided_by = $${index++}`);
      values.push(updates.decidedBy);
    }
    if (updates.decidedAt !== undefined) {
      fields.push(`decided_at = $${index++}`);
      values.push(updates.decidedAt);
    }
    if (updates.comment !== undefined) {
      fields.push(`comment = $${index++}`);
      values.push(updates.comment);
    }
    if (updates.step !== undefined) {
      fields.push(`step = $${index++}`);
      values.push(updates.step);
    }
    if (updates.assigneeRole !== undefined) {
      fields.push(`assignee_role = $${index++}`);
      values.push(updates.assigneeRole);
    }

    const query = `
      UPDATE approvals
      SET ${fields.join(', ')}
      WHERE id = $1
      RETURNING ${APPROVAL_COLUMNS.join(', ')}
    `;
    values.push(id);

    const result = await client.query(query, values);
    if (result.rows.length === 0) {
      return null;
    }
    return ApprovalRepository.mapRow(result.rows[0]);
  }

  static async findPendingByRole(role, client = db.pool) {
    const query = `
      SELECT ${APPROVAL_COLUMNS.join(', ')}
      FROM approvals
      WHERE assignee_role = $1 AND status = 'PENDING'
      ORDER BY requested_at ASC
    `;
    const result = await client.query(query, [role]);
    return result.rows.map(ApprovalRepository.mapRow);
  }

  static mapRow(row) {
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      policyId: row.policy_id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      provider: row.provider,
      approvalRef: row.approval_ref,
      status: row.status,
      assigneeRole: row.assignee_role,
      step: row.step,
      totalSteps: row.total_steps,
      amount: row.amount,
      requestedBy: row.requested_by,
      requestedAt: row.requested_at,
      decidedBy: row.decided_by,
      decidedAt: row.decided_at,
      comment: row.comment,
      metadataJson: row.metadata_json
    };
  }
}

module.exports = ApprovalRepository;