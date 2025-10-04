const express = require('express');
const db = require('../config/database');
const { validateSchema } = require('../validators/onboarding');
const { SectionASchema } = require('../validators/onboarding');
const { 
  requireAuth, 
  requireEmailVerified, 
  requireOrgOwnership,
  requireOrgStatus,
  getUserOrganization,
  auditLog 
} = require('../middleware/onboarding');
const { sendOnboardingCompletedEmail } = require('../services/emailService');

const router = express.Router();

// SSoT Organization endpoint using repository pattern
const OrganizationRepository = require('../repositories/OrganizationRepository.js');
const logger = require('../utils/logger');
const { createEnvelope, createApiError } = require('../core/FormRepository.js');

const orgRepo = new OrganizationRepository();

router.post('/section-a',
  async (req, res) => {
    logger.info('🔥 SECTION A ENDPOINT HIT!');
    try {
      logger.info('📥 SSoT Section A - Received data:', req.body);
      
      // Extract user ID from JWT token
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json(createApiError(401, { form: ['Authentication required'] }));
      }
      
      const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
      const userId = decoded.sub;
      
      logger.info('👤 User ID from token:', userId);
      
      // Get user's organization (with safe fallback if repo still references deleted_at)
      let existingOrg;
      try {
        existingOrg = await orgRepo.readByUserId(userId);
      } catch (readErr) {
        logger.warn('⚠️ Repo.readByUserId failed, attempting direct DB read:', readErr.message || readErr);
        if (readErr.code === '42703' || String(readErr.message || '').includes('deleted_at')) {
          const direct = await db.pool.query('SELECT * FROM organizations WHERE owner_user_id = $1', [userId]);
          existingOrg = direct.rows[0] || null;
        } else {
          throw readErr;
        }
      }
      if (!existingOrg) {
        return res.status(404).json(createApiError(404, { form: ['Organization not found'] }));
      }
      
      logger.info('🏢 Found organization:', existingOrg.id);
      logger.info('🧾 Existing org snapshot:', {
        id: existingOrg.id,
        version: existingOrg.version,
        name: existingOrg.name,
        legal_name: existingOrg.legal_name,
        email: existingOrg.email,
        status: existingOrg.status
      });
      
      // Immutability: block any writes when organization is finalized
      if (existingOrg.status === 'finalized') {
        return res.status(409).json(createApiError(409, { form: ['Organization is finalized and cannot be modified'] }));
      }
      
      // Extract data from SSoT envelope format
      const requestData = req.body.data || req.body;
      logger.info('📦 Extracted request data:', requestData);

      // Merge non-nullable fields from existing organization when absent
      const nonNullable = ['name', 'legal_name', 'email'];
      const mergedData = { ...requestData };
      for (const k of nonNullable) {
        const v = mergedData[k];
        if (v === undefined || v === null || (typeof v === 'string' && v.trim().length === 0)) {
          mergedData[k] = existingOrg[k];
        }
      }

      // Validate after merge: non-nullables must be present and non-empty
      const missingAfterMerge = nonNullable.filter(k => {
        const v = mergedData[k];
        return v === undefined || v === null || (typeof v === 'string' && v.trim().length === 0);
      });
      if (missingAfterMerge.length > 0) {
        logger.info('❌ Missing required fields after merge:', missingAfterMerge);
        const errors = {};
        for (const k of missingAfterMerge) errors[k] = [`${k} is required`];
        return res.status(400).json(createApiError(400, errors));
      }

      const validatedData = mergedData;
      logger.info('✅ Data validated (post-merge):', validatedData);
      
      // Extract etag from request headers or body
      const etag = Number(req.header('If-Match') || req.body?.meta?.etag || existingOrg.version);
      
      // Prepare update data
      const updateData = {
        ...validatedData,
        status: 'b_pending' // Progress to next section
      };
      
      logger.info('🔄 Updating organization with data:', updateData);
      logger.info('📊 Update options:', {
        etag,
        userId,
        idempotencyKey: req.header('Idempotency-Key')
      });
      
      // Update using repository with optimistic concurrency (safe fallback on deleted_at errors)
      let updatedOrg;
      try {
        updatedOrg = await orgRepo.update(existingOrg.id, updateData, {
          etag,
          userId,
          idempotencyKey: req.header('Idempotency-Key')
        });
      } catch (updErr) {
        logger.warn('⚠️ Repo.update failed, attempting direct DB update:', updErr.message || updErr);
        if (updErr.code === '42703' || String(updErr.message || '').includes('deleted_at')) {
          // Build dynamic update query
          const allowed = [
            'name','legal_name','registration_number','tax_id','legal_structure','year_established',
            'email','phone','website','primary_contact_name','primary_contact_title','primary_contact_email','primary_contact_phone',
            'address','city','state_province','postal_code','country','bank_name','bank_branch','account_name','account_number','swift_code','status'
          ];
          const sets = [];
          const vals = [];
          let idx = 1;
          for (const k of allowed) {
            if (Object.prototype.hasOwnProperty.call(updateData, k)) {
              sets.push(`${k} = $${idx++}`);
              vals.push(updateData[k]);
            }
          }
          sets.push(`updated_at = NOW()`);
          const q = `UPDATE organizations SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`;
          vals.push(existingOrg.id);
          logger.info('🛠️ Direct UPDATE SQL:', q, 'params:', vals);
          const directUpd = await db.pool.query(q, vals);
          updatedOrg = directUpd.rows[0];
        } else {
          throw updErr;
        }
      }
      
      logger.info('✅ Organization updated via SSoT repository:', {
        id: updatedOrg.id,
        version: updatedOrg.version,
        bank_name: updatedOrg.bank_name,
        year_established: updatedOrg.year_established
      });
      
      // Return standard envelope
      res.json(createEnvelope(updatedOrg, {
        etag: updatedOrg.version,
        message: 'Section A data saved successfully'
      }));
      
    } catch (error) {
      logger.error('❌ SSoT Section A save error:', error);

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

      // Common Postgres errors -> friendlier responses
      if (error.code) {
        switch (error.code) {
          case '23502': { // not_null_violation
            // Attempt to identify column from detail message
            const msg = error.detail || error.message || 'Not null violation';
            const colMatch = msg.match(/"([^"]+)"/);
            const field = colMatch ? colMatch[1] : 'form';
            return res.status(400).json(createApiError(400, { [field]: [msg] }));
          }
          case '22P02': { // invalid_text_representation (e.g., invalid integer)
            return res.status(400).json(createApiError(400, { form: ['Invalid value format in request'] }));
          }
          case '42703': { // undefined_column
            return res.status(500).json(createApiError(500, { form: ['Server column mapping error'] }));
          }
          case '23503': { // foreign_key_violation
            return res.status(400).json(createApiError(400, { form: ['Related record not found'] }));
          }
          default:
            break;
        }
      }
      
      res.status(500).json(createApiError(500, { 
        form: ['Failed to save Section A data'],
        server: [error && error.message ? String(error.message) : 'unknown']
      }));
    }
  }
);

