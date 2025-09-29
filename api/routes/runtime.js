const express = require('express');
const router = express.Router();
const runtimeController = require('../controllers/runtimeController');
const authMiddleware = require('../middleware/auth');

// All runtime routes require authentication
router.use(authMiddleware);

// Runtime APIs
router.get('/experience', runtimeController.getExperience);
router.get('/dashboard-config', runtimeController.getDashboardConfig);

module.exports = router;