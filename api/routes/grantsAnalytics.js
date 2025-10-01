const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * @route GET /api/grants-analytics/envelope/overview/:projectId
 * @desc Get envelope overview for a project
 * @access Private
 */
router.get('/envelope/overview/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const query = `
      SELECT
        e.currency,
        e.ceiling_amount AS envelope_total,
        COALESCE(SUM(pb.ceiling_total), 0) AS approved_to_partners,
        e.ceiling_amount - COALESCE(SUM(pb.ceiling_total), 0) AS headroom,
        COALESCE(SUM(ea.delta), 0) AS amendments_cum
      FROM allocation_envelopes e
      LEFT JOIN partner_budgets pb ON pb.project_id = e.project_id AND pb.status = 'APPROVED'
      LEFT JOIN envelope_amendments ea ON ea.envelope_id = e.id
      WHERE e.project_id = $1 AND e.status IN ('APPROVED', 'LOCKED')
      GROUP BY e.id, e.currency, e.ceiling_amount
    `;

    const result = await db.pool.query(query, [projectId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No envelope found for this project'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching envelope overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch envelope overview'
    });
  }
});

/**
 * @route GET /api/grants-analytics/envelope/trend/:projectId
 * @desc Get envelope trend data over time
 * @access Private
 */
router.get('/envelope/trend/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { from, to } = req.query;

    let dateFilter = '';
    const params = [projectId];

    if (from && to) {
      dateFilter = 'AND date_key BETWEEN $2 AND $3';
      params.push(from, to);
    }

    const query = `
      SELECT
        date_key,
        envelope_total,
        approved_partner_sum,
        headroom,
        amendments_cum
      FROM fact_envelope_daily
      WHERE project_id = $1 ${dateFilter}
      ORDER BY date_key
    `;

    const result = await db.pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching envelope trend:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch envelope trend'
    });
  }
});

/**
 * @route GET /api/grants-analytics/by-partner/:projectId
 * @desc Get analytics by partner for a project
 * @access Private
 */
router.get('/by-partner/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const query = `
      SELECT
        pb.partner_id,
        o.name AS partner_name,
        pb.ceiling_total AS ceiling,
        COALESCE(SUM(pbl.total), 0) AS budgeted,
        COALESCE(SUM(re.amount), 0) AS spent,
        pb.ceiling_total - COALESCE(SUM(re.amount), 0) AS remaining,
        CASE 
          WHEN pb.ceiling_total > 0 
          THEN (COALESCE(SUM(re.amount), 0) / pb.ceiling_total * 100)
          ELSE 0 
        END AS utilization_pct,
        COALESCE(SUM(pbl.total), 0) - COALESCE(SUM(re.amount), 0) AS variance
      FROM partner_budgets pb
      LEFT JOIN organizations o ON o.id = pb.partner_id
      LEFT JOIN partner_budget_lines pbl ON pbl.partner_budget_id = pb.id AND pbl.status = 'APPROVED'
      LEFT JOIN recon_line_evidence re ON re.partner_budget_line_id = pbl.id
      WHERE pb.project_id = $1 AND pb.status = 'APPROVED'
      GROUP BY pb.partner_id, pb.ceiling_total, o.name
      ORDER BY pb.ceiling_total DESC
    `;

    const result = await db.pool.query(query, [projectId]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching partner analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch partner analytics'
    });
  }
});

/**
 * @route GET /api/grants-analytics/by-category/:projectId
 * @desc Get analytics by category for a project
 * @access Private
 */
router.get('/by-category/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { scope = 'partner' } = req.query; // 'partner' or 'grant_internal'

    let query;
    if (scope === 'partner') {
      query = `
        SELECT
          pbt.category,
          SUM(pbl.total) AS budgeted,
          COALESCE(SUM(re.amount), 0) AS spent,
          SUM(pbl.total) - COALESCE(SUM(re.amount), 0) AS variance,
          CASE 
            WHEN SUM(pbl.total) > 0 
            THEN (COALESCE(SUM(re.amount), 0) / SUM(pbl.total) * 100)
            ELSE 0 
          END AS utilization_pct
        FROM partner_budget_templates pbt
        JOIN partner_budgets pb ON pb.id = pbt.partner_budget_id
        LEFT JOIN partner_budget_lines pbl ON pbl.template_id = pbt.id AND pbl.status = 'APPROVED'
        LEFT JOIN recon_line_evidence re ON re.partner_budget_line_id = pbl.id
        WHERE pb.project_id = $1 AND pb.status = 'APPROVED'
        GROUP BY pbt.category
        ORDER BY budgeted DESC
      `;
    } else {
      query = `
        SELECT
          gca.category_id AS category,
          SUM(gca.amount) AS budgeted,
          0 AS spent, -- Internal spend tracking would need separate implementation
          SUM(gca.amount) AS variance,
          0 AS utilization_pct
        FROM grant_category_allocations gca
        JOIN grants g ON g.id = gca.grant_id
        WHERE g.project_id = $1
        GROUP BY gca.category_id
        ORDER BY budgeted DESC
      `;
    }

    const result = await db.pool.query(query, [projectId]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching category analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category analytics'
    });
  }
});

/**
 * @route GET /api/grants-analytics/burn-rate/:projectId
 * @desc Get burn rate analysis for a project
 * @access Private
 */
router.get('/burn-rate/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { window = 'month' } = req.query; // 'month' or 'quarter'

    const dateFormat = window === 'quarter' ? 'YYYY-Q' : 'YYYY-MM';
    const query = `
      SELECT
        TO_CHAR(re.spent_at, '${dateFormat}') AS period,
        SUM(re.amount) AS spend,
        SUM(SUM(re.amount)) OVER (ORDER BY TO_CHAR(re.spent_at, '${dateFormat}')) AS cumulative
      FROM recon_line_evidence re
      JOIN partner_budget_lines pbl ON pbl.id = re.partner_budget_line_id
      JOIN partner_budgets pb ON pb.id = pbl.partner_budget_id
      WHERE pb.project_id = $1
      GROUP BY TO_CHAR(re.spent_at, '${dateFormat}')
      ORDER BY period
    `;

    const result = await db.pool.query(query, [projectId]);

    // Calculate runway
    const totalBudget = await db.pool.query(`
      SELECT COALESCE(SUM(pb.ceiling_total), 0) AS total_budget
      FROM partner_budgets pb
      WHERE pb.project_id = $1 AND pb.status = 'APPROVED'
    `, [projectId]);

    const totalSpent = result.rows.length > 0 ? 
      result.rows[result.rows.length - 1].cumulative : 0;
    
    const avgMonthlySpend = result.rows.length > 0 ? 
      totalSpent / result.rows.length : 0;
    
    const runwayMonths = avgMonthlySpend > 0 ? 
      (totalBudget.rows[0].total_budget - totalSpent) / avgMonthlySpend : 0;

    res.json({
      success: true,
      data: result.rows,
      metadata: {
        total_budget: totalBudget.rows[0].total_budget,
        total_spent: totalSpent,
        avg_monthly_spend: avgMonthlySpend,
        runway_months: Math.max(0, runwayMonths)
      }
    });
  } catch (error) {
    console.error('Error fetching burn rate:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch burn rate'
    });
  }
});

/**
 * @route GET /api/grants-analytics/approvals/metrics/:projectId
 * @desc Get approval operations metrics
 * @access Private
 */
router.get('/approvals/metrics/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { entityType } = req.query;

    let entityFilter = '';
    const params = [projectId];

    if (entityType) {
      entityFilter = 'AND entity_type = $2';
      params.push(entityType);
    }

    const query = `
      SELECT
        entity_type,
        COUNT(*) AS total_approvals,
        AVG(total_duration_sec) AS median_tta_seconds,
        COUNT(*) FILTER (WHERE result = 'REJECTED') * 100.0 / COUNT(*) AS rework_rate,
        AVG(step_count) AS avg_steps
      FROM fact_approvals
      WHERE project_id = $1 ${entityFilter}
      GROUP BY entity_type
    `;

    const result = await db.pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching approval metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch approval metrics'
    });
  }
});

/**
 * @route GET /api/grants-analytics/contracts/cycle/:projectId
 * @desc Get contract cycle metrics
 * @access Private
 */
router.get('/contracts/cycle/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const query = `
      SELECT
        COUNT(*) AS total_contracts,
        COUNT(*) FILTER (WHERE generated_at IS NOT NULL) AS generated,
        COUNT(*) FILTER (WHERE approved_at IS NOT NULL) AS approved,
        COUNT(*) FILTER (WHERE signed_at IS NOT NULL) AS signed,
        COUNT(*) FILTER (WHERE activated_at IS NOT NULL) AS activated,
        AVG(cycle_days) AS median_cycle_days
      FROM fact_contracts
      WHERE project_id = $1
    `;

    const result = await db.pool.query(query, [projectId]);

    res.json({
      success: true,
      data: result.rows[0] || {}
    });
  } catch (error) {
    console.error('Error fetching contract cycle metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contract cycle metrics'
    });
  }
});

/**
 * @route GET /api/grants-analytics/fund-requests/flow/:projectId
 * @desc Get fund request flow metrics
 * @access Private
 */
router.get('/fund-requests/flow/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const query = `
      SELECT
        COUNT(*) AS total_requests,
        SUM(amount) AS submitted_sum,
        SUM(amount) FILTER (WHERE approved_at IS NOT NULL) AS approved_sum,
        SUM(amount) FILTER (WHERE posted_to_erp_at IS NOT NULL) AS posted_sum,
        AVG(EXTRACT(EPOCH FROM (approved_at - submitted_at))/86400) AS avg_approval_days
      FROM fact_fund_requests
      WHERE project_id = $1
    `;

    const result = await db.pool.query(query, [projectId]);

    res.json({
      success: true,
      data: result.rows[0] || {}
    });
  } catch (error) {
    console.error('Error fetching fund request flow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch fund request flow'
    });
  }
});

/**
 * @route GET /api/grants-analytics/reports/sla/:projectId
 * @desc Get reporting SLA metrics
 * @access Private
 */
router.get('/reports/sla/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { type } = req.query; // 'financial' or 'narrative'

    let typeFilter = '';
    const params = [projectId];

    if (type) {
      typeFilter = 'AND type = $2';
      params.push(type);
    }

    const query = `
      SELECT
        type,
        COUNT(*) AS total_reports,
        COUNT(*) FILTER (WHERE on_time = true) * 100.0 / COUNT(*) AS on_time_pct,
        AVG(days_to_submit) AS median_days_to_submit,
        AVG(days_to_approve) AS median_days_to_approve,
        COUNT(*) FILTER (WHERE due_date >= CURRENT_DATE AND submitted_at IS NULL) AS due_this_month,
        COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND submitted_at IS NULL) AS overdue
      FROM fact_reports
      WHERE project_id = $1 ${typeFilter}
      GROUP BY type
    `;

    const result = await db.pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching reporting SLA:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reporting SLA'
    });
  }
});

/**
 * @route POST /api/grants-analytics/refresh/:projectId
 * @desc Refresh analytics data for a project
 * @access Private (Admin only)
 */
router.post('/refresh/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    // Refresh materialized view
    await db.pool.query('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_grants_overview');

    // Could add more specific refresh logic here for fact tables

    res.json({
      success: true,
      message: 'Analytics data refreshed successfully'
    });
  } catch (error) {
    console.error('Error refreshing analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh analytics data'
    });
  }
});

module.exports = router;