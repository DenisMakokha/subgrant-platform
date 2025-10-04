const express = require('express');
const router = express.Router();
const dashboardPreferencesController = require('../controllers/dashboardPreferencesController');
const authMiddleware = require('../middleware/auth');

/**
 * Dashboard Preferences Routes
 * All routes require authentication
 */

// Get user's dashboard preferences
router.get('/preferences', 
  authMiddleware, 
  dashboardPreferencesController.getUserPreferences
);

// Save/Update user's dashboard preferences
router.post('/preferences', 
  authMiddleware, 
  dashboardPreferencesController.saveUserPreferences
);

// Get available widgets for user
router.get('/widgets', 
  authMiddleware, 
  dashboardPreferencesController.getAvailableWidgets
);

// Get dashboard templates
router.get('/templates', 
  authMiddleware, 
  dashboardPreferencesController.getDashboardTemplates
);

// Reset preferences to default
router.post('/preferences/reset', 
  authMiddleware, 
  dashboardPreferencesController.resetToDefault
);

// Get widget data
router.get('/widgets/:widgetId/data', 
  authMiddleware, 
  dashboardPreferencesController.getWidgetData
);

// Get dashboard config by ID
router.get('/config/:id', 
  authMiddleware, 
  dashboardPreferencesController.getDashboardConfig
);

// Get dashboard template for role
router.get('/templates/role/:role', 
  authMiddleware, 
  dashboardPreferencesController.getDashboardForRole
);

// Create custom dashboard template
router.post('/templates', 
  authMiddleware, 
  dashboardPreferencesController.createDashboardTemplate
);

module.exports = router;
