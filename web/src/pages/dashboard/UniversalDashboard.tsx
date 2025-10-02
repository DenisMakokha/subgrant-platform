import React from 'react';
import { DashboardShell } from '../../components/dashboard/shells';
import { PageLayout, GridLayout } from '../../components/dashboard/layouts';
import { useDashboard } from '../../hooks/useDashboard';
import { useCapabilities } from '../../hooks/useCapabilities';
import {
  BudgetSummaryWidget,
  ProjectTimelineWidget,
  ApprovalQueueWidget,
  ComplianceStatusWidget,
  RecentIssuesWidget,
  UpcomingReportsWidget
} from '../../components/dashboard/widgets/specific';
import { KPIWidget } from '../../components/dashboard/widgets/base';

/**
 * UniversalDashboard - Main dashboard page
 * 
 * Features:
 * - Auto-generates based on user capabilities
 * - Supports custom layouts
 * - Real-time data updates
 * - Responsive design
 * - Customizable widgets
 */

export default function UniversalDashboard() {
  const { dashboard, loading, error, refreshDashboard } = useDashboard();
  const { hasCapability } = useCapabilities();

  // Widget component mapping
  const widgetComponents: Record<string, React.ComponentType<any>> = {
    BudgetSummaryWidget,
    ProjectTimelineWidget,
    ApprovalQueueWidget,
    ComplianceStatusWidget,
    RecentIssuesWidget,
    UpcomingReportsWidget,
    KPIWidget
  };

  const renderWidget = (widgetConfig: any) => {
    // Check capability
    if (widgetConfig.capability && !hasCapability(widgetConfig.capability)) {
      return null;
    }

    const WidgetComponent = widgetComponents[widgetConfig.component];
    
    if (!WidgetComponent) {
      console.warn(`Widget component not found: ${widgetConfig.component}`);
      return null;
    }

    return (
      <div
        key={widgetConfig.id}
        className={`col-span-${widgetConfig.position.span}`}
      >
        <WidgetComponent {...widgetConfig.props} />
      </div>
    );
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (error) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={refreshDashboard}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (!dashboard || dashboard.widgets.length === 0) {
    return (
      <DashboardShell>
        <PageLayout
          title="Dashboard"
          subtitle="Welcome to your dashboard"
        >
          <div className="text-center py-16">
            <svg className="w-20 h-20 mx-auto text-gray-300 dark:text-gray-600 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Dashboard Configured
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your dashboard will appear here once you have been assigned capabilities.
            </p>
            <button
              onClick={refreshDashboard}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
            >
              Refresh Dashboard
            </button>
          </div>
        </PageLayout>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <PageLayout
        title={dashboard.name}
        subtitle={dashboard.description}
        actions={
          <div className="flex items-center space-x-3">
            <button
              onClick={refreshDashboard}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Refresh dashboard"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Customize dashboard"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        }
      >
        <GridLayout columns={dashboard.columns as 1 | 2 | 3 | 4 || 3}>
          {dashboard.widgets.map(renderWidget)}
        </GridLayout>
      </PageLayout>
    </DashboardShell>
  );
}
