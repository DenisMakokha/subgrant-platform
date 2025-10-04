import React from 'react';
import { useActivityLog, Activity } from '../../hooks/useActivityLog';
import { formatDistanceToNow } from 'date-fns';

// Activity icon mapping
const getActivityIcon = (category: string, severity: string) => {
  if (severity === 'error') return '❌';
  if (severity === 'warning') return '⚠️';
  if (severity === 'success') return '✅';
  
  switch (category) {
    case 'budget': return '💰';
    case 'report': return '📊';
    case 'document': return '📄';
    case 'project': return '🎯';
    case 'contract': return '📝';
    case 'system': return '⚙️';
    default: return '📌';
  }
};

// Activity color mapping
const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'error': return 'text-red-600 bg-red-50';
    case 'warning': return 'text-yellow-600 bg-yellow-50';
    case 'success': return 'text-green-600 bg-green-50';
    default: return 'text-blue-600 bg-blue-50';
  }
};

interface RecentActivityWidgetProps {
  limit?: number;
  showMarkAllRead?: boolean;
  autoRefresh?: boolean;
}

export const RecentActivityWidget: React.FC<RecentActivityWidgetProps> = ({
  limit = 10,
  showMarkAllRead = true,
  autoRefresh = true,
}) => {
  const {
    activities,
    loading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useActivityLog({
    limit,
    autoRefresh,
    refreshInterval: 30000, // 30 seconds
  });

  const handleActivityClick = async (activity: Activity) => {
    if (!activity.is_read) {
      try {
        await markAsRead(activity.id);
      } catch (err) {
        console.error('Failed to mark as read:', err);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  if (loading && activities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
        </div>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-red-600">⚠️ {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
          {unreadCount > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              {unreadCount} new
            </span>
          )}
        </div>
        {showMarkAllRead && unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Activity List */}
      <div className="space-y-3">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg">📭</p>
            <p className="mt-2">No recent activity</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              onClick={() => handleActivityClick(activity)}
              className={`flex items-start space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                activity.is_read
                  ? 'bg-gray-50 hover:bg-gray-100'
                  : 'bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500'
              }`}
            >
              {/* Icon */}
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl ${getSeverityColor(
                  activity.severity
                )}`}
              >
                {getActivityIcon(activity.activity_category, activity.severity)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <p
                    className={`text-sm font-medium ${
                      activity.is_read ? 'text-gray-700' : 'text-gray-900'
                    }`}
                  >
                    {activity.title}
                  </p>
                  {!activity.is_read && (
                    <span className="ml-2 flex-shrink-0 inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                  )}
                </div>
                {activity.description && (
                  <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                    {activity.description}
                  </p>
                )}
                <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500">
                  <span className="capitalize">{activity.activity_category}</span>
                  <span>•</span>
                  <span>
                    {formatDistanceToNow(new Date(activity.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* View All Link */}
      {activities.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 text-center">
          <a
            href="/partner/activity"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View all activity →
          </a>
        </div>
      )}
    </div>
  );
};

export default RecentActivityWidget;
