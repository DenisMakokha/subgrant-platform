const express = require('express');
const router = express.Router();
const fundRequestController = require('../controllers/fundRequestController');
const authMiddleware = require('../middleware/auth');
const rbacMiddleware = require('../middleware/rbac');

// All fund request routes require authentication
router.use(authMiddleware);

// SSoT endpoints for fund requests
router.get('/ssot/fundRequest/list', fundRequestController.ssotList);
router.post('/ssot/fundRequest/create', fundRequestController.ssotCreate);

// Standard REST endpoints for fund requests
router.post('/', 
  rbacMiddleware.checkPermission('fund_requests', 'create'),
  fundRequestController.createFundRequest
);

router.get('/', 
  rbacMiddleware.checkPermission('fund_requests', 'read'),
  fundRequestController.getFundRequests
);

router.get('/:id', 
  rbacMiddleware.checkPermission('fund_requests', 'read'),
  fundRequestController.getFundRequestById
);

router.put('/:id', 
  rbacMiddleware.checkPermission('fund_requests', 'update'),
  fundRequestController.updateFundRequest
);

module.exports = router;