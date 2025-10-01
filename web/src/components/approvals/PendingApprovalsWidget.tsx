import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import approvalChainApi, { ApprovalRequest } from '../../services/approvalChainApi';
import { toast } from 'react-toastify';

interface PendingApprovalsWidgetProps {
  maxItems?: number;
  showQuickActions?: boolean;
}

const PendingApprovalsWidget: React.FC<PendingApprovalsWidgetProps> = ({ 
  maxItems = 5,
  showQuickActions = true 
}) => {
  const navigate = useNavigate();
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingApprovals();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingApprovals, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      const data = await approvalChainApi.getMyPendingApprovals();
      setApprovals(data.slice(0, maxItems));
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickApprove = async (requestId: string) => {
    if (!confirm('Are you sure you want to approve this request?')) return;

    try {
      setProcessing(requestId);
      await approvalChainApi.approveRequest(requestId, 'Quick approved from dashboard');
      toast.success('Request approved successfully');
      fetchPendingApprovals();
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve request');
    } finally {
      setProcessing(null);
    }
  };

  const handleQuickReject = async (requestId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      setProcessing(requestId);
      await approvalChainApi.rejectRequest(requestId, reason);
      toast.success('Request rejected');
      fetchPendingApprovals();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject request');
    } finally {
      setProcessing(null);
    }
  };

  const getEntityTypeIcon = (entityType: string) => {
    const icons: Record<string, string> = {
      fund_request: '💰',
      budget: '📊',
      contract: '📄',
      report: '📈',
      grant: '🎯'
    };
    return icons[entityType] || '📋';
  };

  const getEntityTypeColor = (entityType: string) => {
    const colors: Record<string, string> = {
      fund_request: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      budget: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      contract: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      report: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
      grant: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
    };
    return colors[entityType] || 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      high: 'text-rose-600 dark:text-rose-400',
      medium: 'text-amber-600 dark:text-amber-400',
      low: 'text-slate-600 dark:text-slate-400'
    };
    return colors[priority] || colors.medium;
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-slate-100 dark:bg-slate-700/50 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Pending Approvals
              </h3>
              <p className="text-sm text-slate-500">
                {approvals.length} {approvals.length === 1 ? 'item' : 'items'} awaiting your review
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/approvals/queue')}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            View All →
          </button>
        </div>
      </div>

      {/* Approvals List */}
      <div className="divide-y divide-slate-200 dark:divide-slate-700">
        {approvals.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-slate-500 mb-1">No pending approvals</p>
            <p className="text-sm text-slate-400">You're all caught up!</p>
          </div>
        ) : (
          approvals.map((approval) => (
            <div
              key={approval.id}
              className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
              onClick={() => navigate(`/admin/approvals/${approval.id}`)}
            >
              <div className="flex items-start gap-4">
                {/* Entity Icon */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${getEntityTypeColor(approval.entity_type)} flex items-center justify-center text-xl`}>
                  {getEntityTypeIcon(approval.entity_type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-medium text-slate-900 dark:text-white truncate">
                      {approval.entity_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h4>
                    <span className={`text-xs font-medium ${getPriorityColor(approval.priority || 'medium')}`}>
                      {approval.priority || 'medium'}
                    </span>
                  </div>
                  
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    Submitted by {approval.submitted_by_name || 'Unknown'} • {formatTimeAgo(approval.created_at)}
                  </p>

                  {/* Metadata */}
                  {approval.metadata && (
                    <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                      {approval.metadata.amount && (
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded">
                          ${approval.metadata.amount.toLocaleString()}
                        </span>
                      )}
                      {approval.metadata.project_name && (
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded truncate max-w-[200px]">
                          {approval.metadata.project_name}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Quick Actions */}
                  {showQuickActions && (
                    <div className="flex items-center gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleQuickApprove(approval.id)}
                        disabled={processing === approval.id}
                        className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Approve
                      </button>
                      <button
                        onClick={() => handleQuickReject(approval.id)}
                        disabled={processing === approval.id}
                        className="px-3 py-1.5 bg-rose-600 text-white text-sm rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Reject
                      </button>
                      <button
                        onClick={() => navigate(`/admin/approvals/${approval.id}`)}
                        className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PendingApprovalsWidget;
