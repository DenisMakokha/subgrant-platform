// services/reviewerSummaries.js
const db = require('../config/database');
const { ORG_STATUS } = require('../shared/constants/orgStatus');

/**
 * Get reviewer-specific summaries for GM/COO dashboards
 * @param {string} role - 'grants_manager' or 'chief_operations_officer'
 * @returns {Object} Summary data for the reviewer's queue
 */
async function getReviewerSummaries(role) {
  try {
    if (role === 'grants_manager') {
      // GM queue: organizations waiting for GM review
      const gmQueueResult = await db.pool.query(
        `SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '3 days') as aging_3_days,
          COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '7 days') as aging_7_days,
          COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '14 days') as aging_14_days
        FROM organizations 
        WHERE status = $1`,
        [ORG_STATUS.UNDER_REVIEW_GM]
      );

      // Additional metrics for GM
      const sectorBreakdown = await db.pool.query(
        `SELECT 
          sector,
          COUNT(*) as count
        FROM organizations 
        WHERE status = $1 AND sector IS NOT NULL
        GROUP BY sector
        ORDER BY count DESC`,
        [ORG_STATUS.UNDER_REVIEW_GM]
      );

      return {
        queue: gmQueueResult.rows[0] || { total: 0, aging_3_days: 0, aging_7_days: 0, aging_14_days: 0 },
        sectors: sectorBreakdown.rows || [],
        type: 'gm'
      };
    }

    if (role === 'chief_operations_officer') {
      // COO queue: organizations waiting for COO review (after GM approval)
      const cooQueueResult = await db.pool.query(
        `SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE updated_at < NOW() - INTERVAL '2 days') as aging_2_days,
          COUNT(*) FILTER (WHERE updated_at < NOW() - INTERVAL '5 days') as aging_5_days,
          COUNT(*) FILTER (WHERE updated_at < NOW() - INTERVAL '10 days') as aging_10_days
        FROM organizations 
        WHERE status = $1`,
        [ORG_STATUS.UNDER_REVIEW_COO]
      );

      // Organizations approved by GM today
      const gmApprovedToday = await db.pool.query(
        `SELECT COUNT(*) as count
        FROM organizations 
        WHERE status = $1 AND updated_at >= CURRENT_DATE`,
        [ORG_STATUS.UNDER_REVIEW_COO]
      );

      return {
        queue: cooQueueResult.rows[0] || { total: 0, aging_2_days: 0, aging_5_days: 0, aging_10_days: 0 },
        gm_approved_today: gmApprovedToday.rows[0]?.count || 0,
        type: 'coo'
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching reviewer summaries:', error);
    return null;
  }
}

module.exports = {
  getReviewerSummaries
};
