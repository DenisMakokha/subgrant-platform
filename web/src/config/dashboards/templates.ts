import { DashboardTemplate } from './types';

/**
 * Pre-built Dashboard Templates
 * 
 * These templates provide starting points for different user types
 * and can be customized based on user capabilities
 */

export const dashboardTemplates: DashboardTemplate[] = [
  // Executive Dashboard
  {
    id: 'executive',
    name: 'Executive Overview',
    description: 'High-level KPIs and strategic metrics for leadership',
    category: 'executive',
    requiredCapabilities: ['budgets.view', 'projects.view', 'me_reports.view'],
    config: {
      id: 'executive-dashboard',
      name: 'Executive Overview',
      layout: 'grid',
      columns: 3,
      isDefault: false,
      isCustomizable: true,
      widgets: [
        {
          id: 'total-budget',
          type: 'kpi',
          component: 'KPIWidget',
          position: { row: 0, col: 0, span: 1 },
          capability: 'budgets.view',
          props: {
            title: 'Total Budget',
            metric: 'total_budget',
            icon: 'dollar',
            color: 'blue'
          }
        },
        {
          id: 'active-projects',
          type: 'kpi',
          component: 'KPIWidget',
          position: { row: 0, col: 1, span: 1 },
          capability: 'projects.view',
          props: {
            title: 'Active Projects',
            metric: 'active_projects',
            icon: 'folder',
            color: 'green'
          }
        },
        {
          id: 'pending-approvals',
          type: 'kpi',
          component: 'KPIWidget',
          position: { row: 0, col: 2, span: 1 },
          capability: 'approvals.view',
          props: {
            title: 'Pending Approvals',
            metric: 'pending_approvals',
            icon: 'check',
            color: 'yellow'
          }
        },
        {
          id: 'budget-utilization',
          type: 'chart',
          component: 'ChartWidget',
          position: { row: 1, col: 0, span: 2 },
          capability: 'budgets.view',
          props: {
            title: 'Budget Utilization Trend',
            chartType: 'line',
            metric: 'budget_trend'
          }
        },
        {
          id: 'project-status',
          type: 'status',
          component: 'ChartWidget',
          position: { row: 1, col: 2, span: 1 },
          capability: 'projects.view',
          props: {
            title: 'Project Status',
            chartType: 'donut',
            metric: 'project_status'
          }
        }
      ]
    }
  },

  // Finance Dashboard
  {
    id: 'finance',
    name: 'Financial Overview',
    description: 'Comprehensive financial tracking and budget management',
    category: 'finance',
    requiredCapabilities: ['budgets.view', 'disbursements.view', 'financial_reports.view'],
    config: {
      id: 'finance-dashboard',
      name: 'Financial Overview',
      layout: 'grid',
      columns: 3,
      isDefault: false,
      isCustomizable: true,
      widgets: [
        {
          id: 'budget-summary',
          type: 'custom',
          component: 'BudgetSummaryWidget',
          position: { row: 0, col: 0, span: 2 },
          capability: 'budgets.view',
          props: {}
        },
        {
          id: 'pending-disbursements',
          type: 'kpi',
          component: 'KPIWidget',
          position: { row: 0, col: 2, span: 1 },
          capability: 'disbursements.view',
          props: {
            title: 'Pending Disbursements',
            metric: 'pending_disbursements',
            icon: 'credit-card',
            color: 'purple'
          }
        },
        {
          id: 'monthly-spending',
          type: 'chart',
          component: 'ChartWidget',
          position: { row: 1, col: 0, span: 3 },
          capability: 'budgets.view',
          props: {
            title: 'Monthly Spending',
            chartType: 'bar',
            metric: 'monthly_spending'
          }
        }
      ]
    }
  },

  // Operations Dashboard
  {
    id: 'operations',
    name: 'Operations Overview',
    description: 'Day-to-day operational metrics and task management',
    category: 'operations',
    requiredCapabilities: ['projects.view', 'me_reports.view', 'compliance.view'],
    config: {
      id: 'operations-dashboard',
      name: 'Operations Overview',
      layout: 'grid',
      columns: 3,
      isDefault: false,
      isCustomizable: true,
      widgets: [
        {
          id: 'project-timeline',
          type: 'custom',
          component: 'ProjectTimelineWidget',
          position: { row: 0, col: 0, span: 2 },
          capability: 'projects.view',
          props: {}
        },
        {
          id: 'compliance-status',
          type: 'custom',
          component: 'ComplianceStatusWidget',
          position: { row: 0, col: 2, span: 1 },
          capability: 'compliance.view',
          props: {}
        },
        {
          id: 'upcoming-reports',
          type: 'custom',
          component: 'UpcomingReportsWidget',
          position: { row: 1, col: 0, span: 2 },
          capability: 'me_reports.view',
          props: {}
        },
        {
          id: 'recent-issues',
          type: 'custom',
          component: 'RecentIssuesWidget',
          position: { row: 1, col: 2, span: 1 },
          capability: 'issues.view',
          props: {}
        }
      ]
    }
  },

  // Partner Dashboard
  {
    id: 'partner',
    name: 'Partner Dashboard',
    description: 'Essential tools and information for partners',
    category: 'custom',
    requiredCapabilities: ['budgets.view', 'projects.view'],
    config: {
      id: 'partner-dashboard',
      name: 'Partner Dashboard',
      layout: 'grid',
      columns: 3,
      isDefault: true,
      isCustomizable: true,
      widgets: [
        {
          id: 'my-budget',
          type: 'custom',
          component: 'BudgetSummaryWidget',
          position: { row: 0, col: 0, span: 2 },
          capability: 'budgets.view',
          props: {}
        },
        {
          id: 'compliance',
          type: 'custom',
          component: 'ComplianceStatusWidget',
          position: { row: 0, col: 2, span: 1 },
          capability: 'compliance.view',
          props: {}
        },
        {
          id: 'my-projects',
          type: 'custom',
          component: 'ProjectTimelineWidget',
          position: { row: 1, col: 0, span: 2 },
          capability: 'projects.view',
          props: {}
        },
        {
          id: 'my-reports',
          type: 'custom',
          component: 'UpcomingReportsWidget',
          position: { row: 1, col: 2, span: 1 },
          capability: 'me_reports.view',
          props: {}
        }
      ]
    }
  },

  // Grants Manager Dashboard
  {
    id: 'grants',
    name: 'Grants Manager Dashboard',
    description: 'Grants management and approval workflows',
    category: 'operations',
    requiredCapabilities: ['projects.view', 'applications.view', 'approvals.view'],
    config: {
      id: 'grants-dashboard',
      name: 'Grants Manager Dashboard',
      layout: 'grid',
      columns: 3,
      isDefault: true,
      isCustomizable: true,
      widgets: [
        {
          id: 'grants-applications-pending',
          type: 'kpi',
          component: 'GrantsApplicationsPendingWidget',
          position: { row: 0, col: 0, span: 1 },
          capability: 'applications.view',
          props: {}
        },
        {
          id: 'grants-projects-active',
          type: 'kpi',
          component: 'GrantsProjectsActiveWidget',
          position: { row: 0, col: 1, span: 1 },
          capability: 'projects.view',
          props: {}
        },
        {
          id: 'grants-compliance-rate',
          type: 'kpi',
          component: 'GrantsComplianceRateWidget',
          position: { row: 0, col: 2, span: 1 },
          capability: 'compliance.view',
          props: {}
        },
        {
          id: 'grants-approval-queue',
          type: 'list',
          component: 'GrantsApprovalQueueWidget',
          position: { row: 1, col: 0, span: 2 },
          capability: 'approvals.approve',
          props: {}
        },
        {
          id: 'grants-partner-performance',
          type: 'chart',
          component: 'GrantsPartnerPerformanceWidget',
          position: { row: 1, col: 2, span: 1 },
          capability: 'organizations.view',
          props: {}
        }
      ]
    }
  },

  // Admin Dashboard
  {
    id: 'admin',
    name: 'Admin Dashboard',
    description: 'System administration and monitoring',
    category: 'executive',
    requiredCapabilities: ['users.view', 'audit_logs.view', 'system.read'],
    config: {
      id: 'admin-dashboard',
      name: 'Admin Dashboard',
      layout: 'grid',
      columns: 3,
      isDefault: true,
      isCustomizable: true,
      widgets: [
        {
          id: 'total-users',
          type: 'kpi',
          component: 'KPIWidget',
          position: { row: 0, col: 0, span: 1 },
          capability: 'users.view',
          props: {
            title: 'Total Users',
            metric: 'total_users',
            icon: 'users',
            color: 'blue'
          }
        },
        {
          id: 'total-organizations',
          type: 'kpi',
          component: 'KPIWidget',
          position: { row: 0, col: 1, span: 1 },
          capability: 'organizations.view',
          props: {
            title: 'Organizations',
            metric: 'total_organizations',
            icon: 'building',
            color: 'green'
          }
        },
        {
          id: 'system-health',
          type: 'kpi',
          component: 'KPIWidget',
          position: { row: 0, col: 2, span: 1 },
          capability: 'system.read',
          props: {
            title: 'System Health',
            metric: 'system_health',
            icon: 'heart',
            color: 'red'
          }
        },
        {
          id: 'approval-queue',
          type: 'custom',
          component: 'ApprovalQueueWidget',
          position: { row: 1, col: 0, span: 2 },
          capability: 'approvals.view',
          props: {}
        },
        {
          id: 'recent-issues',
          type: 'custom',
          component: 'RecentIssuesWidget',
          position: { row: 1, col: 2, span: 1 },
          capability: 'issues.view',
          props: {}
        }
      ]
    }
  }
];

export function getDashboardTemplate(id: string): DashboardTemplate | undefined {
  return dashboardTemplates.find(template => template.id === id);
}

export function getDashboardTemplatesByCategory(category: string): DashboardTemplate[] {
  return dashboardTemplates.filter(template => template.category === category);
}

export function getDefaultDashboardForRole(role: string): DashboardTemplate | undefined {
  const roleTemplateMap: Record<string, string> = {
    admin: 'admin',
    partner: 'partner',
    partner_user: 'partner',
    grants_manager: 'grants',  // Fixed: was 'operations', now 'grants'
    coo: 'executive',
    finance_manager: 'finance',
    accountant: 'finance'
  };

  const templateId = roleTemplateMap[role] || 'partner';
  return getDashboardTemplate(templateId);
}
