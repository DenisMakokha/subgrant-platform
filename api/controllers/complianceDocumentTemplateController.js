const ComplianceDocumentTemplate = require('../models/complianceDocumentTemplate');
const auditLogger = require('../middleware/auditLogger');
const logger = require('../utils/logger');

class ComplianceDocumentTemplateController {
  // Create a new compliance document template
  static async createTemplate(req, res, next) {
    try {
      const templateData = {
        document_type_id: req.body.document_type_id,
        name: req.body.name,
        description: req.body.description,
        template_uri: req.body.template_uri,
        template_name: req.body.template_name,
        mime_type: req.body.mime_type,
        is_active: req.body.is_active !== undefined ? req.body.is_active : true,
        created_by: req.user.id,
        updated_by: req.user.id
      };

      const template = await ComplianceDocumentTemplate.create(templateData);

      // Log the template creation
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'CREATE_COMPLIANCE_DOCUMENT_TEMPLATE',
          entity_type: 'compliance_document_template',
          entity_id: template.id,
          before_state: null,
          after_state: template,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        logger.error('Error creating audit log:', auditError);
      }

      res.status(201).json({
        message: 'Compliance document template created successfully',
        template
      });
    } catch (err) {
      next(err);
    }
  }

  // Get all compliance document templates
  static async getAllTemplates(req, res, next) {
    try {
      const templates = await ComplianceDocumentTemplate.findAll();

      // Log the template access
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'GET_ALL_COMPLIANCE_DOCUMENT_TEMPLATES',
          entity_type: 'compliance_document_template',
          entity_id: null,
          before_state: null,
          after_state: { count: templates.length },
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        logger.error('Error creating audit log:', auditError);
      }

      res.json(templates);
    } catch (err) {
      next(err);
    }
  }

  // Get a specific compliance document template by ID
  static async getTemplateById(req, res, next) {
    try {
      const { templateId } = req.params;
      const template = await ComplianceDocumentTemplate.findById(templateId);

      if (!template) {
        return res.status(404).json({ error: 'Compliance document template not found' });
      }

      // Log the template access
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'GET_COMPLIANCE_DOCUMENT_TEMPLATE',
          entity_type: 'compliance_document_template',
          entity_id: templateId,
          before_state: null,
          after_state: template,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        logger.error('Error creating audit log:', auditError);
      }

      res.json(template);
    } catch (err) {
      next(err);
    }
  }

  // Update a compliance document template
  static async updateTemplate(req, res, next) {
    try {
      const { templateId } = req.params;
      const updateData = req.body;
      updateData.updated_by = req.user.id;

      // Get the current template for audit logging
      const currentTemplate = await ComplianceDocumentTemplate.findById(templateId);
      if (!currentTemplate) {
        return res.status(404).json({ error: 'Compliance document template not found' });
      }

      const updatedTemplate = await ComplianceDocumentTemplate.update(templateId, updateData);

      if (!updatedTemplate) {
        return res.status(404).json({ error: 'Compliance document template not found' });
      }

      // Log the template update
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'UPDATE_COMPLIANCE_DOCUMENT_TEMPLATE',
          entity_type: 'compliance_document_template',
          entity_id: templateId,
          before_state: currentTemplate,
          after_state: updatedTemplate,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        logger.error('Error creating audit log:', auditError);
      }

      res.json({
        message: 'Compliance document template updated successfully',
        template: updatedTemplate
      });
    } catch (err) {
      next(err);
    }
  }

  // Delete a compliance document template
  static async deleteTemplate(req, res, next) {
    try {
      const { templateId } = req.params;
      
      // Get the current template for audit logging
      const currentTemplate = await ComplianceDocumentTemplate.findById(templateId);
      if (!currentTemplate) {
        return res.status(404).json({ error: 'Compliance document template not found' });
      }

      const deletedTemplate = await ComplianceDocumentTemplate.delete(templateId);

      if (!deletedTemplate) {
        return res.status(404).json({ error: 'Compliance document template not found' });
      }

      // Log the template deletion
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'DELETE_COMPLIANCE_DOCUMENT_TEMPLATE',
          entity_type: 'compliance_document_template',
          entity_id: templateId,
          before_state: currentTemplate,
          after_state: null,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        logger.error('Error creating audit log:', auditError);
      }

      res.json({
        message: 'Compliance document template deleted successfully',
        template: deletedTemplate
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ComplianceDocumentTemplateController;