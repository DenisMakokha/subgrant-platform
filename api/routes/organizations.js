const express = require('express');
const router = express.Router();
const Organization = require('../models/organization');

// Create a new organization
router.post('/', async (req, res) => {
  try {
    const organizationData = req.body;
    
    // Validate required fields
    if (!organizationData.name || !organizationData.email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Create the organization
    const organization = await Organization.create(organizationData);
    
    res.status(201).json({
      message: 'Organization created successfully',
      organization
    });
  } catch (error) {
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