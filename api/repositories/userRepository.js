const User = require('../models/user');
const { Op } = require('sequelize');

class UserRepository {
  /**
   * Count users by criteria
   */
  static async count(options = {}) {
    try {
      if (options.where && options.where.status) {
        // Handle single status filter
        return await this.countByStatus(options.where.status);
      }

      // Default count all
      return await this.countAll();
    } catch (error) {
      console.error('Error counting users:', error);
      return 0;
    }
  }

  /**
   * Count all users
   */
  static async countAll() {
    try {
      const users = await User.findAll();
      return users.length;
    } catch (error) {
      console.error('Error counting all users:', error);
      return 0;
    }
  }

  /**
   * Count users by status
   */
  static async countByStatus(status) {
    try {
      // Since the User model doesn't have a direct countByStatus method,
      // we'll fetch all and filter
      const users = await User.findAll();
      return users.filter(user => user.status === status).length;
    } catch (error) {
      console.error('Error counting users by status:', error);
      return 0;
    }
  }

  /**
   * Find all users with optional filtering
   */
  static async findAll(options = {}) {
    try {
      if (options.where && options.where.status) {
        // Filter by status
        const users = await User.findAll();
        return users.filter(user => user.status === options.where.status);
      }

      if (options.where && options.where.organization_id) {
        // Filter by organization
        return await User.findByOrganization(options.where.organization_id);
      }

      // Default find all
      return await User.findAll();
    } catch (error) {
      console.error('Error finding users:', error);
      return [];
    }
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    try {
      return await User.findById(id);
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    try {
      return await User.findByEmail(email);
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  /**
   * Create a new user
   */
  static async create(userData) {
    try {
      return await User.create(userData);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update a user
   */
  static async update(id, userData) {
    try {
      return await User.update(id, userData);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Delete a user
   */
  static async delete(id) {
    try {
      return await User.delete(id);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Find users by organization
   */
  static async findByOrganization(organizationId) {
    try {
      return await User.findByOrganization(organizationId);
    } catch (error) {
      console.error('Error finding users by organization:', error);
      return [];
    }
  }

  /**
   * Validate user password
   */
  static async validatePassword(user, password) {
    try {
      if (!user || typeof user.validatePassword !== 'function') {
        return false;
      }
      return await user.validatePassword(password);
    } catch (error) {
      console.error('Error validating password:', error);
      return false;
    }
  }

  /**
   * Check if user has a specific role
   */
  static hasRole(user, role) {
    try {
      if (!user || typeof user.hasRole !== 'function') {
        return false;
      }
      return user.hasRole(role);
    } catch (error) {
      console.error('Error checking user role:', error);
      return false;
    }
  }

  /**
   * Check if user has any of the specified roles
   */
  static hasAnyRole(user, roles) {
    try {
      if (!user || typeof user.hasAnyRole !== 'function') {
        return false;
      }
      return user.hasAnyRole(roles);
    } catch (error) {
      console.error('Error checking user roles:', error);
      return false;
    }
  }
}

module.exports = UserRepository;
