const express = require('express');
const router = express.Router();
const adminActivityLogService = require('../services/adminActivityLogService');
const logger = require('../utils/logger');

/**
 * Admin Activity Log Routes
 * All routes require admin authentication (handled by parent router)
 */

/**
 * GET /admin/activity
 * Get admin activities with optional filters
 */
router.get('/', async (req, res) => {
  try {
    const {
      adminId,
      action,
      entityType,
      limit,
      offset,
      startDate,
      endDate
    } = req.query;

    const options = {
      adminId: adminId ? parseInt(adminId) : undefined,
      action,
      entityType,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    };

    const activities = await adminActivityLogService.getActivities(options);

    res.json({
      success: true,
      data: activities,
      count: activities.length
    });
  } catch (error) {
    logger.error('Error fetching admin activities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch admin activities',
      details: error.message
    });
  }
});

/**
 * GET /admin/activity/stats
 * Get activity statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const { adminId, startDate, endDate } = req.query;

    const options = {
      adminId: adminId ? parseInt(adminId) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    };

    const stats = await adminActivityLogService.getActivityStats(options);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching activity stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity statistics',
      details: error.message
    });
  }
});

/**
 * GET /admin/activity/top-admins
 * Get most active admins
 */
router.get('/top-admins', async (req, res) => {
  try {
    const { limit, startDate, endDate } = req.query;

    const options = {
      limit: limit ? parseInt(limit) : 10,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    };

    const topAdmins = await adminActivityLogService.getMostActiveAdmins(options);

    res.json({
      success: true,
      data: topAdmins
    });
  } catch (error) {
    logger.error('Error fetching top admins:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top admins',
      details: error.message
    });
  }
});

/**
 * GET /admin/activity/action-distribution
 * Get action type distribution
 */
router.get('/action-distribution', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const options = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    };

    const distribution = await adminActivityLogService.getActionDistribution(options);

    res.json({
      success: true,
      data: distribution
    });
  } catch (error) {
    logger.error('Error fetching action distribution:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch action distribution',
      details: error.message
    });
  }
});

/**
 * GET /admin/activity/entity-distribution
 * Get entity type distribution
 */
router.get('/entity-distribution', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const options = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    };

    const distribution = await adminActivityLogService.getEntityDistribution(options);

    res.json({
      success: true,
      data: distribution
    });
  } catch (error) {
    logger.error('Error fetching entity distribution:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch entity distribution',
      details: error.message
    });
  }
});

/**
 * GET /admin/activity/timeline
 * Get activity timeline (hourly or daily)
 */
router.get('/timeline', async (req, res) => {
  try {
    const { interval, startDate, endDate } = req.query;

    const options = {
      interval: interval || 'day', // 'hour' or 'day'
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    };

    const timeline = await adminActivityLogService.getActivityTimeline(options);

    res.json({
      success: true,
      data: timeline
    });
  } catch (error) {
    logger.error('Error fetching activity timeline:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity timeline',
      details: error.message
    });
  }
});

/**
 * GET /admin/activity/search
 * Search activities by keyword
 */
router.get('/search', async (req, res) => {
  try {
    const { q, limit, offset } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query (q) is required'
      });
    }

    const options = {
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0
    };

    const results = await adminActivityLogService.searchActivities(q, options);

    res.json({
      success: true,
      data: results,
      count: results.length
    });
  } catch (error) {
    logger.error('Error searching activities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search activities',
      details: error.message
    });
  }
});

/**
 * GET /admin/activity/my-activity
 * Get current admin's activity
 */
router.get('/my-activity', async (req, res) => {
  try {
    const { limit, offset } = req.query;

    const options = {
      adminId: req.user.id,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0
    };

    const activities = await adminActivityLogService.getActivities(options);

    res.json({
      success: true,
      data: activities,
      count: activities.length
    });
  } catch (error) {
    logger.error('Error fetching my activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch your activity',
      details: error.message
    });
  }
});

module.exports = router;
