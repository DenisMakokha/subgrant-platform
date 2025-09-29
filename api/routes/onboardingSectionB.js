const express = require('express');
const db = require('../config/database');
const { validateSchema, FinancialAssessmentSchema } = require('../validators/onboarding');
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

// SSoT Section B endpoint using repository pattern
router.post('/section-b',
  async (req, res) => {
    try {
      console.log('📥 SSoT Section B - Received data:', req.body);
      
      // Extract user ID from JWT token
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json(createApiError(401, { form: ['Authentication required'] }));
      }
      
      const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
      const userId = decoded.sub;
      
      console.log('👤 User ID from token:', userId);
      
      // Get user's organization
      const existingOrg = await orgRepo.readByUserId(userId);
      if (!existingOrg) {
        return res.status(404).json(createApiError(404, { form: ['Organization not found'] }));
      }
      
      console.log('🏢 Found organization:', existingOrg.id);
      
      // Immutability: block any writes when organization is finalized
      if (existingOrg.status === 'finalized') {
        return res.status(409).json(createApiError(409, { form: ['Organization is finalized and cannot be modified'] }));
      }
      
      // Extract data from SSoT envelope format
      const requestData = req.body.data || req.body;
      console.log('📦 Extracted request data (Section B):', requestData);

      // Minimal validation
      if (!requestData || typeof requestData !== 'object' || typeof requestData.financial_assessment !== 'object') {
        return res.status(400).json(createApiError(400, { financial_assessment: ['financial_assessment is required'] }));
      }

      const validatedData = requestData;
      console.log('✅ Financial data validated successfully');
      
      // Extract etag from request headers or body
      const etag = Number(req.header('If-Match') || req.body?.meta?.etag || existingOrg.version);
      
      // Update using repository with optimistic concurrency
      const updatedOrg = await orgRepo.update(existingOrg.id, {
        financial_assessment: validatedData.financial_assessment,
        status: 'c_pending' // Progress to next section
      }, {
        etag,
        userId,
        idempotencyKey: req.header('Idempotency-Key')
      });
      
      console.log('✅ Organization financial assessment updated via SSoT repository:', {
        id: updatedOrg.id,
        version: updatedOrg.version,
        financial_assessment: updatedOrg.financial_assessment
      });
      
      // Return standard envelope
      res.json(createEnvelope(updatedOrg, {
        etag: updatedOrg.version,
        message: 'Section B data saved successfully'
      }));
      
    } catch (error) {
      console.error('❌ SSoT Section B save error:', error);
      
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
      
      res.status(500).json(createApiError(500, { 
        form: ['Failed to save Section B data'] 
      }));
    }
  }
);

// Get Section B data (financial assessment)
router.get('/section-b',
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

    // Check if organization is in the right status (allow a_pending or b_pending)
    if (!['a_pending', 'b_pending', 'c_pending'].includes(req.userOrganization.status)) {
      return res.status(400).json({ 
        error: 'Organization must complete Section A first',
        currentStatus: req.userOrganization.status,
        requiredStatus: 'a_pending, b_pending, or c_pending'
      });
    }
    try {
      // Get existing financial assessment
      const assessmentResult = await db.pool.query(
        `SELECT current_annual_budget_amount_usd, current_annual_budget_year,
                next_year_annual_budget_estimate_amount_usd, next_year_annual_budget_estimate_year,
                largest_grant_ever_managed_amount_usd, largest_grant_ever_managed_year,
                current_donor_funding_amount_usd, current_donor_funding_year,
                other_funds_amount_usd, other_funds_year,
                submitted_at
         FROM financial_assessments
         WHERE organization_id = $1`,
        [req.userOrganization.id]
      );

      let assessment = null;
      if (assessmentResult.rows.length > 0) {
        const row = assessmentResult.rows[0];
        assessment = {
          currentAnnualBudget: {
            amountUsd: parseFloat(row.current_annual_budget_amount_usd) || 0,
            year: row.current_annual_budget_year || new Date().getFullYear()
          },
          nextYearAnnualBudgetEstimate: {
            amountUsd: parseFloat(row.next_year_annual_budget_estimate_amount_usd) || 0,
            year: row.next_year_annual_budget_estimate_year || new Date().getFullYear() + 1
          },
          largestGrantEverManaged: {
            amountUsd: parseFloat(row.largest_grant_ever_managed_amount_usd) || 0,
            year: row.largest_grant_ever_managed_year || new Date().getFullYear()
          },
          currentDonorFunding: {
            amountUsd: parseFloat(row.current_donor_funding_amount_usd) || 0,
            year: row.current_donor_funding_year || new Date().getFullYear()
          },
          otherFunds: {
            amountUsd: parseFloat(row.other_funds_amount_usd) || 0,
            year: row.other_funds_year || new Date().getFullYear()
          },
          submittedAt: row.submitted_at
        };
      }

      res.json({
        organizationStatus: req.userOrganization.status,
        assessment
      });

    } catch (error) {
      console.error('Get Section B error:', error);
      res.status(500).json({ error: 'Failed to load financial assessment' });
    }
  }
);

