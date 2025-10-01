const db = require('../config/database');

const RECON_LINE_EVIDENCE_COLUMNS = [
  'id',
  'partner_budget_line_id',
  'amount',
  'spent_at',
  'document_uri',
  'document_name',
  'mime_type',
  'checksum',
  'note',
  'created_by',
  'created_at'
];

class ReconciliationRepository {
  static async create(evidence, client = db.pool) {
    return ReconciliationRepository.createEvidence(evidence, client);
  }

  static async findById(id, client = db.pool) {
    const query = `
      SELECT ${RECON_LINE_EVIDENCE_COLUMNS.join(', ')}
      FROM recon_line_evidence
      WHERE id = $1
    `;
    const result = await client.query(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return ReconciliationRepository.mapRow(result.rows[0]);
  }

  static async update(id, updates, client = db.pool) {
    const fields = [];
    const values = [];
    let index = 1;

    if (updates.amount !== undefined) {
      fields.push(`amount = $${index++}`);
      values.push(updates.amount);
    }
    if (updates.spentAt !== undefined) {
      fields.push(`spent_at = $${index++}`);
      values.push(updates.spentAt);
    }
    if (updates.documentUri !== undefined) {
      fields.push(`document_uri = $${index++}`);
      values.push(updates.documentUri);
    }
    if (updates.documentName !== undefined) {
      fields.push(`document_name = $${index++}`);
      values.push(updates.documentName);
    }
    if (updates.mimeType !== undefined) {
      fields.push(`mime_type = $${index++}`);
      values.push(updates.mimeType);
    }
    if (updates.checksum !== undefined) {
      fields.push(`checksum = $${index++}`);
      values.push(updates.checksum);
    }
    if (updates.note !== undefined) {
      fields.push(`note = $${index++}`);
      values.push(updates.note);
    }

    if (fields.length === 0) {
      return ReconciliationRepository.findById(id, client);
    }

    const query = `
      UPDATE recon_line_evidence
      SET ${fields.join(', ')}
      WHERE id = $${index}
      RETURNING ${RECON_LINE_EVIDENCE_COLUMNS.join(', ')}
    `;
    values.push(id);

    const result = await client.query(query, values);
    if (result.rows.length === 0) {
      return null;
    }
    return ReconciliationRepository.mapRow(result.rows[0]);
  }

  static async createEvidence(evidence, client = db.pool) {
    const query = `
      INSERT INTO recon_line_evidence (
        id,
        partner_budget_line_id,
        amount,
        spent_at,
        document_uri,
        document_name,
        mime_type,
        checksum,
        note,
        created_by,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, COALESCE($11, now()))
      RETURNING ${RECON_LINE_EVIDENCE_COLUMNS.join(', ')}
    `;

    const values = [
      evidence.id,
      evidence.partnerBudgetLineId,
      evidence.amount,
      evidence.spentAt,
      evidence.documentUri,
      evidence.documentName,
      evidence.mimeType,
      evidence.checksum,
      evidence.note,
      evidence.createdBy,
      evidence.createdAt
    ];

    const result = await client.query(query, values);
    return ReconciliationRepository.mapRow(result.rows[0]);
  }

  static async getEvidenceByBudgetLine(partnerBudgetLineId, client = db.pool) {
    return ReconciliationRepository.findByBudgetLine(partnerBudgetLineId, client);
  }

  static async findByBudgetLine(partnerBudgetLineId, client = db.pool) {
    const query = `
      SELECT ${RECON_LINE_EVIDENCE_COLUMNS.join(', ')}
      FROM recon_line_evidence
      WHERE partner_budget_line_id = $1
      ORDER BY spent_at DESC
    `;
    const result = await client.query(query, [partnerBudgetLineId]);
    return result.rows.map(ReconciliationRepository.mapRow);
  }

  static async getSummaryByBudget(partnerBudgetId, client = db.pool) {
    const query = `
      SELECT 
        pbl.id,
        pbl.description,
        pbl.total as approved_amount,
        COALESCE(SUM(rle.amount), 0) as spent_cumulative,
        pbl.total - COALESCE(SUM(rle.amount), 0) as remaining,
        COUNT(rle.id) as evidence_count
      FROM partner_budget_lines pbl
      LEFT JOIN recon_line_evidence rle ON pbl.id = rle.partner_budget_line_id
      WHERE pbl.partner_budget_id = $1
      GROUP BY pbl.id, pbl.description, pbl.total
      ORDER BY pbl.created_at ASC
    `;
    const result = await client.query(query, [partnerBudgetId]);
    return result.rows.map(row => ({
      id: row.id,
      description: row.description,
      total: parseFloat(row.approved_amount),
      spentCumulative: parseFloat(row.spent_cumulative),
      remaining: parseFloat(row.remaining),
      evidenceCount: parseInt(row.evidence_count)
    }));
  }

  static async getEvidenceCountByBudgetLine(partnerBudgetLineId, client = db.pool) {
    const query = `
      SELECT COUNT(*) as count
      FROM recon_line_evidence
      WHERE partner_budget_line_id = $1
    `;
    const result = await client.query(query, [partnerBudgetLineId]);
    return parseInt(result.rows[0].count);
  }

  static async getTotalSpentByBudgetLine(partnerBudgetLineId, client = db.pool) {
    const query = `
      SELECT COALESCE(SUM(amount), 0) as total_spent
      FROM recon_line_evidence
      WHERE partner_budget_line_id = $1
    `;
    const result = await client.query(query, [partnerBudgetLineId]);
    return parseFloat(result.rows[0].total_spent);
  }

  static async deleteEvidence(evidenceId, client = db.pool) {
    const query = `
      DELETE FROM recon_line_evidence
      WHERE id = $1
      RETURNING ${RECON_LINE_EVIDENCE_COLUMNS.join(', ')}
    `;
    const result = await client.query(query, [evidenceId]);
    return result.rows.length ? ReconciliationRepository.mapRow(result.rows[0]) : null;
  }

  static mapRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      partnerBudgetLineId: row.partner_budget_line_id,
      amount: parseFloat(row.amount),
      spentAt: row.spent_at,
      documentUri: row.document_uri,
      documentName: row.document_name,
      mimeType: row.mime_type,
      checksum: row.checksum,
      note: row.note,
      createdBy: row.created_by,
      createdAt: row.created_at
    };
  }
}

module.exports = ReconciliationRepository;