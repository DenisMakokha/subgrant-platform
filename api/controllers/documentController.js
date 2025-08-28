const Document = require('../models/document');

class DocumentController {
  // Get all documents with optional filters
  static async getAllDocuments(req, res, next) {
    try {
      const filters = req.query;
      const documents = await Document.findAll(filters);
      res.json(documents);
    } catch (err) {
      next(err);
    }
  }

  // Get a document by ID
  static async getDocumentById(req, res, next) {
    try {
      const { id } = req.params;
      const document = await Document.findById(id);
      
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }
      
      res.json(document);
    } catch (err) {
      next(err);
    }
  }

  // Get documents by entity
  static async getDocumentsByEntity(req, res, next) {
    try {
      const { entityType, entityId } = req.params;
      const documents = await Document.findByEntity(entityType, entityId);
      res.json(documents);
    } catch (err) {
      next(err);
    }
  }

  // Get documents by user
  static async getDocumentsByUser(req, res, next) {
    try {
      const { userId } = req.params;
      const documents = await Document.findByUser(userId);
      res.json(documents);
    } catch (err) {
      next(err);
    }
  }

  // Create a new document
  static async createDocument(req, res, next) {
    try {
      const documentData = {
        ...req.body,
        uploaded_by: req.user.id
      };
      
      const document = await Document.create(documentData);
      res.status(201).json(document);
    } catch (err) {
      next(err);
    }
  }

  // Update a document
  static async updateDocument(req, res, next) {
    try {
      const { id } = req.params;
      const document = await Document.findById(id);
      
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }
      
      const updateData = {
        ...req.body,
        updated_by: req.user.id
      };
      
      const updatedDocument = await Document.update(id, updateData);
      res.json(updatedDocument);
    } catch (err) {
      next(err);
    }
  }

  // Delete a document
  static async deleteDocument(req, res, next) {
    try {
      const { id } = req.params;
      const document = await Document.delete(id);
      
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }
      
      res.json({ message: 'Document deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  // Get version history for a document entity
  static async getVersionHistory(req, res, next) {
    try {
      const { entityType, entityId } = req.params;
      const history = await Document.getVersionHistory(entityType, entityId);
      res.json(history);
    } catch (err) {
      next(err);
    }
  }

  // Verify document checksum
  static async verifyChecksum(req, res, next) {
    try {
      const { id } = req.params;
      const { fileContent } = req.body;
      
      if (!fileContent) {
        return res.status(400).json({ error: 'File content is required' });
      }
      
      const isValid = await Document.verifyChecksum(id, fileContent);
      res.json({ valid: isValid });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = DocumentController;