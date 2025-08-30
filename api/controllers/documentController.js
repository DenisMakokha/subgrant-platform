const Document = require('../models/document');
const auditLogger = require('../middleware/auditLogger');

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
      
      // Log the document creation
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'CREATE_DOCUMENT',
          entity_type: 'document',
          entity_id: document.id,
          before_state: null,
          after_state: document,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error creating audit log:', auditError);
      }
      
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
      
      // Log the document update
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'UPDATE_DOCUMENT',
          entity_type: 'document',
          entity_id: id,
          before_state: document,
          after_state: updatedDocument,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error creating audit log:', auditError);
      }
      
      res.json(updatedDocument);
    } catch (err) {
      next(err);
    }
  }

  // Delete a document
  static async deleteDocument(req, res, next) {
    try {
      const { id } = req.params;
      const document = await Document.findById(id);
      
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }
      
      await Document.delete(id);
      
      // Log the document deletion
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'DELETE_DOCUMENT',
          entity_type: 'document',
          entity_id: id,
          before_state: document,
          after_state: null,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error creating audit log:', auditError);
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
      
      // Log the checksum verification
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'VERIFY_DOCUMENT_CHECKSUM',
          entity_type: 'document',
          entity_id: id,
          before_state: null,
          after_state: { id, valid: isValid },
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error creating audit log:', auditError);
      }
      
      res.json({ valid: isValid });
    } catch (err) {
      next(err);
    }
  }
  
  // Get the latest version of a document for a specific entity
  static async getLatestVersion(req, res, next) {
    try {
      const { entityType, entityId } = req.params;
      const document = await Document.getLatestVersion(entityType, entityId);
      
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }
      
      res.json(document);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = DocumentController;