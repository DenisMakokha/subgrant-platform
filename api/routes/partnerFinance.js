const express = require('express');
const { requireAuth, requireEmailVerified, getUserOrganization, requireOrgOwnership } = require('../middleware/onboarding');
const db = require('../config/database');

const router = express.Router();

// Guard stack for all partner finance routes
const guard = [requireAuth, requireEmailVerified, getUserOrganization, requireOrgOwnership];

// List disbursements for organization (read-only)
router.get('/disbursements', ...guard, async (req, res) => {
  try {
    const result = await db.pool.query(
      `SELECT id, amount, currency, scheduled_date, paid_date, status, description, reference_number
       FROM disbursements 
       WHERE organization_id = $1
       ORDER BY scheduled_date DESC`,
      [req.userOrganization.id]
    );
    
    res.json({ disbursements: result.rows });
  } catch (error) {
    console.error('Error fetching disbursements:', error);
    res.status(500).json({ error: 'Failed to fetch disbursements' });
  }
});

// List contracts for organization (read-only)
router.get('/contracts', ...guard, async (req, res) => {
  try {
    const result = await db.pool.query(
      `SELECT c.id, c.title, c.amount, c.currency, c.start_date, c.end_date, c.status,
              f.id as file_id, f.original_name as contract_filename
       FROM contracts c
       LEFT JOIN files f ON c.signed_file_id = f.id
       WHERE c.organization_id = $1
       ORDER BY c.created_at DESC`,
      [req.userOrganization.id]
    );
    
    res.json({ contracts: result.rows });
  } catch (error) {
    console.error('Error fetching contracts:', error);
    res.status(500).json({ error: 'Failed to fetch contracts' });
  }
});

// Download signed contract
router.get('/contracts/:id/download', ...guard, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify contract belongs to organization and has signed file
    const result = await db.pool.query(
      `SELECT f.file_key, f.original_name, f.content_type
       FROM contracts c
       JOIN files f ON c.signed_file_id = f.id
       WHERE c.id = $1 AND c.organization_id = $2`,
      [id, req.userOrganization.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contract not found or no signed file available' });
    }
    
    const file = result.rows[0];
    
    // Generate download URL using storage service
    const storage = require('../services/storage');
    const downloadUrl = await storage.generateDownloadUrl(file.file_key);
    
    res.json({
      download_url: downloadUrl,
      filename: file.original_name,
      content_type: file.content_type
    });
  } catch (error) {
    console.error('Error generating contract download:', error);
    res.status(500).json({ error: 'Failed to generate download URL' });
  }
});

module.exports = router;