// Get Section A data (organization profile)
router.get('/section-a',
  requireAuth,
  requireEmailVerified,
  getUserOrganization,
  requireOrgStatus('a_pending'),
  async (req, res) => {
    try {
      // Get existing organization profile
      const profileResult = await db.pool.query(
        `SELECT legal_name, trading_name, registration_number, registration_type, registration_type_other,
                date_of_registration, country_of_registration, tax_identification_number,
                physical_address, postal_address, website,
                primary_contact_person, primary_contact_title, primary_contact_email, primary_contact_phone,
                finance_contact_person, finance_contact_email, finance_contact_phone,
                submitted_at
         FROM org_profile_section_a
         WHERE organization_id = $1`,
        [req.userOrganization.id]
      );

      let profile = null;
      if (profileResult.rows.length > 0) {
        const row = profileResult.rows[0];
        profile = {
          legalName: row.legal_name,
          tradingName: row.trading_name,
          registrationNumber: row.registration_number,
          registrationType: row.registration_type,
          registrationTypeOther: row.registration_type_other,
          dateOfRegistration: row.date_of_registration,
          countryOfRegistration: row.country_of_registration,
          taxIdentificationNumber: row.tax_identification_number,
          physicalAddress: row.physical_address,
          postalAddress: row.postal_address,
          website: row.website,
          primaryContactPerson: row.primary_contact_person,
          primaryContactTitle: row.primary_contact_title,
          primaryContactEmail: row.primary_contact_email,
          primaryContactPhone: row.primary_contact_phone,
          financeContactPerson: row.finance_contact_person,
          financeContactEmail: row.finance_contact_email,
          financeContactPhone: row.finance_contact_phone,
          submittedAt: row.submitted_at
        };
      }

      res.json({
        organizationStatus: req.userOrganization.status,
        profile
      });

    } catch (error) {
      logger.error('Get Section A error:', error);
      res.status(500).json({ error: 'Failed to load organization profile' });
    }
  }
);

