const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const authMiddleware = require('../middleware/auth');
const rbacMiddleware = require('../middleware/rbac');

// All project routes require authentication
router.use(authMiddleware);

// Create a new project (Admin only)
router.post('/', 
  rbacMiddleware.checkPermission('projects', 'create'),
  projectController.createProject
);

// Get all projects
router.get('/', 
  rbacMiddleware.checkPermission('projects', 'read'),
  projectController.getAllProjects
);

// Get project by ID
router.get('/:id', 
  rbacMiddleware.checkPermission('projects', 'read'),
  projectController.getProjectById
);

// Update project (Admin only)
router.put('/:id', 
  rbacMiddleware.checkPermission('projects', 'update'),
  projectController.updateProject
);

// Delete project (Admin only)
router.delete('/:id', 
  rbacMiddleware.checkPermission('projects', 'delete'),
  projectController.deleteProject
);

// Get projects by status
router.get('/status/:status', 
  rbacMiddleware.checkPermission('projects', 'read'),
  projectController.getProjectsByStatus
);

// Add budget category to project (Admin only)
router.post('/:id/categories', 
  rbacMiddleware.checkPermission('budget_categories', 'create'),
  projectController.addBudgetCategory
);

// Get budget categories for project
router.get('/:id/categories',
  rbacMiddleware.checkPermission('budget_categories', 'read'),
  projectController.getProjectBudgetCategories
);

// Archive a project (Admin only)
router.patch('/:id/archive',
  rbacMiddleware.checkPermission('projects', 'update'),
  projectController.archiveProject
);

// Close a project (Admin only)
router.patch('/:id/close',
  rbacMiddleware.checkPermission('projects', 'update'),
  projectController.closeProject
);

// Get archived projects
router.get('/archived',
  rbacMiddleware.checkPermission('projects', 'read'),
  projectController.getArchivedProjects
);

// Get closed projects
router.get('/closed',
  rbacMiddleware.checkPermission('projects', 'read'),
  projectController.getClosedProjects
);

// Search projects
router.get('/search',
  rbacMiddleware.checkPermission('projects', 'read'),
  projectController.searchProjects
);

module.exports = router;