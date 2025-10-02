import React, { useState, useCallback } from 'react';
import { DashboardShell } from '../../components/dashboard/shells';
import { PageLayout, GridLayout } from '../../components/dashboard/layouts';
import { useDashboard } from '../../hooks/useDashboard';
import { useCapabilities } from '../../hooks/useCapabilities';
import { useAuth } from '../../contexts/AuthContext';
import { getUserDisplayName } from '../../utils/format';
import { useRealTimeWidgets } from '../../hooks/useRealTimeWidgets';
import { exportDashboardToPDF } from '../../utils/dashboardExport';
import DraggableDashboard from '../../components/dashboard/DraggableDashboard';
import { WidgetConfig } from '../../config/dashboards/types';
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
  const { dashboard, loading, error, refreshDashboard, updatePreferences } = useDashboard();
  const { hasCapability } = useCapabilities();
  const { user, organization } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [widgetData, setWidgetData] = useState<Record<string, any>>({});

  // Real-time updates
  const handleWidgetUpdate = useCallback((widgetId: string, data: any) => {
    setWidgetData(prev => ({
      ...prev,
      [widgetId]: data
    }));
  }, []);

  const { connected: wsConnected } = useRealTimeWidgets({
    widgetIds: dashboard?.widgets.map(w => w.id) || [],
    onUpdate: handleWidgetUpdate,
    enabled: !!dashboard
  });

  // Handle widget reorder
  const handleWidgetReorder = useCallback(async (reorderedWidgets: WidgetConfig[]) => {
    if (!dashboard) return;

    try {
      await updatePreferences({
        widgetOrder: reorderedWidgets.map(w => w.id),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to save widget order:', error);
    }
  }, [dashboard, updatePreferences]);

  // Handle PDF export
  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      await exportDashboardToPDF('dashboard-content', {
        filename: `${dashboard?.name || 'dashboard'}-${new Date().toISOString().split('T')[0]}.pdf`,
        orientation: 'landscape',
        includeHeader: true,
        includeFooter: true
      });
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  }, [dashboard]);

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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="space-y-4 sm:space-y-6">
          {/* Modern Welcome Header */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-3xl shadow-2xl border border-white/10">
            <div className="absolute inset-0 bg-black/10"></div>
            {/* Decorative Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
              }}></div>
            </div>
            <div className="relative p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-xl flex-shrink-0">
                      <span className="text-lg sm:text-2xl font-bold text-white">
                        {getUserDisplayName(user).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 truncate">
                        {dashboard.name}
                      </h1>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <span className="inline-flex px-2 sm:px-3 py-1 bg-white/20 rounded-full text-xs sm:text-sm font-medium backdrop-blur-sm border border-white/30 w-fit">
                          ✨ {user?.role?.toUpperCase() || 'USER'}
                        </span>
                        {dashboard.description && (
                          <>
                            <span className="text-white/80 hidden sm:inline">•</span>
                            <span className="font-medium text-white/90 text-sm sm:text-base truncate">{dashboard.description}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Real-time Status Indicator */}
                  {wsConnected && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                      <span className="text-xs font-medium text-white">Live</span>
                    </div>
                  )}
                  
                  {/* Edit Mode Toggle */}
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className={`p-3 rounded-xl backdrop-blur-sm border transition-all duration-300 shadow-lg hover:shadow-xl ${
                      editMode
                        ? 'bg-yellow-500/90 border-yellow-400 text-white'
                        : 'bg-white/20 border-white/30 text-white hover:bg-white/30'
                    }`}
                    title={editMode ? 'Exit edit mode' : 'Edit layout'}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  
                  {/* Export PDF */}
                  <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="p-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Export to PDF"
                  >
                    {exporting ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </button>
                  
                  {/* Refresh */}
                  <button
                    onClick={refreshDashboard}
                    className="p-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 transition-all duration-300 shadow-lg hover:shadow-xl"
                    title="Refresh dashboard"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  
                  {/* Customize */}
                  <button
                    onClick={() => window.location.href = '/dashboard/customize'}
                    className="p-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 transition-all duration-300 shadow-lg hover:shadow-xl"
                    title="Customize dashboard"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-white/10 to-white/5 rounded-full -translate-y-20 translate-x-20 blur-sm"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-white/8 to-white/3 rounded-full translate-y-16 -translate-x-16 blur-sm"></div>
            <div className="absolute top-1/2 right-1/4 w-6 h-6 bg-white/20 rounded-full animate-pulse"></div>
            <div className="absolute top-1/4 right-1/3 w-4 h-4 bg-white/15 rounded-full animate-pulse delay-1000"></div>
          </div>

          {/* Edit Mode Banner */}
          {editMode && (
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <div>
                    <h3 className="text-white font-semibold">Edit Mode Active</h3>
                    <p className="text-white/90 text-sm">Drag and drop widgets to rearrange your dashboard</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditMode(false)}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* Widgets Grid */}
          <div id="dashboard-content">
            <DraggableDashboard
              widgets={dashboard.widgets}
              onReorder={handleWidgetReorder}
              renderWidget={(widget, index) => renderWidget(widget)}
              columns={dashboard.columns as number || 3}
              editMode={editMode}
            />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
