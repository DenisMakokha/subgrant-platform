const express = require('express');
const router = express.Router();
const budgetCategoryController = require('../controllers/budgetCategoryController');
const authMiddleware = require('../middleware/auth');
const rbacMiddleware = require('../middleware/rbac');

// All budget category routes require authentication
router.use(authMiddleware);

// Create a new budget category (Admin only)
router.post('/', 
  rbacMiddleware.checkPermission('budget_categories', 'create'),
  budgetCategoryController.createCategory
);

// Get all budget categories
router.get('/', 
  rbacMiddleware.checkPermission('budget_categories', 'read'),
  budgetCategoryController.getAllCategories
);

// Get budget category by ID
router.get('/:id', 
  rbacMiddleware.checkPermission('budget_categories', 'read'),
  budgetCategoryController.getCategoryById
);

// Get budget categories by project ID
router.get('/project/:project_id', 
  rbacMiddleware.checkPermission('budget_categories', 'read'),
  budgetCategoryController.getCategoriesByProjectId
);

// Get active budget categories by project ID
router.get('/project/:project_id/active', 
  rbacMiddleware.checkPermission('budget_categories', 'read'),
  budgetCategoryController.getActiveCategoriesByProjectId
);

// Update budget category (Admin only)
router.put('/:id', 
  rbacMiddleware.checkPermission('budget_categories', 'update'),
  budgetCategoryController.updateCategory
);

// Delete budget category (Admin only)
router.delete('/:id', 
  rbacMiddleware.checkPermission('budget_categories', 'delete'),
  budgetCategoryController.deleteCategory
);

module.exports = router;