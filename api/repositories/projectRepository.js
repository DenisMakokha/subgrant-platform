const Project = require('../models/project');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

class ProjectRepository {
  /**
   * Count projects by status
   */
  static async count(options = {}) {
    try {
      if (options.where && options.where.status && Array.isArray(options.where.status[Op.in])) {
        // Handle multiple statuses
        const statuses = options.where.status[Op.in];
        let totalCount = 0;
        for (const status of statuses) {
          totalCount += await Project.countByStatus(status);
        }
        return totalCount;
      } else if (options.where && options.where.status) {
        // Handle single status
        return await Project.countByStatus(options.where.status);
      } else if (options.where && options.where.updatedAt && options.where.updatedAt[Op.gte]) {
        // Handle date-based queries - for now, return all completed projects
        return await Project.countByStatus('completed');
      }

      // Default count all
      return await Project.countAll();
    } catch (error) {
      logger.error('Error counting projects:', error);
      return 0;
    }
  }

  /**
   * Find all projects with optional filtering
   */
  static async findAll(options = {}) {
    try {
      if (options.where && options.where.status && Array.isArray(options.where.status[Op.in])) {
        // Handle multiple statuses
        const statuses = options.where.status[Op.in];
        const projects = [];
        for (const status of statuses) {
          const statusProjects = await Project.findByStatus(status);
          projects.push(...statusProjects);
        }
        return projects;
      } else if (options.where && options.where.status) {
        // Handle single status
        return await Project.findByStatus(options.where.status);
      }

      // Default find all
      return await Project.findAll();
    } catch (error) {
      logger.error('Error finding projects:', error);
      return [];
    }
  }

  /**
   * Find project by ID
   */
  static async findById(id) {
    try {
      return await Project.findById(id);
    } catch (error) {
      logger.error('Error finding project by ID:', error);
      return null;
    }
  }

  /**
   * Create a new project
   */
  static async create(projectData) {
    try {
      return await Project.create(projectData);
    } catch (error) {
      logger.error('Error creating project:', error);
      throw error;
    }
  }

  /**
   * Update a project
   */
  static async update(id, projectData) {
    try {
      return await Project.update(id, projectData);
    } catch (error) {
      logger.error('Error updating project:', error);
      throw error;
    }
  }

  /**
   * Delete a project
   */
  static async delete(id) {
    try {
      return await Project.delete(id);
    } catch (error) {
      logger.error('Error deleting project:', error);
      throw error;
    }
  }

  /**
   * Get total budget for all projects (mock implementation)
   */
  static async getTotalBudget() {
    try {
      // This would need to be implemented based on actual budget relationships
      // For now, return 0 as placeholder
      return 0;
    } catch (error) {
      logger.error('Error getting total budget:', error);
      return 0;
    }
  }

  /**
   * Get total disbursed amount (mock implementation)
   */
  static async getTotalDisbursed() {
    try {
      // This would need to be implemented based on actual disbursement relationships
      // For now, return 0 as placeholder
      return 0;
    } catch (error) {
      logger.error('Error getting total disbursed:', error);
      return 0;
    }
  }
}

module.exports = ProjectRepository;
