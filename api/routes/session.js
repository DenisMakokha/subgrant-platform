// routes/session.js
const express = require('express');
const { requireAuth } = require('../middleware/onboarding');
const { nextStepFrom } = require('../services/orgStateMachine');
const { getPartnerSummaries } = require('../services/partnerSummaries');
const { getReviewerSummaries } = require('../services/reviewerSummaries');
const { normalizeRole } = require('../shared/constants/roles');
const db = require('../config/database');
const logger = require('../utils/logger');
const { ORG_STATUS } = require('../shared/constants/orgStatus');

const router = express.Router();

router.get('/session', requireAuth, async (req, res) => {
  try {
    // Ensure phone column exists in users table
    try {
      await db.pool.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS phone VARCHAR(20)
      `);
    } catch (error) {
      logger.info('Phone column might already exist:', error.message);
    }

    // Get user with organization info
    const userResult = await db.pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.role, u.email_verified_at,
              u.organization_id, u.created_at, o.id as org_id, o.status as organization_status
       FROM users u
       LEFT JOIN organizations o ON o.id = u.organization_id
       WHERE u.id = $1`,
      [req.auth.sub || req.auth.user_id]
    );

    const user = userResult.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Normalize role to canonical vocabulary
    const role = normalizeRole(user.role);
    
    // Get organization data if user has one
    let org = null;
    let status = null;
    if (user.organization_id) {
      // First ensure all missing columns exist (CRITICAL POLICY)
      try {
        await db.pool.query(`
          ALTER TABLE organizations 
          ADD COLUMN IF NOT EXISTS year_established INTEGER,
          ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES users(id),
          ADD COLUMN IF NOT EXISTS bank_name TEXT,
          ADD COLUMN IF NOT EXISTS bank_branch TEXT,
          ADD COLUMN IF NOT EXISTS account_name TEXT,
          ADD COLUMN IF NOT EXISTS account_number TEXT,
          ADD COLUMN IF NOT EXISTS swift_code TEXT,
          ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 0
        `);
        logger.info('Missing organization columns created/verified');
      } catch (error) {
        logger.info('Organization columns might already exist:', error.message);
      }

      const orgResult = await db.pool.query(
        `SELECT id, version, name, legal_name, registration_number, tax_id, legal_structure, year_established,
                email, phone, website, primary_contact_name, primary_contact_title, 
                primary_contact_email, primary_contact_phone, address, city, state_province, 
                postal_code, country, bank_name, bank_branch, account_name, account_number, 
                swift_code, status, owner_user_id, created_at, updated_at 
         FROM organizations WHERE id = $1`,
        [user.organization_id]
      );
      org = orgResult.rows[0];
      status = org?.status || ORG_STATUS.EMAIL_PENDING;

      // Ensure owner_user_id is set correctly
      if (org && !org.owner_user_id) {
        try {
          await db.pool.query(
            'UPDATE organizations SET owner_user_id = $1 WHERE id = $2',
            [user.id, org.id]
          );
          org.owner_user_id = user.id;
          logger.info('Updated organization owner_user_id');
        } catch (error) {
          logger.error('Failed to update organization owner_user_id:', error);
        }
      }

      // Get financial assessment data for Section B
      if (org) {
        // First ensure financial_assessments table exists
        try {
          await db.pool.query(`
            CREATE TABLE IF NOT EXISTS financial_assessments (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
              current_annual_budget_amount_usd DECIMAL(18,2),
              current_annual_budget_year INTEGER,
              next_year_annual_budget_estimate_amount_usd DECIMAL(18,2),
              next_year_annual_budget_estimate_year INTEGER,
              largest_grant_ever_managed_amount_usd DECIMAL(18,2),
              largest_grant_ever_managed_year INTEGER,
              current_donor_funding_amount_usd DECIMAL(18,2),
              current_donor_funding_year INTEGER,
              other_funds_amount_usd DECIMAL(18,2),
              other_funds_year INTEGER,
              submitted_at TIMESTAMP NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              UNIQUE(organization_id)
            )
          `);
          
          // Ensure unique constraint exists for ON CONFLICT to work
          await db.pool.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_financial_assessments_org_id 
            ON financial_assessments(organization_id)
          `);
          logger.info('Financial assessments table created/verified');
        } catch (error) {
          logger.info('Financial assessments table might already exist:', error.message);
        }

        // Now safely query the financial assessment data
        try {
          const financialResult = await db.pool.query(
            `SELECT current_annual_budget_amount_usd, current_annual_budget_year,
                    next_year_annual_budget_estimate_amount_usd, next_year_annual_budget_estimate_year,
                    largest_grant_ever_managed_amount_usd, largest_grant_ever_managed_year,
                    current_donor_funding_amount_usd, current_donor_funding_year,
                    other_funds_amount_usd, other_funds_year
             FROM financial_assessments WHERE organization_id = $1 
             ORDER BY updated_at DESC LIMIT 1`,
            [org.id]
          );
          
          if (financialResult.rows.length > 0) {
            const financial = financialResult.rows[0];
            org.financial_assessment = {
              currentAnnualBudget: {
                amountUsd: financial.current_annual_budget_amount_usd,
                year: financial.current_annual_budget_year
              },
              nextYearAnnualBudgetEstimate: {
                amountUsd: financial.next_year_annual_budget_estimate_amount_usd,
                year: financial.next_year_annual_budget_estimate_year
              },
              largestGrantEverManaged: {
                amountUsd: financial.largest_grant_ever_managed_amount_usd,
                year: financial.largest_grant_ever_managed_year
              },
              currentDonorFunding: {
                amountUsd: financial.current_donor_funding_amount_usd,
                year: financial.current_donor_funding_year
              },
              otherFunds: {
                amountUsd: financial.other_funds_amount_usd,
                year: financial.other_funds_year
              }
            };
          }
        } catch (error) {
          logger.error('Error querying financial assessments:', error);
        }

        // Create Section C document tables
        try {
          // Create document_category enum
          await db.pool.query(`
            DO $$ BEGIN
              CREATE TYPE document_category AS ENUM (
                'legal',
                'governance', 
                'financial',
                'operational',
                'compliance',
                'additional'
              );
            EXCEPTION
              WHEN duplicate_object THEN null;
            END $$;
          `);

          // Create document_requirements table
          await db.pool.query(`
            CREATE TABLE IF NOT EXISTS document_requirements (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              code VARCHAR(100) UNIQUE NOT NULL,
              name VARCHAR(255) NOT NULL,
              title VARCHAR(255) NOT NULL,
              description TEXT,
              category document_category NOT NULL,
              is_required BOOLEAN DEFAULT true,
              is_optional BOOLEAN DEFAULT false,
              is_active BOOLEAN DEFAULT true,
              file_types VARCHAR(255) DEFAULT 'pdf,doc,docx,jpg,jpeg,png',
              max_file_size_mb INTEGER DEFAULT 10,
              sort_order INTEGER DEFAULT 0,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);
          
          // Add missing columns if table already exists
          await db.pool.query(`
            ALTER TABLE document_requirements 
            ADD COLUMN IF NOT EXISTS code VARCHAR(100),
            ADD COLUMN IF NOT EXISTS title VARCHAR(255),
            ADD COLUMN IF NOT EXISTS is_optional BOOLEAN DEFAULT false,
            ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true
          `);

          // Create org_documents table
          await db.pool.query(`
            CREATE TABLE IF NOT EXISTS org_documents (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
              requirement_id UUID NOT NULL REFERENCES document_requirements(id) ON DELETE CASCADE,
              file_name VARCHAR(255) NOT NULL,
              file_path VARCHAR(500) NOT NULL,
              file_size INTEGER,
              mime_type VARCHAR(100),
              uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              status VARCHAR(50) DEFAULT 'pending',
              review_notes TEXT,
              reviewed_at TIMESTAMP,
              reviewed_by UUID,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              UNIQUE(organization_id, requirement_id)
            )
          `);

          logger.info('Section C document tables created/verified');
        } catch (error) {
          logger.error('Error creating Section C tables:', error);
        }
      }
    }

    // Get next step based on organization status
    const next_step = nextStepFrom(status);
    
    // Calculate onboarding locked status for partners
    const onboarding_locked = role === 'partner_user' && status !== ORG_STATUS.FINALIZED;
    
    // Get partner module summaries if user has an organization
    const summaries = org ? await getPartnerSummaries(org.id) : null;
    
    // Get reviewer summaries for GM/COO roles
    const reviewSummaries = (role === 'grants_manager' || role === 'chief_operations_officer')
      ? await getReviewerSummaries(role) : null;

    res.json({
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        firstName: user.first_name, // Also provide camelCase for compatibility
        lastName: user.last_name,
        role,
        email_verified: !!user.email_verified_at,
        email_verified_at: user.email_verified_at,
        organization_id: user.organization_id,
        created_at: user.created_at
      },
      organization: org,
      next_step,
      onboarding_locked,
      modules: {
        onboarding: { status, next_step },
        applications: summaries?.applications ?? { drafts: 0, submitted: 0, under_review: 0, approved: 0, rejected: 0 },
        compliance: summaries?.compliance ?? { required: 0, submitted: 0, approved: 0, rejected: 0, expiring_soon: 0 },
        me_reports: summaries?.me ?? { due: 0, upcoming: 0, submitted_this_quarter: 0 },
        disbursements: summaries?.disbursements ?? { upcoming: 0, paid: 0 },
        contracts: summaries?.contracts ?? { pending_signature: 0, active: 0, ending_soon: 0 },
        messages: summaries?.messages ?? { unread: 0 },
        reviewer: reviewSummaries ?? undefined
      }
    });

  } catch (error) {
    logger.error('Session error:', error);
    res.status(500).json({ error: 'Failed to get session' });
  }
});

module.exports = router;
