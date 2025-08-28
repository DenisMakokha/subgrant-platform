const MeReport = require('../models/meReport');
const FinancialReport = require('../models/financialReport');
const Disbursement = require('../models/disbursement');
const Budget = require('../models/budget');
const Project = require('../models/project');

class KpiController {
  // Get KPI dashboard data
  static async getKpiDashboardData(req, res, next) {
    try {
      // Get user's organization if they're a partner
      const organizationId = req.user.organization_id;
      
      // Get KPI data based on user role
      let kpiData;
      if (req.user.role === 'admin' || req.user.role === 'm&e_officer') {
        // Admin and M&E officers get overall KPIs
        kpiData = await KpiController.getOverallKpiData();
      } else if (req.user.role === 'partner_user' && organizationId) {
        // Partner users get KPIs for their organization
        kpiData = await KpiController.getPartnerKpiData(organizationId);
      } else {
        // Other users get limited KPIs
        kpiData = await KpiController.getLimitedKpiData();
      }
      
      res.json(kpiData);
    } catch (err) {
      next(err);
    }
  }
  
  // Get overall KPI data for admin and M&E officers
  static async getOverallKpiData() {
    try {
      // Get counts for different entities
      const activeProjects = await Project.countActive();
      const totalBudgets = await Budget.countAll();
      const approvedBudgets = await Budget.countApproved();
      const pendingReports = await MeReport.countPending();
      const totalDisbursements = await Disbursement.countAll();
      const completedDisbursements = await Disbursement.countCompleted();
      
      // Calculate financial metrics
      const totalBudgetAmount = await Budget.getTotalAmount();
      const totalDisbursedAmount = await Disbursement.getTotalAmount();
      
      // Get recent reports
      const recentMeReports = await MeReport.getRecent(5);
      const recentFinancialReports = await FinancialReport.getRecent(5);
      
      return {
        overview: {
          activeProjects,
          totalBudgets,
          approvedBudgets,
          pendingReports,
          totalDisbursements,
          completedDisbursements,
          totalBudgetAmount,
          totalDisbursedAmount
        },
        recentReports: {
          meReports: recentMeReports,
          financialReports: recentFinancialReports
        }
      };
    } catch (error) {
      throw error;
    }
  }
  
  // Get KPI data for a specific partner organization
  static async getPartnerKpiData(organizationId) {
    try {
      // Get counts for partner's entities
      const organizationBudgets = await Budget.countByOrganization(organizationId);
      const organizationApprovedBudgets = await Budget.countApprovedByOrganization(organizationId);
      const organizationPendingReports = await MeReport.countPendingByOrganization(organizationId);
      const organizationDisbursements = await Disbursement.countByOrganization(organizationId);
      const organizationCompletedDisbursements = await Disbursement.countCompletedByOrganization(organizationId);
      
      // Calculate financial metrics for the organization
      const organizationBudgetAmount = await Budget.getTotalAmountByOrganization(organizationId);
      const organizationDisbursedAmount = await Disbursement.getTotalAmountByOrganization(organizationId);
      
      // Get recent reports for the organization
      const recentMeReports = await MeReport.getRecentByOrganization(organizationId, 5);
      const recentFinancialReports = await FinancialReport.getRecentByOrganization(organizationId, 5);
      
      return {
        overview: {
          totalBudgets: organizationBudgets,
          approvedBudgets: organizationApprovedBudgets,
          pendingReports: organizationPendingReports,
          totalDisbursements: organizationDisbursements,
          completedDisbursements: organizationCompletedDisbursements,
          totalBudgetAmount: organizationBudgetAmount,
          totalDisbursedAmount: organizationDisbursedAmount
        },
        recentReports: {
          meReports: recentMeReports,
          financialReports: recentFinancialReports
        }
      };
    } catch (error) {
      throw error;
    }
  }
  
  // Get limited KPI data for other users
  static async getLimitedKpiData() {
    try {
      // Get only basic counts
      const activeProjects = await Project.countActive();
      const totalBudgets = await Budget.countAll();
      const approvedBudgets = await Budget.countApproved();
      
      return {
        overview: {
          activeProjects,
          totalBudgets,
          approvedBudgets
        }
      };
    } catch (error) {
      throw error;
    }
  }
  
  // Get KPI data for a specific project
  static async getProjectKpiData(req, res, next) {
    try {
      const { projectId } = req.params;
      
      // Verify user has access to this project
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      // Get project-specific KPIs
      const projectBudgets = await Budget.countByProject(projectId);
      const projectApprovedBudgets = await Budget.countApprovedByProject(projectId);
      const projectDisbursements = await Disbursement.countByProject(projectId);
      const projectCompletedDisbursements = await Disbursement.countCompletedByProject(projectId);
      
      // Calculate financial metrics for the project
      const projectBudgetAmount = await Budget.getTotalAmountByProject(projectId);
      const projectDisbursedAmount = await Disbursement.getTotalAmountByProject(projectId);
      
      // Get recent reports for the project
      const recentMeReports = await MeReport.getRecentByProject(projectId, 5);
      const recentFinancialReports = await FinancialReport.getRecentByProject(projectId, 5);
      
      const kpiData = {
        project: {
          id: project.id,
          name: project.name,
          status: project.status
        },
        overview: {
          totalBudgets: projectBudgets,
          approvedBudgets: projectApprovedBudgets,
          totalDisbursements: projectDisbursements,
          completedDisbursements: projectCompletedDisbursements,
          totalBudgetAmount: projectBudgetAmount,
          totalDisbursedAmount: projectDisbursedAmount
        },
        recentReports: {
          meReports: recentMeReports,
          financialReports: recentFinancialReports
        }
      };
      
      res.json(kpiData);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = KpiController;