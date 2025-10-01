const express = require('express');
const { requireAuth, requireEmailVerified, getUserOrganization, requireOrgOwnership } = require('../middleware/onboarding');
const db = require('../config/database');

const router = express.Router();

// Guard stack for all partner M&E routes
const guard = [requireAuth, requireEmailVerified, getUserOrganization, requireOrgOwnership];

// Get due M&E reports using SSOT
router.get('/due', ...guard, async (req, res) => {
  try {
    const result = await db.pool.query(
      `SELECT 
        grd.id,
        grd.report_type as title,
        grd.due_date,
        grd.report_type,
        grd.status,
        g.name as grant_name,
        pb.project_id
       FROM grant_reporting_dates grd
       JOIN grants g ON g.id = grd.grant_id
       JOIN partner_budgets pb ON pb.project_id = g.project_id
       WHERE pb.partner_id = $1 
         AND grd.due_date < NOW() 
         AND grd.status = 'due'
         AND grd.report_type = 'monthly'
       ORDER BY grd.due_date ASC`,
      [req.userOrganization.id]
    );
    
    res.json({ reports: result.rows });
  } catch (error) {
    console.error('Error fetching due reports:', error);
    res.status(500).json({ error: 'Failed to fetch due reports' });
  }
});

// List all M&E reports (paginated) using SSOT - monthly reports
router.get('/', ...guard, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    const result = await db.pool.query(
      `SELECT 
        grd.id,
        CONCAT('Monthly Report - ', TO_CHAR(grd.due_date, 'Mon YYYY')) as title,
        grd.description,
        grd.due_date,
        grd.report_type,
        grd.status,
        grd.created_at,
        grd.submitted_at,
        g.name as grant_name,
        g.id as grant_id,
        pb.project_id,
        pb.id as partner_budget_id
       FROM grant_reporting_dates grd
       JOIN grants g ON g.id = grd.grant_id
       JOIN partner_budgets pb ON pb.project_id = g.project_id
       WHERE pb.partner_id = $1 AND grd.report_type = 'monthly'
       ORDER BY grd.due_date DESC
       LIMIT $2 OFFSET $3`,
      [req.userOrganization.id, limit, offset]
    );
    
    const countResult = await db.pool.query(
      `SELECT COUNT(*) 
       FROM grant_reporting_dates grd
       JOIN grants g ON g.id = grd.grant_id
       JOIN partner_budgets pb ON pb.project_id = g.project_id
       WHERE pb.partner_id = $1 AND grd.report_type = 'monthly'`,
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

// Get single M&E report details using SSOT
router.get('/:id', ...guard, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.pool.query(
      `SELECT 
        grd.id,
        CONCAT('Monthly Report - ', TO_CHAR(grd.due_date, 'Mon YYYY')) as title,
        grd.description,
        grd.due_date,
        grd.report_type,
        grd.status,
        grd.content,
        grd.metrics,
        grd.created_at,
        grd.submitted_at,
        g.name as grant_name,
        g.id as grant_id,
        pb.project_id,
        pb.id as partner_budget_id
       FROM grant_reporting_dates grd
       JOIN grants g ON g.id = grd.grant_id
       JOIN partner_budgets pb ON pb.project_id = g.project_id
       WHERE grd.id = $1 AND pb.partner_id = $2`,
      [id, req.userOrganization.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    res.json({ report: result.rows[0] });
  } catch (error) {
    console.error('Error fetching M&E report:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// Update M&E report content (before submission) using SSOT
router.put('/:id', ...guard, async (req, res) => {
  try {
    const { id } = req.params;
    const { content, metrics } = req.body;
    
    // Verify report belongs to partner and is still due (not submitted)
    const checkResult = await db.pool.query(
      `SELECT grd.status
       FROM grant_reporting_dates grd
       JOIN grants g ON g.id = grd.grant_id
       JOIN partner_budgets pb ON pb.project_id = g.project_id
       WHERE grd.id = $1 AND pb.partner_id = $2`,
      [id, req.userOrganization.id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    if (checkResult.rows[0].status !== 'due') {
      return res.status(400).json({ error: 'Can only update reports that are due' });
    }
    
    const result = await db.pool.query(
      `UPDATE grant_reporting_dates 
       SET content = $1, metrics = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING id, report_type as title, content, metrics, status, updated_at`,
      [content, JSON.stringify(metrics), id]
    );
    
    res.json({ report: result.rows[0] });
  } catch (error) {
    console.error('Error updating M&E report:', error);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

// Submit M&E report using SSOT
router.post('/:id/submit', ...guard, async (req, res) => {
  try {
    const { id } = req.params;
    const { content, metrics } = req.body;
    
    // Verify report belongs to partner and is due
    const checkResult = await db.pool.query(
      `SELECT grd.status, grd.grant_id, pb.partner_id
       FROM grant_reporting_dates grd
       JOIN grants g ON g.id = grd.grant_id
       JOIN partner_budgets pb ON pb.project_id = g.project_id
       WHERE grd.id = $1 AND pb.partner_id = $2`,
      [id, req.userOrganization.id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    if (checkResult.rows[0].status !== 'due') {
      return res.status(400).json({ error: 'Can only submit due reports' });
    }
    
    // Update report status to submitted
    const result = await db.pool.query(
      `UPDATE grant_reporting_dates 
       SET status = 'submitted', 
           submitted_at = NOW(), 
           content = $1,
           metrics = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, report_type as title, status, submitted_at, due_date`,
      [content, JSON.stringify(metrics), id]
    );
    
    res.json({ report: result.rows[0] });
  } catch (error) {
    console.error('Error submitting M&E report:', error);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

module.exports = router;
