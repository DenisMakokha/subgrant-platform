// routes/reviewerSummaries.js
const express = require('express');
const { requireAuth } = require('../middleware/onboarding');
const { normalizeRole } = require('../shared/constants/roles');
const { getReviewerSummaries } = require('../services/reviewerSummaries');
const db = require('../config/database');
const logger = require('../utils/logger');

const router = express.Router();

// GET /api/review/summaries
// Returns reviewer dashboard summaries for GM/COO based on the caller's role
router.get('/', requireAuth, async (req, res) => {
  try {
    // Ensure we have a reliable role (requireAuth may not include role on req.user)
    let role = req.user?.role;
    if (!role) {
      const r = await db.pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
      role = r.rows[0]?.role || '';
    }

    const normalized = normalizeRole(role);
    if (normalized !== 'grants_manager' && normalized !== 'chief_operations_officer') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const summary = await getReviewerSummaries(normalized);
    return res.json({ reviewer: summary });
  } catch (error) {
    logger.error('Error in reviewer summaries endpoint:', error);
    return res.status(500).json({ error: 'Failed to fetch reviewer summaries' });
  }
});

module.exports = router;
