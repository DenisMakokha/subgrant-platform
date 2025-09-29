const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');
const actionController = require('../controllers/actionController');
const authMiddleware = require('../middleware/auth');

// All SSoT routes require authentication
router.use(authMiddleware);

// Generic data endpoint
router.get('/*', dataController.getDataByKey);

// Generic action endpoint
router.post('/action', actionController.executeAction);

module.exports = router;