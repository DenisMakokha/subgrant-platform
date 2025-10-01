const budgetRepository = require('../repositories/partnerBudgetRepository');
const projectRepository = require('../repositories/projectRepository');
const organizationRepository = require('../repositories/OrganizationRepository');
const { Op } = require('sequelize');

class ExecutiveDashboardService {
  /**
   * Get executive KPIs
   */
  async getExecutiveKPIs() {
    try {
      // Get total budget from all approved budgets
      const totalBudget = await budgetRepository.getTotalBudget();

      // Get total disbursed amount
      const totalDisbursed = await budgetRepository.getTotalDisbursed();

      // Get active projects count
      const activeProjects = await projectRepository.count({
        where: { status: { [Op.in]: ['active', 'in_progress'] } }
      });

      // Get completed projects count (last 12 months)
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const completedProjects = await projectRepository.count({
        where: {
          status: 'completed',
          updatedAt: { [Op.gte]: oneYearAgo }
        }
      });

      // Get partner organizations count (finalized status means onboarding complete)
      const partnerOrganizations = await organizationRepository.count({
        where: { status: 'finalized' }
      });

      // Calculate program efficiency (mock calculation)
      const programEfficiency = this.calculateProgramEfficiency(totalDisbursed, totalBudget);

      // Calculate risk score (mock calculation)
      const riskScore = this.calculateRiskScore();

      // Calculate compliance rate (mock calculation)
      const complianceRate = this.calculateComplianceRate();

      return {
        totalBudget,
        totalDisbursed,
        activeProjects,
        completedProjects,
        partnerOrganizations,
        programEfficiency,
        riskScore,
        complianceRate
      };
    } catch (error) {
      throw new Error(`Failed to get executive KPIs: ${error.message}`);
    }
  }

  /**
   * Get financial summary
   */
  async getFinancialSummary() {
    try {
      const totalBudget = await budgetRepository.getTotalBudget() || 0;
      const totalSpent = await budgetRepository.getTotalDisbursed() || 0;
      const remainingBudget = totalBudget - totalSpent;

      // Get quarterly spending data
      const quarterlySpending = await this.getQuarterlySpending();

      // Get top expense categories
      const topExpenseCategories = await this.getTopExpenseCategories();

      return {
        totalBudget,
        totalSpent,
        remainingBudget,
        quarterlySpending,
        topExpenseCategories
      };
    } catch (error) {
      throw new Error(`Failed to get financial summary: ${error.message}`);
    }
  }

  /**
   * Get program performance data
   */
  async getProgramPerformance() {
    try {
      // Get all active projects
      const projects = await projectRepository.findAll({
        where: { status: { [Op.in]: ['active', 'in_progress', 'completed'] } }
      });

      // Limit to 50 projects
      const limitedProjects = projects.slice(0, 50);

      // Transform projects into program performance format
      const programs = await Promise.all(limitedProjects.map(async project => {
        // Get budget data for this project from partner_budgets
        const budgets = await budgetRepository.findByProject(project.id);
        
        const totalBudget = budgets.reduce((sum, budget) => sum + (parseFloat(budget.ceilingTotal) || 0), 0);
        const totalSpent = await this.getProjectSpending(project.id);
        const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

        // Mock milestones data
        const keyMilestones = this.generateMockMilestones(project);

        return {
          id: project.id,
          name: project.name,
          status: this.mapProjectStatusToProgramStatus(project.status),
          progress: this.calculateProjectProgress(project),
          budgetUtilization,
          keyMilestones
        };
      }));

      // Calculate overall health
      const overallHealth = this.calculateOverallHealth(programs);

      return {
        programs,
        overallHealth
      };
    } catch (error) {
      throw new Error(`Failed to get program performance: ${error.message}`);
    }
  }

  /**
   * Get total spending for a project
   */
  async getProjectSpending(projectId) {
    try {
      const db = require('../config/database');
      const query = `
        SELECT COALESCE(SUM(d.amount), 0) as total
        FROM disbursements d
        JOIN partner_budgets pb ON d.partner_budget_id = pb.id
        WHERE pb.project_id = $1 AND d.status = 'paid'
      `;
      const result = await db.pool.query(query, [projectId]);
      return parseFloat(result.rows[0]?.total || 0);
    } catch (error) {
      console.error('Error getting project spending:', error);
      return 0;
    }
  }

  /**
   * Get strategic initiatives
   */
  async getStrategicInitiatives() {
    try {
      // For now, return mock strategic initiatives
      // In a real implementation, this would come from a strategic initiatives table
      return [
        {
          id: '1',
          name: 'Digital Transformation Initiative',
          description: 'Implement comprehensive digital systems across all operations',
          status: 'in_progress',
          priority: 'high',
          progress: 65,
          startDate: new Date('2025-01-01'),
          targetDate: new Date('2025-12-31'),
          owner: 'Sarah Johnson',
          budget: 500000,
          spent: 325000,
          risks: [
            {
              description: 'Technical skills gap in partner organizations',
              impact: 'medium',
              probability: 'high',
              mitigation: 'Comprehensive training program implemented'
            }
          ]
        },
        {
          id: '2',
          name: 'Sustainability Framework Development',
          description: 'Create long-term sustainability model for program impacts',
          status: 'planning',
          priority: 'critical',
          progress: 15,
          startDate: new Date('2025-03-01'),
          targetDate: new Date('2026-02-28'),
          owner: 'Michael Chen',
          budget: 300000,
          spent: 45000,
          risks: [
            {
              description: 'Stakeholder alignment challenges',
              impact: 'high',
              probability: 'medium',
              mitigation: 'Regular stakeholder engagement sessions planned'
            }
          ]
        }
      ];
    } catch (error) {
      throw new Error(`Failed to get strategic initiatives: ${error.message}`);
    }
  }

