const Organization = require('../models/organization');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

class OrganizationRepository {
  /**
   * Count organizations by criteria
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
      logger.error('Error counting organizations:', error);
      return 0;
    }
  }

  /**
   * Count all organizations
   */
  static async countAll() {
    try {
      const organizations = await Organization.findAll();
      return organizations.length;
    } catch (error) {
      logger.error('Error counting all organizations:', error);
      return 0;
    }
  }

  /**
   * Count organizations by status
   */
  static async countByStatus(status) {
    try {
      // Since the Organization model doesn't have a direct countByStatus method,
      // we'll fetch all and filter
      const organizations = await Organization.findAll();
      return organizations.filter(org => org.status === status).length;
    } catch (error) {
      logger.error('Error counting organizations by status:', error);
      return 0;
    }
  }

  /**
   * Find all organizations with optional filtering
   */
  static async findAll(options = {}) {
    try {
      if (options.where && options.where.status) {
        // Filter by status
        const organizations = await Organization.findAll();
        return organizations.filter(org => org.status === options.where.status);
      }

      // Default find all
      return await Organization.findAll();
    } catch (error) {
      logger.error('Error finding organizations:', error);
      return [];
    }
  }

  /**
   * Find organization by ID
   */
  static async findById(id) {
    try {
      return await Organization.findById(id);
    } catch (error) {
      logger.error('Error finding organization by ID:', error);
      return null;
    }
  }

  /**
   * Find organization by email
   */
  static async findByEmail(email) {
    try {
      return await Organization.findByEmail(email);
    } catch (error) {
      logger.error('Error finding organization by email:', error);
      return null;
    }
  }

  /**
   * Create a new organization
   */
  static async create(organizationData) {
    try {
      return await Organization.create(organizationData);
    } catch (error) {
      logger.error('Error creating organization:', error);
      throw error;
    }
  }

  /**
   * Update an organization
   */
  static async update(id, organizationData) {
    try {
      return await Organization.update(id, organizationData);
    } catch (error) {
      logger.error('Error updating organization:', error);
      throw error;
    }
  }

  /**
   * Delete an organization
   */
  static async delete(id) {
    try {
      return await Organization.delete(id);
    } catch (error) {
      logger.error('Error deleting organization:', error);
      throw error;
    }
  }

  /**
   * Get organizations by owner user ID
   */
  static async findByOwnerId(userId) {
    try {
      return await Organization.findByOwnerId(userId);
    } catch (error) {
      logger.error('Error finding organization by owner ID:', error);
      return null;
    }
  }

  /**
   * Check if organization has completed compliance
   */
  static async hasCompletedCompliance(organizationId) {
    try {
      return await Organization.hasCompletedCompliance(organizationId);
    } catch (error) {
      logger.error('Error checking compliance completion:', error);
      return false;
    }
  }

  /**
   * Get required compliance documents for organization
   */
  static async getRequiredComplianceDocuments(organizationId) {
    try {
      return await Organization.getRequiredComplianceDocuments(organizationId);
    } catch (error) {
      logger.error('Error getting required compliance documents:', error);
      return [];
    }
  }

  /**
   * Instance method: Find organization by user ID
   */
  async readByUserId(userId) {
    try {
      return await Organization.findByOwnerId(userId);
    } catch (error) {
      logger.error('Error finding organization by user ID:', error);
      return null;
    }
  }

  /**
   * Instance method: Update organization with additional options
   */
  async update(id, organizationData, options = {}) {
    try {
      const updatedOrg = await Organization.update(id, organizationData);

      // Handle additional options like etag and idempotency
      if (options.etag && updatedOrg.version !== options.etag) {
        const error = new Error('CONFLICT');
        error.code = 'CONFLICT';
        throw error;
      }

      return updatedOrg;
    } catch (error) {
      logger.error('Error updating organization:', error);
      throw error;
    }
  }
}

module.exports = OrganizationRepository;
