const express = require('express');
const db = require('../config/database');
const { validateSchema } = require('../validators/onboarding');
const { SectionCSchema } = require('../validators/onboarding');
const { 
  requireAuth, 
  requireEmailVerified, 
  requireOrgOwnership,
  requireOrgStatus,
  getUserOrganization,
  auditLog 
} = require('../middleware/onboarding');

// SSoT imports (JS versions)
const { OrganizationRepository } = require('../repositories/OrganizationRepository.js');
const { createEnvelope, createApiError } = require('../core/FormRepository.js');

const router = express.Router();
const orgRepo = new OrganizationRepository();

// SSoT Section C endpoint using repository pattern
router.post('/section-c',
  async (req, res) => {
    try {
      // Ensure org_documents table exists before selecting from it
      try {
        await db.pool.query(`
          CREATE TABLE IF NOT EXISTS org_documents (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            requirement_code VARCHAR(100) NOT NULL,
            available VARCHAR(10),
            na_explanation TEXT,
            note TEXT,
            files_json JSONB,
            last_submitted_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        await db.pool.query(`
          ALTER TABLE org_documents 
          ADD COLUMN IF NOT EXISTS requirement_code VARCHAR(100),
          ADD COLUMN IF NOT EXISTS available VARCHAR(10),
          ADD COLUMN IF NOT EXISTS na_explanation TEXT,
          ADD COLUMN IF NOT EXISTS note TEXT,
          ADD COLUMN IF NOT EXISTS files_json JSONB,
          ADD COLUMN IF NOT EXISTS last_submitted_at TIMESTAMP
        `);
      } catch (schemaErr) {
        console.warn('⚠️ Section C GET: org_documents ensure warning:', schemaErr.message || schemaErr);
      }
      console.log(' SSoT Section C - Received data:', req.body);
      
      // Extract user ID from JWT token
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json(createApiError(401, { form: ['Authentication required'] }));
      }
      
      const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
      const userId = decoded.sub;
      
      console.log(' User ID from token:', userId);
      
      // Get user's organization
      const existingOrg = await orgRepo.readByUserId(userId);
      if (!existingOrg) {
        return res.status(404).json(createApiError(404, { form: ['Organization not found'] }));
      }
      
      console.log(' Found organization:', existingOrg.id);
      
      // Extract data from SSoT envelope format
      const requestData = req.body.data || req.body;
      console.log('📦 Extracted request data (Section C):', requestData);

      // Ensure document enums and requirements table exist (self-healing policy)
      try {
        await db.pool.query(`
          DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_category') THEN
              CREATE TYPE document_category AS ENUM (
                'legal','governance','financial','operational','compliance','additional'
              );
            END IF;
          END $$;
        `);
        await db.pool.query(`
          CREATE TABLE IF NOT EXISTS document_requirements (
            code VARCHAR(100) PRIMARY KEY,
            category document_category NOT NULL,
            title VARCHAR(255) NOT NULL,
            is_optional BOOLEAN DEFAULT FALSE,
            is_active BOOLEAN DEFAULT TRUE,
            sort_order INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        await db.pool.query(`
          ALTER TABLE document_requirements
          ADD COLUMN IF NOT EXISTS is_optional BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
          ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
          ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        `);
      } catch (reqSchemaErr) {
        console.warn('⚠️ Section C POST: requirements ensure warning:', reqSchemaErr.message || reqSchemaErr);
      }

      // Accept various FE formats; normalize to an array of sanitized docs
      let inputDocs = [];
      if (requestData && Array.isArray(requestData.documents)) {
        inputDocs = requestData.documents;
      } else if (requestData && requestData.documents && typeof requestData.documents === 'object') {
        // Object map keyed by requirement code
        inputDocs = Object.entries(requestData.documents).map(([code, value]) => ({
          requirementCode: code,
          ...(value || {})
        }));
      } else {
        inputDocs = [];
      }

      // Determine if this is a draft or a submission (affects validation strictness)
      const isSubmitted = requestData.status === 'submitted';

      // Sanitize and normalize docs
      const sanitizedDocs = inputDocs.map((doc) => {
        const requirementCode = doc.requirementCode || doc.code;
        let availableRaw = (doc.available !== undefined && doc.available !== null) ? String(doc.available) : 'yes';
        const avail = availableRaw.trim().toLowerCase();
        const available = (avail === 'na' || avail === 'n/a' || avail === 'not_applicable' || avail === 'not-applicable') ? 'na' : 'yes';
        let files = Array.isArray(doc.files) ? doc.files : [];
        if (!Array.isArray(files) && typeof doc.files === 'string') {
          try { files = JSON.parse(doc.files); } catch (_) { files = []; }
        }
        const naExplanation = (doc.naExplanation ?? doc.na_explanation ?? '').toString();
        const note = (doc.note ?? '').toString();
        return { requirementCode, available, naExplanation, note, files };
      });

      // Validation after normalization
      const docErrors = {};
      const validDocs = [];
      sanitizedDocs.forEach((doc, idx) => {
        let invalid = false;
        if (!doc || typeof doc !== 'object') { docErrors[idx] = ['invalid document']; invalid = true; }
        if (!doc.requirementCode || typeof doc.requirementCode !== 'string') {
          docErrors[`documents[${idx}].requirementCode`] = ['requirementCode is required'];
          invalid = true;
        }
        if (!['yes','na'].includes(doc.available)) {
          docErrors[`documents[${idx}].available`] = ["available must be 'yes' or 'na'"];
          invalid = true;
        }
        if (isSubmitted && doc.available === 'na' && (!doc.naExplanation || doc.naExplanation.trim().length === 0)) {
          docErrors[`documents[${idx}].naExplanation`] = ['naExplanation is required when available=na'];
          invalid = true;
        }
        if (!invalid) validDocs.push(doc);
      });
      // For submissions, any validation errors should block the request
      if (isSubmitted && Object.keys(docErrors).length > 0) {
        return res.status(400).json(createApiError(400, docErrors));
      }

      const validatedData = {
        documents: validDocs,
        status: isSubmitted ? 'submitted' : 'draft'
      };
      console.log('✅ Document data validated successfully');
      
      // Extract etag from request headers or body
      const etag = Number(req.header('If-Match') || req.body?.meta?.etag || existingOrg.version);
      
      // Ensure required schema exists (policy: always create missing DB elements)
      try {
        // organizations.document_responses
        await db.pool.query(`
          ALTER TABLE organizations
          ADD COLUMN IF NOT EXISTS document_responses JSONB
        `);

        // Create org_documents table if missing (first-time saves)
        await db.pool.query(`
          CREATE TABLE IF NOT EXISTS org_documents (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            requirement_id UUID,
            requirement_code VARCHAR(100) NOT NULL,
            available VARCHAR(10),
            na_explanation TEXT,
            note TEXT,
            files_json JSONB,
            last_submitted_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Ensure all required columns exist (safe if already present)
        await db.pool.query(`
          ALTER TABLE org_documents 
          ADD COLUMN IF NOT EXISTS requirement_id UUID,
          ADD COLUMN IF NOT EXISTS requirement_code VARCHAR(100),
          ADD COLUMN IF NOT EXISTS available VARCHAR(10),
          ADD COLUMN IF NOT EXISTS na_explanation TEXT,
          ADD COLUMN IF NOT EXISTS note TEXT,
          ADD COLUMN IF NOT EXISTS files_json JSONB,
          ADD COLUMN IF NOT EXISTS last_submitted_at TIMESTAMP,
          ADD COLUMN IF NOT EXISTS file_name TEXT,
          ADD COLUMN IF NOT EXISTS file_path TEXT
        `);

        // Ensure requirement_id is nullable to avoid legacy NOT NULL constraint failures
        try { await db.pool.query(`ALTER TABLE org_documents ALTER COLUMN requirement_id DROP NOT NULL`); } catch (e) {}
        try { await db.pool.query(`ALTER TABLE org_documents ALTER COLUMN file_name DROP NOT NULL`); } catch (e) {}
        try { await db.pool.query(`ALTER TABLE org_documents ALTER COLUMN file_path DROP NOT NULL`); } catch (e) {}

        // Ensure unique index for upsert
        await db.pool.query(`
          DO $$ BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_indexes WHERE indexname = 'idx_org_documents_org_req'
            ) THEN
              CREATE UNIQUE INDEX idx_org_documents_org_req ON org_documents(organization_id, requirement_code);
            END IF;
          END $$;
        `);
        console.log('✅ Section C schema ensured');
      } catch (schemaErr) {
        console.error('⚠️ Failed ensuring Section C schema:', schemaErr);
      }

      // Upsert into org_documents and update organization in a transaction
      const client = await db.pool.connect();
      let updatedOrg;
      try {
        await client.query('BEGIN');

        // Attempt to map requirement_code -> requirement_id if column exists in document_requirements
        let codeToId = {};
        try {
          const colCheck = await client.query(`
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'document_requirements' AND column_name = 'id'
          `);
          const hasId = colCheck.rowCount > 0;
          if (hasId) {
            const reqRows = await client.query('SELECT id, code FROM document_requirements');
            reqRows.rows.forEach(r => { codeToId[r.code] = r.id; });
          }
        } catch (mapErr) {
          console.warn('⚠️ Could not build requirement code→id map:', mapErr.message || mapErr);
        }

        for (const doc of validatedData.documents) {
          const requirementId = codeToId[doc.requirementCode] || null;
          const primaryFile = Array.isArray(doc.files) && doc.files.length > 0 ? doc.files[0] : null;
          const fileName = primaryFile?.name || primaryFile?.fileName || primaryFile?.filename || primaryFile?.originalName || null;
          const filePath = primaryFile?.url || primaryFile?.key || primaryFile?.fileKey || primaryFile?.path || null;

          await client.query(
            `INSERT INTO org_documents (
               organization_id, requirement_id, requirement_code, available, na_explanation, note, files_json, file_name, file_path, updated_at
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
             ON CONFLICT (organization_id, requirement_code)
             DO UPDATE SET
               requirement_id = EXCLUDED.requirement_id,
               available = EXCLUDED.available,
               na_explanation = EXCLUDED.na_explanation,
               note = EXCLUDED.note,
               files_json = EXCLUDED.files_json,
               file_name = COALESCE(EXCLUDED.file_name, org_documents.file_name),
               file_path = COALESCE(EXCLUDED.file_path, org_documents.file_path),
               updated_at = CURRENT_TIMESTAMP`,
            [
              existingOrg.id,
              requirementId,
              doc.requirementCode,
              doc.available,
              doc.naExplanation || null,
              doc.note || null,
              JSON.stringify(doc.files || []),
              fileName,
              filePath
            ]
          );
        }

        // If this is a submission, strictly validate against all active requirements
        if (isSubmitted) {
          const requirementsResult = await client.query(
            'SELECT code, is_optional FROM document_requirements WHERE is_active = true'
          );
          const documentsResult = await client.query(
            `SELECT requirement_code, available, na_explanation, files_json
             FROM org_documents
             WHERE organization_id = $1`,
            [existingOrg.id]
          );

          const existingDocs = {};
          documentsResult.rows.forEach(doc => {
            existingDocs[doc.requirement_code] = {
              available: doc.available,
              naExplanation: doc.na_explanation,
              files: Array.isArray(doc.files_json) ? doc.files_json : (typeof doc.files_json === 'string' ? (()=>{ try { return JSON.parse(doc.files_json); } catch { return []; } })() : [])
            };
          });

          const submissionErrors = {};
          for (const reqRow of requirementsResult.rows) {
            if (!reqRow.is_optional) {
              const doc = existingDocs[reqRow.code];
              if (!doc) {
                submissionErrors[reqRow.code] = [`Required document "${reqRow.code}" is missing`];
                continue;
              }
              if (doc.available === 'yes') {
                if (!doc.files || doc.files.length === 0) {
                  submissionErrors[reqRow.code] = [`Required document "${reqRow.code}" must have files`];
                }
              } else if (doc.available === 'na') {
                if (!doc.naExplanation || String(doc.naExplanation).trim().length === 0) {
                  submissionErrors[reqRow.code] = [`Required document "${reqRow.code}" must have N/A explanation`];
                }
              } else {
                submissionErrors[reqRow.code] = [`Document "${reqRow.code}" has invalid availability value`];
              }
            }
          }

          if (Object.keys(submissionErrors).length > 0) {
            throw new Error('VALIDATION_SUBMISSION:' + JSON.stringify(submissionErrors));
          }
        }

        // Determine next status based on submission
        const nextStatus = validatedData.status === 'submitted' ? 'under_review_gm' : 'c_pending';

        // Update organization (status + document_responses)
        try {
          updatedOrg = await orgRepo.update(existingOrg.id, {
            document_responses: validatedData.documents,
            status: nextStatus
          }, {
            etag,
            userId,
            idempotencyKey: req.header('Idempotency-Key')
          });
        } catch (updErr) {
          // If document_responses column missing somehow, update status directly
          console.warn('⚠️ Repo.update failed; falling back to direct status update:', updErr.message || updErr);
          await client.query(
            'UPDATE organizations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [nextStatus, existingOrg.id]
          );
          updatedOrg = (await client.query('SELECT * FROM organizations WHERE id = $1', [existingOrg.id])).rows[0];
        }

        await client.query('COMMIT');

        console.log('✅ Organization documents saved:', {
          id: updatedOrg.id,
          status: updatedOrg.status,
          document_count: validatedData.documents.length
        });

        // If this is a formal submission, send email + notify reviewers
        if (isSubmitted) {
          try {
            const { sendSubmissionReceivedEmail } = require('../services/emailService');
            const userResult = await client.query('SELECT email, first_name FROM users WHERE id = $1', [userId]);
            if (userResult.rows.length > 0) {
              const user = userResult.rows[0];
              await sendSubmissionReceivedEmail(user.email, user.first_name, updatedOrg.legal_name || 'Your Organization');
            }

            const NotificationService = require('../services/notificationService');
            await NotificationService.notifyRole('grants_manager', {
              type: 'review_incoming',
              orgId: updatedOrg.id,
              orgName: updatedOrg.legal_name || 'Organization',
              message: `New organization ${updatedOrg.legal_name || ''} submitted for GM review`
            });
          } catch (notifyErr) {
            console.warn('⚠️ Submission notification failed (non-fatal):', notifyErr.message || notifyErr);
          }
        }

        // Return standard envelope
        res.json(createEnvelope(updatedOrg, {
          etag: updatedOrg.version,
          message: isSubmitted ? 'Section C submitted successfully' : 'Section C data saved successfully',
          nextStep: 'review'
        }));

      } catch (txErr) {
        await client.query('ROLLBACK');
        throw txErr;
      } finally {
        client.release();
      }
      
    } catch (error) {
      console.error(' SSoT Section C save error:', error);

      if (error.message === 'CONFLICT') {
        return res.status(409).json(createApiError(409, { 
          form: ['Data was modified by another process. Please reload and try again.'] 
        }));
      }

      // Repository-level non-null validation
      if (error.message && error.message.startsWith('VALIDATION_NON_NULL:')) {
        const fields = error.message.replace('VALIDATION_NON_NULL:', '').split(',').filter(Boolean);
        const errors = {};
        for (const f of fields) errors[f] = [`${f} must not be null or empty`];
        return res.status(400).json(createApiError(400, errors));
      }

      // Submission validation aggregation
      if (typeof error.message === 'string' && error.message.startsWith('VALIDATION_SUBMISSION:')) {
        let submissionErrors = {};
        try { submissionErrors = JSON.parse(error.message.substring('VALIDATION_SUBMISSION:'.length)); } catch (_) {}
        return res.status(400).json(createApiError(400, submissionErrors));
      }

      // Common Postgres errors -> friendlier responses
      if (error.code) {
        switch (error.code) {
          case '23503':
            return res.status(400).json(createApiError(400, { form: ['Invalid related reference'] }));
          case '23505':
            return res.status(409).json(createApiError(409, { form: ['Duplicate document entry'] }));
          case '42703':
            return res.status(500).json(createApiError(500, { form: ['Server column mapping error (Section C)'] }));
          default:
            break;
        }
      }

      res.status(500).json(createApiError(500, { 
        form: ['Failed to save Section C data'] 
      }));
    }
  }
);

// Review status endpoint for partner after submission
router.get('/review-status',
  requireAuth,
  requireEmailVerified,
  getUserOrganization,
  async (req, res) => {
    try {
      if (!req.userOrganization) {
        return res.status(404).json({ error: 'Organization not found' });
      }

      // Normalize review statuses to a single client-friendly status
      const rawStatus = req.userOrganization.status;
      const organizationStatus = ['under_review_gm', 'under_review_coo'].includes(rawStatus)
        ? 'under_review'
        : rawStatus;

      // Placeholder flags; integrate reviewer flags later
      const flags = [];

      res.json({
        organizationStatus,
        flags,
        canProceed: organizationStatus === 'finalized'
      });
    } catch (error) {
      console.error('Get review-status error:', error);
      res.status(500).json({ error: 'Failed to load review status' });
    }
  }
);

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
    // Allow viewing Section C data in later states for review purposes
    const allowedStatuses = ['b_pending', 'c_pending', 'under_review', 'under_review_gm', 'under_review_coo', 'finalized'];
    if (!allowedStatuses.includes(req.userOrganization.status)) {
      return res.status(400).json({ 
        error: 'Organization must complete previous sections first',
        currentStatus: req.userOrganization.status,
        requiredStatus: allowedStatuses.join(', ')
      });
    }
    try {
      // Ensure enums and tables exist (self-healing per policy)
      try {
        // Ensure document_category enum exists
        await db.pool.query(`
          DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_category') THEN
              CREATE TYPE document_category AS ENUM (
                'legal','governance','financial','operational','compliance','additional'
              );
            END IF;
          END $$;
        `);

        // Ensure document_requirements table and columns exist
        await db.pool.query(`
          CREATE TABLE IF NOT EXISTS document_requirements (
            code VARCHAR(100) PRIMARY KEY,
            category document_category NOT NULL,
            title VARCHAR(255) NOT NULL,
            is_optional BOOLEAN DEFAULT FALSE,
            is_active BOOLEAN DEFAULT TRUE,
            sort_order INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        await db.pool.query(`
          ALTER TABLE document_requirements
          ADD COLUMN IF NOT EXISTS is_optional BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
          ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
          ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        `);

        // Ensure org_documents table exists for subsequent selects
        await db.pool.query(`
          CREATE TABLE IF NOT EXISTS org_documents (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            requirement_id UUID,
            requirement_code VARCHAR(100) NOT NULL,
            available VARCHAR(10),
            na_explanation TEXT,
            note TEXT,
            files_json JSONB,
            last_submitted_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        await db.pool.query(`
          ALTER TABLE org_documents 
          ADD COLUMN IF NOT EXISTS requirement_id UUID,
          ADD COLUMN IF NOT EXISTS requirement_code VARCHAR(100),
          ADD COLUMN IF NOT EXISTS available VARCHAR(10),
          ADD COLUMN IF NOT EXISTS na_explanation TEXT,
          ADD COLUMN IF NOT EXISTS note TEXT,
          ADD COLUMN IF NOT EXISTS files_json JSONB,
          ADD COLUMN IF NOT EXISTS last_submitted_at TIMESTAMP,
          ADD COLUMN IF NOT EXISTS file_name TEXT,
          ADD COLUMN IF NOT EXISTS file_path TEXT
        `);
        // Ensure requirement_id is nullable (handle legacy schema with NOT NULL)
        try { await db.pool.query(`ALTER TABLE org_documents ALTER COLUMN requirement_id DROP NOT NULL`); } catch (e) {}
        try { await db.pool.query(`ALTER TABLE org_documents ALTER COLUMN file_name DROP NOT NULL`); } catch (e) {}
        try { await db.pool.query(`ALTER TABLE org_documents ALTER COLUMN file_path DROP NOT NULL`); } catch (e) {}
        await db.pool.query(`
          DO $$ BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_indexes WHERE indexname = 'idx_org_documents_org_req'
            ) THEN
              CREATE UNIQUE INDEX idx_org_documents_org_req ON org_documents(organization_id, requirement_code);
            END IF;
          END $$;
        `);
      } catch (schemaEnsureErr) {
        console.warn('⚠️ Section C GET schema ensure warning:', schemaEnsureErr.message || schemaEnsureErr);
      }

      // Get all document requirements (seed if empty)
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
        let files = doc.files_json;
        try {
          if (typeof files === 'string') files = JSON.parse(files);
        } catch (_) { /* keep as-is */ }
        existingDocs[doc.requirement_code] = {
          available: doc.available,
          naExplanation: doc.na_explanation,
          note: doc.note,
          files: files || [],
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

      res.json(createEnvelope({
        organizationStatus: req.userOrganization.status,
        requirements: groupedRequirements,
        categories: ['legal', 'governance', 'financial', 'operational', 'compliance', 'additional']
      }, {
        etag: req.userOrganization.version,
        timestamp: new Date().toISOString()
      }));

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
      const { fileName, fileType, fileSize } = req.body || {};

      // Basic runtime validation
      const errors = {};
      if (!fileName || typeof fileName !== 'string') errors.fileName = ['fileName is required'];
      if (!fileType || typeof fileType !== 'string') errors.fileType = ['fileType is required'];
      if (fileSize === undefined || fileSize === null || Number.isNaN(Number(fileSize))) errors.fileSize = ['fileSize is required'];
      if (Object.keys(errors).length > 0) {
        return res.status(400).json(createApiError(400, errors));
      }

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

      // Ensure tables/columns/indexes exist
      try {
        await db.pool.query(`
          CREATE TABLE IF NOT EXISTS org_documents (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
            requirement_code VARCHAR(100) NOT NULL,
            available VARCHAR(10),
            na_explanation TEXT,
            note TEXT,
            files_json JSONB,
            last_submitted_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        await db.pool.query(`
          ALTER TABLE org_documents 
          ADD COLUMN IF NOT EXISTS requirement_code VARCHAR(100),
          ADD COLUMN IF NOT EXISTS available VARCHAR(10),
          ADD COLUMN IF NOT EXISTS na_explanation TEXT,
          ADD COLUMN IF NOT EXISTS note TEXT,
          ADD COLUMN IF NOT EXISTS files_json JSONB,
          ADD COLUMN IF NOT EXISTS last_submitted_at TIMESTAMP;
        `);
        await db.pool.query(`
          DO $$ BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_indexes WHERE indexname = 'idx_org_documents_org_req'
            ) THEN
              CREATE UNIQUE INDEX idx_org_documents_org_req ON org_documents(organization_id, requirement_code);
            END IF;
          END $$;
        `);
        await db.pool.query(`
          ALTER TABLE organizations ADD COLUMN IF NOT EXISTS document_responses JSONB
        `);
      } catch (schemaErr) {
        console.error('Section C save: schema ensure failed (non-fatal):', schemaErr.message || schemaErr);
      }

      const client = await db.pool.connect();
      try {
        await client.query('BEGIN');

        // Upsert each document response
        for (const doc of documents) {
          await client.query(
            `INSERT INTO org_documents (
               organization_id, requirement_code, available, na_explanation, note, files_json, updated_at
             ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
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

        // Always set status to c_pending (B -> C progression) and persist responses on organization
        await client.query(
          'UPDATE organizations SET status = $1, document_responses = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
          ['c_pending', JSON.stringify(documents), req.userOrganization.id]
        );

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
      // Map common errors
      if (error.code === '42P10') {
        return res.status(500).json({ error: 'Missing unique index on (organization_id, requirement_code)' });
      }
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

      // Update organization status to under_review_gm (GM review stage)
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
