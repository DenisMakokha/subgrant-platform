const db = require('../config/database');

const LINE_COLUMNS = [
  'id',
  'partner_budget_id',
  'template_id',
  'description',
  'unit',
  'qty',
  'unit_cost',
  'total',
  'currency',
  'period_from',
  'period_to',
  'notes',
  'status',
  'created_by',
  'created_at'
];

class PartnerBudgetLineRepository {
  static async create(line, client = db.pool) {
    const query = `
      INSERT INTO partner_budget_lines (
        id,
        partner_budget_id,
        template_id,
        description,
        unit,
        qty,
        unit_cost,
        currency,
        period_from,
        period_to,
        notes,
        status,
        created_by,
        created_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, COALESCE($14, now())
      )
      RETURNING ${LINE_COLUMNS.join(', ')}
    `;
    const values = [
      line.id,
      line.partnerBudgetId,
      line.templateId,
      line.description,
      line.unit,
      line.qty,
      line.unitCost,
      line.currency,
      line.periodFrom,
      line.periodTo,
      line.notes,
      line.status,
      line.createdBy,
      line.createdAt
    ];
    const result = await client.query(query, values);
    return PartnerBudgetLineRepository.mapRow(result.rows[0]);
  }

  static async replaceBudgetLines(partnerBudgetId, lines, client = db.pool) {
    await client.query('DELETE FROM partner_budget_lines WHERE partner_budget_id = $1', [partnerBudgetId]);

    const created = [];
    for (const line of lines) {
      const record = await PartnerBudgetLineRepository.create(
        { ...line, partnerBudgetId },
        client
      );
      created.push(record);
    }
    return created;
  }

  static async findByBudget(partnerBudgetId, client = db.pool) {
    const query = `
      SELECT ${LINE_COLUMNS.join(', ')}
      FROM partner_budget_lines
      WHERE partner_budget_id = $1
      ORDER BY created_at ASC
    `;
    const result = await client.query(query, [partnerBudgetId]);
    return result.rows.map(PartnerBudgetLineRepository.mapRow);
  }

  static async findByBudgetLineId(lineId, client = db.pool) {
    const query = `
      SELECT ${LINE_COLUMNS.join(', ')}
      FROM partner_budget_lines
      WHERE id = $1
    `;
    const result = await client.query(query, [lineId]);
    if (result.rows.length === 0) {
      return null;
    }
    return PartnerBudgetLineRepository.mapRow(result.rows[0]);
  }

  static async findById(id, client = db.pool) {
    const query = `
      SELECT ${LINE_COLUMNS.join(', ')}
      FROM partner_budget_lines
      WHERE id = $1
    `;
    const result = await client.query(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return PartnerBudgetLineRepository.mapRow(result.rows[0]);
  }

  static async update(id, updates, client = db.pool) {
    const fields = [];
    const values = [];
    let index = 1;

    if (updates.description !== undefined) {
      fields.push(`description = $${index++}`);
      values.push(updates.description);
    }
    if (updates.unit !== undefined) {
      fields.push(`unit = $${index++}`);
      values.push(updates.unit);
    }
    if (updates.qty !== undefined) {
      fields.push(`qty = $${index++}`);
      values.push(updates.qty);
    }
    if (updates.unitCost !== undefined) {
      fields.push(`unit_cost = $${index++}`);
      values.push(updates.unitCost);
    }
    if (updates.currency !== undefined) {
      fields.push(`currency = $${index++}`);
      values.push(updates.currency);
    }
    if (updates.periodFrom !== undefined) {
      fields.push(`period_from = $${index++}`);
      values.push(updates.periodFrom);
    }
    if (updates.periodTo !== undefined) {
      fields.push(`period_to = $${index++}`);
      values.push(updates.periodTo);
    }
    if (updates.notes !== undefined) {
      fields.push(`notes = $${index++}`);
      values.push(updates.notes);
    }
    if (updates.status !== undefined) {
      fields.push(`status = $${index++}`);
      values.push(updates.status);
    }

    if (fields.length === 0) {
      return PartnerBudgetLineRepository.findById(id, client);
    }

    const query = `
      UPDATE partner_budget_lines
      SET ${fields.join(', ')}
      WHERE id = $${index}
      RETURNING ${LINE_COLUMNS.join(', ')}
    `;
    values.push(id);

    const result = await client.query(query, values);
    if (result.rows.length === 0) {
      return null;
    }
    return PartnerBudgetLineRepository.mapRow(result.rows[0]);
  }

  static async updateStatus(lineIds, status, client = db.pool) {
    if (!Array.isArray(lineIds) || lineIds.length === 0) {
      return [];
    }
    const placeholders = lineIds.map((_, idx) => `$${idx + 2}`).join(', ');
    const query = `
      UPDATE partner_budget_lines
      SET status = $1,
          created_at = created_at -- preserve trigger semantics
      WHERE id IN (${placeholders})
      RETURNING ${LINE_COLUMNS.join(', ')}
    `;
    const result = await client.query(query, [status, ...lineIds]);
    return result.rows.map(PartnerBudgetLineRepository.mapRow);
  }

  static mapRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      partnerBudgetId: row.partner_budget_id,
      templateId: row.template_id,
      description: row.description,
      unit: row.unit,
      qty: row.qty,
      unitCost: row.unit_cost,
      total: row.total,
      currency: row.currency,
      periodFrom: row.period_from,
      periodTo: row.period_to,
      notes: row.notes,
      status: row.status,
      createdBy: row.created_by,
      createdAt: row.created_at
    };
  }
}

module.exports = PartnerBudgetLineRepository;