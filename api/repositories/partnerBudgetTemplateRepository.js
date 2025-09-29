const db = require('../config/database');

const TEMPLATE_COLUMNS = [
  'id',
  'partner_budget_id',
  'category',
  'subcategory',
  'guidance',
  'required',
  'min_lines',
  'sort_index',
  'status',
  'created_by',
  'created_at',
  'legacy_category_id'
];

class PartnerBudgetTemplateRepository {
  static async findByBudget(partnerBudgetId, client = db.pool) {
    const query = `
      SELECT ${TEMPLATE_COLUMNS.join(', ')}
      FROM partner_budget_templates
      WHERE partner_budget_id = $1
      ORDER BY sort_index ASC, created_at ASC
    `;
    const result = await client.query(query, [partnerBudgetId]);
    return result.rows.map(PartnerBudgetTemplateRepository.mapRow);
  }

  static async findById(id, client = db.pool) {
    const query = `
      SELECT ${TEMPLATE_COLUMNS.join(', ')}
      FROM partner_budget_templates
      WHERE id = $1
    `;
    const result = await client.query(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return PartnerBudgetTemplateRepository.mapRow(result.rows[0]);
  }

  static mapRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      partnerBudgetId: row.partner_budget_id,
      category: row.category,
      subcategory: row.subcategory,
      guidance: row.guidance,
      required: row.required,
      minLines: row.min_lines,
      sortIndex: row.sort_index,
      status: row.status,
      createdBy: row.created_by,
      createdAt: row.created_at,
      legacyCategoryId: row.legacy_category_id
    };
  }
}

module.exports = PartnerBudgetTemplateRepository;