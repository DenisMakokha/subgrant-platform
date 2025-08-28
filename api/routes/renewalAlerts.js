const express = require('express');
const router = express.Router();
const renewalAlertController = require('../controllers/renewalAlertController');
const authMiddleware = require('../middleware/auth');
const rbacMiddleware = require('../middleware/rbac');

// All renewal alert routes require authentication
router.use(authMiddleware);

// Get renewal alerts for the current user
router.get('/', 
  rbacMiddleware.checkPermission('renewal_alerts', 'read'),
  renewalAlertController.getRenewalAlerts
);

// Send renewal alerts (admin only)
router.post('/send', 
  rbacMiddleware.checkPermission('renewal_alerts', 'create'),
  renewalAlertController.sendRenewalAlerts
);

// Check for renewal alerts (for testing)
router.get('/check', 
  rbacMiddleware.checkPermission('renewal_alerts', 'read'),
  renewalAlertController.checkRenewalAlerts
);

module.exports = router;