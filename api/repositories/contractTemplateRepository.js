const db = require('../config/database');

const TEMPLATE_COLUMNS = [
  'id',
  'name',
  'description',
  'storage_key',
  'placeholder_schema',
  'is_default',
  'active',
  'created_at'
];

class ContractTemplateRepository {
  static async findActive(client = db.pool) {
    const result = await client.query(
      `SELECT ${TEMPLATE_COLUMNS.join(', ')}
       FROM contract_templates
       WHERE active = TRUE
       ORDER BY is_default DESC, name ASC`
    );
    return result.rows.map(ContractTemplateRepository.mapRow);
  }

  static async findById(id, client = db.pool) {
    const result = await client.query(
      `SELECT ${TEMPLATE_COLUMNS.join(', ')}
       FROM contract_templates
       WHERE id = $1`,
      [id]
    );
    return result.rows.length ? ContractTemplateRepository.mapRow(result.rows[0]) : null;
  }

  static mapRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      storageKey: row.storage_key,
      placeholderSchema: row.placeholder_schema,
      isDefault: row.is_default,
      active: row.active,
      createdAt: row.created_at
    };
  }
}

module.exports = ContractTemplateRepository;