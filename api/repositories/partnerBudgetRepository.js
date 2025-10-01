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

  static async findByPartnerAndProject(partnerId, projectId, client = db.pool) {
    const query = `
      SELECT ${PARTNER_BUDGET_COLUMNS.join(', ')}
      FROM partner_budgets
      WHERE partner_id = $1 AND project_id = $2
      ORDER BY created_at DESC
    `;
    const result = await client.query(query, [partnerId, projectId]);
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

  /**
   * Get total budget from all approved budgets
   */
  static async getTotalBudget(client = db.pool) {
    const query = `
      SELECT COALESCE(SUM(ceiling_total), 0) as total 
      FROM partner_budgets 
      WHERE status = 'approved'
    `;
    const result = await client.query(query);
    return parseFloat(result.rows[0]?.total || 0);
  }

  /**
   * Get total disbursed amount
   */
  static async getTotalDisbursed(client = db.pool) {
    const query = `
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM disbursements 
      WHERE status = 'paid'
    `;
    const result = await client.query(query);
    return parseFloat(result.rows[0]?.total || 0);
  }

  /**
   * Get quarterly spending data
   */
  static async getQuarterlySpending(year = new Date().getFullYear(), client = db.pool) {
    const query = `
      SELECT 
        CONCAT('Q', EXTRACT(QUARTER FROM d.created_at)) as quarter,
        COALESCE(SUM(d.amount), 0) as amount,
        COALESCE(SUM(pb.ceiling_total), 0) as budget
      FROM disbursements d
      LEFT JOIN partner_budgets pb ON d.partner_budget_id = pb.id
      WHERE EXTRACT(YEAR FROM d.created_at) = $1
      GROUP BY EXTRACT(QUARTER FROM d.created_at)
      ORDER BY EXTRACT(QUARTER FROM d.created_at)
    `;
    const result = await client.query(query, [year]);
    return result.rows.map(row => ({
      quarter: `${row.quarter} ${year}`,
      amount: parseFloat(row.amount || 0),
      budget: parseFloat(row.budget || 0)
    }));
  }

  /**
   * Get top expense categories from budget lines using template categories
   */
  static async getTopExpenseCategories(limit = 5, client = db.pool) {
    const query = `
      SELECT 
        pbt.category,
        COALESCE(SUM(pbl.total), 0) as amount,
        ROUND((COALESCE(SUM(pbl.total), 0) / NULLIF((SELECT SUM(total) FROM partner_budget_lines), 0) * 100), 2) as percentage
      FROM partner_budget_lines pbl
      JOIN partner_budget_templates pbt ON pbl.template_id = pbt.id
      WHERE pbl.total > 0
      GROUP BY pbt.category
      ORDER BY amount DESC
      LIMIT $1
    `;
    const result = await client.query(query, [limit]);
    return result.rows.map(row => ({
      category: row.category || 'Uncategorized',
      amount: parseFloat(row.amount || 0),
      percentage: parseFloat(row.percentage || 0)
    }));
  }
}

module.exports = PartnerBudgetRepository;