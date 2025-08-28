const express = require('express');
const router = express.Router();
const budgetLineController = require('../controllers/budgetLineController');
const authMiddleware = require('../middleware/auth');
const rbacMiddleware = require('../middleware/rbac');

// All budget line routes require authentication
router.use(authMiddleware);

// Create a new budget line
router.post('/', 
  rbacMiddleware.checkPermission('budget_lines', 'create'),
  budgetLineController.createBudgetLine
);

// Get all budget lines
router.get('/', 
  rbacMiddleware.checkPermission('budget_lines', 'read'),
  budgetLineController.getAllBudgetLines
);

// Get budget line by ID
router.get('/:id', 
  rbacMiddleware.checkPermission('budget_lines', 'read'),
  budgetLineController.getBudgetLineById
);

// Get budget lines by budget ID
router.get('/budget/:budget_id', 
  rbacMiddleware.checkPermission('budget_lines', 'read'),
  budgetLineController.getBudgetLinesByBudgetId
);

// Update budget line
router.put('/:id', 
  rbacMiddleware.checkPermission('budget_lines', 'update'),
  budgetLineController.updateBudgetLine
);

// Delete budget line
router.delete('/:id', 
  rbacMiddleware.checkPermission('budget_lines', 'delete'),
  budgetLineController.deleteBudgetLine
);

module.exports = router;