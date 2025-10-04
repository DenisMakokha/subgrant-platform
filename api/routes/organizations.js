const express = require('express');
const router = express.Router();
const Organization = require('../models/organization');
const db = require('../config/database'); // Fix the db import path
const authenticateToken = require('../middleware/auth');
const logger = require('../utils/logger');

// Create a new organization
router.post('/', authenticateToken, async (req, res) => {
  try {
    logger.info('Organization creation request received');
    logger.info('Request body:', req.body);
    logger.info('User from token:', req.user);
    
    const organizationData = req.body;
    const userId = req.user?.id || req.user?.sub;
    
    logger.info('Extracted userId:', userId);
    
    // Validate required fields
    if (!organizationData.name || !organizationData.email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Check if user already has an organization
    if (userId) {
      const existingOrg = await Organization.findByOwnerId(userId);
      if (existingOrg) {
        return res.status(400).json({ error: 'User already has an organization' });
      }
    }

    // Create the organization
    const organization = await Organization.create({
      ...organizationData,
      status: organizationData.status || 'pending',
      created_by: userId,
      updated_by: userId
    });
    
    // Update user's organization_id to link them to this organization
    if (userId) {
      await db.pool.query(
        'UPDATE users SET organization_id = $1 WHERE id = $2',
        [organization.id, userId]
      );
    }
    
    res.status(201).json({
      message: 'Organization created successfully',
      organization
    });
  } catch (error) {
    logger.error('Organization creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all organizations
router.get('/', async (req, res) => {
  try {
    const organizations = await Organization.findAll();
    res.status(200).json(organizations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get organization by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const organization = await Organization.findById(id);
    
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    res.status(200).json(organization);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update organization
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Update the organization
    const organization = await Organization.update(id, updateData);
    
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    res.status(200).json({
      message: 'Organization updated successfully',
      organization
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete organization
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete the organization
    const organization = await Organization.delete(id);
    
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    res.status(200).json({
      message: 'Organization deleted successfully',
      organization
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;