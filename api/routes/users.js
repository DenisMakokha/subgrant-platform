const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Organization = require('../models/organization');

// Create a new user
router.post('/', async (req, res) => {
  try {
    const userData = req.body;
    
    // Validate required fields
    if (!userData.email || !userData.password || !userData.first_name || !userData.last_name || !userData.role) {
      return res.status(400).json({ error: 'Email, password, first name, last name, and role are required' });
    }

    // Check if organization exists (if provided)
    if (userData.organization_id) {
      const organization = await Organization.findById(userData.organization_id);
      if (!organization) {
        return res.status(400).json({ error: 'Organization not found' });
      }
    }

    // Create the user
    const user = await User.create(userData);
    
    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        organization_id: user.organization_id,
        status: user.status,
        mfa_enabled: user.mfa_enabled,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    });
  } catch (error) {
    if (error.message === 'User with this email already exists') {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.findAll();
    res.status(200).json(users.map(user => ({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      organization_id: user.organization_id,
      status: user.status,
      mfa_enabled: user.mfa_enabled,
      last_login: user.last_login,
      created_at: user.created_at,
      updated_at: user.updated_at
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(200).json({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      organization_id: user.organization_id,
      status: user.status,
      mfa_enabled: user.mfa_enabled,
      last_login: user.last_login,
      created_at: user.created_at,
      updated_at: user.updated_at
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get users by organization
router.get('/organization/:organizationId', async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    // Check if organization exists
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    const users = await User.findByOrganization(organizationId);
    res.status(200).json(users.map(user => ({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      organization_id: user.organization_id,
      status: user.status,
      mfa_enabled: user.mfa_enabled,
      last_login: user.last_login,
      created_at: user.created_at,
      updated_at: user.updated_at
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.password_hash;
    
    // Update the user
    const user = await User.update(id, updateData);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(200).json({
      message: 'User updated successfully',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        organization_id: user.organization_id,
        status: user.status,
        mfa_enabled: user.mfa_enabled,
        last_login: user.last_login,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete the user
    const user = await User.delete(id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(200).json({
      message: 'User deleted successfully',
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
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;