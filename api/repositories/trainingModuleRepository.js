const TrainingModule = require('../models/trainingModule');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

class TrainingModuleRepository {
  /**
   * Create a new training module
   */
  async create(moduleData, userId) {
    try {
      const module = await TrainingModule.create({
        id: uuidv4(),
        ...moduleData,
        createdBy: userId,
        updatedBy: userId
      });
      return module;
    } catch (error) {
      throw new Error(`Failed to create training module: ${error.message}`);
    }
  }

  /**
   * Find module by ID
   */
  async findById(id) {
    try {
      const module = await TrainingModule.findByPk(id);
      return module;
    } catch (error) {
      throw new Error(`Failed to find training module: ${error.message}`);
    }
  }

  /**
   * Update module
   */
  async update(id, updateData, userId) {
    try {
      const [updatedRowsCount, updatedRows] = await TrainingModule.update(
        { ...updateData, updatedBy: userId },
        { where: { id }, returning: true }
      );
      return updatedRows[0];
    } catch (error) {
      throw new Error(`Failed to update training module: ${error.message}`);
    }
  }

  /**
   * Delete module
   */
  async delete(id) {
    try {
      const deletedRowsCount = await TrainingModule.destroy({
        where: { id }
      });
      return deletedRowsCount > 0;
    } catch (error) {
      throw new Error(`Failed to delete training module: ${error.message}`);
    }
  }

  /**
   * Search modules with filters
   */
  async search(filters = {}, pagination = {}) {
    try {
      const { limit = 20, offset = 0, sortBy = 'updatedAt', sortOrder = 'DESC' } = pagination;

      const whereClause = {};

      // Text search
      if (filters.query) {
        whereClause[Op.or] = [
          { title: { [Op.iLike]: `%${filters.query}%` } },
          { description: { [Op.iLike]: `%${filters.query}%` } }
        ];
      }

      // Filter by type
      if (filters.type) {
        whereClause.type = filters.type;
      }

      // Filter by category
      if (filters.category) {
        whereClause.category = filters.category;
      }

      // Filter by status
      if (filters.status) {
        whereClause.status = filters.status;
      }

      // Filter by difficulty
      if (filters.difficulty) {
        whereClause.difficulty = filters.difficulty;
      }

      // Filter by tags
      if (filters.tags && filters.tags.length > 0) {
        whereClause.tags = { [Op.overlap]: filters.tags };
      }

      // Date range filter
      if (filters.dateRange) {
        whereClause.createdAt = {
          [Op.between]: [filters.dateRange.start, filters.dateRange.end]
        };
      }

      const { rows: modules, count: total } = await TrainingModule.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [[sortBy, sortOrder]],
        include: [
          {
            model: require('../models/user'),
            as: 'creator',
            attributes: ['id', 'email', 'firstName', 'lastName']
          }
        ]
      });

