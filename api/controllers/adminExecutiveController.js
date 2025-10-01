const executiveDashboardService = require('../services/executiveDashboardService');

class AdminExecutiveController {
  /**
   * Get complete executive dashboard data
   */
  async getDashboardData(req, res) {
    try {
      const dashboardData = await executiveDashboardService.getDashboardData();

      res.json({
        success: true,
        data: dashboardData
      });
    } catch (error) {
      console.error('Error fetching executive dashboard data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch executive dashboard data',
        error: error.message
      });
    }
  }

  /**
   * Get executive KPIs
   */
  async getExecutiveKPIs(req, res) {
    try {
      const kpis = await executiveDashboardService.getExecutiveKPIs();

      res.json({
        success: true,
        data: kpis
      });
    } catch (error) {
      console.error('Error fetching executive KPIs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch executive KPIs',
        error: error.message
      });
    }
  }

  /**
   * Get financial summary
   */
  async getFinancialSummary(req, res) {
    try {
      const financialSummary = await executiveDashboardService.getFinancialSummary();

      res.json({
        success: true,
        data: financialSummary
      });
    } catch (error) {
      console.error('Error fetching financial summary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch financial summary',
        error: error.message
      });
    }
  }

  /**
   * Get program performance data
   */
  async getProgramPerformance(req, res) {
    try {
      const programPerformance = await executiveDashboardService.getProgramPerformance();

      res.json({
        success: true,
        data: programPerformance
      });
    } catch (error) {
      console.error('Error fetching program performance:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch program performance',
        error: error.message
      });
    }
  }

  /**
   * Get strategic initiatives
   */
  async getStrategicInitiatives(req, res) {
    try {
      const initiatives = await executiveDashboardService.getStrategicInitiatives();

      res.json({
        success: true,
        data: initiatives
      });
    } catch (error) {
      console.error('Error fetching strategic initiatives:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch strategic initiatives',
        error: error.message
      });
    }
  }

  /**
   * Get executive alerts
   */
  async getExecutiveAlerts(req, res) {
    try {
      const alerts = await executiveDashboardService.getExecutiveAlerts();

      res.json({
        success: true,
        data: alerts
      });
    } catch (error) {
      console.error('Error fetching executive alerts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch executive alerts',
        error: error.message
      });
    }
  }

  /**
   * Get trend data
   */
  async getTrends(req, res) {
    try {
      const trends = await executiveDashboardService.getTrends();

      res.json({
        success: true,
        data: trends
      });
    } catch (error) {
      console.error('Error fetching trends:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch trends',
        error: error.message
      });
    }
  }

  /**
   * Get dashboard summary for widgets/cards
   */
  async getDashboardSummary(req, res) {
    try {
      const kpis = await executiveDashboardService.getExecutiveKPIs();
      const alerts = await executiveDashboardService.getExecutiveAlerts();

      const summary = {
        totalBudget: kpis.totalBudget,
        totalDisbursed: kpis.totalDisbursed,
        activeProjects: kpis.activeProjects,
        completedProjects: kpis.completedProjects,
        partnerOrganizations: kpis.partnerOrganizations,
        programEfficiency: kpis.programEfficiency,
        riskScore: kpis.riskScore,
        complianceRate: kpis.complianceRate,
        criticalAlerts: alerts.filter(alert => alert.severity === 'critical').length,
        pendingApprovals: 0, // This would come from approval service
        systemAlerts: alerts.length
      };

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard summary',
        error: error.message
      });
    }
  }

  /**
   * Export executive dashboard data
   */
  async exportDashboardData(req, res) {
    try {
      const { format = 'json' } = req.query;
      const dashboardData = await executiveDashboardService.getDashboardData();

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `executive-dashboard-${timestamp}`;

      switch (format.toLowerCase()) {
        case 'csv':
          // Convert data to CSV format
          const csvData = this.convertToCSV(dashboardData);
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
          res.send(csvData);
          break;

        case 'excel':
          // For Excel export, you would typically use a library like 'exceljs'
          // For now, return JSON with Excel headers
          res.setHeader('Content-Type', 'application/vnd.ms-excel');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
          res.json(dashboardData);
          break;

        case 'pdf':
          // For PDF export, you would typically use a library like 'puppeteer' or 'pdfkit'
          // For now, return JSON with PDF headers
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
          res.json(dashboardData);
          break;

        default:
          // JSON format
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
          res.json(dashboardData);
      }
    } catch (error) {
      console.error('Error exporting dashboard data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export dashboard data',
        error: error.message
      });
    }
  }

  /**
   * Convert dashboard data to CSV format
   */
  convertToCSV(data) {
    let csv = '';

    // Add KPIs section
    csv += 'Executive KPIs\n';
    csv += 'Metric,Value\n';
    csv += `Total Budget,$${data.kpis.totalBudget.toLocaleString()}\n`;
    csv += `Total Disbursed,$${data.kpis.totalDisbursed.toLocaleString()}\n`;
    csv += `Active Projects,${data.kpis.activeProjects}\n`;
    csv += `Completed Projects,${data.kpis.completedProjects}\n`;
    csv += `Partner Organizations,${data.kpis.partnerOrganizations}\n`;
    csv += `Program Efficiency,${data.kpis.programEfficiency}%\n`;
    csv += `Risk Score,${data.kpis.riskScore}%\n`;
    csv += `Compliance Rate,${data.kpis.complianceRate}%\n\n`;

    // Add Financial Summary
    csv += 'Financial Summary\n';
    csv += 'Category,Amount,Percentage\n';
    data.financialSummary.topExpenseCategories.forEach(category => {
      csv += `${category.category},$${category.amount.toLocaleString()},${category.percentage}%\n`;
    });
    csv += '\n';

    // Add Program Performance
    csv += 'Program Performance\n';
    csv += 'Program,Status,Progress,Budget Utilization\n';
    data.programPerformance.programs.forEach(program => {
      csv += `${program.name},${program.status},${program.progress}%,${program.budgetUtilization}%\n`;
    });

    return csv;
  }
}

module.exports = new AdminExecutiveController();
