const express = require('express');
const db = require('../config/database');
const logger = require('../utils/logger');
const { validateSchema } = require('../validators/onboarding');
const { 
  ReviewDecisionSchema, 
  CreateReviewFlagsSchema, 
  AssessmentStreamSchema 
} = require('../validators/onboarding');
const { 
  requireAuth, 
  requireEmailVerified, 
  requireAdminRole,
  auditLog 
} = require('../middleware/onboarding');
const { 
  sendChangesRequestedEmail, 
  sendApprovedEmail 
} = require('../services/emailService');

const router = express.Router();

// Get organization dossier for review
router.get('/review/:organizationId',
  requireAuth,
  requireEmailVerified,
  requireAdminRole,
  async (req, res) => {
    try {
      const { organizationId } = req.params;

      // Get organization with owner info
      const orgResult = await db.pool.query(
        `SELECT o.id, o.status, o.created_at, o.updated_at,
                u.first_name, u.last_name, u.email, u.email_verified_at
         FROM organizations o
         JOIN users u ON u.id = o.owner_user_id
         WHERE o.id = $1`,
        [organizationId]
      );

      if (orgResult.rows.length === 0) {
        return res.status(404).json({ error: 'Organization not found' });
      }

      const organization = orgResult.rows[0];

      // Get document requirements and responses
      const documentsResult = await db.pool.query(
        `SELECT dr.code, dr.category, dr.title, dr.is_optional,
                od.available, od.na_explanation, od.note, od.files_json, od.last_submitted_at
         FROM document_requirements dr
         LEFT JOIN org_documents od ON od.requirement_code = dr.code AND od.organization_id = $1
         WHERE dr.is_active = true
         ORDER BY dr.sort_order, dr.title`,
        [organizationId]
      );

      // Get financial assessment
      const financialResult = await db.pool.query(
        `SELECT current_annual_budget_amount_usd, current_annual_budget_year,
                next_year_annual_budget_estimate_amount_usd, next_year_annual_budget_estimate_year,
                largest_grant_ever_managed_amount_usd, largest_grant_ever_managed_year,
                current_donor_funding_amount_usd, current_donor_funding_year,
                other_funds_amount_usd, other_funds_year,
                submitted_at
         FROM financial_assessments
         WHERE organization_id = $1`,
        [organizationId]
      );

      // Get existing review flags
      const flagsResult = await db.pool.query(
        `SELECT id, scope, scope_ref, comment, status, created_at, resolved_at
         FROM review_flags
         WHERE organization_id = $1
         ORDER BY created_at DESC`,
        [organizationId]
      );

      // Get review history
      const reviewsResult = await db.pool.query(
        `SELECT r.decision, r.comment, r.created_at,
                u.first_name, u.last_name
         FROM reviews r
         JOIN users u ON u.id = r.reviewer_user_id
         WHERE r.organization_id = $1
         ORDER BY r.created_at DESC`,
        [organizationId]
      );

      // Group documents by category
      const documentsByCategory = {};
      documentsResult.rows.forEach(doc => {
        if (!documentsByCategory[doc.category]) {
          documentsByCategory[doc.category] = [];
        }
        documentsByCategory[doc.category].push({
          code: doc.code,
          title: doc.title,
          isOptional: doc.is_optional,
          available: doc.available,
          naExplanation: doc.na_explanation,
          note: doc.note,
          files: doc.files_json || [],
          lastSubmittedAt: doc.last_submitted_at
        });
      });

      let financialAssessment = null;
      if (financialResult.rows.length > 0) {
        const row = financialResult.rows[0];
        financialAssessment = {
          currentAnnualBudget: {
            amountUsd: parseFloat(row.current_annual_budget_amount_usd),
            year: row.current_annual_budget_year
          },
          nextYearAnnualBudgetEstimate: {
            amountUsd: parseFloat(row.next_year_annual_budget_estimate_amount_usd),
            year: row.next_year_annual_budget_estimate_year
          },
          largestGrantEverManaged: {
            amountUsd: parseFloat(row.largest_grant_ever_managed_amount_usd),
            year: row.largest_grant_ever_managed_year
          },
          currentDonorFunding: {
            amountUsd: parseFloat(row.current_donor_funding_amount_usd),
            year: row.current_donor_funding_year
          },
          otherFunds: {
            amountUsd: parseFloat(row.other_funds_amount_usd),
            year: row.other_funds_year
          },
          submittedAt: row.submitted_at
        };
      }

      res.json({
        organization: {
          id: organization.id,
          status: organization.status,
          createdAt: organization.created_at,
          updatedAt: organization.updated_at,
          owner: {
            firstName: organization.first_name,
            lastName: organization.last_name,
            email: organization.email,
            emailVerified: !!organization.email_verified_at
          }
        },
        documents: documentsByCategory,
        financialAssessment,
        flags: flagsResult.rows,
        reviewHistory: reviewsResult.rows
      });

    } catch (error) {
      logger.error('Get review dossier error:', error);
      res.status(500).json({ error: 'Failed to load review dossier' });
    }
  }
);

