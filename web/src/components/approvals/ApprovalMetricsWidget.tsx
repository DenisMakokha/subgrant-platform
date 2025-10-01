import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import approvalChainApi from '../../services/approvalChainApi';

interface ApprovalMetrics {
  total_pending: number;
  total_approved: number;
  total_rejected: number;
  avg_approval_time_hours: number;
  my_pending: number;
  my_approved_today: number;
  overdue_count: number;
  approval_rate: number;
}

const ApprovalMetricsWidget: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<ApprovalMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('week');

  useEffect(() => {
    fetchMetrics();
  }, [timeRange]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const data = await approvalChainApi.getApprovalMetrics(timeRange);
      setMetrics(data);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const metricCards = metrics ? [
    {
      label: 'My Pending',
      value: metrics.my_pending,
      icon: '⏳',
      color: 'blue',
      bgColor: 'from-blue-500 to-blue-600',
      change: null,
      onClick: () => navigate('/admin/approvals/queue?filter=my_pending')
    },
    {
      label: 'Approved Today',
      value: metrics.my_approved_today,
      icon: '✅',
      color: 'emerald',
      bgColor: 'from-emerald-500 to-emerald-600',
      change: null,
      onClick: () => navigate('/admin/approvals/history?filter=approved_today')
    },
    {
      label: 'Overdue',
      value: metrics.overdue_count,
      icon: '🚨',
      color: 'rose',
      bgColor: 'from-rose-500 to-rose-600',
      change: null,
      onClick: () => navigate('/admin/approvals/queue?filter=overdue')
    },
    {
      label: 'Approval Rate',
      value: `${metrics.approval_rate.toFixed(1)}%`,
      icon: '📊',
      color: 'purple',
      bgColor: 'from-purple-500 to-purple-600',
      change: null,
      onClick: () => navigate('/admin/approvals/analytics')
    }
  ] : [];

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-slate-100 dark:bg-slate-700/50 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Approval Metrics
            </h3>
            <p className="text-sm text-slate-500">
              Your approval activity and team performance
            </p>
          </div>
          
          {/* Time Range Selector */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
            {(['today', 'week', 'month'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  timeRange === range
                    ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metricCards.map((card, index) => (
            <div
              key={index}
              onClick={card.onClick}
              className="relative overflow-hidden rounded-xl cursor-pointer group"
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.bgColor} opacity-10 group-hover:opacity-20 transition-opacity`}></div>
              
              {/* Content */}
              <div className="relative p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.bgColor} flex items-center justify-center text-white text-xl shadow-lg`}>
                    {card.icon}
                  </div>
                  {card.change && (
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      card.change > 0 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                    }`}>
                      {card.change > 0 ? '+' : ''}{card.change}%
                    </span>
                  )}
                </div>
                
                <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                  {card.value}
                </div>
                
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {card.label}
                </div>

                {/* Hover Arrow */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Stats */}
        {metrics && (
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Avg Approval Time */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-lg font-semibold text-slate-900 dark:text-white">
                    {metrics.avg_approval_time_hours.toFixed(1)}h
                  </div>
                  <div className="text-xs text-slate-500">Avg Approval Time</div>
                </div>
              </div>

              {/* Total Approved */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-lg font-semibold text-slate-900 dark:text-white">
                    {metrics.total_approved}
                  </div>
                  <div className="text-xs text-slate-500">Total Approved</div>
                </div>
              </div>

              {/* Total Rejected */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div className="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <div className="text-lg font-semibold text-slate-900 dark:text-white">
                    {metrics.total_rejected}
                  </div>
                  <div className="text-xs text-slate-500">Total Rejected</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => navigate('/admin/approvals/analytics')}
            className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            View Detailed Analytics
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApprovalMetricsWidget;
