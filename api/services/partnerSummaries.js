const db = require('../config/database');

/**
 * Get lightweight module summaries for partner dashboard
 * Uses fast queries and cached rollups where possible
 */
async function getPartnerSummaries(organizationId) {
  try {
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

    // M&E Reports summary
    const meResult = await db.pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE due_date < NOW() AND status != 'submitted') as due,
        COUNT(*) FILTER (WHERE due_date > NOW() AND due_date < NOW() + INTERVAL '30 days') as upcoming,
        COUNT(*) FILTER (WHERE submitted_at >= DATE_TRUNC('quarter', NOW()) AND status = 'submitted') as submitted_this_quarter
      FROM me_reports WHERE organization_id = $1
    `, [organizationId]);

    // Disbursements summary
    const disbursementsResult = await db.pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE scheduled_date > NOW() AND status = 'scheduled') as upcoming,
        COUNT(*) FILTER (WHERE status = 'paid') as paid
      FROM disbursements WHERE organization_id = $1
    `, [organizationId]);

    // Contracts summary
    const contractsResult = await db.pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'pending_signature') as pending_signature,
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'active' AND end_date < NOW() + INTERVAL '60 days') as ending_soon
      FROM contracts WHERE organization_id = $1
    `, [organizationId]);

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
    console.error('Error fetching partner summaries:', error);
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
