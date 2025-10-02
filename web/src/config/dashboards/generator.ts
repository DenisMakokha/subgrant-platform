import { DashboardConfig, WidgetConfig } from './types';

/**
 * Smart Dashboard Generator
 * 
 * Automatically generates dashboard configuration based on user capabilities
 * This ensures every user gets a relevant dashboard regardless of their role
 */

export function generateDashboardFromCapabilities(
  capabilities: string[],
  userId: string,
  userName: string
): DashboardConfig {
  const widgets: WidgetConfig[] = [];
  let row = 0;
  let col = 0;

  // Helper to add widget and manage grid position
  const addWidget = (widget: WidgetConfig) => {
    widget.position = { row, col, span: widget.position.span };
    widgets.push(widget);
    
    col += widget.position.span;
    if (col >= 3) {
      col = 0;
      row++;
    }
  };

  // Add KPI widgets based on view capabilities
  if (capabilities.includes('budgets.view')) {
    addWidget({
      id: 'budget-kpi',
      type: 'kpi',
      component: 'KPIWidget',
      position: { row: 0, col: 0, span: 1 },
      capability: 'budgets.view',
      props: {
        title: 'Total Budget',
        metric: 'total_budget',
        color: 'blue'
      }
    });
  }

  if (capabilities.includes('projects.view')) {
    addWidget({
      id: 'projects-kpi',
      type: 'kpi',
      component: 'KPIWidget',
      position: { row: 0, col: 0, span: 1 },
      capability: 'projects.view',
      props: {
        title: 'Active Projects',
        metric: 'active_projects',
        color: 'green'
      }
    });
  }

  if (capabilities.includes('approvals.view')) {
    addWidget({
      id: 'approvals-kpi',
      type: 'kpi',
      component: 'KPIWidget',
      position: { row: 0, col: 0, span: 1 },
      capability: 'approvals.view',
      props: {
        title: 'Pending Approvals',
        metric: 'pending_approvals',
        color: 'yellow'
      }
    });
  }

  // Add detailed widgets
  if (capabilities.includes('budgets.view')) {
    addWidget({
      id: 'budget-summary',
      type: 'custom',
      component: 'BudgetSummaryWidget',
      position: { row: 0, col: 0, span: 2 },
      capability: 'budgets.view',
      props: {}
    });
  }

  if (capabilities.includes('projects.view')) {
    addWidget({
      id: 'project-timeline',
      type: 'custom',
      component: 'ProjectTimelineWidget',
      position: { row: 0, col: 0, span: 2 },
      capability: 'projects.view',
      props: {}
    });
  }

  if (capabilities.includes('compliance.view')) {
    addWidget({
      id: 'compliance-status',
      type: 'custom',
      component: 'ComplianceStatusWidget',
      position: { row: 0, col: 0, span: 1 },
      capability: 'compliance.view',
      props: {}
    });
  }

  if (capabilities.includes('me_reports.view')) {
    addWidget({
      id: 'upcoming-reports',
      type: 'custom',
      component: 'UpcomingReportsWidget',
      position: { row: 0, col: 0, span: 2 },
      capability: 'me_reports.view',
      props: {}
    });
  }

  if (capabilities.includes('approvals.view')) {
    addWidget({
      id: 'approval-queue',
      type: 'custom',
      component: 'ApprovalQueueWidget',
      position: { row: 0, col: 0, span: 2 },
      capability: 'approvals.view',
      props: {}
    });
  }

  if (capabilities.includes('issues.view')) {
    addWidget({
      id: 'recent-issues',
      type: 'custom',
      component: 'RecentIssuesWidget',
      position: { row: 0, col: 0, span: 1 },
      capability: 'issues.view',
      props: {}
    });
  }

  // If no widgets were added, provide a default welcome widget
  if (widgets.length === 0) {
    widgets.push({
      id: 'welcome',
      type: 'custom',
      position: { row: 0, col: 0, span: 3 },
      props: {
        title: `Welcome, ${userName}!`,
        message: 'Your dashboard will appear here once you have been assigned capabilities.'
      }
    });
  }

  return {
    id: `auto-generated-${userId}`,
    name: 'My Dashboard',
    description: 'Automatically generated based on your capabilities',
    layout: 'grid',
    columns: 3,
    widgets,
    isDefault: false,
    isCustomizable: true
  };
}

/**
 * Get widget priority score for sorting
 * Higher priority widgets appear first
 */
function getWidgetPriority(widgetType: string, capability: string): number {
  const priorities: Record<string, number> = {
    'budgets.view': 100,
    'projects.view': 90,
    'approvals.view': 80,
    'me_reports.view': 70,
    'compliance.view': 60,
    'issues.view': 50
  };

  return priorities[capability] || 0;
}

/**
 * Optimize widget layout for better visual balance
 */
export function optimizeWidgetLayout(widgets: WidgetConfig[]): WidgetConfig[] {
  // Sort widgets by priority
  const sorted = [...widgets].sort((a, b) => {
    const priorityA = getWidgetPriority(a.type, a.capability || '');
    const priorityB = getWidgetPriority(b.type, b.capability || '');
    return priorityB - priorityA;
  });

  // Reassign positions
  let row = 0;
  let col = 0;

  sorted.forEach(widget => {
    widget.position = { row, col, span: widget.position.span };
    
    col += widget.position.span;
    if (col >= 3) {
      col = 0;
      row++;
    }
  });

  return sorted;
}

/**
 * Filter widgets based on user capabilities
 */
export function filterWidgetsByCapabilities(
  widgets: WidgetConfig[],
  capabilities: string[]
): WidgetConfig[] {
  return widgets.filter(widget => {
    if (!widget.capability) return true;
    return capabilities.includes(widget.capability);
  });
}
