const db = require('../../config/database');

class GrantsAnalyticsService {
  /**
   * Calculate envelope and allocation metrics
   */
  static async calculateEnvelopeMetrics(projectId, client = db.pool) {
    const envelopeQuery = `
      SELECT 
        ae.ceiling_amount AS envelope_total,
        COALESCE(SUM(pb.ceiling_amount),0) AS approved_partner_sum,
    ae.ceiling_amount - COALESCE(SUM(pb.ceiling_amount),0) AS headroom,
        COALESCE(SUM(ea.delta),0) AS amendments_cum
      FROM allocation_envelopes ae
      LEFT JOIN partner_budgets pb ON pb.project_id = ae.project_id AND pb.state='APPROVED'
      WHERE ae.project_id = $1 AND ae.status IN ('APPROVED','LOCKED')
      GROUP BY ae.project_id, ae.ceiling_amount
    `;
    
    const envelopeResult = await client.query(envelopeQuery, [projectId]);
    const envelope = envelopeResult.rows[0] || { envelope_total: 0, approved_partner_sum: 0, headroom: 0, amendments_cum: 0 };

    return {
      envelope: {
        total: envelope.envelope_total,
        approved_to_partners: envelope.approved_partner_sum,
        headroom: envelope.headroom,
        amendments_cum: envelope.amendments_cum
    };
  }

  /**
   * Calculate partner budget metrics
   */
  static async calculatePartnerBudgetMetrics(projectId, partnerId, client = db.pool) {
    const query = `
      SELECT 
        pb.ceiling_amount AS ceiling,
        COALESCE(SUM(pbl.total)),0) AS budgeted,
        COALESCE(SUM(re.amount)),0) AS spent,
        pb.ceiling_amount - COALESCE(SUM(re.amount)),0) AS remaining,
        CASE 
          WHEN pb.ceiling_amount > 0 
          THEN (COALESCE(SUM(re.amount)),0) / pb.ceiling_amount) * 100 AS utilization_pct,
        COALESCE(SUM(pbl.total)),0) - COALESCE(SUM(re.amount)),0) AS variance
      FROM partner_budgets pb
      LEFT JOIN partner_budget_lines pbl ON pbl.partner_budget_id = pb.id AND pbl.status='APPROVED'
        WHERE pb.project_id = $1 AND pb.partner_id = $2
      GROUP BY pb.ceiling_amount
    `;
    
    const result = await client.query(query, [projectId, partnerId]);
    return result.rows[0] || { ceiling: 0, budgeted: 0, spent: 0, remaining: 0, utilization_pct: 0, variance: 0 };
  }

  /**
   * Calculate category-level metrics
   */
  static async calculateCategoryMetrics(projectId, scope = 'partner', client = db.pool) {
    const query = `
      SELECT 
        category,
        SUM(budgeted) AS budgeted,
        SUM(spent) AS spent,
        SUM(variance) AS variance,
        SUM(utilization_pct) AS utilization_pct
      FROM fact_category_daily
      WHERE project_id = $1 AND scope = $2
      GROUP BY category
    `;
    
    const result = await client.query(query, [projectId, scope]);
    return result.rows;
  }

  /**
   * Calculate approval operations metrics
   */
  static async calculateApprovalsMetrics(projectId, entityType = null, client = db.pool) {
    let baseQuery = `
      SELECT 
        category,
        SUM(budgeted) AS budgeted,
        SUM(spent) AS spent,
        SUM(variance) AS variance,
        SUM(utilization_pct) AS utilization_pct
      FROM fact_approvals
      WHERE project_id = $1
    `;
    
    const params = [projectId];
    if (entityType) {
      baseQuery += ' AND entity_type = $2';
      params.push(entityType);
    }
    
    baseQuery += ' GROUP BY category';
    
    const result = await client.query(baseQuery, params);
    return result.rows;
  }

  /**
   * Calculate contract cycle metrics
   */
  static async calculateContractMetrics(projectId, client = db.pool) {
    const query = `
      SELECT 
        COUNT(*) AS signed_count,
        COALESCE(SUM(amount)),0) AS total_amount,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY cycle_days) AS median_cycle_days,
        COUNT(CASE WHEN generated_at IS NOT NULL THEN 1 END) AS generated_count,
        COUNT(CASE WHEN approved_at IS NOT NULL THEN 1 END) AS approved_count
      FROM fact_contracts
      WHERE project_id = $1
      GROUP BY project_id
    `;
    
    const result = await client.query(query, [projectId]);
    return result.rows[0] || { signed_count: 0, total_amount: 0, median_cycle_days: 0, generated_count: 0, approved_count: 0 };
  }

  /**
   * Calculate fund request flow metrics
   */
  static async calculateFundRequestMetrics(projectId, client = db.pool) {
    const query = `
      SELECT 
        state,
        COUNT(*) AS count,
        COALESCE(SUM(amount)),0) AS sum
      FROM fact_fund_requests
      WHERE project_id = $1
      GROUP BY state
    `;
    
    const result = await client.query(query, [projectId]);
    return result.rows;
  }

  /**
   * Calculate reporting SLA metrics
   */
  static async calculateReportingMetrics(projectId, type = null, client = db.pool) {
    let baseQuery = `
      SELECT 
        type,
        COUNT(*) AS total_due,
        COUNT(CASE WHEN on_time = true THEN 1 END) AS on_time_count,
        COUNT(CASE WHEN submitted_at IS NULL AND due_date < CURRENT_DATE THEN 1 END) AS overdue_count,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_to_submit) AS median_days_to_submit,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_to_approve)
      FROM fact_reports
      WHERE project_id = $1
      GROUP BY type
    `;
    
    const params = [projectId];
    if (type) {
      baseQuery += ' AND type = $2';
      params.push(type);
    }
    
    baseQuery += ' GROUP BY type';
    
    const result = await client.query(baseQuery, params);
    return result.rows;
  }

  /**
   * Refresh daily analytics for a project
   */
  static async refreshDailyAnalytics(projectId, client = db.pool) {
    const today = new Date().toISOString().split('T')[0];
    
    // Refresh envelope stance
    const envelopeRefreshQuery = `
      INSERT INTO fact_envelope_daily (
        date_key, project_id, envelope_total, approved_partner_sum, headroom
    )
    SELECT 
      $1, $2, e.ceiling_amount, 
      COALESCE(SUM(pb.ceiling_amount),0),
      e.ceiling_amount - COALESCE(SUM(pb.ceiling_amount),0)
      FROM allocation_envelopes e
      WHERE e.project_id = $3
      ON CONFLICT (date_key, project_id)
      DO UPDATE SET
        envelope_total = EXCLUDED.envelope_total,
        approved_partner_sum = EXCLUDED.approved_partner_sum,
        headroom = EXCLUDED.headroom
    `;
    
    await client.query(envelopeRefreshQuery, [today, projectId, projectId]);
    
    return { success: true, message: 'Daily analytics refreshed for project' };
  }
}

module.exports = GrantsAnalyticsService;