const express = require('express');
const { requireAuth } = require('../middleware/onboarding');
const { getPartnerSummaries } = require('../services/partnerSummaries');
const db = require('../config/database');

const router = express.Router();

/**
 * Get partner dashboard KPI data
 * Returns the main KPIs for the dashboard: projectsActive, budgetCeiling, spent, utilizationPct, reportsDue
 */
router.get('/kpis', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.sub || req.auth.user_id;
    
    // Get user's organization
    const userResult = await db.pool.query(
      'SELECT organization_id FROM users WHERE id = $1',
      [userId]
    );
    
    if (!userResult.rows[0]?.organization_id) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    const organizationId = userResult.rows[0].organization_id;
    
    // Get basic summaries
    const summaries = await getPartnerSummaries(organizationId);
    
    // Get projects data
    const projectsResult = await db.pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) as total
      FROM projects 
      WHERE organization_id = $1
    `, [organizationId]);
    
    // Get budget data
    const budgetResult = await db.pool.query(`
      SELECT 
        COALESCE(SUM(total_budget), 0) as ceiling,
        COALESCE(SUM(spent_amount), 0) as spent
      FROM budgets 
      WHERE organization_id = $1
    `, [organizationId]);
    
    // Calculate utilization percentage
    const ceiling = parseFloat(budgetResult.rows[0]?.ceiling || 0);
    const spent = parseFloat(budgetResult.rows[0]?.spent || 0);
    const utilizationPct = ceiling > 0 ? (spent / ceiling) * 100 : 0;
    
    // Get reports due count
    const reportsResult = await db.pool.query(`
      SELECT COUNT(*) as due
      FROM me_reports mr
      JOIN budgets b ON mr.budget_id = b.id
      WHERE b.organization_id = $1 
        AND COALESCE(mr.due_date, mr.report_date) < NOW() 
        AND mr.status != 'submitted'
    `, [organizationId]);
    
    const kpis = {
      projectsActive: parseInt(projectsResult.rows[0]?.active || 0),
      projectsTotal: parseInt(projectsResult.rows[0]?.total || 0),
      budgetCeiling: ceiling,
      spent: spent,
      utilizationPct: parseFloat(utilizationPct.toFixed(1)),
      reportsDue: parseInt(reportsResult.rows[0]?.due || 0),
      reportsSubmitted: parseInt(summaries.me?.submitted_this_quarter || 0)
    };
    
    res.json({
      success: true,
      data: kpis,
      meta: {
        timestamp: new Date().toISOString(),
        organizationId
      }
    });
    
  } catch (error) {
    console.error('Error fetching partner dashboard KPIs:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch dashboard data',
      data: {
        projectsActive: 0,
        projectsTotal: 0,
        budgetCeiling: 0,
        spent: 0,
        utilizationPct: 0,
        reportsDue: 0,
        reportsSubmitted: 0
      }
    });
  }
});

/**
 * Get detailed partner dashboard data
 * Returns comprehensive dashboard information including summaries and KPIs
 */
router.get('/summary', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.sub || req.auth.user_id;
    
    // Get user's organization
    const userResult = await db.pool.query(
      'SELECT organization_id FROM users WHERE id = $1',
      [userId]
    );
    
    if (!userResult.rows[0]?.organization_id) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    const organizationId = userResult.rows[0].organization_id;
    
    // Get partner summaries
    const summaries = await getPartnerSummaries(organizationId);
    
    res.json({
      success: true,
      data: {
        modules: summaries,
        organizationId
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error fetching partner dashboard summary:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch dashboard summary'
    });
  }
});

module.exports = router;
