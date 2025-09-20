/**
 * Partner Onboarding Routes
 * Handles the A→B→C→Submit onboarding flow
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../../config/database');

const router = express.Router();

// Organization status constants
const ORG_STATUS = {
  EMAIL_PENDING: 'email_pending',
  A_PENDING: 'a_pending',
  B_PENDING: 'b_pending', 
  C_PENDING: 'c_pending',
  UNDER_REVIEW: 'under_review',
  FINALIZED: 'finalized'
};

// Get onboarding progress
router.get('/progress/:organizationId', async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    // Verify user owns this organization
    if (req.org.id !== organizationId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const result = await db.pool.query(
      'SELECT status, completed_steps FROM organizations WHERE id = $1',
      [organizationId]
    );
    
    const org = result.rows[0];
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    res.json({
      status: org.status,
      completedSteps: org.completed_steps || [],
      nextStep: getNextOnboardingStep(org.status)
    });
    
  } catch (error) {
    console.error('Get onboarding progress error:', error);
    res.status(500).json({ error: 'Failed to get onboarding progress' });
  }
});

// Save onboarding progress
router.put('/progress/:organizationId', async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { completedSteps } = req.body;
    
    // Verify user owns this organization
    if (req.org.id !== organizationId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await db.pool.query(
      'UPDATE organizations SET completed_steps = $1 WHERE id = $2',
      [JSON.stringify(completedSteps), organizationId]
    );
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Save onboarding progress error:', error);
    res.status(500).json({ error: 'Failed to save onboarding progress' });
  }
});

// Section A - Organization Profile
router.post('/section-a', async (req, res) => {
  try {
    console.log('=== SECTION A ENDPOINT HIT ===');
    console.log('req.user:', req.user);
    console.log('Request body:', req.body);
    console.log('Headers:', req.headers.authorization);
    
    // Get organization ID from user's organization_id field
    let userId = req.user?.id || req.user?.sub;
    console.log('Extracted userId from req.user:', userId);
    
    // If no user from middleware, try to decode JWT manually
    if (!userId) {
      console.log('No user from middleware, trying manual JWT decode...');
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
          userId = decoded.id || decoded.sub;
          console.log('Manual JWT decode successful, userId:', userId);
        } catch (jwtError) {
          console.log('Manual JWT decode failed:', jwtError.message);
        }
      }
    }
    
    if (!userId) {
      console.log('No userId found after all attempts');
      return res.status(401).json({ error: 'User authentication required' });
    }
    
    // Get user's organization_id from database
    console.log('Querying for user organization...');
    const userResult = await db.pool.query(
      'SELECT organization_id FROM users WHERE id = $1',
      [userId]
    );
    
    console.log('User query result:', userResult.rows);
    const orgId = userResult.rows[0]?.organization_id;
    console.log('Found orgId:', orgId);
    
    if (!orgId) {
      console.log('No organization found for user');
      return res.status(400).json({ 
        error: 'No organization found for user. Please create an organization first.',
        userId: userId,
        userFound: userResult.rows.length > 0
      });
    }
    const {
      name,
      legal_name,
      registration_number,
      tax_id,
      legal_structure,
      year_established,
      email,
      phone,
      website,
      primary_contact_name,
      primary_contact_title,
      primary_contact_email,
      primary_contact_phone,
      address,
      city,
      state_province,
      postal_code,
      country,
      bank_name,
      bank_branch,
      account_name,
      account_number,
      swift_code
    } = req.body;
    
    // First, ensure the year_established column exists
    try {
      await db.pool.query(`
        ALTER TABLE organizations 
        ADD COLUMN IF NOT EXISTS year_established INTEGER
      `);
    } catch (error) {
      console.log('Column year_established might already exist:', error.message);
    }

    // Update organization with Section A data including banking information
    await db.pool.query(`
      UPDATE organizations SET 
        name = $1,
        legal_name = $2,
        registration_number = $3,
        tax_id = $4,
        legal_structure = $5,
        year_established = $6,
        email = $7,
        phone = $8,
        website = $9,
        primary_contact_name = $10,
        primary_contact_title = $11,
        primary_contact_email = $12,
        primary_contact_phone = $13,
        address = $14,
        city = $15,
        state_province = $16,
        postal_code = $17,
        country = $18,
        bank_name = $19,
        bank_branch = $20,
        account_name = $21,
        account_number = $22,
        swift_code = $23,
        status = $24,
        updated_at = NOW()
      WHERE id = $25
    `, [
      name, legal_name, registration_number, tax_id, legal_structure,
      year_established, email, phone, website, primary_contact_name,
      primary_contact_title, primary_contact_email, primary_contact_phone,
      address, city, state_province, postal_code, country,
      bank_name, bank_branch, account_name, account_number, swift_code,
      ORG_STATUS.B_PENDING, // Progress to Section B
      orgId
    ]);
    
    res.json({ 
      success: true, 
      nextStep: 'section-b',
      status: ORG_STATUS.B_PENDING
    });
    
  } catch (error) {
    console.error('Section A save error:', error);
    res.status(500).json({ error: 'Failed to save Section A data' });
  }
});

// Section B - Financial Information
router.post('/section-b', async (req, res) => {
  try {
    const orgId = req.org.id;
    const {
      bank_name,
      bank_account_number,
      bank_routing_number,
      bank_swift_code,
      bank_branch,
      bank_country,
      bank_currency
    } = req.body;
    
    // Update organization with Section B data
    await db.pool.query(`
      UPDATE organizations SET 
        bank_name = $1,
        bank_account_number = $2,
        bank_routing_number = $3,
        bank_swift_code = $4,
        bank_branch = $5,
        bank_country = $6,
        bank_currency = $7,
        status = $8,
        updated_at = NOW()
      WHERE id = $9
    `, [
      bank_name, bank_account_number, bank_routing_number,
      bank_swift_code, bank_branch, bank_country, bank_currency,
      ORG_STATUS.C_PENDING, // Progress to Section C
      orgId
    ]);
    
    res.json({ 
      success: true, 
      nextStep: 'section-c',
      status: ORG_STATUS.C_PENDING
    });
    
  } catch (error) {
    console.error('Section B save error:', error);
    res.status(500).json({ error: 'Failed to save Section B data' });
  }
});

// Section B - Financial Assessment (Direct endpoint like Section A)
router.post('/section-b-financial', async (req, res) => {
  try {
    // Manual JWT decoding (same as Section A)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.sub || decoded.id;

    if (!userId) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    // Get user's organization
    const userResult = await db.pool.query(
      'SELECT organization_id FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const orgId = userResult.rows[0].organization_id;
    if (!orgId) {
      return res.status(400).json({ error: 'No organization found for user' });
    }

    const {
      currentAnnualBudget,
      nextYearAnnualBudgetEstimate,
      largestGrantEverManaged,
      currentDonorFunding,
      otherFunds
    } = req.body;

    console.log('Section B Financial - Received data:', req.body);

    // Upsert financial assessment data
    await db.pool.query(`
      INSERT INTO financial_assessments (
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
        updated_at = CURRENT_TIMESTAMP
    `, [
      orgId,
      currentAnnualBudget?.amountUsd || 0,
      currentAnnualBudget?.year || new Date().getFullYear(),
      nextYearAnnualBudgetEstimate?.amountUsd || 0,
      nextYearAnnualBudgetEstimate?.year || new Date().getFullYear() + 1,
      largestGrantEverManaged?.amountUsd || 0,
      largestGrantEverManaged?.year || new Date().getFullYear(),
      currentDonorFunding?.amountUsd || 0,
      currentDonorFunding?.year || new Date().getFullYear(),
      otherFunds?.amountUsd || 0,
      otherFunds?.year || new Date().getFullYear()
    ]);

    // Update organization status to C_PENDING
    await db.pool.query(`
      UPDATE organizations SET 
        status = $1,
        updated_at = NOW()
      WHERE id = $2
    `, [ORG_STATUS.C_PENDING, orgId]);

    console.log('Section B Financial - Successfully saved for org:', orgId);

    res.json({ 
      success: true, 
      nextStep: 'section-c',
      status: ORG_STATUS.C_PENDING
    });
    
  } catch (error) {
    console.error('Section B Financial save error:', error);
    res.status(500).json({ error: 'Failed to save Section B financial data' });
  }
});

// Section C - Compliance Documents
router.post('/section-c', async (req, res) => {
  try {
    const orgId = req.org.id;
    const { documents } = req.body; // Array of uploaded document info
    
    // Update organization with Section C data
    await db.pool.query(`
      UPDATE organizations SET 
        compliance_documents = $1,
        status = $2,
        updated_at = NOW()
      WHERE id = $3
    `, [
      JSON.stringify(documents),
      ORG_STATUS.UNDER_REVIEW, // Progress to Review
      orgId
    ]);
    
    res.json({ 
      success: true, 
      nextStep: 'review',
      status: ORG_STATUS.UNDER_REVIEW
    });
    
  } catch (error) {
    console.error('Section C save error:', error);
    res.status(500).json({ error: 'Failed to save Section C data' });
  }
});

// Submit Application (Final Step)
router.post('/submit', async (req, res) => {
  try {
    const orgId = req.org.id;
    
    // Verify organization is ready for submission
    const orgResult = await db.pool.query(
      'SELECT status FROM organizations WHERE id = $1',
      [orgId]
    );
    
    const org = orgResult.rows[0];
    if (!org || org.status !== ORG_STATUS.UNDER_REVIEW) {
      return res.status(400).json({ 
        error: 'Organization not ready for submission',
        current_status: org?.status
      });
    }
    
    // Submit application - set to finalized (or under_review_gm if using approval flow)
    await db.pool.query(`
      UPDATE organizations SET 
        status = $1,
        submitted_at = NOW(),
        updated_at = NOW()
      WHERE id = $2
    `, [
      ORG_STATUS.FINALIZED, // Direct to finalized, or use UNDER_REVIEW_GM for approval flow
      orgId
    ]);
    
    res.json({ 
      success: true, 
      message: 'Application submitted successfully',
      status: ORG_STATUS.FINALIZED
    });
    
  } catch (error) {
    console.error('Submit application error:', error);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

module.exports = router;