// Create review flags
router.post('/review/:organizationId/flags',
  requireAuth,
  requireEmailVerified,
  requireAdminRole,
  validateSchema(CreateReviewFlagsSchema),
  auditLog('create_review_flags'),
  async (req, res) => {
    try {
      const { organizationId } = req.params;
      const { flags } = req.validatedData;

      const client = await db.pool.connect();
      try {
        await client.query('BEGIN');

        // Clear existing flags
        await client.query(
          'DELETE FROM review_flags WHERE organization_id = $1',
          [organizationId]
        );

        // Insert new flags
        for (const flag of flags) {
          await client.query(
            `INSERT INTO review_flags (organization_id, scope, scope_ref, comment)
             VALUES ($1, $2, $3, $4)`,
            [organizationId, flag.scope, flag.scopeRef, flag.comment]
          );
        }

        await client.query('COMMIT');

        res.json({ message: 'Review flags created successfully' });

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      logger.error('Create review flags error:', error);
      res.status(500).json({ error: 'Failed to create review flags' });
    }
  }
);

// Make review decision
router.post('/review/:organizationId/decision',
  requireAuth,
  requireEmailVerified,
  requireAdminRole,
  validateSchema(ReviewDecisionSchema),
  auditLog('review_decision'),
  async (req, res) => {
    try {
      const { organizationId } = req.params;
      const { decision, comment } = req.validatedData;

      // Get organization and owner info
      const orgResult = await db.pool.query(
        `SELECT o.status, u.first_name, u.email
         FROM organizations o
         JOIN users u ON u.id = o.owner_user_id
         WHERE o.id = $1`,
        [organizationId]
      );

      if (orgResult.rows.length === 0) {
        return res.status(404).json({ error: 'Organization not found' });
      }

      const organization = orgResult.rows[0];

      if (organization.status !== 'under_review') {
        return res.status(400).json({ error: 'Organization is not under review' });
      }

      const client = await db.pool.connect();
      try {
        await client.query('BEGIN');

        // Record the review decision
        await client.query(
          `INSERT INTO reviews (organization_id, reviewer_user_id, decision, comment)
           VALUES ($1, $2, $3, $4)`,
          [organizationId, req.user.id, decision, comment]
        );

        let newStatus;
        let emailFunction;

        switch (decision) {
          case 'approve':
            newStatus = 'finalized';
            const { sendOnboardingCompletedEmail } = require('../services/emailService');
            emailFunction = () => sendOnboardingCompletedEmail(
              organization.email,
              organization.first_name,
              'Your Organization'
            );
            break;
          case 'changes':
            newStatus = 'changes_requested';
            // Get flags for email
            const flagsResult = await client.query(
              'SELECT comment FROM review_flags WHERE organization_id = $1',
              [organizationId]
            );
            emailFunction = () => sendChangesRequestedEmail(
              organization.email, 
              organization.first_name, 
              flagsResult.rows
            );
            break;
          case 'reject':
            newStatus = 'rejected'; // Note: this status not in original enum, might need to add
            // TODO: Send rejection email
            break;
        }

        // Update organization status
        await client.query(
          'UPDATE organizations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [newStatus, organizationId]
        );

        await client.query('COMMIT');

        // Send notification email
        if (emailFunction) {
          await emailFunction();
        }

        res.json({ 
          message: `Review decision recorded: ${decision}`,
          newStatus
        });

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      logger.error('Review decision error:', error);
      res.status(500).json({ error: 'Failed to record review decision' });
    }
  }
);

// Get assessment streams for organization
router.get('/assessment/:organizationId',
  requireAuth,
  requireEmailVerified,
  requireAdminRole,
  async (req, res) => {
    try {
      const { organizationId } = req.params;

      const assessmentResult = await db.pool.query(
        `SELECT stream, q1_score, q1_comment, q2_score, q2_comment, q3_score, q3_comment,
                q4_score, q4_comment, q5_score, q5_comment, q6_score, q6_comment,
                q7_score, q7_comment, q8_score, q8_comment, q9_score, q9_comment,
                q10_score, q10_comment, q11_score, q11_comment, q12_score, q12_comment,
                q13_score, q13_comment, q14_score, q14_comment, overall_risk, updated_at
         FROM assessment_streams
         WHERE organization_id = $1
         ORDER BY stream`,
        [organizationId]
      );

      const assessments = {};
      assessmentResult.rows.forEach(row => {
        assessments[row.stream] = {
          q1Score: row.q1_score,
          q1Comment: row.q1_comment,
          q2Score: row.q2_score,
          q2Comment: row.q2_comment,
          q3Score: row.q3_score,
          q3Comment: row.q3_comment,
          q4Score: row.q4_score,
          q4Comment: row.q4_comment,
          q5Score: row.q5_score,
          q5Comment: row.q5_comment,
          q6Score: row.q6_score,
          q6Comment: row.q6_comment,
          q7Score: row.q7_score,
          q7Comment: row.q7_comment,
          q8Score: row.q8_score,
          q8Comment: row.q8_comment,
          q9Score: row.q9_score,
          q9Comment: row.q9_comment,
          q10Score: row.q10_score,
          q10Comment: row.q10_comment,
          q11Score: row.q11_score,
          q11Comment: row.q11_comment,
          q12Score: row.q12_score,
          q12Comment: row.q12_comment,
          q13Score: row.q13_score,
          q13Comment: row.q13_comment,
          q14Score: row.q14_score,
          q14Comment: row.q14_comment,
          overallRisk: row.overall_risk,
          updatedAt: row.updated_at
        };
      });

      res.json({ assessments });

    } catch (error) {
      logger.error('Get assessment streams error:', error);
      res.status(500).json({ error: 'Failed to load assessment streams' });
    }
  }
);

// Save assessment stream
router.post('/assessment/:organizationId',
  requireAuth,
  requireEmailVerified,
  requireAdminRole,
  validateSchema(AssessmentStreamSchema),
  auditLog('save_assessment_stream'),
  async (req, res) => {
    try {
      const { organizationId } = req.params;
      const assessmentData = req.validatedData;

      await db.pool.query(
        `INSERT INTO assessment_streams (
           organization_id, stream, q1_score, q1_comment, q2_score, q2_comment,
           q3_score, q3_comment, q4_score, q4_comment, q5_score, q5_comment,
           q6_score, q6_comment, q7_score, q7_comment, q8_score, q8_comment,
           q9_score, q9_comment, q10_score, q10_comment, q11_score, q11_comment,
           q12_score, q12_comment, q13_score, q13_comment, q14_score, q14_comment,
           overall_risk
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31)
         ON CONFLICT (organization_id, stream)
         DO UPDATE SET
           q1_score = EXCLUDED.q1_score, q1_comment = EXCLUDED.q1_comment,
           q2_score = EXCLUDED.q2_score, q2_comment = EXCLUDED.q2_comment,
           q3_score = EXCLUDED.q3_score, q3_comment = EXCLUDED.q3_comment,
           q4_score = EXCLUDED.q4_score, q4_comment = EXCLUDED.q4_comment,
           q5_score = EXCLUDED.q5_score, q5_comment = EXCLUDED.q5_comment,
           q6_score = EXCLUDED.q6_score, q6_comment = EXCLUDED.q6_comment,
           q7_score = EXCLUDED.q7_score, q7_comment = EXCLUDED.q7_comment,
           q8_score = EXCLUDED.q8_score, q8_comment = EXCLUDED.q8_comment,
           q9_score = EXCLUDED.q9_score, q9_comment = EXCLUDED.q9_comment,
           q10_score = EXCLUDED.q10_score, q10_comment = EXCLUDED.q10_comment,
           q11_score = EXCLUDED.q11_score, q11_comment = EXCLUDED.q11_comment,
           q12_score = EXCLUDED.q12_score, q12_comment = EXCLUDED.q12_comment,
           q13_score = EXCLUDED.q13_score, q13_comment = EXCLUDED.q13_comment,
           q14_score = EXCLUDED.q14_score, q14_comment = EXCLUDED.q14_comment,
           overall_risk = EXCLUDED.overall_risk,
           updated_at = CURRENT_TIMESTAMP`,
        [
          organizationId, assessmentData.stream,
          assessmentData.q1Score, assessmentData.q1Comment,
          assessmentData.q2Score, assessmentData.q2Comment,
          assessmentData.q3Score, assessmentData.q3Comment,
          assessmentData.q4Score, assessmentData.q4Comment,
          assessmentData.q5Score, assessmentData.q5Comment,
          assessmentData.q6Score, assessmentData.q6Comment,
          assessmentData.q7Score, assessmentData.q7Comment,
          assessmentData.q8Score, assessmentData.q8Comment,
          assessmentData.q9Score, assessmentData.q9Comment,
          assessmentData.q10Score, assessmentData.q10Comment,
          assessmentData.q11Score, assessmentData.q11Comment,
          assessmentData.q12Score, assessmentData.q12Comment,
          assessmentData.q13Score, assessmentData.q13Comment,
          assessmentData.q14Score, assessmentData.q14Comment,
          assessmentData.overallRisk
        ]
      );

      res.json({ message: 'Assessment stream saved successfully' });

    } catch (error) {
      logger.error('Save assessment stream error:', error);
      res.status(500).json({ error: 'Failed to save assessment stream' });
    }
  }
);

module.exports = router;
