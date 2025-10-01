import React, { useState, useEffect } from 'react';
import approvalChainApi, { ApprovalAnalytics } from '../../services/approvalChainApi';
import { toast } from 'react-toastify';

const ApprovalAnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<ApprovalAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });
  const [entityTypeFilter, setEntityTypeFilter] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, entityTypeFilter]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await approvalChainApi.getAnalytics({
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
        entity_type: entityTypeFilter || undefined
      });
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const calculateApprovalRate = () => {
    if (!analytics?.summary.total_requests) return 0;
    return ((analytics.summary.approved_count / analytics.summary.total_requests) * 100).toFixed(1);
  };

  const calculateRejectionRate = () => {
    if (!analytics?.summary.total_requests) return 0;
    return ((analytics.summary.rejected_count / analytics.summary.total_requests) * 100).toFixed(1);
  };

  const formatHours = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)} minutes`;
    if (hours < 24) return `${hours.toFixed(1)} hours`;
    return `${(hours / 24).toFixed(1)} days`;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Analytics</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Track approval performance and identify bottlenecks</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.start_date}
                onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.end_date}
                onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Entity Type
              </label>
              <select
                value={entityTypeFilter}
                onChange={(e) => setEntityTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Types</option>
                <option value="budget">Budget</option>
                <option value="fund_request">Fund Request</option>
                <option value="contract">Contract</option>
                <option value="report">Report</option>
              </select>
            </div>
          </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">Loading analytics...</p>
        </div>
      ) : analytics ? (
        <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {/* Total Requests */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Requests</h3>
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.summary.total_requests}</p>
              </div>

              {/* Approved */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Approved</h3>
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.summary.approved_count}</p>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">{calculateApprovalRate()}% approval rate</p>
              </div>

              {/* Rejected */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Rejected</h3>
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.summary.rejected_count}</p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{calculateRejectionRate()}% rejection rate</p>
              </div>

              {/* Pending */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</h3>
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.summary.pending_count}</p>
              </div>
            </div>

            {/* Average Time Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Average Approval Time</h3>
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                    {formatHours(analytics.summary.avg_hours_to_complete || 0)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Time from submission to completion
                  </p>
                </div>
                <svg className="w-24 h-24 text-blue-600 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            {/* Bottlenecks */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Approval Bottlenecks</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Steps taking the longest time to complete
              </p>

              {analytics.bottlenecks.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400">No bottlenecks detected</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {analytics.bottlenecks.map((bottleneck, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {bottleneck.step_name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Step {bottleneck.step_order}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          bottleneck.avg_hours > 48
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                            : bottleneck.avg_hours > 24
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        }`}>
                          {formatHours(bottleneck.avg_hours)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>{bottleneck.request_count} requests</span>
                        <span>•</span>
                        <span>Avg: {formatHours(bottleneck.avg_hours)}</span>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            bottleneck.avg_hours > 48
                              ? 'bg-red-600'
                              : bottleneck.avg_hours > 24
                              ? 'bg-yellow-600'
                              : 'bg-green-600'
                          }`}
                          style={{ width: `${Math.min((bottleneck.avg_hours / 72) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
        </>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No data available</h3>
          <p className="text-gray-600 dark:text-gray-400">Try adjusting your filters or date range</p>
        </div>
      )}
    </div>
  );
};

export default ApprovalAnalyticsDashboard;
