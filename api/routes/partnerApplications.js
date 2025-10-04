const express = require('express');
const { requireAuth, requireEmailVerified, getUserOrganization, requireOrgOwnership } = require('../middleware/onboarding');
const db = require('../config/database');
const logger = require('../utils/logger');

const router = express.Router();

// Guard stack for all partner application routes
const guard = [requireAuth, requireEmailVerified, getUserOrganization, requireOrgOwnership];

// List applications for organization
router.get('/', ...guard, async (req, res) => {
  try {
    const result = await db.pool.query(
      `SELECT id, title, description, status, amount_requested, created_at, updated_at, submitted_at
       FROM applications 
       WHERE organization_id = $1 
       ORDER BY created_at DESC`,
      [req.userOrganization.id]
    );
    
    res.json({ applications: result.rows });
  } catch (error) {
    logger.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Create new draft application
router.post('/', ...guard, async (req, res) => {
  try {
    const { title, description, amount_requested } = req.body;
    
    const result = await db.pool.query(
      `INSERT INTO applications (organization_id, title, description, amount_requested, status, created_by)
       VALUES ($1, $2, $3, $4, 'draft', $5)
       RETURNING id, title, description, status, amount_requested, created_at`,
      [req.userOrganization.id, title, description, amount_requested, req.user.id]
    );
    
    res.status(201).json({ application: result.rows[0] });
  } catch (error) {
    logger.error('Error creating application:', error);
    res.status(500).json({ error: 'Failed to create application' });
  }
});

// Update draft application
router.put('/:id', ...guard, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, amount_requested } = req.body;
    
    // Verify application belongs to organization and is still draft
    const checkResult = await db.pool.query(
      'SELECT status FROM applications WHERE id = $1 AND organization_id = $2',
      [id, req.userOrganization.id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    if (checkResult.rows[0].status !== 'draft') {
      return res.status(400).json({ error: 'Can only update draft applications' });
    }
    
    const result = await db.pool.query(
      `UPDATE applications 
       SET title = $1, description = $2, amount_requested = $3, updated_at = NOW()
       WHERE id = $4 AND organization_id = $5
       RETURNING id, title, description, status, amount_requested, updated_at`,
      [title, description, amount_requested, id, req.userOrganization.id]
    );
    
    res.json({ application: result.rows[0] });
  } catch (error) {
    logger.error('Error updating application:', error);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

// Submit application for review
router.post('/:id/submit', ...guard, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify application belongs to organization and is draft
    const checkResult = await db.pool.query(
      'SELECT status FROM applications WHERE id = $1 AND organization_id = $2',
      [id, req.userOrganization.id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    if (checkResult.rows[0].status !== 'draft') {
      return res.status(400).json({ error: 'Can only submit draft applications' });
    }
    
    const result = await db.pool.query(
      `UPDATE applications 
       SET status = 'submitted', submitted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND organization_id = $2
       RETURNING id, title, status, submitted_at`,
      [id, req.userOrganization.id]
    );
    
    res.json({ application: result.rows[0] });
  } catch (error) {
    logger.error('Error submitting application:', error);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

module.exports = router;
