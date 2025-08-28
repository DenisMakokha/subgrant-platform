const express = require('express');
const router = express.Router();
const AuthService = require('../services/authService');
const User = require('../models/user');

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const userData = req.body;
    
    // Validate required fields
    if (!userData.email || !userData.password || !userData.first_name || !userData.last_name) {
      return res.status(400).json({ error: 'Email, password, first name, and last name are required' });
    }

    // Register the user
    const user = await AuthService.register(userData);
    
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        organization_id: user.organization_id
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

// Logout user
router.post('/logout', (req, res) => {
  // In a stateless JWT implementation, logout is handled on the client side
  // by deleting the token. However, we can still provide an endpoint for
  // client-side consistency.
  res.status(200).json({ message: 'Logged out successfully' });
});

module.exports = router;