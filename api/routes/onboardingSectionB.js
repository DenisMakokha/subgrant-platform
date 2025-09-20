const express = require('express');
const db = require('../config/database');
const { validateSchema } = require('../validators/onboarding');
const { FinancialAssessmentSchema } = require('../validators/onboarding');
const { 
  requireAuth, 
  requireEmailVerified, 
  requireOrgOwnership,
  requireOrgStatus,
  getUserOrganization,
  auditLog 
} = require('../middleware/onboarding');
const { sendSubmissionReceivedEmail } = require('../services/emailService');

const router = express.Router();

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
