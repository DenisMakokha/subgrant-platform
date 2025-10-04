const db = require('../config/database');
const logger = require('../utils/logger');

/**
 * Get lightweight module summaries for partner dashboard
 * Uses fast queries and cached rollups where possible
 */
async function getPartnerSummaries(organizationId) {
  try {
    // Ensure minimal schema for summary queries
    try {
      await db.pool.query(`
        CREATE TABLE IF NOT EXISTS applications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          organization_id UUID NOT NULL,
          status VARCHAR(50) DEFAULT 'draft'
        )
      `);
      await db.pool.query(`
        CREATE TABLE IF NOT EXISTS compliance_documents (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          organization_id UUID NOT NULL,
          status VARCHAR(50) DEFAULT 'required',
          expires_at TIMESTAMP NULL
        )
      `);
      await db.pool.query(`
        CREATE TABLE IF NOT EXISTS me_reports (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          organization_id UUID NOT NULL,
          due_date TIMESTAMP NULL,
          submitted_at TIMESTAMP NULL,
          status VARCHAR(50) DEFAULT 'draft'
        )
      `);
      await db.pool.query(`
        CREATE TABLE IF NOT EXISTS disbursements (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          organization_id UUID NOT NULL,
          scheduled_date TIMESTAMP NULL,
          status VARCHAR(50) DEFAULT 'scheduled'
        )
      `);
      await db.pool.query(`
        CREATE TABLE IF NOT EXISTS contracts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          organization_id UUID NOT NULL,
          end_date TIMESTAMP NULL,
          status VARCHAR(50) DEFAULT 'pending_signature'
        )
      `);
      await db.pool.query(`
        CREATE TABLE IF NOT EXISTS notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          organization_id UUID NOT NULL,
          read_at TIMESTAMP NULL
        )
      `);

      // Ensure referenced columns exist even if tables pre-existed
      const alters = [
        // me_reports columns
        `ALTER TABLE me_reports ADD COLUMN IF NOT EXISTS organization_id UUID`,
        `ALTER TABLE me_reports ADD COLUMN IF NOT EXISTS due_date TIMESTAMP`,
        `ALTER TABLE me_reports ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP`,
        `ALTER TABLE me_reports ADD COLUMN IF NOT EXISTS status VARCHAR(50)`,
        // disbursements columns
        `ALTER TABLE disbursements ADD COLUMN IF NOT EXISTS organization_id UUID`,
        `ALTER TABLE disbursements ADD COLUMN IF NOT EXISTS scheduled_date TIMESTAMP`,
        `ALTER TABLE disbursements ADD COLUMN IF NOT EXISTS status VARCHAR(50)`,
        // contracts columns
        `ALTER TABLE contracts ADD COLUMN IF NOT EXISTS organization_id UUID`,
        `ALTER TABLE contracts ADD COLUMN IF NOT EXISTS end_date TIMESTAMP`,
        `ALTER TABLE contracts ADD COLUMN IF NOT EXISTS status VARCHAR(50)`,
        // compliance_documents columns
        `ALTER TABLE compliance_documents ADD COLUMN IF NOT EXISTS organization_id UUID`,
        `ALTER TABLE compliance_documents ADD COLUMN IF NOT EXISTS status VARCHAR(50)`,
        `ALTER TABLE compliance_documents ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP`,
        // applications columns
        `ALTER TABLE applications ADD COLUMN IF NOT EXISTS organization_id UUID`,
        `ALTER TABLE applications ADD COLUMN IF NOT EXISTS status VARCHAR(50)`,
        // notifications columns
        `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS organization_id UUID`,
        `ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMP`
      ];
      for (const q of alters) {
        try { await db.pool.query(q); } catch (_) { /* ignore */ }
      }
    } catch (schemaErr) {
      logger.warn('partnerSummaries: schema ensure failed (non-fatal):', schemaErr.message || schemaErr);
    }

    // Applications summary
    const applicationsResult = await db.pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'draft') as drafts,
        COUNT(*) FILTER (WHERE status = 'submitted') as submitted,
        COUNT(*) FILTER (WHERE status = 'under_review') as under_review,
        COUNT(*) FILTER (WHERE status = 'approved') as approved,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected
      FROM applications WHERE organization_id = $1
    `, [organizationId]);

    // Compliance summary
    const complianceResult = await db.pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'required') as required,
        COUNT(*) FILTER (WHERE status = 'submitted') as submitted,
        COUNT(*) FILTER (WHERE status = 'approved') as approved,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
        COUNT(*) FILTER (WHERE status = 'approved' AND expires_at < NOW() + INTERVAL '30 days') as expiring_soon
      FROM compliance_documents WHERE organization_id = $1
    `, [organizationId]);

    // M&E Reports summary using SSOT grant reporting dates
    const meResult = await db.pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE grd.due_date < NOW() AND grd.status = 'due') as due,
        COUNT(*) FILTER (WHERE grd.due_date > NOW() AND grd.due_date < NOW() + INTERVAL '30 days' AND grd.status = 'due') as upcoming,
        COUNT(*) FILTER (WHERE grd.status = 'submitted' AND grd.created_at >= DATE_TRUNC('quarter', NOW())) as submitted_this_quarter
      FROM grant_reporting_dates grd
      JOIN grants g ON g.id = grd.grant_id
      JOIN partner_budgets pb ON pb.project_id = g.project_id
      WHERE pb.partner_id = $1
    `, [organizationId]);

    // Disbursements summary using SSOT
    const disbursementsResult = await db.pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE COALESCE(d.scheduled_date, d.planned_date) > NOW() AND d.status IN ('scheduled','planned')) as upcoming,
        COUNT(*) FILTER (WHERE d.status = 'paid') as paid
      FROM disbursements d
      JOIN partner_budgets pb ON COALESCE(d.partner_budget_id, d.budget_id) = pb.id
      WHERE pb.partner_id = $1
    `, [organizationId]);

    // Contracts summary - graceful fallback if table doesn't exist
    let contractsResult;
    try {
      contractsResult = await db.pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE c.state = 'PENDING_SIGNATURE') as pending_signature,
          COUNT(*) FILTER (WHERE c.state = 'ACTIVE') as active,
          COUNT(*) FILTER (WHERE c.state = 'ACTIVE' AND c.end_date < NOW() + INTERVAL '60 days') as ending_soon
        FROM contracts c
        WHERE c.partner_id = $1
      `, [organizationId]);
    } catch (error) {
      // If contracts table doesn't exist, return zeros
      contractsResult = { rows: [{ pending_signature: 0, active: 0, ending_soon: 0 }] };
    }

    // Messages/Notifications summary
    const messagesResult = await db.pool.query(`
      SELECT COUNT(*) as unread
      FROM notifications 
      WHERE organization_id = $1 AND read_at IS NULL
    `, [organizationId]);

    return {
      applications: applicationsResult.rows[0] || { drafts: 0, submitted: 0, under_review: 0, approved: 0, rejected: 0 },
      compliance: complianceResult.rows[0] || { required: 0, submitted: 0, approved: 0, rejected: 0, expiring_soon: 0 },
      me: meResult.rows[0] || { due: 0, upcoming: 0, submitted_this_quarter: 0 },
      disbursements: disbursementsResult.rows[0] || { upcoming: 0, paid: 0 },
      contracts: contractsResult.rows[0] || { pending_signature: 0, active: 0, ending_soon: 0 },
      messages: messagesResult.rows[0] || { unread: 0 }
    };
  } catch (error) {
    logger.error('Error fetching partner summaries:', error);
    // Return empty summaries on error to prevent dashboard failure
    return {
      applications: { drafts: 0, submitted: 0, under_review: 0, approved: 0, rejected: 0 },
      compliance: { required: 0, submitted: 0, approved: 0, rejected: 0, expiring_soon: 0 },
      me: { due: 0, upcoming: 0, submitted_this_quarter: 0 },
      disbursements: { upcoming: 0, paid: 0 },
      contracts: { pending_signature: 0, active: 0, ending_soon: 0 },
      messages: { unread: 0 }
    };
  }
}

module.exports = {
  getPartnerSummaries
};
