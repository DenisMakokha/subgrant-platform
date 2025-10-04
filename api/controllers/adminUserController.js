const db = require('../config/database');
const { logApiCall, logError } = require('../services/observabilityService');
const adminActivityLogService = require('../services/adminActivityLogService');

/**
 * Get users with filtering and pagination
 */
exports.getUsers = async (req, res) => {
  const startTime = Date.now();
  try {
    const {
      search,
      role,
      organization,
      status,
      limit = 50,
      offset = 0
    } = req.query;

    let query = `
      SELECT
        u.id, u.email, u.first_name, u.last_name, u.role, u.is_active,
        u.last_login, u.created_at, u.updated_at, u.organization_id
      FROM users u
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    // Apply filters
    if (search) {
      query += ` AND (u.email ILIKE $${paramIndex} OR u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (role) {
      query += ` AND u.role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    if (organization) {
      query += ` AND u.organization_id = $${paramIndex}`;
      params.push(organization);
      paramIndex++;
    }

    if (status !== undefined) {
      query += ` AND u.is_active = $${paramIndex}`;
      params.push(status === 'true');
      paramIndex++;
    }

    // Get total count
    const countQuery = query.replace('SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.is_active, u.last_login, u.created_at, u.updated_at, u.organization_id', 'SELECT COUNT(*) as total');
    const countResult = await db.pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Apply pagination
    query += ` ORDER BY u.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.pool.query(query, params);

    // Transform data to match frontend expectations
    const users = result.rows.map(row => ({
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      role: row.role,
      organizationId: row.organization_id,
      isActive: row.is_active,
      lastLogin: row.last_login,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    logApiCall('GET', '/admin/users', 200, Date.now() - startTime, req.user?.id);
    res.json({
      data: users,
      pagination: {
        total,
        page: Math.floor(offset / limit) + 1,
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logError(error, 'getUsers', { userId: req.user?.id });
    logApiCall('GET', '/admin/users', 500, Date.now() - startTime, req.user?.id);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get user by ID
 */
exports.getUserById = async (req, res) => {
  const startTime = Date.now();
  try {
    const { userId } = req.params;

    const result = await db.pool.query(`
      SELECT
        u.id, u.email, u.first_name, u.last_name, u.role, u.is_active,
        u.last_login, u.created_at, u.updated_at, u.organization_id
      FROM users u
      WHERE u.id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    const transformedUser = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      organizationId: user.organization_id,
      isActive: user.is_active,
      lastLogin: user.last_login,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };

    logApiCall('GET', `/admin/users/${userId}`, 200, Date.now() - startTime, req.user?.id);
    res.json(transformedUser);
  } catch (error) {
    logError(error, 'getUserById', { userId: req.params.userId });
    logApiCall('GET', `/admin/users/${req.params.userId}`, 500, Date.now() - startTime, req.user?.id);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Create new user
 */
exports.createUser = async (req, res) => {
  const startTime = Date.now();
  try {
    const { email, firstName, lastName, role, isActive, organizationId } = req.body;

    // Check if user already exists
    const existingUser = await db.pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Insert new user
    const result = await db.pool.query(`
      INSERT INTO users (email, first_name, last_name, role, is_active, organization_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING id, email, first_name, last_name, role, is_active, last_login, created_at, updated_at, organization_id
    `, [email, firstName, lastName, role, isActive, organizationId]);

    const user = result.rows[0];
    const transformedUser = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      organizationId: user.organization_id,
      isActive: user.is_active,
      lastLogin: user.last_login,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };

    // Log admin activity
    await adminActivityLogService.logActivity({
      adminId: req.user?.id,
      action: 'create_user',
      entityType: 'user',
      entityId: user.id,
      changes: {
        before: null,
        after: {
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          isActive: user.is_active,
          organizationId: user.organization_id
        }
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    logApiCall('POST', '/admin/users', 201, Date.now() - startTime, req.user?.id);
    res.status(201).json(transformedUser);
  } catch (error) {
    // Log failed attempt
    await adminActivityLogService.logActivity({
      adminId: req.user?.id,
      action: 'create_user',
      entityType: 'user',
      result: 'error',
      errorMessage: error.message,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    logError(error, 'createUser', { userId: req.user?.id });
    logApiCall('POST', '/admin/users', 500, Date.now() - startTime, req.user?.id);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update user
 */
exports.updateUser = async (req, res) => {
  const startTime = Date.now();
  try {
    const { userId } = req.params;
    const { email, firstName, lastName, role, isActive, organizationId } = req.body;

    logger.info('📝 Update user request:', { userId, email, firstName, lastName, role, isActive, organizationId });

    // Check if user exists and get current state
    const existingUser = await db.pool.query(
      'SELECT id, email, first_name, last_name, role, is_active, organization_id FROM users WHERE id = $1',
      [userId]
    );
    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const beforeState = existingUser.rows[0];

    // Build dynamic update query based on provided fields
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(email);
    }
    if (firstName !== undefined) {
      updates.push(`first_name = $${paramIndex++}`);
      values.push(firstName);
    }
    if (lastName !== undefined) {
      updates.push(`last_name = $${paramIndex++}`);
      values.push(lastName);
    }
    if (role !== undefined) {
      updates.push(`role = $${paramIndex++}`);
      values.push(role);
    }
    if (isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(isActive);
    }
    if (organizationId !== undefined) {
      updates.push(`organization_id = $${paramIndex++}`);
      values.push(organizationId);
    }

    updates.push(`updated_at = NOW()`);
    values.push(userId);

    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, email, first_name, last_name, role, is_active, last_login, created_at, updated_at, organization_id
    `;

    logger.info('🔍 Update query:', query);
    logger.info('🔍 Update values:', values);

    const result = await db.pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found after update' });
    }

    const user = result.rows[0];
    logger.info('✅ Updated user from DB:', user);
    const transformedUser = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      organizationId: user.organization_id,
      isActive: user.is_active,
      lastLogin: user.last_login,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };

    // Log admin activity
    await adminActivityLogService.logActivity({
      adminId: req.user?.id,
      action: 'update_user',
      entityType: 'user',
      entityId: parseInt(userId),
      changes: {
        before: {
          email: beforeState.email,
          firstName: beforeState.first_name,
          lastName: beforeState.last_name,
          role: beforeState.role,
          isActive: beforeState.is_active,
          organizationId: beforeState.organization_id
        },
        after: {
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          isActive: user.is_active,
          organizationId: user.organization_id
        }
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    logApiCall('PUT', `/admin/users/${userId}`, 200, Date.now() - startTime, req.user?.id);
    res.json(transformedUser);
  } catch (error) {
    // Log failed attempt
    await adminActivityLogService.logActivity({
      adminId: req.user?.id,
      action: 'update_user',
      entityType: 'user',
      entityId: parseInt(req.params.userId),
      result: 'error',
      errorMessage: error.message,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    logError(error, 'updateUser', { userId: req.params.userId });
    logApiCall('PUT', `/admin/users/${req.params.userId}`, 500, Date.now() - startTime, req.user?.id);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Reset user password
 */
exports.resetPassword = async (req, res) => {
  const startTime = Date.now();
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Check if user exists
    const existingUser = await db.pool.query('SELECT id, email FROM users WHERE id = $1', [userId]);
    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash the new password
    const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(newPassword, saltRounds);

    // Update user password
    await db.pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [password_hash, userId]
    );

    logger.info(`✅ Password reset for user: ${existingUser.rows[0].email} by admin: ${req.user?.email || req.user?.id}`);

    // Log admin activity
    await adminActivityLogService.logActivity({
      adminId: req.user?.id,
      action: 'reset_password',
      entityType: 'user',
      entityId: parseInt(userId),
      changes: {
        before: { hasPassword: true },
        after: { passwordReset: true }
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    logApiCall('POST', `/admin/users/${userId}/reset-password`, 200, Date.now() - startTime, req.user?.id);
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    // Log failed attempt
    await adminActivityLogService.logActivity({
      adminId: req.user?.id,
      action: 'reset_password',
      entityType: 'user',
      entityId: parseInt(req.params.userId),
      result: 'error',
      errorMessage: error.message,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    logError(error, 'resetPassword', { userId: req.params.userId });
    logApiCall('POST', `/admin/users/${req.params.userId}/reset-password`, 500, Date.now() - startTime, req.user?.id);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete user
 */
exports.deleteUser = async (req, res) => {
  const startTime = Date.now();
  try {
    const { userId } = req.params;

    // Check if user exists and get data for logging
    const existingUser = await db.pool.query(
      'SELECT id, email, first_name, last_name, role, is_active, organization_id FROM users WHERE id = $1',
      [userId]
    );
    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const userToDelete = existingUser.rows[0];

    // If trying to delete an admin, check if it's the last one
    if (userToDelete.role === 'admin') {
      const adminCount = await db.pool.query(
        'SELECT COUNT(*) as count FROM users WHERE role = $1 AND is_active = true',
        ['admin']
      );
      
      if (parseInt(adminCount.rows[0].count) <= 1) {
        return res.status(403).json({ 
          error: 'Cannot delete the last admin user. Please create another admin first.' 
        });
      }
    }

    // Delete user
    await db.pool.query('DELETE FROM users WHERE id = $1', [userId]);

    // Log admin activity
    await adminActivityLogService.logActivity({
      adminId: req.user?.id,
      action: 'delete_user',
      entityType: 'user',
      entityId: parseInt(userId),
      changes: {
        before: {
          email: userToDelete.email,
          firstName: userToDelete.first_name,
          lastName: userToDelete.last_name,
          role: userToDelete.role,
          isActive: userToDelete.is_active,
          organizationId: userToDelete.organization_id
        },
        after: null
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    logApiCall('DELETE', `/admin/users/${userId}`, 200, Date.now() - startTime, req.user?.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    // Log failed attempt
    await adminActivityLogService.logActivity({
      adminId: req.user?.id,
      action: 'delete_user',
      entityType: 'user',
      entityId: parseInt(req.params.userId),
      result: 'error',
      errorMessage: error.message,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    logError(error, 'deleteUser', { userId: req.params.userId });
    logApiCall('DELETE', `/admin/users/${req.params.userId}`, 500, Date.now() - startTime, req.user?.id);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get user access logs
 */
exports.getUserAccessLogs = async (req, res) => {
  const startTime = Date.now();
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const result = await db.pool.query(`
      SELECT
        id, created_at as timestamp, user_id, action, entity_type, entity_id, metadata
      FROM audit_log
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `, [userId, limit]);

    const logs = result.rows.map(log => ({
      id: log.id,
      timestamp: log.timestamp,
      userId: log.user_id,
      userEmail: '', // Would need to join with users table
      action: log.action,
      entityType: log.entity_type,
      entityId: log.entity_id,
      details: log.metadata || {},
      ipAddress: null,
      userAgent: null,
    }));

    logApiCall('GET', `/admin/users/${userId}/access-logs`, 200, Date.now() - startTime, req.user?.id);
    res.json(logs);
  } catch (error) {
    logError(error, 'getUserAccessLogs', { userId: req.params.userId });
    logApiCall('GET', `/admin/users/${req.params.userId}/access-logs`, 500, Date.now() - startTime, req.user?.id);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Bulk assign roles to users
 */
exports.bulkAssignRoles = async (req, res) => {
  const startTime = Date.now();
  try {
    const { userIds, roleId } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'userIds must be a non-empty array' });
    }

    // Update users with new role
    const result = await db.pool.query(`
      UPDATE users
      SET role = $1, updated_at = NOW()
      WHERE id = ANY($2)
      RETURNING id
    `, [roleId, userIds]);

    // Log admin activity
    await adminActivityLogService.logActivity({
      adminId: req.user?.id,
      action: 'bulk_assign_roles',
      entityType: 'user',
      entityId: null,
      changes: {
        before: null,
        after: {
          userIds: result.rows.map(r => r.id),
          roleId: roleId,
          count: result.rows.length
        }
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    logApiCall('POST', '/admin/users/bulk-assign-roles', 200, Date.now() - startTime, req.user?.id);
    res.json({
      message: `Role assigned to ${result.rows.length} users`,
      updatedCount: result.rows.length,
    });
  } catch (error) {
    // Log failed attempt
    await adminActivityLogService.logActivity({
      adminId: req.user?.id,
      action: 'bulk_assign_roles',
      entityType: 'user',
      result: 'error',
      errorMessage: error.message,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    logError(error, 'bulkAssignRoles', { userId: req.user?.id });
    logApiCall('POST', '/admin/users/bulk-assign-roles', 500, Date.now() - startTime, req.user?.id);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Export users data
 */
exports.exportUsers = async (req, res) => {
  const startTime = Date.now();
  try {
    const format = req.query.format || 'csv';

    // Get all users
    const result = await db.pool.query(`
      SELECT
        u.id, u.email, u.first_name, u.last_name, u.role, u.is_active,
        u.last_login, u.created_at, u.updated_at, u.organization_id,
        o.name as organization_name
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      ORDER BY u.created_at DESC
    `);

    if (format === 'csv') {
      // Generate CSV
      const csvHeaders = ['ID', 'Email', 'First Name', 'Last Name', 'Role', 'Status', 'Last Login', 'Created At', 'Organization'];
      const csvRows = result.rows.map(user => [
        user.id,
        user.email,
        user.first_name || '',
        user.last_name || '',
        user.role,
        user.is_active ? 'Active' : 'Inactive',
        user.last_login || '',
        user.created_at,
        user.organization_name || '',
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
      res.send(csvContent);
    } else if (format === 'excel') {
      // For Excel export, we'd need a library like 'exceljs'
      // For now, return CSV with Excel MIME type
      res.setHeader('Content-Type', 'application/vnd.ms-excel');
      res.setHeader('Content-Disposition', 'attachment; filename="users.xls"');

      const csvHeaders = ['ID', 'Email', 'First Name', 'Last Name', 'Role', 'Status', 'Last Login', 'Created At', 'Organization'];
      const csvRows = result.rows.map(user => [
        user.id,
        user.email,
        user.first_name || '',
        user.last_name || '',
        user.role,
        user.is_active ? 'Active' : 'Inactive',
        user.last_login || '',
        user.created_at,
        user.organization_name || '',
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.join('\t'))
        .join('\n');

      res.send(csvContent);
    } else {
      throw new Error('Unsupported export format');
    }

    logApiCall('GET', `/admin/users/export?format=${format}`, 200, Date.now() - startTime, req.user?.id);
  } catch (error) {
    logError(error, 'exportUsers', { userId: req.user?.id });
    logApiCall('GET', `/admin/users/export?format=${req.query.format}`, 500, Date.now() - startTime, req.user?.id);
    res.status(500).json({ error: error.message });
  }
};
