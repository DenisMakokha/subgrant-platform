/**
 * Role & Dashboard Wizard Service
 * Handles complete role and dashboard creation workflow
 */

const db = require('../config/database');
const { ValidationError, NotFoundError } = require('../errors');
const { invalidateCache } = require('../cache/cacheInvalidation');
const { logApiCall, logError } = require('./observabilityService');

/**
 * Validate role definition
 */
function validateRoleDefinition(roleDef) {
  const errors = [];

  // Required fields
  if (!roleDef.id || typeof roleDef.id !== 'string') {
    errors.push('Role ID is required and must be a string');
  }

  if (!roleDef.label || typeof roleDef.label !== 'string') {
    errors.push('Role label is required and must be a string');
  }

  // Validate ID format (lowercase, underscores only)
  if (roleDef.id && !/^[a-z][a-z0-9_]*$/.test(roleDef.id)) {
    errors.push('Role ID must start with a letter and contain only lowercase letters, numbers, and underscores');
  }

  // Capabilities validation
  if (!Array.isArray(roleDef.capabilities)) {
    errors.push('Capabilities must be an array');
  } else if (roleDef.capabilities.length === 0) {
    errors.push('At least one capability must be selected');
  }

  // Scopes validation
  if (!roleDef.scopes || typeof roleDef.scopes !== 'object') {
    errors.push('Scopes must be an object');
  } else if (Object.keys(roleDef.scopes).length === 0) {
    errors.push('At least one scope must be configured');
  }

  if (errors.length > 0) {
    throw new ValidationError(errors.join(', '));
  }

  return true;
}

/**
 * Validate dashboard definition
 */
function validateDashboardDefinition(dashboardDef) {
  const errors = [];

  // Required fields
  if (!dashboardDef.role_id || typeof dashboardDef.role_id !== 'string') {
    errors.push('Role ID is required for dashboard');
  }

  // Menus validation
  if (!Array.isArray(dashboardDef.menus_json)) {
    errors.push('Menus must be an array');
  }

  // Pages validation
  if (!Array.isArray(dashboardDef.pages_json)) {
    errors.push('Pages must be an array');
  }

  // Widgets validation (optional but recommended)
  if (dashboardDef.widgets && !Array.isArray(dashboardDef.widgets)) {
    errors.push('Widgets must be an array');
  }

  if (errors.length > 0) {
    throw new ValidationError(errors.join(', '));
  }

  return true;
}

/**
 * Check if role ID already exists
 */
async function checkRoleExists(roleId) {
  const result = await db.pool.query(
    'SELECT id FROM roles WHERE id = $1',
    [roleId]
  );
  return result.rows.length > 0;
}

/**
 * Create or update role
 */
