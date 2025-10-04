import React from 'react';

interface Widget {
  id: string;
  name: string;
  description: string;
  widget_type: string;
  category: string;
}

interface DashboardPreviewProps {
  widgets: string[];
  availableWidgets: Widget[];
  columns?: number;
  roleName?: string;
}

export default function DashboardPreview({
  widgets,
  availableWidgets,
  columns = 3,
  roleName = 'User'
}: DashboardPreviewProps) {
  const getWidgetTypeIcon = (type: string) => {
    switch (type) {
      case 'kpi':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'chart':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        );
      case 'list':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
      case 'table':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
        );
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'financial':
        return 'from-green-500 to-emerald-600';
      case 'operational':
        return 'from-blue-500 to-indigo-600';
      case 'compliance':
        return 'from-purple-500 to-pink-600';
      case 'analytics':
        return 'from-orange-500 to-red-600';
      default:
        return 'from-gray-500 to-slate-600';
    }
  };

  if (widgets.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
        <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Widgets Selected
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Select widgets from the list above to see a preview of your dashboard
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Preview Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-1">Dashboard Preview</h3>
            <p className="text-blue-100 text-sm">
              {roleName} Dashboard • {widgets.length} widgets • {columns} columns
            </p>
          </div>
          <div className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
            Preview Mode
          </div>
        </div>
      </div>

      {/* Widget Grid Preview */}
      <div className={`grid gap-4 grid-cols-1 md:grid-cols-${columns}`}>
        {widgets.map((widgetId, index) => {
          const widget = availableWidgets.find(w => w.id === widgetId);
          if (!widget) return null;

          return (
            <div
              key={widgetId}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      #{index + 1}
                    </span>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {widget.name}
                    </h4>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {widget.description}
                  </p>
                </div>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${getCategoryColor(widget.category)} text-white`}>
                  {getWidgetTypeIcon(widget.widget_type)}
                </div>
              </div>

              {/* Mock Widget Content */}
              <div className="space-y-3">
                {widget.widget_type === 'kpi' && (
                  <div className="text-center py-4">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                      {Math.floor(Math.random() * 1000)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Sample KPI Value
                    </div>
                  </div>
                )}

                {widget.widget_type === 'chart' && (
                  <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                )}

                {widget.widget_type === 'list' && (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-600 rounded"></div>
                      </div>
                    ))}
                  </div>
                )}

                {widget.widget_type === 'table' && (
                  <div className="space-y-1">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex gap-2">
                        <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded"></div>
                        <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded"></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Widget Footer */}
              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-400">
                    {widget.widget_type}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {widget.category}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Preview Information
            </h4>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              This is a preview of how the dashboard will look. Actual widget data will be loaded from the database when users access their dashboard. Widgets can be rearranged using drag-and-drop after creation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
