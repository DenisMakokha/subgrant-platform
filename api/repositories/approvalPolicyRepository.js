const db = require('../config/database');

const APPROVAL_POLICY_COLUMNS = [
  'id',
  'scope',
  'scope_ref',
  'entity_type',
  'provider',
  'name',
  'description',
  'config_json',
  'active',
  'created_at'
];

class ApprovalPolicyRepository {
  static async create(policy, client = db.pool) {
    const query = `
      INSERT INTO approval_policies (
        id,
        scope,
        scope_ref,
        entity_type,
        provider,
        name,
        description,
        config_json,
        active,
        created_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      )
      RETURNING ${APPROVAL_POLICY_COLUMNS.join(', ')}
    `;

    const values = [
      policy.id,
      policy.scope,
      policy.scopeRef,
      policy.entityType,
      policy.provider,
      policy.name,
      policy.description,
      policy.configJson,
      policy.active,
      policy.createdAt || new Date()
    ];

    const result = await client.query(query, values);
    return ApprovalPolicyRepository.mapRow(result.rows[0]);
  }

  static async findByEntityType(entityType, client = db.pool) {
    const query = `
      SELECT ${APPROVAL_POLICY_COLUMNS.join(', ')}
      FROM approval_policies
      WHERE entity_type = $1 AND active = TRUE
      ORDER BY created_at DESC
    `;
    const result = await client.query(query, [entityType]);
    return result.rows.map(ApprovalPolicyRepository.mapRow);
  }

  static async findByEntityTypeAndScope(entityType, scope, scopeRef = null, client = db.pool) {
    const query = `
      SELECT ${APPROVAL_POLICY_COLUMNS.join(', ')}
      FROM approval_policies
      WHERE entity_type = $1 AND scope = $2 AND scope_ref ${scopeRef ? '= $3' : 'IS NULL'} AND active = TRUE
      ORDER BY created_at DESC
    `;
    const values = scopeRef ? [entityType, scope, scopeRef] : [entityType, scope];
    const result = await client.query(query, values);
    return result.rows.map(ApprovalPolicyRepository.mapRow);
  }

  static async findByRole(role, client = db.pool) {
    const query = `
      SELECT ${APPROVAL_POLICY_COLUMNS.join(', ')}
      FROM approval_policies
      WHERE config_json->>'role' = $1 AND active = TRUE
      ORDER BY created_at DESC
    `;
    const result = await client.query(query, [role]);
    return result.rows.map(ApprovalPolicyRepository.mapRow);
  }

  static async findById(id, client = db.pool) {
    const query = `
      SELECT ${APPROVAL_POLICY_COLUMNS.join(', ')}
      FROM approval_policies
      WHERE id = $1
    `;
    const result = await client.query(query, [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return ApprovalPolicyRepository.mapRow(result.rows[0]);
  }

  static mapRow(row) {
    if (!row) {
      return null;
    }
    return {
      id: row.id,
      scope: row.scope,
      scopeRef: row.scope_ref,
      entityType: row.entity_type,
      provider: row.provider,
      name: row.name,
      description: row.description,
      configJson: row.config_json,
      active: row.active,
      createdAt: row.created_at
    };
  }
}

module.exports = ApprovalPolicyRepository;