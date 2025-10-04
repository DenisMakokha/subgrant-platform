const db = require('../config/database');
const { logApiCall, logError } = require('../services/observabilityService');
const adminActivityLogService = require('../services/adminActivityLogService');

/**
 * Get organizations with filtering and pagination
 */
exports.getOrganizations = async (req, res) => {
  const startTime = Date.now();
  try {
    const {
      search,
      status,
      type,
      limit = 50,
      offset = 0
    } = req.query;

    let query = `
      SELECT
        o.id, o.name, o.legal_name, o.type, o.status, o.created_at, o.updated_at,
        COUNT(u.id) as user_count,
        COUNT(p.id) as project_count
      FROM organizations o
      LEFT JOIN users u ON o.id = u.organization_id
      LEFT JOIN projects p ON o.id = p.organization_id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    // Apply filters
    if (search) {
      query += ` AND (o.name ILIKE $${paramIndex} OR o.legal_name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status) {
      query += ` AND o.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (type) {
      query += ` AND o.type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    // Group by organization
    query += ' GROUP BY o.id, o.name, o.legal_name, o.type, o.status, o.created_at, o.updated_at';

    // Get total count
    const countQuery = query.replace('o.id, o.name, o.legal_name, o.type, o.status, o.created_at, o.updated_at, COUNT(u.id) as user_count, COUNT(p.id) as project_count', 'COUNT(*) as total');
    const countResult = await db.pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Apply pagination and ordering
    query += ` ORDER BY o.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.pool.query(query, params);

    // Transform data to match frontend expectations
    const organizations = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      legalName: row.legal_name,
      type: row.type,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      userCount: parseInt(row.user_count) || 0,
      projectCount: parseInt(row.project_count) || 0,
    }));

    logApiCall('GET', '/admin/organizations', 200, Date.now() - startTime, req.user?.id);
    res.json({
      data: organizations,
      pagination: {
        total,
        page: Math.floor(offset / limit) + 1,
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logError(error, 'getOrganizations', { userId: req.user?.id });
    logApiCall('GET', '/admin/organizations', 500, Date.now() - startTime, req.user?.id);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get organization by ID
 */
exports.getOrganizationById = async (req, res) => {
  const startTime = Date.now();
  try {
    const { orgId } = req.params;

    const result = await db.pool.query(`
      SELECT
        o.id, o.name, o.legal_name, o.type, o.status, o.created_at, o.updated_at,
        COUNT(u.id) as user_count,
        COUNT(p.id) as project_count
      FROM organizations o
      LEFT JOIN users u ON o.id = u.organization_id
      LEFT JOIN projects p ON o.id = p.organization_id
      WHERE o.id = $1
      GROUP BY o.id, o.name, o.legal_name, o.type, o.status, o.created_at, o.updated_at
    `, [orgId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const org = result.rows[0];
    const organization = {
      id: org.id,
      name: org.name,
      legalName: org.legal_name,
      type: org.type,
      status: org.status,
      createdAt: org.created_at,
      updatedAt: org.updated_at,
      userCount: parseInt(org.user_count) || 0,
      projectCount: parseInt(org.project_count) || 0,
    };

    logApiCall('GET', `/admin/organizations/${orgId}`, 200, Date.now() - startTime, req.user?.id);
    res.json(organization);
  } catch (error) {
    logError(error, 'getOrganizationById', { userId: req.user?.id, orgId: req.params.orgId });
    logApiCall('GET', `/admin/organizations/${req.params.orgId}`, 500, Date.now() - startTime, req.user?.id);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update organization
 */
exports.updateOrganization = async (req, res) => {
  const startTime = Date.now();
  try {
    const { orgId } = req.params;
    const { name, legalName, type, status } = req.body;

    // Get current organization state (REAL DB query for before state)
    const existingOrgQuery = await db.pool.query(
      'SELECT id, name, legal_name, type, status FROM organizations WHERE id = $1',
      [orgId]
    );
    
    if (existingOrgQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const beforeState = {
      id: existingOrgQuery.rows[0].id,
      name: existingOrgQuery.rows[0].name,
      legalName: existingOrgQuery.rows[0].legal_name,
      type: existingOrgQuery.rows[0].type,
      status: existingOrgQuery.rows[0].status
    };

    // Update organization (REAL DB UPDATE)
    const result = await db.pool.query(`
      UPDATE organizations
      SET name = $1, legal_name = $2, type = $3, status = $4, updated_at = NOW()
      WHERE id = $5
      RETURNING id, name, legal_name, type, status, created_at, updated_at
    `, [name, legalName, type, status, orgId]);

    const org = result.rows[0];
    const organization = {
      id: org.id,
      name: org.name,
      legalName: org.legal_name,
      type: org.type,
      status: org.status,
      createdAt: org.created_at,
      updatedAt: org.updated_at,
      userCount: 0, // Would need to calculate
      projectCount: 0, // Would need to calculate
    };

    const afterState = {
      id: org.id,
      name: org.name,
      legalName: org.legal_name,
      type: org.type,
      status: org.status
    };

    // Log admin activity with REAL before/after data
    await adminActivityLogService.logActivity({
      adminId: req.user?.id,
      action: 'update_organization',
      entityType: 'organization',
      entityId: orgId,
      changes: {
        before: beforeState,
        after: afterState
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    logApiCall('PUT', `/admin/organizations/${orgId}`, 200, Date.now() - startTime, req.user?.id);
    res.json(organization);
  } catch (error) {
    // Log failed activity
    await adminActivityLogService.logActivity({
      adminId: req.user?.id,
      action: 'update_organization',
      entityType: 'organization',
      entityId: req.params.orgId,
      result: 'error',
      errorMessage: error.message,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    logError(error, 'updateOrganization', { userId: req.user?.id, orgId: req.params.orgId });
    logApiCall('PUT', `/admin/organizations/${req.params.orgId}`, 500, Date.now() - startTime, req.user?.id);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get organization users
 */
exports.getOrganizationUsers = async (req, res) => {
  const startTime = Date.now();
  try {
    const { orgId } = req.params;

    const result = await db.pool.query(`
      SELECT
        u.id, u.email, u.first_name, u.last_name, u.role, u.is_active,
        u.last_login, u.created_at, u.updated_at
      FROM users u
      WHERE u.organization_id = $1
      ORDER BY u.created_at DESC
    `, [orgId]);

    const users = result.rows.map(row => ({
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      role: row.role,
      organizationId: orgId,
      isActive: row.is_active,
      lastLogin: row.last_login,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    logApiCall('GET', `/admin/organizations/${orgId}/users`, 200, Date.now() - startTime, req.user?.id);
    res.json(users);
  } catch (error) {
    logError(error, 'getOrganizationUsers', { userId: req.user?.id, orgId: req.params.orgId });
    logApiCall('GET', `/admin/organizations/${req.params.orgId}/users`, 500, Date.now() - startTime, req.user?.id);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get organization projects
 */
exports.getOrganizationProjects = async (req, res) => {
  const startTime = Date.now();
  try {
    const { orgId } = req.params;

    const result = await db.pool.query(`
      SELECT
        p.id, p.name, p.status, p.created_at, p.updated_at
      FROM projects p
      WHERE p.organization_id = $1
      ORDER BY p.created_at DESC
    `, [orgId]);

    const projects = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    logApiCall('GET', `/admin/organizations/${orgId}/projects`, 200, Date.now() - startTime, req.user?.id);
    res.json(projects);
  } catch (error) {
    logError(error, 'getOrganizationProjects', { userId: req.user?.id, orgId: req.params.orgId });
    logApiCall('GET', `/admin/organizations/${req.params.orgId}/projects`, 500, Date.now() - startTime, req.user?.id);
    res.status(500).json({ error: error.message });
  }
};
