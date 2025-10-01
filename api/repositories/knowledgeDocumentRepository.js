const KnowledgeDocument = require('../models/knowledgeDocument');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

class KnowledgeDocumentRepository {
  /**
   * Create a new knowledge document
   */
  async create(documentData, userId) {
    try {
      const document = await KnowledgeDocument.create({
        id: uuidv4(),
        ...documentData,
        createdBy: userId,
        updatedBy: userId
      });
      return document;
    } catch (error) {
      throw new Error(`Failed to create knowledge document: ${error.message}`);
    }
  }

  /**
   * Find document by ID
   */
  async findById(id) {
    try {
      const document = await KnowledgeDocument.findByPk(id);
      return document;
    } catch (error) {
      throw new Error(`Failed to find knowledge document: ${error.message}`);
    }
  }

  /**
   * Update document
   */
  async update(id, updateData, userId) {
    try {
      const [updatedRowsCount, updatedRows] = await KnowledgeDocument.update(
        { ...updateData, updatedBy: userId },
        { where: { id }, returning: true }
      );
      return updatedRows[0];
    } catch (error) {
      throw new Error(`Failed to update knowledge document: ${error.message}`);
    }
  }

  /**
   * Delete document
   */
  async delete(id) {
    try {
      const deletedRowsCount = await KnowledgeDocument.destroy({
        where: { id }
      });
      return deletedRowsCount > 0;
    } catch (error) {
      throw new Error(`Failed to delete knowledge document: ${error.message}`);
    }
  }

  /**
   * Search documents with filters
   */
  async search(filters = {}, pagination = {}) {
    try {
      const { limit = 20, offset = 0, sortBy = 'updatedAt', sortOrder = 'DESC' } = pagination;

      const whereClause = {};

      // Text search
      if (filters.query) {
        whereClause[Op.or] = [
          { title: { [Op.iLike]: `%${filters.query}%` } },
          { description: { [Op.iLike]: `%${filters.query}%` } },
          { content: { [Op.iLike]: `%${filters.query}%` } }
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

      // Filter by author
      if (filters.author) {
        whereClause.author = filters.author;
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

      const { rows: documents, count: total } = await KnowledgeDocument.findAndCountAll({
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
        documents,
        pagination: {
          total,
          page: Math.floor(offset / limit) + 1,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to search knowledge documents: ${error.message}`);
    }
  }

  /**
   * Get documents by category
   */
  async getByCategory(category, pagination = {}) {
    return this.search({ category }, pagination);
  }

  /**
   * Get documents by type
   */
  async getByType(type, pagination = {}) {
    return this.search({ type }, pagination);
  }

  /**
   * Get documents by status
   */
  async getByStatus(status, pagination = {}) {
    return this.search({ status }, pagination);
  }

  /**
   * Increment view count
   */
  async incrementViewCount(id) {
    try {
      await KnowledgeDocument.increment('viewCount', { where: { id } });
      return true;
    } catch (error) {
      throw new Error(`Failed to increment view count: ${error.message}`);
    }
  }

  /**
   * Increment download count
   */
  async incrementDownloadCount(id) {
    try {
      await KnowledgeDocument.increment('downloadCount', { where: { id } });
      return true;
    } catch (error) {
      throw new Error(`Failed to increment download count: ${error.message}`);
    }
  }

  /**
   * Get popular documents (by view count)
   */
  async getPopular(limit = 10) {
    try {
      const documents = await KnowledgeDocument.findAll({
        where: { status: 'published' },
        order: [['viewCount', 'DESC']],
        limit
      });
      return documents;
    } catch (error) {
      throw new Error(`Failed to get popular documents: ${error.message}`);
    }
  }

  /**
   * Get recent documents
   */
  async getRecent(limit = 10) {
    try {
      const documents = await KnowledgeDocument.findAll({
        order: [['createdAt', 'DESC']],
        limit
      });
      return documents;
    } catch (error) {
      throw new Error(`Failed to get recent documents: ${error.message}`);
    }
  }

  /**
   * Get document statistics
   */
  async getStatistics() {
    try {
      const stats = await KnowledgeDocument.findAll({
        attributes: [
          'status',
          'type',
          'category',
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
        ],
        group: ['status', 'type', 'category'],
        raw: true
      });

      const totalDocuments = await KnowledgeDocument.count();
      const publishedDocuments = await KnowledgeDocument.count({ where: { status: 'published' } });
      const totalViews = await KnowledgeDocument.sum('viewCount');
      const totalDownloads = await KnowledgeDocument.sum('downloadCount');

      return {
        totalDocuments,
        publishedDocuments,
        totalViews,
        totalDownloads,
        breakdown: stats
      };
    } catch (error) {
      throw new Error(`Failed to get document statistics: ${error.message}`);
    }
  }

  /**
   * Get all unique categories
   */
  async getCategories() {
    try {
      const categories = await KnowledgeDocument.findAll({
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
      const documents = await KnowledgeDocument.findAll({
        attributes: ['tags'],
        where: { status: 'published' },
        raw: true
      });

      const tagSet = new Set();
      documents.forEach(doc => {
        if (doc.tags && Array.isArray(doc.tags)) {
          doc.tags.forEach(tag => tagSet.add(tag));
        }
      });

      return Array.from(tagSet).sort();
    } catch (error) {
      throw new Error(`Failed to get tags: ${error.message}`);
    }
  }

  /**
   * Bulk update document status
   */
  async bulkUpdateStatus(documentIds, status, userId) {
    try {
      const [updatedRowsCount] = await KnowledgeDocument.update(
        { status, updatedBy: userId },
        { where: { id: { [Op.in]: documentIds } } }
      );
      return updatedRowsCount;
    } catch (error) {
      throw new Error(`Failed to bulk update document status: ${error.message}`);
    }
  }

  /**
   * Archive old documents
   */
  async archiveOldDocuments(olderThanDays = 365) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const [updatedRowsCount] = await KnowledgeDocument.update(
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
      throw new Error(`Failed to archive old documents: ${error.message}`);
    }
  }
}

module.exports = new KnowledgeDocumentRepository();
