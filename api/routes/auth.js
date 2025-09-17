const express = require('express');
const router = express.Router();
const AuthService = require('../services/authService');
const User = require('../models/user');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { getDbClient } = require('../config/database');

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const userData = req.body;
    
    // Validate required fields
    if (!userData.email || !userData.password || !userData.first_name || !userData.last_name) {
      return res.status(400).json({ error: 'Email, password, first name, and last name are required' });
    }

    // Set user as unverified with email_pending status
    userData.onboarding_status = 'email_pending';
    userData.email_verified_at = null;

    // Register the user
    const user = await AuthService.register(userData);
    
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Store verification token in database
    const client = getDbClient();
    await client.connect();
    await client.query(
      'INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, verificationToken, expiresAt]
    );
    await client.end();
    
    // Send verification email
    await sendVerificationEmail(user.email, user.first_name, verificationToken);
    
    res.status(201).json({
      message: 'User registered successfully. Please check your email to verify your account.',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        organization_id: user.organization_id,
        onboarding_status: user.onboarding_status
      }
    });
  } catch (error) {
    if (error.message === 'User with this email already exists') {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user exists and get verification status
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if email is verified (only for partner users)
    if (!user.email_verified_at && user.role === 'partner_user') {
      return res.status(403).json({ 
        error: 'Email not verified', 
        message: 'Please verify your email before logging in',
        email: user.email,
        userRole: user.role,
        requiresVerification: true
      });
    }

    // Login the user
    const result = await AuthService.login(email, password);
    
    res.status(200).json(result);
  } catch (error) {
    if (error.message === 'Invalid credentials' || error.message === 'Account is not active') {
      return res.status(401).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// Verify MFA token
router.post('/mfa/verify', async (req, res) => {
  try {
    const { email, token } = req.body;
    
    // Validate required fields
    if (!email || !token) {
      return res.status(400).json({ error: 'Email and token are required' });
    }

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify MFA token
    const result = await AuthService.verifyMFA(user, token);
    
    res.status(200).json(result);
  } catch (error) {
    if (error.message === 'Invalid MFA code') {
      return res.status(401).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// Setup MFA for user
router.post('/mfa/setup', async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Validate required fields
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Setup MFA
    const result = await AuthService.setupMFA(userId);
    
    res.status(200).json(result);
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// Enable MFA for user
router.post('/mfa/enable', async (req, res) => {
  try {
    const { userId, token } = req.body;
    
    // Validate required fields
    if (!userId || !token) {
      return res.status(400).json({ error: 'User ID and token are required' });
    }

    // Enable MFA
    const user = await AuthService.enableMFA(userId, token);
    
    res.status(200).json({
      message: 'MFA enabled successfully',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        organization_id: user.organization_id,
        mfa_enabled: user.mfa_enabled
      }
    });
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'Invalid MFA code') {
      return res.status(401).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// Disable MFA for user
router.post('/mfa/disable', async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Validate required fields
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Disable MFA
    const user = await AuthService.disableMFA(userId);
    
    res.status(200).json({
      message: 'MFA disabled successfully',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        organization_id: user.organization_id,
        mfa_enabled: user.mfa_enabled
      }
    });
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// Verify email
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const client = getDbClient();
    
    await client.connect();
    
    // Find valid token
    const tokenResult = await client.query(
      'SELECT * FROM email_verification_tokens WHERE token = $1 AND expires_at > NOW() AND used_at IS NULL',
      [token]
    );
    
    if (tokenResult.rows.length === 0) {
      await client.end();
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }
    
    const tokenData = tokenResult.rows[0];
    
    // Mark user as verified
    await client.query(
      'UPDATE users SET email_verified_at = NOW(), onboarding_status = $1 WHERE id = $2',
      ['start', tokenData.user_id]
    );
    
    // Mark token as used
    await client.query(
      'UPDATE email_verification_tokens SET used_at = NOW() WHERE id = $1',
      [tokenData.id]
    );
    
    await client.end();
    
    // Redirect to onboarding start
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/onboarding/start?verified=true`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resend verification email
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.email_verified_at) {
      return res.status(400).json({ error: 'Email already verified' });
    }
    
    // Check rate limiting (60 seconds)
    if (user.last_verification_sent_at) {
      const timeDiff = Date.now() - new Date(user.last_verification_sent_at).getTime();
      if (timeDiff < 60000) {
        return res.status(429).json({ 
          error: 'Please wait before requesting another verification email',
          retryAfter: Math.ceil((60000 - timeDiff) / 1000)
        });
      }
    }
    
    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    const client = getDbClient();
    await client.connect();
    
    // Invalidate old tokens
    await client.query(
      'UPDATE email_verification_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL',
      [user.id]
    );
    
    // Create new token
    await client.query(
      'INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, verificationToken, expiresAt]
    );
    
    // Update last sent timestamp
    await client.query(
      'UPDATE users SET last_verification_sent_at = NOW() WHERE id = $1',
      [user.id]
    );
    
    await client.end();
    
    // Send verification email
    await sendVerificationEmail(user.email, user.first_name, verificationToken);
    
    res.status(200).json({ message: 'Verification email sent successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to send verification email
async function sendVerificationEmail(email, firstName, token) {
  const client = getDbClient();
  await client.connect();
  
  // Get SMTP configuration
  const result = await client.query(
    'SELECT enabled, settings FROM integration_settings WHERE integration_type = $1',
    ['custom_smtp']
  );
  
  if (result.rows.length === 0 || !result.rows[0].enabled) {
    await client.end();
    throw new Error('SMTP not configured');
  }
  
  const config = result.rows[0].settings;
  await client.end();
  
  let transporter;
  
  if (config.host === 'smtp.gmail.com') {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.username,
        pass: config.password
      }
    });
  } else {
    transporter = nodemailer.createTransport({
      host: config.host,
      port: parseInt(config.port),
      secure: config.port === '465',
      auth: {
        user: config.username,
        pass: config.password
      },
      tls: {
        rejectUnauthorized: false,
        servername: config.host
      },
      requireTLS: config.port !== '465'
    });
  }
  
  const verificationUrl = `${process.env.API_URL || 'http://localhost:3000'}/api/auth/verify-email/${token}`;
  
  const mailOptions = {
    from: config.from_email,
    to: email,
    subject: 'Verify your SubGrant Platform account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to SubGrant Platform, ${firstName}!</h2>
        <p>Thank you for registering. Please verify your email address to continue with your onboarding.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email & Continue Onboarding
          </a>
        </div>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create this account, please ignore this email.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">SubGrant Platform - Grant Management Made Simple</p>
      </div>
    `
  };
  
  await transporter.sendMail(mailOptions);
}

// Logout user
router.post('/logout', (req, res) => {
  // In a stateless JWT implementation, logout is handled on the client side
  // by deleting the token. However, we can still provide an endpoint for
  // client-side consistency.
  res.status(200).json({ message: 'Logged out successfully' });
});

module.exports = router;