async function createOrUpdateRole(roleDef, userId) {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');

    // Validate role definition
    validateRoleDefinition(roleDef);

    // Check if role exists
    const exists = await checkRoleExists(roleDef.id);

    let query, values;
    
    if (exists) {
      // Update existing role
      query = `
        UPDATE roles 
        SET 
          label = $2,
          description = $3,
          caps = $4,
          scopes = $5,
          visibility_rules = $6,
          inherits = $7,
          version = version + 1,
          updated_at = NOW(),
          updated_by = $8
        WHERE id = $1
        RETURNING *
      `;
      
      values = [
        roleDef.id,
        roleDef.label,
        roleDef.description || '',
        JSON.stringify(roleDef.capabilities || []),
        JSON.stringify(roleDef.scopes || {}),
        JSON.stringify(roleDef.visibility_rules || []),
        JSON.stringify(roleDef.inherits || []),
        userId
      ];
    } else {
      // Create new role
      query = `
        INSERT INTO roles (
          id, label, description, caps, scopes, 
          visibility_rules, inherits, version, active,
          created_at, created_by, updated_at, updated_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10, NOW(), $10)
        RETURNING *
      `;
      
      values = [
        roleDef.id,
        roleDef.label,
        roleDef.description || '',
        JSON.stringify(roleDef.capabilities || []),
        JSON.stringify(roleDef.scopes || {}),
        JSON.stringify(roleDef.visibility_rules || []),
        JSON.stringify(roleDef.inherits || []),
        1, // version
        roleDef.active !== false, // default to true
        userId
      ];
    }

    const result = await client.query(query, values);
    await client.query('COMMIT');

    // Invalidate cache
    invalidateCache('roles');

    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Create or update dashboard
 */
async function createOrUpdateDashboard(dashboardDef, userId) {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');

    // Validate dashboard definition
    validateDashboardDefinition(dashboardDef);

    // Check if dashboard exists for this role
    const existsResult = await client.query(
      'SELECT role_id FROM dashboards WHERE role_id = $1',
      [dashboardDef.role_id]
    );
    
    const exists = existsResult.rows.length > 0;

    let query, values;
    
    if (exists) {
      // Update existing dashboard
      query = `
        UPDATE dashboards 
        SET 
          menus_json = $2,
          pages_json = $3,
          widgets = $4,
          version = version + 1,
          updated_at = NOW(),
          updated_by = $5
        WHERE role_id = $1
        RETURNING *
      `;
      
      values = [
        dashboardDef.role_id,
        JSON.stringify(dashboardDef.menus_json || []),
        JSON.stringify(dashboardDef.pages_json || []),
        JSON.stringify(dashboardDef.widgets || []),
        userId
      ];
    } else {
      // Create new dashboard
      query = `
        INSERT INTO dashboards (
          role_id, menus_json, pages_json, widgets, 
          version, active, created_at, created_by, 
          updated_at, updated_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, NOW(), $7)
        RETURNING *
      `;
      
      values = [
        dashboardDef.role_id,
        JSON.stringify(dashboardDef.menus_json || []),
        JSON.stringify(dashboardDef.pages_json || []),
        JSON.stringify(dashboardDef.widgets || []),
        1, // version
        dashboardDef.active !== false, // default to true
        userId
      ];
    }

    const result = await client.query(query, values);
    await client.query('COMMIT');

    // Invalidate cache
    invalidateCache('dashboards');

    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Save dashboard as template
 */
async function saveDashboardTemplate(templateData, userId) {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');

    const query = `
      INSERT INTO dashboard_templates (
        id, name, description, target_role, 
        default_widgets, default_menus, default_pages,
        default_layout_columns, is_system_template,
        created_at, created_by, updated_at, updated_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10, NOW(), $10)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        target_role = EXCLUDED.target_role,
        default_widgets = EXCLUDED.default_widgets,
        default_menus = EXCLUDED.default_menus,
        default_pages = EXCLUDED.default_pages,
        default_layout_columns = EXCLUDED.default_layout_columns,
        updated_at = NOW(),
        updated_by = EXCLUDED.updated_by
      RETURNING *
    `;

    const values = [
      templateData.id,
      templateData.name,
      templateData.description || '',
      templateData.target_role,
      JSON.stringify(templateData.default_widgets || []),
      JSON.stringify(templateData.default_menus || []),
      JSON.stringify(templateData.default_pages || []),
      templateData.default_layout_columns || 3,
      templateData.is_system_template || false,
      userId
    ];

    const result = await client.query(query, values);
    await client.query('COMMIT');

    // Invalidate cache
    invalidateCache('dashboard_templates');

    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get complete role with dashboard
 */
async function getRoleWithDashboard(roleId) {
  const roleResult = await db.pool.query(
    'SELECT * FROM roles WHERE id = $1',
    [roleId]
  );

  if (roleResult.rows.length === 0) {
    throw new NotFoundError(`Role ${roleId} not found`);
  }

  const dashboardResult = await db.pool.query(
    'SELECT * FROM dashboards WHERE role_id = $1',
    [roleId]
  );

  return {
    role: roleResult.rows[0],
    dashboard: dashboardResult.rows.length > 0 ? dashboardResult.rows[0] : null
  };
}

/**
 * Delete role and associated dashboard
 */
async function deleteRoleAndDashboard(roleId, userId) {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');

    // Check if role has users assigned
    const usersResult = await client.query(
      'SELECT COUNT(*) as count FROM users WHERE role = $1',
      [roleId]
    );

    if (parseInt(usersResult.rows[0].count) > 0) {
      throw new ValidationError('Cannot delete role with assigned users. Please reassign users first.');
    }

    // Delete dashboard first (foreign key constraint)
    await client.query(
      'DELETE FROM dashboards WHERE role_id = $1',
      [roleId]
    );

    // Delete role
    await client.query(
      'DELETE FROM roles WHERE id = $1',
      [roleId]
    );

    await client.query('COMMIT');

    // Invalidate cache
    invalidateCache('roles');
    invalidateCache('dashboards');

    return { success: true, message: `Role ${roleId} and associated dashboard deleted successfully` };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Clone role with dashboard
 */
async function cloneRole(sourceRoleId, newRoleId, newLabel, userId) {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');

    // Get source role
    const sourceRole = await getRoleWithDashboard(sourceRoleId);

    if (!sourceRole.role) {
      throw new NotFoundError(`Source role ${sourceRoleId} not found`);
    }

    // Check if new role ID already exists
    const exists = await checkRoleExists(newRoleId);
    if (exists) {
      throw new ValidationError(`Role ID ${newRoleId} already exists`);
    }

    // Create new role
    const newRole = {
      id: newRoleId,
      label: newLabel,
      description: `Cloned from ${sourceRole.role.label}`,
      capabilities: JSON.parse(sourceRole.role.caps || '[]'),
      scopes: JSON.parse(sourceRole.role.scopes || '{}'),
      visibility_rules: JSON.parse(sourceRole.role.visibility_rules || '[]'),
      inherits: JSON.parse(sourceRole.role.inherits || '[]'),
      active: false // Start as inactive
    };

    const createdRole = await createOrUpdateRole(newRole, userId);

    // Clone dashboard if exists
    let createdDashboard = null;
    if (sourceRole.dashboard) {
      const newDashboard = {
        role_id: newRoleId,
        menus_json: JSON.parse(sourceRole.dashboard.menus_json || '[]'),
        pages_json: JSON.parse(sourceRole.dashboard.pages_json || '[]'),
        widgets: JSON.parse(sourceRole.dashboard.widgets || '[]'),
        active: false
      };

      createdDashboard = await createOrUpdateDashboard(newDashboard, userId);
    }

    await client.query('COMMIT');

    return {
      role: createdRole,
      dashboard: createdDashboard
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Toggle role active status
 */
async function toggleRoleActive(roleId, active, userId) {
  const result = await db.pool.query(
    `UPDATE roles 
     SET active = $2, updated_at = NOW(), updated_by = $3
     WHERE id = $1
     RETURNING *`,
    [roleId, active, userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError(`Role ${roleId} not found`);
  }

  // Invalidate cache
  invalidateCache('roles');

  return result.rows[0];
}

/**
 * Get all roles with dashboard info
 */
async function getAllRolesWithDashboards() {
  const query = `
    SELECT 
      r.*,
      d.menus_json,
      d.pages_json,
      d.widgets,
      d.version as dashboard_version,
      d.active as dashboard_active,
      (SELECT COUNT(*) FROM users WHERE role = r.id) as user_count
    FROM roles r
    LEFT JOIN dashboards d ON r.id = d.role_id
    ORDER BY r.created_at DESC
  `;

  const result = await db.pool.query(query);
  return result.rows;
}

module.exports = {
  validateRoleDefinition,
  validateDashboardDefinition,
  checkRoleExists,
  createOrUpdateRole,
  createOrUpdateDashboard,
  saveDashboardTemplate,
  getRoleWithDashboard,
  deleteRoleAndDashboard,
  cloneRole,
  toggleRoleActive,
  getAllRolesWithDashboards
};