// Save Section B and move to Section C
router.post('/section-b/save',
  requireAuth,
  requireEmailVerified,
  getUserOrganization,
  requireOrgOwnership,
  validateSchema(FinancialAssessmentSchema),
  auditLog('section_b_save'),
  async (req, res) => {
    // Check if organization exists
    if (!req.userOrganization) {
      return res.status(400).json({ 
        error: 'Organization not found. Please create an organization first.',
        userId: req.user.id
      });
    }

    // Check if organization is in the right status (allow a_pending or b_pending)
    if (!['a_pending', 'b_pending'].includes(req.userOrganization.status)) {
      return res.status(400).json({ 
        error: 'Organization must complete Section A first',
        currentStatus: req.userOrganization.status,
        requiredStatus: 'a_pending or b_pending'
      });
    }
    try {
      const { 
        currentAnnualBudget,
        nextYearAnnualBudgetEstimate,
        largestGrantEverManaged,
        currentDonorFunding,
        otherFunds
      } = req.validatedData;

      await db.pool.query(
        `INSERT INTO financial_assessments (
           organization_id,
           current_annual_budget_amount_usd, current_annual_budget_year,
           next_year_annual_budget_estimate_amount_usd, next_year_annual_budget_estimate_year,
           largest_grant_ever_managed_amount_usd, largest_grant_ever_managed_year,
           current_donor_funding_amount_usd, current_donor_funding_year,
           other_funds_amount_usd, other_funds_year
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (organization_id)
         DO UPDATE SET
           current_annual_budget_amount_usd = EXCLUDED.current_annual_budget_amount_usd,
           current_annual_budget_year = EXCLUDED.current_annual_budget_year,
           next_year_annual_budget_estimate_amount_usd = EXCLUDED.next_year_annual_budget_estimate_amount_usd,
           next_year_annual_budget_estimate_year = EXCLUDED.next_year_annual_budget_estimate_year,
           largest_grant_ever_managed_amount_usd = EXCLUDED.largest_grant_ever_managed_amount_usd,
           largest_grant_ever_managed_year = EXCLUDED.largest_grant_ever_managed_year,
           current_donor_funding_amount_usd = EXCLUDED.current_donor_funding_amount_usd,
           current_donor_funding_year = EXCLUDED.current_donor_funding_year,
           other_funds_amount_usd = EXCLUDED.other_funds_amount_usd,
           other_funds_year = EXCLUDED.other_funds_year,
           updated_at = CURRENT_TIMESTAMP`,
        [
          req.userOrganization.id,
          currentAnnualBudget.amountUsd,
          currentAnnualBudget.year,
          nextYearAnnualBudgetEstimate.amountUsd,
          nextYearAnnualBudgetEstimate.year,
          largestGrantEverManaged.amountUsd,
          largestGrantEverManaged.year,
          currentDonorFunding.amountUsd,
          currentDonorFunding.year,
          otherFunds.amountUsd,
          otherFunds.year
        ]
      );

      // Update organization status to c_pending (B→C transition)
      await db.pool.query(
        'UPDATE organizations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['c_pending', req.userOrganization.id]
      );

      res.json({ ok: true, nextStep: 'section-c' });

    } catch (error) {
      console.error('Save Section B error:', error);
      res.status(500).json({ error: 'Failed to save draft' });
    }
  }
);


module.exports = router;
