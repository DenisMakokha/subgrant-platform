const express = require('express');
const { requireAuth } = require('../middleware/onboarding');
const activityLogService = require('../services/activityLogService');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * Get activity feed for partner organization
 * GET /partner/dashboard/activity
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.sub || req.auth.user_id;
    
    // Get user's organization
    const db = require('../config/database');
    const userResult = await db.pool.query(
      'SELECT organization_id FROM users WHERE id = $1',
      [userId]
    );
    
    if (!userResult.rows[0]?.organization_id) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }
    
    const organizationId = userResult.rows[0].organization_id;
    
    // Parse query parameters
    const options = {
      limit: parseInt(req.query.limit) || 20,
      offset: parseInt(req.query.offset) || 0,
      category: req.query.category || null,
      severity: req.query.severity || null,
      unreadOnly: req.query.unreadOnly === 'true',
      startDate: req.query.startDate || null,
      endDate: req.query.endDate || null
    };
    
    const result = await activityLogService.getActivities(organizationId, options);
    
    res.json({
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        organizationId
      }
    });
    
  } catch (error) {
    logger.error('Error fetching activity feed:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity feed'
    });
  }
});

/**
 * Mark activity as read
 * POST /partner/dashboard/activity/:id/read
 */
router.post('/:id/read', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.sub || req.auth.user_id;
    const activityId = parseInt(req.params.id);
    
    // Get user's organization
    const db = require('../config/database');
    const userResult = await db.pool.query(
      'SELECT organization_id FROM users WHERE id = $1',
      [userId]
    );
    
    if (!userResult.rows[0]?.organization_id) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }
    
    const organizationId = userResult.rows[0].organization_id;
    
    await activityLogService.markAsRead(activityId, organizationId);
    
    res.json({
      success: true,
      message: 'Activity marked as read'
    });
    
  } catch (error) {
    logger.error('Error marking activity as read:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to mark activity as read'
    });
  }
});

/**
 * Mark all activities as read
 * POST /partner/dashboard/activity/read-all
 */
router.post('/read-all', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.sub || req.auth.user_id;
    
    // Get user's organization
    const db = require('../config/database');
    const userResult = await db.pool.query(
      'SELECT organization_id FROM users WHERE id = $1',
      [userId]
    );
    
    if (!userResult.rows[0]?.organization_id) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }
    
    const organizationId = userResult.rows[0].organization_id;
    
    const count = await activityLogService.markAllAsRead(organizationId);
    
    res.json({
      success: true,
      message: `${count} activities marked as read`,
      count
    });
    
  } catch (error) {
    logger.error('Error marking all activities as read:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to mark activities as read'
    });
  }
});

/**
 * Get activity statistics
 * GET /partner/dashboard/activity/stats
 */
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.sub || req.auth.user_id;
    
    // Get user's organization
    const db = require('../config/database');
    const userResult = await db.pool.query(
      'SELECT organization_id FROM users WHERE id = $1',
      [userId]
    );
    
    if (!userResult.rows[0]?.organization_id) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }
    
    const organizationId = userResult.rows[0].organization_id;
    const days = parseInt(req.query.days) || 30;
    
    const stats = await activityLogService.getStatistics(organizationId, days);
    
    res.json({
      success: true,
      data: stats,
      meta: {
        timestamp: new Date().toISOString(),
        organizationId,
        days
      }
    });
    
  } catch (error) {
    logger.error('Error fetching activity statistics:', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity statistics'
    });
  }
});

module.exports = router;
