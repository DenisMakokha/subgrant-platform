const express = require('express');
const router = express.Router();
const adminExecutiveController = require('../controllers/adminExecutiveController');
const { query } = require('express-validator');

/**
 * Executive Dashboard Routes
 */

// GET /api/admin/executive/dashboard - Get complete executive dashboard data
router.get('/dashboard', adminExecutiveController.getDashboardData);

// GET /api/admin/executive/kpis - Get executive KPIs
router.get('/kpis', adminExecutiveController.getExecutiveKPIs);

// GET /api/admin/executive/financial - Get financial summary
router.get('/financial', adminExecutiveController.getFinancialSummary);

// GET /api/admin/executive/programs - Get program performance data
router.get('/programs', adminExecutiveController.getProgramPerformance);

// GET /api/admin/executive/initiatives - Get strategic initiatives
router.get('/initiatives', adminExecutiveController.getStrategicInitiatives);

// GET /api/admin/executive/alerts - Get executive alerts
router.get('/alerts', adminExecutiveController.getExecutiveAlerts);

// GET /api/admin/executive/trends - Get trend data
router.get('/trends', adminExecutiveController.getTrends);

// GET /api/admin/executive/summary - Get dashboard summary for widgets/cards
router.get('/summary', adminExecutiveController.getDashboardSummary);

// GET /api/admin/executive/export - Export executive dashboard data
router.get('/export', [
  query('format').optional().isIn(['json', 'csv', 'excel', 'pdf'])
], adminExecutiveController.exportDashboardData);

module.exports = router;
