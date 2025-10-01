const knowledgeDocumentRepository = require('../repositories/knowledgeDocumentRepository');
const trainingModuleRepository = require('../repositories/trainingModuleRepository');
const { validationResult } = require('express-validator');
const fs = require('fs').promises;
const path = require('path');

class AdminKnowledgeController {
  /**
   * Knowledge Documents Management
   */

  /**
   * Get all documents with filtering and pagination
   */
  async getDocuments(req, res) {
    try {
      const { page = 1, limit = 20, sortBy = 'updatedAt', sortOrder = 'DESC', ...filters } = req.query;

      const offset = (page - 1) * limit;

      const result = await knowledgeDocumentRepository.search(filters, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        sortBy,
        sortOrder
      });

      res.json({
        success: true,
        data: result.documents,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error fetching documents:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch documents',
        error: error.message
      });
    }
  }

  /**
   * Get document by ID
   */
  async getDocumentById(req, res) {
    try {
      const { id } = req.params;
      const document = await knowledgeDocumentRepository.findById(id);

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      // Increment view count
      await knowledgeDocumentRepository.incrementViewCount(id);

      res.json({
        success: true,
        data: document
      });
    } catch (error) {
      console.error('Error fetching document:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch document',
        error: error.message
      });
    }
  }

  /**
   * Create new document
   */
  async createDocument(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const documentData = req.body;
      const userId = req.user.id;

      // Handle file upload if present
      if (req.file) {
        documentData.filePath = req.file.path;
        documentData.fileSize = req.file.size;
        documentData.mimeType = req.file.mimetype;
      }

      const document = await knowledgeDocumentRepository.create(documentData, userId);

      res.status(201).json({
        success: true,
        data: document,
        message: 'Document created successfully'
      });
    } catch (error) {
      console.error('Error creating document:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create document',
        error: error.message
      });
    }
  }

  /**
   * Update document
   */
  async updateDocument(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user.id;

      // Handle file upload if present
      if (req.file) {
        updateData.filePath = req.file.path;
        updateData.fileSize = req.file.size;
        updateData.mimeType = req.file.mimetype;
      }

      const document = await knowledgeDocumentRepository.update(id, updateData, userId);

      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      res.json({
        success: true,
        data: document,
        message: 'Document updated successfully'
      });
    } catch (error) {
      console.error('Error updating document:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update document',
        error: error.message
      });
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(req, res) {
    try {
      const { id } = req.params;
      const deleted = await knowledgeDocumentRepository.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      res.json({
        success: true,
        message: 'Document deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete document',
        error: error.message
      });
    }
  }

  /**
   * Download document file
   */
  async downloadDocument(req, res) {
    try {
      const { id } = req.params;
      const document = await knowledgeDocumentRepository.findById(id);

      if (!document || !document.filePath) {
        return res.status(404).json({
          success: false,
          message: 'Document file not found'
        });
      }

      // Increment download count
      await knowledgeDocumentRepository.incrementDownloadCount(id);

      // Send file
      res.download(document.filePath, document.title);
    } catch (error) {
      console.error('Error downloading document:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to download document',
        error: error.message
      });
    }
  }

  /**
   * Get document statistics
   */
  async getDocumentStatistics(req, res) {
    try {
      const stats = await knowledgeDocumentRepository.getStatistics();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching document statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch document statistics',
        error: error.message
      });
    }
  }

  /**
   * Get document categories
   */
  async getDocumentCategories(req, res) {
    try {
      const categories = await knowledgeDocumentRepository.getCategories();

      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('Error fetching document categories:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch document categories',
        error: error.message
      });
    }
  }

  /**
   * Get document tags
   */
  async getDocumentTags(req, res) {
    try {
      const tags = await knowledgeDocumentRepository.getTags();

      res.json({
        success: true,
        data: tags
      });
    } catch (error) {
      console.error('Error fetching document tags:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch document tags',
        error: error.message
      });
    }
  }

  /**
   * Bulk update document status
   */
  async bulkUpdateDocumentStatus(req, res) {
    try {
      const { documentIds, status } = req.body;
      const userId = req.user.id;

      if (!Array.isArray(documentIds) || documentIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Document IDs array is required'
        });
      }

      const updatedCount = await knowledgeDocumentRepository.bulkUpdateStatus(documentIds, status, userId);

      res.json({
        success: true,
        message: `${updatedCount} documents updated successfully`,
        data: { updatedCount }
      });
    } catch (error) {
      console.error('Error bulk updating document status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to bulk update document status',
        error: error.message
      });
    }
  }

  /**
   * Training Modules Management
   */

  /**
   * Get all training modules with filtering and pagination
   */
  async getTrainingModules(req, res) {
    try {
      const { page = 1, limit = 20, sortBy = 'updatedAt', sortOrder = 'DESC', ...filters } = req.query;

      const offset = (page - 1) * limit;

      const result = await trainingModuleRepository.search(filters, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        sortBy,
        sortOrder
      });

      res.json({
        success: true,
        data: result.modules,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error fetching training modules:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch training modules',
        error: error.message
      });
    }
  }

  /**
   * Get training module by ID
   */
  async getTrainingModuleById(req, res) {
    try {
      const { id } = req.params;
      const module = await trainingModuleRepository.findById(id);

      if (!module) {
        return res.status(404).json({
          success: false,
          message: 'Training module not found'
        });
      }

      res.json({
        success: true,
        data: module
      });
    } catch (error) {
      console.error('Error fetching training module:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch training module',
        error: error.message
      });
    }
  }

  /**
   * Create new training module
   */
  async createTrainingModule(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const moduleData = req.body;
      const userId = req.user.id;

      const module = await trainingModuleRepository.create(moduleData, userId);

      res.status(201).json({
        success: true,
        data: module,
        message: 'Training module created successfully'
      });
    } catch (error) {
      console.error('Error creating training module:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create training module',
        error: error.message
      });
    }
  }

  /**
   * Update training module
   */
  async updateTrainingModule(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user.id;

      const module = await trainingModuleRepository.update(id, updateData, userId);

      if (!module) {
        return res.status(404).json({
          success: false,
          message: 'Training module not found'
        });
      }

      res.json({
        success: true,
        data: module,
        message: 'Training module updated successfully'
      });
    } catch (error) {
      console.error('Error updating training module:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update training module',
        error: error.message
      });
    }
  }

  /**
   * Delete training module
   */
  async deleteTrainingModule(req, res) {
    try {
      const { id } = req.params;
      const deleted = await trainingModuleRepository.delete(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Training module not found'
        });
      }

      res.json({
        success: true,
        message: 'Training module deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting training module:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete training module',
        error: error.message
      });
    }
  }

  /**
   * Enroll user in training module
   */
  async enrollInModule(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Check if module exists
      const module = await trainingModuleRepository.findById(id);
      if (!module) {
        return res.status(404).json({
          success: false,
          message: 'Training module not found'
        });
      }

      // Increment enrollment count
      await trainingModuleRepository.incrementEnrollmentCount(id);

      res.json({
        success: true,
        message: 'Successfully enrolled in training module'
      });
    } catch (error) {
      console.error('Error enrolling in module:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to enroll in training module',
        error: error.message
      });
    }
  }

  /**
   * Get training module statistics
   */
  async getTrainingStatistics(req, res) {
    try {
      const stats = await trainingModuleRepository.getStatistics();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching training statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch training statistics',
        error: error.message
      });
    }
  }

  /**
   * Get training module categories
   */
  async getTrainingCategories(req, res) {
    try {
      const categories = await trainingModuleRepository.getCategories();

      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('Error fetching training categories:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch training categories',
        error: error.message
      });
    }
  }

  /**
   * Get training module tags
   */
  async getTrainingTags(req, res) {
    try {
      const tags = await trainingModuleRepository.getTags();

      res.json({
        success: true,
        data: tags
      });
    } catch (error) {
      console.error('Error fetching training tags:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch training tags',
        error: error.message
      });
    }
  }

  /**
   * Bulk update training module status
   */
  async bulkUpdateModuleStatus(req, res) {
    try {
      const { moduleIds, status } = req.body;
      const userId = req.user.id;

      if (!Array.isArray(moduleIds) || moduleIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Module IDs array is required'
        });
      }

      const updatedCount = await trainingModuleRepository.bulkUpdateStatus(moduleIds, status, userId);

      res.json({
        success: true,
        message: `${updatedCount} modules updated successfully`,
        data: { updatedCount }
      });
    } catch (error) {
      console.error('Error bulk updating module status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to bulk update module status',
        error: error.message
      });
    }
  }

  /**
   * Get popular documents
   */
  async getPopularDocuments(req, res) {
    try {
      const { limit = 10 } = req.query;
      const documents = await knowledgeDocumentRepository.getPopular(parseInt(limit));

      res.json({
        success: true,
        data: documents
      });
    } catch (error) {
      console.error('Error fetching popular documents:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch popular documents',
        error: error.message
      });
    }
  }

  /**
   * Get recent documents
   */
  async getRecentDocuments(req, res) {
    try {
      const { limit = 10 } = req.query;
      const documents = await knowledgeDocumentRepository.getRecent(parseInt(limit));

      res.json({
        success: true,
        data: documents
      });
    } catch (error) {
      console.error('Error fetching recent documents:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch recent documents',
        error: error.message
      });
    }
  }

  /**
   * Get popular training modules
   */
  async getPopularModules(req, res) {
    try {
      const { limit = 10 } = req.query;
      const modules = await trainingModuleRepository.getPopular(parseInt(limit));

      res.json({
        success: true,
        data: modules
      });
    } catch (error) {
      console.error('Error fetching popular modules:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch popular modules',
        error: error.message
      });
    }
  }

  /**
   * Get recent training modules
   */
  async getRecentModules(req, res) {
    try {
      const { limit = 10 } = req.query;
      const modules = await trainingModuleRepository.getRecent(parseInt(limit));

      res.json({
        success: true,
        data: modules
      });
    } catch (error) {
      console.error('Error fetching recent modules:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch recent modules',
        error: error.message
      });
    }
  }

  /**
   * Archive old documents
   */
  async archiveOldDocuments(req, res) {
    try {
      const { olderThanDays = 365 } = req.body;
      const archivedCount = await knowledgeDocumentRepository.archiveOldDocuments(olderThanDays);

      res.json({
        success: true,
        message: `${archivedCount} documents archived successfully`,
        data: { archivedCount }
      });
    } catch (error) {
      console.error('Error archiving old documents:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to archive old documents',
        error: error.message
      });
    }
  }

  /**
   * Archive old training modules
   */
  async archiveOldModules(req, res) {
    try {
      const { olderThanDays = 365 } = req.body;
      const archivedCount = await trainingModuleRepository.archiveOldModules(olderThanDays);

      res.json({
        success: true,
        message: `${archivedCount} modules archived successfully`,
        data: { archivedCount }
      });
    } catch (error) {
      console.error('Error archiving old modules:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to archive old modules',
        error: error.message
      });
    }
  }
}

module.exports = new AdminKnowledgeController();