// Save Section A and move to Section B
router.post('/section-a/save',
  requireAuth,
  requireEmailVerified,
  getUserOrganization,
  requireOrgOwnership,
  requireOrgStatus('a_pending'),
  validateSchema(SectionASchema),
  auditLog('section_a_save'),
  async (req, res) => {
    try {
      const {
        legalName, tradingName, registrationNumber, registrationType, registrationTypeOther,
        dateOfRegistration, countryOfRegistration, taxIdentificationNumber,
        physicalAddress, postalAddress, website,
        primaryContactPerson, primaryContactTitle, primaryContactEmail, primaryContactPhone,
        financeContactPerson, financeContactEmail, financeContactPhone
      } = req.validatedData;

      await db.pool.query(
        `INSERT INTO org_profile_section_a (
           organization_id, legal_name, trading_name, registration_number, registration_type, registration_type_other,
           date_of_registration, country_of_registration, tax_identification_number,
           physical_address, postal_address, website,
           primary_contact_person, primary_contact_title, primary_contact_email, primary_contact_phone,
           finance_contact_person, finance_contact_email, finance_contact_phone
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
         ON CONFLICT (organization_id)
         DO UPDATE SET
           legal_name = EXCLUDED.legal_name,
           trading_name = EXCLUDED.trading_name,
           registration_number = EXCLUDED.registration_number,
           registration_type = EXCLUDED.registration_type,
           registration_type_other = EXCLUDED.registration_type_other,
           date_of_registration = EXCLUDED.date_of_registration,
           country_of_registration = EXCLUDED.country_of_registration,
           tax_identification_number = EXCLUDED.tax_identification_number,
           physical_address = EXCLUDED.physical_address,
           postal_address = EXCLUDED.postal_address,
           website = EXCLUDED.website,
           primary_contact_person = EXCLUDED.primary_contact_person,
           primary_contact_title = EXCLUDED.primary_contact_title,
           primary_contact_email = EXCLUDED.primary_contact_email,
           primary_contact_phone = EXCLUDED.primary_contact_phone,
           finance_contact_person = EXCLUDED.finance_contact_person,
           finance_contact_email = EXCLUDED.finance_contact_email,
           finance_contact_phone = EXCLUDED.finance_contact_phone,
           updated_at = CURRENT_TIMESTAMP`,
        [
          req.userOrganization.id, legalName, tradingName, registrationNumber, registrationType, registrationTypeOther,
          dateOfRegistration, countryOfRegistration, taxIdentificationNumber,
          physicalAddress, postalAddress, website,
          primaryContactPerson, primaryContactTitle, primaryContactEmail, primaryContactPhone,
          financeContactPerson, financeContactEmail, financeContactPhone
        ]
      );

      // Update organization status to b_pending (A→B transition)
      await db.pool.query(
        'UPDATE organizations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['b_pending', req.userOrganization.id]
      );

      res.json({ ok: true, nextStep: 'section-b' });

    } catch (error) {
      logger.error('Save Section A error:', error);
      res.status(500).json({ error: 'Failed to save draft' });
    }
  }
);


module.exports = router;