  /**
   * Get executive alerts
   */
  async getExecutiveAlerts() {
    try {
      // Mock alerts - in real implementation, these would be generated based on business rules
      return [
        {
          id: '1',
          type: 'risk',
          title: 'Budget Variance Alert',
          description: 'Healthcare program showing 15% budget overrun risk',
          severity: 'medium',
          date: new Date()
        },
        {
          id: '2',
          type: 'milestone',
          title: 'Major Milestone Achieved',
          description: 'Education program reached 10,000 beneficiaries',
          severity: 'low',
          date: new Date()
        }
      ];
    } catch (error) {
      throw new Error(`Failed to get executive alerts: ${error.message}`);
    }
  }

  /**
   * Get trend data
   */
  async getTrends() {
    try {
      // Mock trend data - in real implementation, this would be calculated from historical data
      return {
        budgetUtilization: [
          { month: 'Jan', value: 72 },
          { month: 'Feb', value: 75 },
          { month: 'Mar', value: 78 },
          { month: 'Apr', value: 74 },
          { month: 'May', value: 76 },
          { month: 'Jun', value: 79 }
        ],
        projectSuccess: [
          { month: 'Jan', value: 85 },
          { month: 'Feb', value: 87 },
          { month: 'Mar', value: 89 },
          { month: 'Apr', value: 86 },
          { month: 'May', value: 88 },
          { month: 'Jun', value: 90 }
        ],
        partnerPerformance: [
          { month: 'Jan', value: 82 },
          { month: 'Feb', value: 84 },
          { month: 'Mar', value: 83 },
          { month: 'Apr', value: 86 },
          { month: 'May', value: 85 },
          { month: 'Jun', value: 87 }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to get trends: ${error.message}`);
    }
  }

  /**
   * Get complete executive dashboard data
   */
  async getDashboardData() {
    try {
      const [kpis, financialSummary, programPerformance, strategicInitiatives, alerts, trends] = await Promise.all([
        this.getExecutiveKPIs(),
        this.getFinancialSummary(),
        this.getProgramPerformance(),
        this.getStrategicInitiatives(),
        this.getExecutiveAlerts(),
        this.getTrends()
      ]);

      return {
        kpis,
        financialSummary,
        programPerformance,
        strategicInitiatives,
        alerts,
        trends
      };
    } catch (error) {
      throw new Error(`Failed to get dashboard data: ${error.message}`);
    }
  }

  /**
   * Helper methods
   */

  calculateProgramEfficiency(spent, budget) {
    if (budget === 0) return 0;
    const utilizationRate = (spent / budget) * 100;
    // Mock efficiency calculation based on utilization
    return Math.max(0, Math.min(100, 85 + (utilizationRate - 70) * 0.5));
  }

  calculateRiskScore() {
    // Mock risk calculation based on various factors
    return 23.1; // Mock value
  }

  calculateComplianceRate() {
    // Mock compliance calculation
    return 94.2; // Mock value
  }

  async getQuarterlySpending() {
    // Get real quarterly spending data from repository
    return await budgetRepository.getQuarterlySpending();
  }

  async getTopExpenseCategories() {
    // Get real expense categories from repository
    return await budgetRepository.getTopExpenseCategories(5);
  }

  mapProjectStatusToProgramStatus(projectStatus) {
    const statusMap = {
      'active': 'on_track',
      'in_progress': 'on_track',
      'completed': 'completed',
      'on_hold': 'at_risk',
      'cancelled': 'at_risk'
    };
    return statusMap[projectStatus] || 'on_track';
  }

  calculateProjectProgress(project) {
    // Mock progress calculation based on project status and dates
    const statusProgress = {
      'planning': 10,
      'active': 50,
      'in_progress': 75,
      'completed': 100,
      'on_hold': 25,
      'cancelled': 0
    };
    return statusProgress[project.status] || 0;
  }

  generateMockMilestones(project) {
    // Generate mock milestones based on project
    return [
      {
        name: 'Project Kickoff',
        dueDate: new Date(project.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000),
        status: 'completed'
      },
      {
        name: 'Mid-term Review',
        dueDate: new Date(project.createdAt.getTime() + 90 * 24 * 60 * 60 * 1000),
        status: project.status === 'completed' ? 'completed' : 'on_track'
      },
      {
        name: 'Final Deliverables',
        dueDate: new Date(project.createdAt.getTime() + 180 * 24 * 60 * 60 * 1000),
        status: project.status === 'completed' ? 'completed' : 'on_track'
      }
    ];
  }

  calculateOverallHealth(programs) {
    if (programs.length === 0) return 'good';

    const statusWeights = {
      'on_track': 3,
      'at_risk': 1,
      'behind': 0,
      'completed': 2
    };

    const totalScore = programs.reduce((sum, program) => {
      return sum + (statusWeights[program.status] || 1);
    }, 0);

    const averageScore = totalScore / programs.length;

    if (averageScore >= 2.5) return 'excellent';
    if (averageScore >= 2.0) return 'good';
    if (averageScore >= 1.5) return 'fair';
    return 'poor';
  }
}

module.exports = new ExecutiveDashboardService();
