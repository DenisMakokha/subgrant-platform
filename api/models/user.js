const db = require('../config/database');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

class User {
  constructor(data) {
    this.id = data.id;
    this.organization_id = data.organization_id;
    this.first_name = data.first_name;
    this.last_name = data.last_name;
    this.email = data.email;
    this.phone = data.phone;
    this.role = data.role;
    this.status = data.status || 'active';
    this.mfa_enabled = data.mfa_enabled || false;
    this.mfa_secret = data.mfa_secret;
    this.password_hash = data.password_hash;
    this.last_login = data.last_login;
    this.email_verified_at = data.email_verified_at;
    this.onboarding_status = data.onboarding_status || 'email_pending';
    this.last_verification_sent_at = data.last_verification_sent_at;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create a new user
  static async create(userData) {
    // Hash the password before storing
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(userData.password, saltRounds);
    
    const query = `
      INSERT INTO users (
        organization_id, first_name, last_name, email, phone, role, status,
        mfa_enabled, mfa_secret, password_hash, email_verified_at, onboarding_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;
    `;
    
    const values = [
      userData.organization_id,
      userData.first_name,
      userData.last_name,
      userData.email,
      userData.phone,
      userData.role,
      userData.status || 'active',
      userData.mfa_enabled || false,
      userData.mfa_secret,
      password_hash,
      userData.email_verified_at || null,
      userData.onboarding_status || 'email_pending'
    ];
    
    const result = await db.pool.query(query, values);
    return new User(result.rows[0]);
  }

  // Find user by ID
  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await db.pool.query(query, [id]);
    return result.rows.length ? new User(result.rows[0]) : null;
  }

  // Find user by email
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await db.pool.query(query, [email]);
    return result.rows.length ? new User(result.rows[0]) : null;
  }

  // Find all users
  static async findAll() {
    const query = 'SELECT * FROM users ORDER BY created_at DESC';
    const result = await db.pool.query(query);
    return result.rows.map(user => new User(user));
  }

  // Find users by organization
  static async findByOrganization(organizationId) {
    const query = 'SELECT * FROM users WHERE organization_id = $1 ORDER BY created_at DESC';
    const result = await db.pool.query(query, [organizationId]);
    return result.rows.map(user => new User(user));
  }

  // Update user
  static async update(id, updateData) {
    const fields = [];
    const values = [];
    let index = 1;

    // Map camelCase to snake_case for database columns
    const fieldMapping = {
      firstName: 'first_name',
      lastName: 'last_name',
      organizationId: 'organization_id',
      isActive: 'is_active',
      mfaEnabled: 'mfa_enabled',
      mfaSecret: 'mfa_secret',
      passwordHash: 'password_hash',
      lastLogin: 'last_login',
      emailVerifiedAt: 'email_verified_at',
      onboardingStatus: 'onboarding_status',
      lastVerificationSentAt: 'last_verification_sent_at',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    };

    // Handle password hashing if password is being updated
    if (updateData.password) {
      const saltRounds = 10;
      updateData.password_hash = await bcrypt.hash(updateData.password, saltRounds);
      delete updateData.password; // Remove plain text password
      fields.push(`password_hash = $${index}`);
      values.push(updateData.password_hash);
      index++;
    }

    for (const key in updateData) {
      if (updateData.hasOwnProperty(key) && key !== 'id' && key !== 'password_hash') {
        // Convert camelCase to snake_case using mapping, or use key as-is if already snake_case
        const dbColumn = fieldMapping[key] || key;
        fields.push(`${dbColumn} = $${index}`);
        values.push(updateData[key]);
        index++;
      }
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);
    const query = `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${index} RETURNING *`;
    
    logger.info('🔍 User.update query:', query);
    logger.info('🔍 User.update values:', values);
    
    const result = await db.pool.query(query, values);
    return result.rows.length ? new User(result.rows[0]) : null;
  }

  // Delete user
  static async delete(id) {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING *';
    const result = await db.pool.query(query, [id]);
    return result.rows.length ? new User(result.rows[0]) : null;
  }

  // Validate password
  async validatePassword(password) {
    return bcrypt.compare(password, this.password_hash);
  }

  // Check if user has a specific role
  hasRole(role) {
    return this.role === role;
  }

  // Check if user has one of the specified roles
  hasAnyRole(roles) {
    return roles.includes(this.role);
  }
}

module.exports = User;