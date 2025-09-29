const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/database');
const { validateSchema } = require('../validators/onboarding');
const { 
  RegisterSchema, 
  LoginSchema, 
  VerifyEmailSchema 
} = require('../validators/onboarding');
const { 
  sendVerificationEmail 
} = require('../services/emailService');
const { 
  createRegistrationLimiter, 
  createEmailVerificationLimiter,
  auditLog 
} = require('../middleware/onboarding');

const router = express.Router();

// Register new partner
router.post('/register', 
  createRegistrationLimiter,
  validateSchema(RegisterSchema),
  auditLog('partner_register'),
  async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.validatedData;

      // Check if user already exists
      const existingUser = await db.pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Start transaction
      const client = await db.pool.connect();
      try {
        await client.query('BEGIN');

        // Create user
        const userResult = await client.query(
          `INSERT INTO users (email, password_hash, first_name, last_name)
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [email.toLowerCase(), passwordHash, firstName, lastName]
        );

        const userId = userResult.rows[0].id;

        // Create organization with attachments_pending status (after email verification)
        const orgResult = await client.query(
          `INSERT INTO organizations (owner_user_id, status)
           VALUES ($1, 'email_pending') RETURNING id`,
          [userId]
        );

        const organizationId = orgResult.rows[0].id;

        // Link user to organization to enable SSoT repository lookups
        await client.query(
          `UPDATE users SET organization_id = $1 WHERE id = $2`,
          [organizationId, userId]
        );

        // Create owner role
        await client.query(
          `INSERT INTO org_roles (organization_id, user_id, role)
           VALUES ($1, $2, 'owner')`,
          [organizationId, userId]
        );

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await client.query(
          `INSERT INTO email_verifications (user_id, token, expires_at)
           VALUES ($1, $2, $3)`,
          [userId, verificationToken, expiresAt]
        );

        await client.query('COMMIT');

        // Send verification email
        await sendVerificationEmail(email, firstName, verificationToken);

        res.status(201).json({
          message: 'Registration successful. Please check your email to verify your account.',
          userId,
          organizationId
        });

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

// Login
router.post('/login',
  validateSchema(LoginSchema),
  auditLog('partner_login'),
  async (req, res) => {
    try {
      const { email, password } = req.validatedData;

      // Get user with organization info
      const userResult = await db.pool.query(
        `SELECT u.id, u.email, u.password_hash, u.first_name, u.last_name, u.email_verified_at, u.role, u.organization_id,
                o.id as org_id, o.status as organization_status, o.name as organization_name
         FROM users u
         LEFT JOIN organizations o ON u.organization_id = o.id
         WHERE u.email = $1`,
        [email.toLowerCase()]
      );

      if (userResult.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = userResult.rows[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT token with canonical role
      const role = 'partner_user'; // All onboarding users are partner_user
      const token = jwt.sign(
        { 
          sub: user.id,
          role,
          organization_id: user.organization_id
        },
        process.env.JWT_SECRET,
        { expiresIn: '12h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role || role,
          email_verified: !!user.email_verified_at,
          organization_id: user.organization_id
        },
        organization: user.organization_id ? {
          id: user.organization_id,
          name: user.organization_name,
          status: user.organization_status
        } : null
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

// Verify email
router.get('/verify',
  validateSchema(VerifyEmailSchema),
  auditLog('email_verify'),
  async (req, res) => {
    try {
      const { token } = req.query;

      // Find verification record
      const verificationResult = await db.pool.query(
        `SELECT ev.user_id, ev.expires_at, u.first_name, u.email
         FROM email_verifications ev
         JOIN users u ON u.id = ev.user_id
         WHERE ev.token = $1`,
        [token]
      );

      if (verificationResult.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid verification token' });
      }

      const verification = verificationResult.rows[0];

      // Check if token expired
      if (new Date() > new Date(verification.expires_at)) {
        return res.status(400).json({ error: 'Verification token expired' });
      }

      // Start transaction
      const client = await db.pool.connect();
      try {
        await client.query('BEGIN');

        // Mark email as verified
        await client.query(
          'UPDATE users SET email_verified_at = CURRENT_TIMESTAMP WHERE id = $1',
          [verification.user_id]
        );

        // Update organization status to a_pending (new linear flow)
        await client.query(
          'UPDATE organizations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE owner_user_id = $2',
          ['a_pending', verification.user_id]
        );

        // Delete verification token
        await client.query(
          'DELETE FROM email_verifications WHERE token = $1',
          [token]
        );

        await client.query('COMMIT');

        // Redirect to onboarding section A (new linear flow start)
        const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/onboarding/section-a?verified=true`;
        res.redirect(redirectUrl);

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({ error: 'Email verification failed' });
    }
  }
);

// Resend verification email
router.post('/resend-verification',
  createEmailVerificationLimiter,
  validateSchema(LoginSchema), // Reuse login schema for email/password
  auditLog('resend_verification'),
  async (req, res) => {
    try {
      const { email, password } = req.validatedData;

      // Verify user credentials
      const userResult = await db.pool.query(
        'SELECT id, password_hash, first_name, email_verified_at FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (userResult.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = userResult.rows[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check if already verified
      if (user.email_verified_at) {
        return res.status(400).json({ error: 'Email already verified' });
      }

      // Delete existing verification tokens
      await db.pool.query(
        'DELETE FROM email_verifications WHERE user_id = $1',
        [user.id]
      );

      // Generate new verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await db.pool.query(
        `INSERT INTO email_verifications (user_id, token, expires_at)
         VALUES ($1, $2, $3)`,
        [user.id, verificationToken, expiresAt]
      );

      // Send verification email
      await sendVerificationEmail(email, user.first_name, verificationToken);

      res.json({
        message: 'Verification email sent. Please check your inbox.'
      });

    } catch (error) {
      console.error('Resend verification error:', error);
      res.status(500).json({ error: 'Failed to resend verification email' });
    }
  }
);

module.exports = router;
