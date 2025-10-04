import React, { useState } from 'react';
import { useAdminActivity } from '../../hooks/useAdminActivity';
import { formatDistanceToNow } from 'date-fns';

interface AdminActivityWidgetProps {
  limit?: number;
  showFilters?: boolean;
  autoRefresh?: number;
}

const AdminActivityWidget: React.FC<AdminActivityWidgetProps> = ({
  limit = 10,
  showFilters = false,
  autoRefresh = 30000,
}) => {
  const [filters, setFilters] = useState({
    limit,
    action: undefined as string | undefined,
    entityType: undefined as string | undefined,
  });

  const { activities, loading, error, refreshActivities } = useAdminActivity(
    filters,
    autoRefresh
  );

  const getActionIcon = (action: string) => {
    if (action.includes('create')) return '➕';
    if (action.includes('update')) return '✏️';
    if (action.includes('delete')) return '🗑️';
    if (action.includes('approve')) return '✅';
    if (action.includes('reject')) return '❌';
    return '📝';
  };

  const getActionColor = (result: string) => {
    switch (result) {
      case 'success':
        return 'text-green-600';
      case 'failure':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatAction = (action: string) => {
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading && activities.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading activities...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">⚠️ {error}</p>
          <button
            onClick={refreshActivities}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Admin Activity Log
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Recent administrative actions
            </p>
          </div>
          <button
            onClick={refreshActivities}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 transition"
            title="Refresh"
          >
            <svg
              className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 flex gap-3">
            <select
              value={filters.action || ''}
              onChange={(e) =>
                setFilters({ ...filters, action: e.target.value || undefined })
              }
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Actions</option>
              <option value="create_user">Create User</option>
              <option value="update_user">Update User</option>
              <option value="delete_user">Delete User</option>
              <option value="create_role">Create Role</option>
              <option value="update_role">Update Role</option>
              <option value="update_config">Update Config</option>
            </select>

            <select
              value={filters.entityType || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  entityType: e.target.value || undefined,
                })
              }
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Entities</option>
              <option value="user">Users</option>
              <option value="role">Roles</option>
              <option value="organization">Organizations</option>
              <option value="config">Configuration</option>
              <option value="approval">Approvals</option>
            </select>
          </div>
        )}
      </div>

      {/* Activity List */}
      <div className="divide-y divide-gray-100">
        {activities.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <svg
              className="w-12 h-12 mx-auto mb-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-sm">No activities recorded yet</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="px-6 py-4 hover:bg-gray-50 transition"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex-shrink-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                      activity.result === 'success'
                        ? 'bg-green-100'
                        : activity.result === 'error'
                        ? 'bg-red-100'
                        : 'bg-yellow-100'
                    }`}
                  >
                    {getActionIcon(activity.action)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.admin_email}
                    </p>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(activity.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-sm font-medium ${getActionColor(
                        activity.result
                      )}`}
                    >
                      {formatAction(activity.action)}
                    </span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-600 uppercase font-medium">
                      {activity.entity_type}
                    </span>
                    {activity.entity_id && (
                      <>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-xs text-gray-500">
                          ID: {activity.entity_id}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Error Message */}
                  {activity.error_message && (
                    <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                      {activity.error_message}
                    </div>
                  )}

                  {/* IP Address */}
                  {activity.ip_address && (
                    <div className="mt-1 text-xs text-gray-500">
                      IP: {activity.ip_address}
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <div className="flex-shrink-0">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      activity.result === 'success'
                        ? 'bg-green-100 text-green-800'
                        : activity.result === 'error'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {activity.result}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {activities.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {activities.length} of {activities.length} activities
            </p>
            <a
              href="/admin/audit-center"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition"
            >
              View All →
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminActivityWidget;