      return {
        modules,
        pagination: {
          total,
          page: Math.floor(offset / limit) + 1,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to search training modules: ${error.message}`);
    }
  }

  /**
   * Get modules by category
   */
  async getByCategory(category, pagination = {}) {
    return this.search({ category }, pagination);
  }

  /**
   * Get modules by type
   */
  async getByType(type, pagination = {}) {
    return this.search({ type }, pagination);
  }

  /**
   * Get modules by difficulty
   */
  async getByDifficulty(difficulty, pagination = {}) {
    return this.search({ difficulty }, pagination);
  }

  /**
   * Get modules by status
   */
  async getByStatus(status, pagination = {}) {
    return this.search({ status }, pagination);
  }

  /**
   * Get popular modules (by enrollment count)
   */
  async getPopular(limit = 10) {
    try {
      const modules = await TrainingModule.findAll({
        where: { status: 'published' },
        order: [['enrollmentCount', 'DESC']],
        limit
      });
      return modules;
    } catch (error) {
      throw new Error(`Failed to get popular modules: ${error.message}`);
    }
  }

  /**
   * Get recent modules
   */
  async getRecent(limit = 10) {
    try {
      const modules = await TrainingModule.findAll({
        order: [['createdAt', 'DESC']],
        limit
      });
      return modules;
    } catch (error) {
      throw new Error(`Failed to get recent modules: ${error.message}`);
    }
  }

  /**
   * Increment enrollment count
   */
  async incrementEnrollmentCount(id) {
    try {
      await TrainingModule.increment('enrollmentCount', { where: { id } });
      return true;
    } catch (error) {
      throw new Error(`Failed to increment enrollment count: ${error.message}`);
    }
  }

  /**
   * Update completion rate
   */
  async updateCompletionRate(id, completionRate) {
    try {
      await TrainingModule.update(
        { completionRate },
        { where: { id } }
      );
      return true;
    } catch (error) {
      throw new Error(`Failed to update completion rate: ${error.message}`);
    }
  }

  /**
   * Update average rating
   */
  async updateAverageRating(id, averageRating) {
    try {
      await TrainingModule.update(
        { averageRating },
        { where: { id } }
      );
      return true;
    } catch (error) {
      throw new Error(`Failed to update average rating: ${error.message}`);
    }
  }

  /**
   * Get module statistics
   */
  async getStatistics() {
    try {
      const stats = await TrainingModule.findAll({
        attributes: [
          'status',
          'type',
          'category',
          'difficulty',
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
        ],
        group: ['status', 'type', 'category', 'difficulty'],
        raw: true
      });

      const totalModules = await TrainingModule.count();
      const publishedModules = await TrainingModule.count({ where: { status: 'published' } });
      const totalEnrollments = await TrainingModule.sum('enrollmentCount');
      const averageCompletionRate = await TrainingModule.findOne({
        attributes: [[require('sequelize').fn('AVG', require('sequelize').col('completionRate')), 'avgCompletion']],
        raw: true
      });

      return {
        totalModules,
        publishedModules,
        totalEnrollments,
        averageCompletionRate: parseFloat(averageCompletionRate.avgCompletion) || 0,
        breakdown: stats
      };
    } catch (error) {
      throw new Error(`Failed to get module statistics: ${error.message}`);
    }
  }

  /**
   * Get all unique categories
   */
  async getCategories() {
    try {
      const categories = await TrainingModule.findAll({
        attributes: [[require('sequelize').fn('DISTINCT', require('sequelize').col('category')), 'category']],
        where: { status: 'published' },
        order: [['category', 'ASC']],
        raw: true
      });
      return categories.map(c => c.category);
    } catch (error) {
      throw new Error(`Failed to get categories: ${error.message}`);
    }
  }

  /**
   * Get all unique tags
   */
  async getTags() {
    try {
      const modules = await TrainingModule.findAll({
        attributes: ['tags'],
        where: { status: 'published' },
        raw: true
      });

      const tagSet = new Set();
      modules.forEach(module => {
        if (module.tags && Array.isArray(module.tags)) {
          module.tags.forEach(tag => tagSet.add(tag));
        }
      });

      return Array.from(tagSet).sort();
    } catch (error) {
      throw new Error(`Failed to get tags: ${error.message}`);
    }
  }

  /**
   * Bulk update module status
   */
  async bulkUpdateStatus(moduleIds, status, userId) {
    try {
      const [updatedRowsCount] = await TrainingModule.update(
        { status, updatedBy: userId },
        { where: { id: { [Op.in]: moduleIds } } }
      );
      return updatedRowsCount;
    } catch (error) {
      throw new Error(`Failed to bulk update module status: ${error.message}`);
    }
  }

  /**
   * Get modules by user enrollments (if we implement enrollment tracking)
   */
  async getModulesByUserEnrollments(userId) {
    try {
      // This would require a TrainingEnrollment model
      // For now, return empty array
      return [];
    } catch (error) {
      throw new Error(`Failed to get user enrollments: ${error.message}`);
    }
  }

  /**
   * Archive old modules
   */
  async archiveOldModules(olderThanDays = 365) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const [updatedRowsCount] = await TrainingModule.update(
        { status: 'archived' },
        {
          where: {
            status: 'published',
            updatedAt: { [Op.lt]: cutoffDate }
          }
        }
      );
      return updatedRowsCount;
    } catch (error) {
      throw new Error(`Failed to archive old modules: ${error.message}`);
    }
  }
}

module.exports = new TrainingModuleRepository();
