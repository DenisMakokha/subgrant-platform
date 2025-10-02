const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
  getPreferences,
  updatePreferences,
  resetPreferences,
  getDashboardConfig,
  getWidgetData
} = require('../controllers/dashboardController');

/**
 * Dashboard Routes
 * Base path: /api/dashboard
 * 
 * All routes require authentication
 */

// User preferences
router.get('/preferences', requireAuth, getPreferences);
router.put('/preferences', requireAuth, updatePreferences);
router.delete('/preferences', requireAuth, resetPreferences);

// Dashboard configurations
router.get('/config/:id', requireAuth, getDashboardConfig);

// Widget data
router.get('/widgets/:widgetId/data', requireAuth, getWidgetData);

module.exports = router;
