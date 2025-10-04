const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/onboarding');
const db = require('../config/database');
const logger = require('../utils/logger');

// Test endpoint to verify authentication and user data
router.get('/user/profile/test', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.sub || req.auth.user_id;
    logger.info('Profile test endpoint - User ID:', userId);
    logger.info('Profile test endpoint - Auth object:', req.auth);
    logger.info('Profile test endpoint - User object:', req.user);
    
    const result = await db.pool.query(
      'SELECT id, email, first_name, last_name, phone, role FROM users WHERE id = $1',
      [userId]
    );
    
    logger.info('Profile test endpoint - Query result:', result.rows);
    
    res.json({
      message: 'Profile test successful',
      userId,
      auth: req.auth,
      user: req.user,
      dbUser: result.rows[0] || null
    });
  } catch (error) {
    logger.error('Profile test endpoint error:', error);
    res.status(500).json({ error: 'Test failed', details: error.message });
  }
});

// Update user profile
router.put('/user/profile', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.sub || req.auth.user_id;
    const { first_name, last_name, email, phone } = req.body;

    logger.info('User profile update request:', { userId, first_name, last_name, email, phone });

    // Validate user ID
    if (!userId) {
      logger.info('No user ID found in auth token');
      return res.status(401).json({ error: 'User ID not found in authentication token' });
    }

    // Ensure phone column exists in users table
    try {
      await db.pool.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS phone VARCHAR(20)
      `);
      logger.info('Phone column ensured for user profile update');
    } catch (error) {
      logger.info('Phone column might already exist:', error.message);
    }

    // Validate required fields
    if (!first_name || !last_name || !email) {
      return res.status(400).json({ error: 'First name, last name, and email are required' });
    }

    // Check if email is already taken by another user
    if (email) {
      const emailCheck = await db.pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, userId]
      );
      
      if (emailCheck.rows.length > 0) {
        return res.status(409).json({ error: 'Email is already taken by another user' });
      }
    }

    // Update user profile
    logger.info('Executing user update query with params:', [first_name, last_name, email, phone, userId]);
    
    const result = await db.pool.query(
      `UPDATE users 
       SET first_name = $1, last_name = $2, email = $3, phone = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, email, first_name, last_name, phone, role, organization_id, email_verified_at, created_at, updated_at`,
      [first_name, last_name, email, phone, userId]
    );

    logger.info('User update query result:', result.rows);

    if (result.rows.length === 0) {
      logger.info('No user found with ID:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    logger.info('User profile updated successfully:', user);

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        role: user.role,
        organization_id: user.organization_id,
        email_verified: !!user.email_verified_at,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    });

  } catch (error) {
    logger.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Update organization profile
router.put('/organization/profile', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.sub || req.auth.user_id;
    
    // Get user's organization and check status
    const userResult = await db.pool.query(
      `SELECT u.organization_id, o.status 
       FROM users u 
       LEFT JOIN organizations o ON o.id = u.organization_id 
       WHERE u.id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { organization_id: organizationId, status: orgStatus } = userResult.rows[0];
    if (!organizationId) {
      return res.status(400).json({ error: 'User is not associated with an organization' });
    }

    // Prevent updates if onboarding is finalized
    if (orgStatus === 'finalized') {
      return res.status(403).json({ 
        error: 'Organization profile cannot be modified after onboarding is finalized',
        code: 'ORGANIZATION_FINALIZED'
      });
    }

    // Extract organization data from request
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

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Organization name is required' });
    }

    // Ensure all columns exist before updating
    try {
      await db.pool.query(`
        ALTER TABLE organizations 
        ADD COLUMN IF NOT EXISTS year_established INTEGER,
        ADD COLUMN IF NOT EXISTS bank_name TEXT,
        ADD COLUMN IF NOT EXISTS bank_branch TEXT,
        ADD COLUMN IF NOT EXISTS account_name TEXT,
        ADD COLUMN IF NOT EXISTS account_number TEXT,
        ADD COLUMN IF NOT EXISTS swift_code TEXT,
        ADD COLUMN IF NOT EXISTS primary_contact_name TEXT,
        ADD COLUMN IF NOT EXISTS primary_contact_title TEXT,
        ADD COLUMN IF NOT EXISTS primary_contact_email TEXT,
        ADD COLUMN IF NOT EXISTS primary_contact_phone TEXT
      `);
      logger.info('Organization columns ensured for profile update');
    } catch (error) {
      logger.info('Organization columns might already exist:', error.message);
    }

    // Update organization
    const result = await db.pool.query(
      `UPDATE organizations 
       SET name = $1, legal_name = $2, registration_number = $3, tax_id = $4, 
           legal_structure = $5, year_established = $6, email = $7, phone = $8, 
           website = $9, address = $10, city = $11, state_province = $12, 
           postal_code = $13, country = $14, bank_name = $15, bank_branch = $16,
           account_name = $17, account_number = $18, swift_code = $19,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $20
       RETURNING *`,
      [
        name, legal_name, registration_number, tax_id, legal_structure,
        year_established, email, phone, website, address, city, state_province,
        postal_code, country, bank_name, bank_branch, account_name, account_number,
        swift_code, organizationId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const organization = result.rows[0];

    res.json({
      message: 'Organization profile updated successfully',
      organization: {
        id: organization.id,
        name: organization.name,
        legal_name: organization.legal_name,
        registration_number: organization.registration_number,
        tax_id: organization.tax_id,
        legal_structure: organization.legal_structure,
        year_established: organization.year_established,
        email: organization.email,
        phone: organization.phone,
        website: organization.website,
        address: organization.address,
        city: organization.city,
        state_province: organization.state_province,
        postal_code: organization.postal_code,
        country: organization.country,
        bank_name: organization.bank_name,
        bank_branch: organization.bank_branch,
        account_name: organization.account_name,
        account_number: organization.account_number,
        swift_code: organization.swift_code,
        status: organization.status,
        created_at: organization.created_at,
        updated_at: organization.updated_at
      }
    });

  } catch (error) {
    logger.error('Error updating organization profile:', error);
    res.status(500).json({ error: 'Failed to update organization profile' });
  }
});

module.exports = router;
