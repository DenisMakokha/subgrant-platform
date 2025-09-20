const express = require('express');
const { requireAuth, requireEmailVerified, getUserOrganization, requireOrgOwnership } = require('../middleware/onboarding');
const db = require('../config/database');

const router = express.Router();

// Guard stack for all partner M&E routes
const guard = [requireAuth, requireEmailVerified, getUserOrganization, requireOrgOwnership];

// Get due M&E reports
router.get('/due', ...guard, async (req, res) => {
  try {
    const result = await db.pool.query(
      `SELECT id, title, description, due_date, report_type, status
       FROM me_reports 
       WHERE organization_id = $1 AND due_date < NOW() AND status != 'submitted'
       ORDER BY due_date ASC`,
      [req.userOrganization.id]
    );
    
    res.json({ reports: result.rows });
  } catch (error) {
    console.error('Error fetching due reports:', error);
    res.status(500).json({ error: 'Failed to fetch due reports' });
  }
});

// List all M&E reports (paginated)
router.get('/', ...guard, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    const result = await db.pool.query(
      `SELECT id, title, description, due_date, report_type, status, created_at, submitted_at
       FROM me_reports 
       WHERE organization_id = $1
       ORDER BY due_date DESC
       LIMIT $2 OFFSET $3`,
      [req.userOrganization.id, limit, offset]
    );
    
    const countResult = await db.pool.query(
      'SELECT COUNT(*) FROM me_reports WHERE organization_id = $1',
      [req.userOrganization.id]
    );
    
    res.json({ 
      reports: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching M&E reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Create new draft M&E report
router.post('/', ...guard, async (req, res) => {
  try {
    const { title, description, report_type, due_date } = req.body;
    
    const result = await db.pool.query(
      `INSERT INTO me_reports (organization_id, title, description, report_type, due_date, status, created_by)
       VALUES ($1, $2, $3, $4, $5, 'draft', $6)
       RETURNING id, title, description, report_type, due_date, status, created_at`,
      [req.userOrganization.id, title, description, report_type, due_date, req.user.id]
    );
    
    res.status(201).json({ report: result.rows[0] });
  } catch (error) {
    console.error('Error creating M&E report:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

// Update draft M&E report
router.put('/:id', ...guard, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, content, metrics } = req.body;
    
    // Verify report belongs to organization and is still draft
    const checkResult = await db.pool.query(
      'SELECT status FROM me_reports WHERE id = $1 AND organization_id = $2',
      [id, req.userOrganization.id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    if (checkResult.rows[0].status !== 'draft') {
      return res.status(400).json({ error: 'Can only update draft reports' });
    }
    
    const result = await db.pool.query(
      `UPDATE me_reports 
       SET title = $1, description = $2, content = $3, metrics = $4, updated_at = NOW()
       WHERE id = $5 AND organization_id = $6
       RETURNING id, title, description, content, metrics, status, updated_at`,
      [title, description, content, JSON.stringify(metrics), id, req.userOrganization.id]
    );
    
    res.json({ report: result.rows[0] });
  } catch (error) {
    console.error('Error updating M&E report:', error);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

// Submit M&E report
router.post('/:id/submit', ...guard, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify report belongs to organization and is draft
    const checkResult = await db.pool.query(
      'SELECT status FROM me_reports WHERE id = $1 AND organization_id = $2',
      [id, req.userOrganization.id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    if (checkResult.rows[0].status !== 'draft') {
      return res.status(400).json({ error: 'Can only submit draft reports' });
    }
    
    const result = await db.pool.query(
      `UPDATE me_reports 
       SET status = 'submitted', submitted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND organization_id = $2
       RETURNING id, title, status, submitted_at`,
      [id, req.userOrganization.id]
    );
    
    res.json({ report: result.rows[0] });
  } catch (error) {
    console.error('Error submitting M&E report:', error);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

module.exports = router;
