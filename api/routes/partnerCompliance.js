const express = require('express');
const { requireAuth, requireEmailVerified, getUserOrganization, requireOrgOwnership } = require('../middleware/onboarding');
const db = require('../config/database');

const router = express.Router();

// Guard stack for all partner compliance routes
const guard = [requireAuth, requireEmailVerified, getUserOrganization, requireOrgOwnership];

// Get compliance requirements for organization
router.get('/requirements', ...guard, async (req, res) => {
  try {
    const result = await db.pool.query(
      `SELECT id, name, description, required_by, document_type, is_recurring
       FROM compliance_requirements 
       WHERE organization_type = 'partner' OR organization_id = $1
       ORDER BY required_by ASC`,
      [req.userOrganization.id]
    );
    
    res.json({ requirements: result.rows });
  } catch (error) {
    console.error('Error fetching compliance requirements:', error);
    res.status(500).json({ error: 'Failed to fetch requirements' });
  }
});

// List compliance documents and their statuses
router.get('/documents', ...guard, async (req, res) => {
  try {
    const result = await db.pool.query(
      `SELECT cd.id, cd.requirement_id, cd.status, cd.submitted_at, cd.approved_at, cd.expires_at,
              cr.name as requirement_name, cr.description, f.original_name, f.file_size
       FROM compliance_documents cd
       JOIN compliance_requirements cr ON cd.requirement_id = cr.id
       LEFT JOIN files f ON cd.file_id = f.id
       WHERE cd.organization_id = $1
       ORDER BY cd.submitted_at DESC`,
      [req.userOrganization.id]
    );
    
    res.json({ documents: result.rows });
  } catch (error) {
    console.error('Error fetching compliance documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Generate presigned URL for document upload
router.post('/documents/presign', ...guard, async (req, res) => {
  try {
    const { requirement_id, filename, content_type } = req.body;
    
    // Verify requirement exists
    const reqResult = await db.pool.query(
      'SELECT id FROM compliance_requirements WHERE id = $1',
      [requirement_id]
    );
    
    if (reqResult.rows.length === 0) {
      return res.status(404).json({ error: 'Requirement not found' });
    }
    
    // Generate upload target using storage service
    const storage = require('../services/storage');
    const uploadTarget = await storage.generateUploadTarget({
      filename,
      content_type,
      organization_id: req.userOrganization.id,
      context: 'compliance'
    });
    
    res.json(uploadTarget);
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

// Complete document upload and create compliance record
router.post('/documents/complete', ...guard, async (req, res) => {
  try {
    const { requirement_id, file_key, original_name, file_size, content_type } = req.body;
    
    // Create file record
    const fileResult = await db.pool.query(
      `INSERT INTO files (file_key, original_name, file_size, content_type, uploaded_by, organization_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [file_key, original_name, file_size, content_type, req.user.id, req.userOrganization.id]
    );
    
    // Create compliance document record
    const docResult = await db.pool.query(
      `INSERT INTO compliance_documents (organization_id, requirement_id, file_id, status, submitted_at, submitted_by)
       VALUES ($1, $2, $3, 'submitted', NOW(), $4)
       RETURNING id, status, submitted_at`,
      [req.userOrganization.id, requirement_id, fileResult.rows[0].id, req.user.id]
    );
    
    res.json({ 
      document: docResult.rows[0],
      file_id: fileResult.rows[0].id
    });
  } catch (error) {
    console.error('Error completing document upload:', error);
    res.status(500).json({ error: 'Failed to complete upload' });
  }
});

module.exports = router;
