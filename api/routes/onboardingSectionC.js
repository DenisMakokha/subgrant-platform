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
  // Allow access if organization is in b_pending or c_pending status
  async (req, res) => {
    // Check if organization exists
    if (!req.userOrganization) {
      return res.status(400).json({ 
        error: 'Organization not found. Please create an organization first.',
        userId: req.user.id
      });
    }

    // Check if organization is in the right status
    if (!['b_pending', 'c_pending'].includes(req.userOrganization.status)) {
      return res.status(400).json({ 
        error: 'Organization must complete previous sections first',
        currentStatus: req.userOrganization.status,
        requiredStatus: 'b_pending or c_pending'
      });
    }
    try {
      // Check if document_requirements table exists and has data
      const tableCheck = await db.pool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'document_requirements'
        )`
      );
      
      if (!tableCheck.rows[0].exists) {
        return res.status(500).json({ 
          error: 'Document requirements table not found. Please run database migrations.' 
        });
      }

      // Get all document requirements
      const requirementsResult = await db.pool.query(
        `SELECT code, category, title, is_optional, sort_order
         FROM document_requirements
         WHERE is_active = true
         ORDER BY sort_order, title`
      );

      // If no requirements exist, seed them
      if (requirementsResult.rows.length === 0) {
        await seedDocumentRequirements();
        // Re-fetch after seeding
        const newRequirementsResult = await db.pool.query(
          `SELECT code, category, title, is_optional, sort_order
           FROM document_requirements
           WHERE is_active = true
           ORDER BY sort_order, title`
        );
        requirementsResult.rows = newRequirementsResult.rows;
      }

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
  validateSchema(PresignRequestSchema),
  async (req, res) => {
    // Check if organization exists
    if (!req.userOrganization) {
      return res.status(400).json({ 
        error: 'Organization not found. Please create an organization first.',
        userId: req.user.id
      });
    }

    // Check if organization is in the right status
    if (!['b_pending', 'c_pending'].includes(req.userOrganization.status)) {
      return res.status(400).json({ 
        error: 'Organization must complete previous sections first',
        currentStatus: req.userOrganization.status,
        requiredStatus: 'b_pending or c_pending'
      });
    }
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
  requireOrgOwnership,
  validateSchema(SectionCSchema),
  auditLog('section_c_save'),
  async (req, res) => {
    // Check if organization exists
    if (!req.userOrganization) {
      return res.status(400).json({ 
        error: 'Organization not found. Please create an organization first.',
        userId: req.user.id
      });
    }

    // Check if organization is in the right status
    if (!['b_pending', 'c_pending'].includes(req.userOrganization.status)) {
      return res.status(400).json({ 
        error: 'Organization must complete previous sections first',
        currentStatus: req.userOrganization.status,
        requiredStatus: 'b_pending or c_pending'
      });
    }
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

        // Update organization status to c_pending if it was b_pending
        if (req.userOrganization.status === 'b_pending') {
          await client.query(
            'UPDATE organizations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            ['c_pending', req.userOrganization.id]
          );
        }

        await client.query('COMMIT');

        res.json({ ok: true, message: 'Draft saved successfully' });

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

// Single submission action: C → under_review
router.post('/section-c/submit',
  requireAuth,
  requireEmailVerified,
  getUserOrganization,
  requireOrgOwnership,
  requireOrgStatus('c_pending'),
  async (req, res) => {
    try {
      // Validate: all required docs present & valid
      const requirementsResult = await db.pool.query(
        'SELECT code, is_optional FROM document_requirements WHERE is_active = true'
      );

      const documentsResult = await db.pool.query(
        `SELECT requirement_code, available, na_explanation, files_json
         FROM org_documents
         WHERE organization_id = $1`,
        [req.userOrganization.id]
      );

      const existingDocs = {};
      documentsResult.rows.forEach(doc => {
        existingDocs[doc.requirement_code] = {
          available: doc.available,
          naExplanation: doc.na_explanation,
          files: doc.files_json || []
        };
      });

      // Check all required documents are complete
      for (const req of requirementsResult.rows) {
        if (!req.is_optional) {
          const doc = existingDocs[req.code];
          if (!doc) {
            return res.status(400).json({ error: `Required document "${req.code}" is missing` });
          }
          if (doc.available === 'yes' && (!doc.files || doc.files.length === 0)) {
            return res.status(400).json({ error: `Required document "${req.code}" must have files` });
          }
          if (doc.available === 'na' && (!doc.naExplanation || doc.naExplanation.trim().length === 0)) {
            return res.status(400).json({ error: `Required document "${req.code}" must have N/A explanation` });
          }
        }
      }

      // Update organization status to under_review_gm (GM first)
      await db.pool.query(
        'UPDATE organizations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['under_review_gm', req.userOrganization.id]
      );

      // Send submission received email
      const { sendSubmissionReceivedEmail } = require('../services/emailService');
      const userResult = await db.pool.query('SELECT email, first_name FROM users WHERE id = $1', [req.auth.sub]);
      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        await sendSubmissionReceivedEmail(user.email, user.first_name, req.userOrganization.legal_name || 'Your Organization');
      }

      // Notify GM reviewers
      const NotificationService = require('../services/notificationService');
      await NotificationService.notifyRole('grants_manager', {
        type: 'review_incoming',
        orgId: req.userOrganization.id,
        orgName: req.userOrganization.legal_name || 'Organization',
        message: `New organization ${req.userOrganization.legal_name} submitted for GM review`
      });

      return res.json({ ok: true, nextStep: 'review' });

    } catch (error) {
      console.error('Submit Section C error:', error);
      res.status(500).json({ error: 'Failed to submit application' });
    }
  }
);

// Complete file upload
router.post('/section-c/complete',
  requireAuth,
  requireEmailVerified,
  getUserOrganization,
  requireOrgOwnership,
  requireOrgStatus('c_pending'),
  async (req, res) => {
    try {
      const { fileKey, docId, mimeType } = req.body;
      
      // For now, just return success - in production you'd validate the upload
      // and create file records in the database
      res.json({ ok: true, fileId: `file_${Date.now()}` });
      
    } catch (error) {
      console.error('Complete upload error:', error);
      res.status(500).json({ error: 'Failed to complete upload' });
    }
  }
);

// Helper function to seed document requirements
async function seedDocumentRequirements() {
  const requirements = [
    // LEGAL DOCUMENTS
    { code: 'legal_incorporation_cert', category: 'legal', title: 'Certificate of Registration/Incorporation', is_optional: false, sort_order: 1 },
    { code: 'constitution_articles', category: 'legal', title: 'Constitution/Articles of Association', is_optional: false, sort_order: 2 },
    { code: 'tax_registration_cert', category: 'legal', title: 'Tax registration certificate', is_optional: false, sort_order: 3 },
    { code: 'tax_exemption_cert', category: 'legal', title: 'Tax Exemption Certificate', is_optional: true, sort_order: 4 },
    { code: 'business_operating_license', category: 'legal', title: 'Current Business/Operating License', is_optional: false, sort_order: 5 },

    // GOVERNANCE
    { code: 'board_directors_list', category: 'governance', title: 'Current Board of Directors List with CVs', is_optional: false, sort_order: 6 },
    { code: 'organizational_chart', category: 'governance', title: 'Organizational Chart', is_optional: false, sort_order: 7 },
    { code: 'board_charter_policy', category: 'governance', title: 'Board charter/governance policy', is_optional: false, sort_order: 8 },

    // FINANCIAL
    { code: 'audited_financial_statements', category: 'financial', title: 'Audited Financial Statements (last 2 years)', is_optional: false, sort_order: 9 },
    { code: 'current_year_budget', category: 'financial', title: 'Current Year Budget', is_optional: false, sort_order: 10 },
    { code: 'financial_policies_manual', category: 'financial', title: 'Financial Policies and Procedures Manual', is_optional: false, sort_order: 11 },

    // OPERATIONAL
    { code: 'strategic_plan', category: 'operational', title: 'Current Strategic Plan', is_optional: false, sort_order: 12 },
    { code: 'annual_reports', category: 'operational', title: 'Annual Reports (last 2 years)', is_optional: false, sort_order: 13 },

    // COMPLIANCE
    { code: 'child_protection_policy', category: 'compliance', title: 'Child Protection Policy and Procedures', is_optional: false, sort_order: 14 },
    { code: 'anti_corruption_policy', category: 'compliance', title: 'Anti-Corruption and Ethics Policy', is_optional: false, sort_order: 15 },
    { code: 'code_of_conduct', category: 'compliance', title: 'Code of Conduct for Staff', is_optional: false, sort_order: 16 },
    { code: 'gender_inclusion_policy', category: 'compliance', title: 'Gender and Inclusion Policy', is_optional: false, sort_order: 17 },
    { code: 'data_protection_policy', category: 'compliance', title: 'Data Protection and Privacy Policy', is_optional: false, sort_order: 18 },
    { code: 'hr_policy', category: 'compliance', title: 'Human Resource Policy', is_optional: false, sort_order: 19 },

    // ADDITIONAL
    { code: 'additional_documents', category: 'additional', title: 'Additional Important Documents', is_optional: true, sort_order: 20 }
  ];

  for (const req of requirements) {
    await db.pool.query(
      `INSERT INTO document_requirements (code, category, title, is_optional, sort_order, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       ON CONFLICT (code) DO NOTHING`,
      [req.code, req.category, req.title, req.is_optional, req.sort_order]
    );
  }
}

module.exports = router;
