const { v4: uuidv4 } = require('uuid');

class SecurityRLSService {
  constructor(db) {
    this.db = db;
  }

  async createRLSPolicies() {
    const policies = [
      {
        name: 'grants_view_policy',
        sql: `
CREATE POLICY grants_view_policy ON grants
FOR SELECT
USING ( current_user_role() IN ('admin','coo') OR created_by = current_user_id() );
`
      },
      {
        name: 'budgets_view_policy',
        sql: `
CREATE POLICY budgets_view_policy ON budgets
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM grants g
    WHERE g.id = budgets.grant_id
      AND (g.created_by = current_user_id() OR current_user_role() IN ('admin','coo'))
  )
);
`
      }
    ];

    for (const p of policies) {
      try {
        await this.db.query(p.sql);
      } catch (err) {
        console.error('Error creating RLS policy', p.name, err);
      }
    }

    return { success: true, policiesCreated: policies.length };
  }

  async enableRLS() {
    const tables = ['grants', 'budgets', 'contracts', 'disbursements'];
    for (const t of tables) {
      try {
        await this.db.query(`ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY;`);
      } catch (err) {
        console.error('Error enabling RLS on', t, err);
      }
    }
    return { success: true };
  }

  async createSecurityRoles() {
    const roles = ['admin', 'coo', 'partner'];
    for (const r of roles) {
      try {
        // Create role if it does not exist (idempotent)
        await this.db.query(
          `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = $1) THEN EXECUTE format('CREATE ROLE %I NOLOGIN', $1); END IF; END $$;`,
          [r]
        );
      } catch (err) {
        console.error('Error creating role', r, err);
      }
    }
    return { success: true, rolesCreated: roles.length };
  }

  async getSecurityContext() {
    // Read application-defined settings or fall back to nulls
    const query = `SELECT current_setting('app.current_user_id', true) as user_id, current_setting('app.current_user_role', true) as user_role;`;
    const res = await this.db.query(query);
    return res.rows[0] || { user_id: null, user_role: null };
  }

  async validateGrantAccess(grantId, userId, userRole) {
    if (userRole === 'admin' || userRole === 'coo') {
      return { hasAccess: true, reason: 'admin_or_coo' };
    }
    const q = `SELECT 1 FROM grants WHERE id = $1 AND created_by = $2 LIMIT 1`;
    const r = await this.db.query(q, [grantId, userId]);
    return { hasAccess: r.rows.length > 0, reason: r.rows.length > 0 ? 'owner' : 'no_access' };
  }

  async logSecurityEvent({ userId, action, resourceType, resourceId, success = true, metadata = {} }) {
    const q = `
INSERT INTO security_audit_logs (id, user_id, action, resource_type, resource_id, success, metadata, created_at)
VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
RETURNING *;`;
    const values = [uuidv4(), userId, action, resourceType, resourceId, success, JSON.stringify(metadata)];
    const res = await this.db.query(q, values);
    return res.rows[0];
  }

  async canUserPerformAction(userId, action, resourceType, resourceId) {
    const ctx = await this.getSecurityContext();
    if (ctx && ctx.user_role === 'admin') return { allowed: true, reason: 'admin' };

    // Fallback simple check: resource owner
    try {
      const q = `SELECT created_by FROM ${resourceType} WHERE id = $1 LIMIT 1`;
      const r = await this.db.query(q, [resourceId]);
      if (r.rows.length === 0) return { allowed: false, reason: 'not_found' };
      return { allowed: r.rows[0].created_by === userId, reason: 'owner_check' };
    } catch (err) {
      console.error('canUserPerformAction error', err);
      return { allowed: false, reason: 'error' };
    }
  }

  async getUserGrantPermissions(userId, grantId) {
    const q = `SELECT id, created_by FROM grants WHERE id = $1`;
    const r = await this.db.query(q, [grantId]);
    if (r.rows.length === 0) return { allowed: false, reason: 'no_grant' };
    const row = r.rows[0];
    const ctx = await this.getSecurityContext();
    const has_access = row.created_by === userId || (ctx && ['admin', 'coo'].includes(ctx.user_role));
    return { grant_id: row.id, created_by: row.created_by, has_access };
  }

  async createDefaultSecurityConfig() {
    return { rls_enabled: true, audit_logging: true, access_control: 'role_based' };
  }

  async encryptData(data, key) {
    // Placeholder for real encryption
    return { encrypted: true, data: 'encrypted_data' };
  }

  async decryptData(encryptedData, key) {
    return { decrypted: true, data: 'decrypted_data' };
  }

  async createSecurityAuditReport(startDate, endDate) {
    const q = `
SELECT
  COUNT(*) as total_events,
  COUNT(CASE WHEN success = true THEN 1 END) as successful_actions,
  COUNT(CASE WHEN success = false THEN 1 END) as failed_actions,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(CASE WHEN success = true THEN 1 ELSE 0 END) as success_rate
FROM security_audit_logs
WHERE created_at BETWEEN $1 AND $2;`;
    const res = await this.db.query(q, [startDate, endDate]);
    return res.rows[0];
  }
}

module.exports = SecurityRLSService;