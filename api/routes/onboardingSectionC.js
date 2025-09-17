const express = require('express');
const db = require('../config/database');
const { validateSchema, SectionCSchema, PresignRequestSchema } = require('../validators/onboarding');
const { requireAuth, requireEmailVerified, requireOrgOwnership, requireOrgStatus, auditLog, getUserOrganization } = require('../middleware/onboarding');
const { generatePresignedUploadUrl, validateUploadCompletion } = require('../services/s3Service');
const pool = require('../config/database');
const { sendSubmissionReceivedEmail } = require('../services/emailService');

const router = express.Router();

// Get Section C data (document requirements and current responses)
router.get('/section-c',
  requireAuth,
  requireEmailVerified,
  getUserOrganization,
  requireOrgStatus('attachments_pending', 'changes_requested'),
  async (req, res) => {
    try {
      // Get all document requirements
      const requirementsResult = await db.pool.query(
        `SELECT code, category, title, is_optional, sort_order
         FROM document_requirements
         WHERE is_active = true
         ORDER BY sort_order, title`
      );

      // Get existing organization documents
      const documentsResult = await db.pool.query(
        `SELECT requirement_code, available, na_explanation, note, files_json, last_submitted_at
         FROM org_documents
         WHERE organization_id = $1`,
        [req.userOrganization.id]
      );

      // Create a map of existing documents
      const existingDocs = {};
      documentsResult.rows.forEach(doc => {
        existingDocs[doc.requirement_code] = {
          available: doc.available,
          naExplanation: doc.na_explanation,
          note: doc.note,
          files: doc.files_json || [],
          lastSubmittedAt: doc.last_submitted_at
        };
      });

      // Group requirements by category
      const groupedRequirements = {};
      requirementsResult.rows.forEach(req => {
        if (!groupedRequirements[req.category]) {
          groupedRequirements[req.category] = [];
        }
        groupedRequirements[req.category].push({
          code: req.code,
          title: req.title,
          isOptional: req.is_optional,
          sortOrder: req.sort_order,
          response: existingDocs[req.code] || null
        });
      });

      res.json({
        organizationStatus: req.userOrganization.status,
        requirements: groupedRequirements,
        categories: ['legal', 'governance', 'financial', 'operational', 'compliance', 'additional']
      });

    } catch (error) {
      console.error('Get Section C error:', error);
      res.status(500).json({ error: 'Failed to load document requirements' });
    }
  }
);

// Generate presigned URLs for file uploads
router.post('/section-c/presign',
  requireAuth,
  requireEmailVerified,
  getUserOrganization,
  requireOrgStatus('attachments_pending', 'changes_requested'),
  validateSchema(PresignRequestSchema),
  async (req, res) => {
    try {
      const { fileName, fileType, fileSize } = req.validatedData;

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/jpg',
        'image/png'
      ];

      if (!allowedTypes.includes(fileType)) {
        return res.status(400).json({ 
          error: 'Invalid file type. Allowed: PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG, PNG' 
        });
      }

      // Generate unique file key
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = fileName.split('.').pop();
      const fileKey = `uploads/${req.userOrganization.id}/${timestamp}-${randomString}.${fileExtension}`;

      // For now, return a mock presigned URL structure
      // In production, you would integrate with AWS S3 or similar service
      const presignedUrl = {
        url: `${process.env.API_URL || 'http://localhost:3000'}/api/upload/${fileKey}`,
        fields: {
          key: fileKey,
          'Content-Type': fileType,
          'Content-Length': fileSize.toString()
        },
        fileKey
      };

      res.json(presignedUrl);

    } catch (error) {
      console.error('Presign URL error:', error);
      res.status(500).json({ error: 'Failed to generate upload URL' });
    }
  }
);

// Save Section C draft
router.post('/section-c/save',
  requireAuth,
  requireEmailVerified,
  getUserOrganization,
  requireOrgStatus('attachments_pending', 'changes_requested'),
  validateSchema(SectionCSchema),
  auditLog('section_c_save'),
  async (req, res) => {
    try {
      const { documents } = req.validatedData;

      const client = await db.pool.connect();
      try {
        await client.query('BEGIN');

        // Upsert each document response
        for (const doc of documents) {
          await client.query(
            `INSERT INTO org_documents (organization_id, requirement_code, available, na_explanation, note, files_json)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (organization_id, requirement_code)
             DO UPDATE SET
               available = EXCLUDED.available,
               na_explanation = EXCLUDED.na_explanation,
               note = EXCLUDED.note,
               files_json = EXCLUDED.files_json,
               updated_at = CURRENT_TIMESTAMP`,
            [
              req.userOrganization.id,
              doc.requirementCode,
              doc.available,
              doc.naExplanation || null,
              doc.note || null,
              JSON.stringify(doc.files || [])
            ]
          );
        }

        await client.query('COMMIT');

        res.json({ message: 'Draft saved successfully' });

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      console.error('Save Section C error:', error);
      res.status(500).json({ error: 'Failed to save draft' });
    }
  }
);

// Submit Section C
router.post('/section-c/submit',
  requireAuth,
  requireEmailVerified,
  getUserOrganization,
  requireOrgStatus('attachments_pending', 'changes_requested'),
  validateSchema(SectionCSchema),
  auditLog('section_c_submit'),
  async (req, res) => {
    try {
      const { documents } = req.validatedData;

      // Validate all required documents are complete
      const requirementsResult = await db.pool.query(
        'SELECT code, is_optional FROM document_requirements WHERE is_active = true'
      );

      const requirements = {};
      requirementsResult.rows.forEach(req => {
        requirements[req.code] = { isOptional: req.is_optional };
      });

      // Check each document
      for (const doc of documents) {
        const requirement = requirements[doc.requirementCode];
        if (!requirement) continue;

        if (!requirement.isOptional) {
          if (doc.available === 'yes' && (!doc.files || doc.files.length === 0)) {
            return res.status(400).json({
              error: `Required document "${doc.requirementCode}" must have at least one file when marked as available`
            });
          }
          if (doc.available === 'na' && (!doc.naExplanation || doc.naExplanation.trim().length === 0)) {
            return res.status(400).json({
              error: `Required document "${doc.requirementCode}" must have explanation when marked as N/A`
            });
          }
        }
      }

      const client = await db.pool.connect();
      try {
        await client.query('BEGIN');

        // Save all documents with submission timestamp
        for (const doc of documents) {
          await client.query(
            `INSERT INTO org_documents (organization_id, requirement_code, available, na_explanation, note, files_json, last_submitted_at)
             VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
             ON CONFLICT (organization_id, requirement_code)
             DO UPDATE SET
               available = EXCLUDED.available,
               na_explanation = EXCLUDED.na_explanation,
               note = EXCLUDED.note,
               files_json = EXCLUDED.files_json,
               last_submitted_at = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP`,
            [
              req.userOrganization.id,
              doc.requirementCode,
              doc.available,
              doc.naExplanation || null,
              doc.note || null,
              JSON.stringify(doc.files || [])
            ]
          );
        }

        // Update organization status to financials_pending
        await client.query(
          'UPDATE organizations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          ['financials_pending', req.userOrganization.id]
        );

        await client.query('COMMIT');

        // Send confirmation email
        await sendSubmissionReceivedEmail(
          req.user.email,
          req.user.first_name,
          'Section C (Attachments)'
        );

        res.json({ 
          message: 'Section C submitted successfully. Please proceed to Section B (Financial Assessment).',
          nextStep: 'section-b'
        });

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      console.error('Submit Section C error:', error);
      res.status(500).json({ error: 'Failed to submit Section C' });
    }
  }
);

module.exports = router;
