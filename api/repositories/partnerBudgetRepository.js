const db = require('../config/database');

const PARTNER_BUDGET_COLUMNS = [
  'id',
  'project_id',
  'partner_id',
  'currency',
  'ceiling_total',
  'status',
  'rules_json',
  'created_by',
  'created_at',
  'updated_at'
];

class PartnerBudgetRepository {
  static async create(budget, client = db.pool) {
    const query = `
      INSERT INTO partner_budgets (
        id,
        project_id,
        partner_id,
        currency,
        ceiling_total,
        status,
        rules_json,
        created_by,
        created_at,
        updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6,
        COALESCE($7, '{}'::jsonb),
        $8,
        COALESCE($9, now()),
        now()
      )
      RETURNING ${PARTNER_BUDGET_COLUMNS.join(', ')}
    `;

    const values = [
      budget.id,
      budget.projectId,
      budget.partnerId,
      budget.currency,
      budget.ceilingTotal,
      budget.status,
      budget.rulesJson,
      budget.createdBy,
      budget.createdAt
    ];

    const result = await client.query(query, values);
    return PartnerBudgetRepository.mapRow(result.rows[0]);
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
    if (updates.currency !== undefined) {
      fields.push(`currency = $${index++}`);
      values.push(updates.currency);
    }
    if (updates.ceilingTotal !== undefined) {
      fields.push(`ceiling_total = $${index++}`);
      values.push(updates.ceilingTotal);
    }
    if (updates.status !== undefined) {
      fields.push(`status = $${index++}`);
      values.push(updates.status);
    }
    if (updates.rulesJson !== undefined) {
      fields.push(`rules_json = COALESCE($${index++}, '{}'::jsonb)`);
      values.push(updates.rulesJson);
    }
    if (updates.updatedAt !== undefined) {
      fields.push(`updated_at = $${index++}`);
      values.push(updates.updatedAt);
    } else {
      fields.push(`updated_at = now()`);
    }

    if (fields.length === 0) {
      return PartnerBudgetRepository.findById(id, client);
    }

    const query = `
      UPDATE partner_budgets
      SET ${fields.join(', ')}
      WHERE id = $${index}
      RETURNING ${PARTNER_BUDGET_COLUMNS.join(', ')}
    `;
    values.push(id);

    const result = await client.query(query, values);
    if (result.rows.length === 0) {
      return null;
    }
    return PartnerBudgetRepository.mapRow(result.rows[0]);
  }

  static async findById(id, client = db.pool) {
    const query = `
      SELECT ${PARTNER_BUDGET_COLUMNS.join(', ')}
      FROM partner_budgets
      WHERE id = $1
    `;
    const result = await client.query(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return PartnerBudgetRepository.mapRow(result.rows[0]);
  }

  static async findByPartner(partnerId, client = db.pool) {
    const query = `
      SELECT ${PARTNER_BUDGET_COLUMNS.join(', ')}
      FROM partner_budgets
      WHERE partner_id = $1
      ORDER BY created_at DESC
    `;
    const result = await client.query(query, [partnerId]);
    return result.rows.map(PartnerBudgetRepository.mapRow);
  }

  static async findByProject(projectId, client = db.pool) {
    const query = `
      SELECT ${PARTNER_BUDGET_COLUMNS.join(', ')}
      FROM partner_budgets
      WHERE project_id = $1
      ORDER BY created_at DESC
    `;
    const result = await client.query(query, [projectId]);
    return result.rows.map(PartnerBudgetRepository.mapRow);
  }

  static async transitionStatus(id, nextStatus, actorId, client = db.pool) {
    const query = `
      UPDATE partner_budgets
      SET status = $2,
          updated_at = now(),
          rules_json = jsonb_set(
            COALESCE(rules_json, '{}'::jsonb),
            '{last_transition_by}',
            to_jsonb($3::uuid),
            true
          )
      WHERE id = $1
      RETURNING ${PARTNER_BUDGET_COLUMNS.join(', ')}
    `;
    const result = await client.query(query, [id, nextStatus, actorId]);
    if (result.rows.length === 0) {
      return null;
    }
    return PartnerBudgetRepository.mapRow(result.rows[0]);
  }

  static async lockBudget(id, client = db.pool) {
    const query = `
      UPDATE partner_budgets
      SET status = 'LOCKED',
          updated_at = now()
      WHERE id = $1
      RETURNING ${PARTNER_BUDGET_COLUMNS.join(', ')}
    `;
    const result = await client.query(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return PartnerBudgetRepository.mapRow(result.rows[0]);
  }

  static mapRow(row) {
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      projectId: row.project_id,
      partnerId: row.partner_id,
      currency: row.currency,
      ceilingTotal: row.ceiling_total,
      status: row.status,
      rulesJson: row.rules_json,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

module.exports = PartnerBudgetRepository;