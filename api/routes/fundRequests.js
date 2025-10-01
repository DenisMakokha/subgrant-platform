const express = require('express');
const router = express.Router();
const fundRequestController = require('../controllers/fundRequestController');
const authMiddleware = require('../middleware/auth');

// All fund request routes require authentication
router.use(authMiddleware);

// SSoT endpoints for fund requests
router.get('/ssot/fundRequest/list', fundRequestController.ssotList);
router.post('/ssot/fundRequest/create', fundRequestController.ssotCreate);
router.post('/ssot/fundRequest/update', fundRequestController.ssotUpdate);
router.post('/ssot/fundRequest/submit', fundRequestController.ssotSubmit);
router.delete('/ssot/fundRequest/delete', fundRequestController.ssotDelete);

module.exports = router;