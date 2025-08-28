const express = require('express');
const router = express.Router();
const kpiController = require('../controllers/kpiController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get KPI dashboard data
router.get('/dashboard', authorizeRole(['admin', 'm&e_officer', 'partner_user', 'accountant', 'finance_manager']), kpiController.getKpiDashboardData);

// Get KPI data for a specific project
router.get('/project/:projectId', authorizeRole(['admin', 'm&e_officer', 'partner_user', 'accountant', 'finance_manager']), kpiController.getProjectKpiData);

module.exports = router;