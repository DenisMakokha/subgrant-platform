import React from 'react';
import { useActivityLog } from '../../hooks/useActivityLog';

// Category display config
const categoryConfig: Record<string, { icon: string; label: string; color: string }> = {
  budget: {
    icon: '💰',
    label: 'Budget',
    color: 'bg-green-100 text-green-800',
  },
  report: {
    icon: '📊',
    label: 'Reports',
    color: 'bg-blue-100 text-blue-800',
  },
  document: {
    icon: '📄',
    label: 'Documents',
    color: 'bg-purple-100 text-purple-800',
  },
  project: {
    icon: '🎯',
    label: 'Projects',
    color: 'bg-orange-100 text-orange-800',
  },
  contract: {
    icon: '📝',
    label: 'Contracts',
    color: 'bg-indigo-100 text-indigo-800',
  },
  system: {
    icon: '⚙️',
    label: 'System',
    color: 'bg-gray-100 text-gray-800',
  },
};

export const ActivityStatsWidget: React.FC = () => {
  const { stats, loading, unreadCount } = useActivityLog({
    autoRefresh: true,
    refreshInterval: 60000, // 1 minute
  });

  if (loading && stats.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Activity Overview</h3>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const totalActivities = stats.reduce((sum, stat) => sum + stat.count, 0);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Activity Overview</h3>
        {unreadCount > 0 && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            {unreadCount} unread
          </span>
        )}
      </div>

      {/* Total Activity Count */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
        <div className="text-center">
          <p className="text-3xl font-bold text-gray-900">{totalActivities}</p>
          <p className="text-sm text-gray-600 mt-1">Total Activities</p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="space-y-3">
        {stats.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No activity data available</p>
          </div>
        ) : (
          stats.map((stat) => {
            const config = categoryConfig[stat.activity_category] || {
              icon: '📌',
              label: stat.activity_category,
              color: 'bg-gray-100 text-gray-800',
            };
            
            const percentage = totalActivities > 0 
              ? Math.round((stat.count / totalActivities) * 100)
              : 0;

            return (
              <div key={stat.activity_category} className="space-y-2">
                {/* Category Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{config.icon}</span>
                    <span className="text-sm font-medium text-gray-700">
                      {config.label}
                    </span>
                    {stat.unread_count > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {stat.unread_count} new
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {stat.count}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({percentage}%)
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      stat.unread_count > 0 
                        ? 'bg-blue-600' 
                        : 'bg-gray-400'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Note */}
      {stats.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Last 30 days of activity
          </p>
        </div>
      )}
    </div>
  );
};

export default ActivityStatsWidget;
