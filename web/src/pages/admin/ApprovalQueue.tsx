import React, { useState, useEffect } from 'react';
import approvalChainApi, { ApprovalRequest } from '../../services/approvalChainApi';
import { toast } from 'react-toastify';
import ApprovalDetailModal from '../../components/approvals/ApprovalDetailModal';

const ApprovalQueue: React.FC = () => {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Filters
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('submitted_at');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  useEffect(() => {
    fetchQueue();
  }, [entityTypeFilter, sortBy, sortOrder]);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const data = await approvalChainApi.getQueue({
        entity_type: entityTypeFilter || undefined,
        sort_by: sortBy,
        order: sortOrder
      });
      setRequests(data);
    } catch (error) {
      console.error('Error fetching queue:', error);
      toast.error('Failed to load approval queue');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string, comments?: string) => {
    try {
      await approvalChainApi.approveRequest(id, comments);
      toast.success('Request approved successfully');
      fetchQueue();
      setShowDetailModal(false);
    } catch (error: any) {
      console.error('Error approving request:', error);
      toast.error(error.message || 'Failed to approve request');
    }
  };

  const handleReject = async (id: string, comments: string) => {
    if (!comments) {
      toast.error('Comments are required for rejection');
      return;
    }

    try {
      await approvalChainApi.rejectRequest(id, comments);
      toast.success('Request rejected');
      fetchQueue();
      setShowDetailModal(false);
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      toast.error(error.message || 'Failed to reject request');
    }
  };

  const handleViewDetails = async (request: ApprovalRequest) => {
    try {
      const fullRequest = await approvalChainApi.getRequestById(request.id);
      setSelectedRequest(fullRequest);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error loading request details:', error);
      toast.error('Failed to load request details');
    }
  };

  const getUrgencyLevel = (submittedAt: string): { level: string; color: string; icon: string } => {
    const hoursSince = (new Date().getTime() - new Date(submittedAt).getTime()) / (1000 * 60 * 60);
    
    if (hoursSince > 48) {
      return { level: 'URGENT - Overdue', color: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800', icon: '🔴' };
    } else if (hoursSince > 24) {
      return { level: 'Due Soon', color: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800', icon: '🟡' };
    } else {
      return { level: 'Normal', color: 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700', icon: '🟢' };
    }
  };

  const getEntityTypeIcon = (type: string) => {
    switch (type) {
      case 'budget': return '💰';
      case 'fund_request': return '💵';
      case 'contract': return '📄';
      case 'report': return '📊';
      default: return '📋';
    }
  };

  const formatTimeAgo = (date: string) => {
    const hours = (new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${Math.floor(hours)} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const urgentRequests = requests.filter(r => getUrgencyLevel(r.submitted_at).level === 'URGENT - Overdue');
  const dueSoonRequests = requests.filter(r => getUrgencyLevel(r.submitted_at).level === 'Due Soon');
  const normalRequests = requests.filter(r => getUrgencyLevel(r.submitted_at).level === 'Normal');

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Approval Queue</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Review and act on pending approval requests</p>
        </div>
        {urgentRequests.length > 0 && (
          <div className="bg-red-500 text-white px-4 py-2 rounded-full font-bold text-sm animate-pulse">
            🔔 {urgentRequests.length} Urgent
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter by Type
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

            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="submitted_at">Submission Date</option>
                <option value="entity_type">Entity Type</option>
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Order
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'ASC' | 'DESC')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="DESC">Newest First</option>
                <option value="ASC">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

      {/* Queue */}
      {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-4">Loading approval queue...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No pending approvals</h3>
            <p className="text-gray-600 dark:text-gray-400">You're all caught up! No requests waiting for your approval.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Urgent Requests */}
            {urgentRequests.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-red-600 dark:text-red-400 mb-3 flex items-center">
                  🔴 URGENT - Overdue ({urgentRequests.length})
                </h2>
                <div className="space-y-3">
                  {urgentRequests.map(request => {
                    const urgency = getUrgencyLevel(request.submitted_at);
                    return (
                      <div key={request.id} className={`rounded-xl border-2 p-6 ${urgency.color}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="text-2xl">{getEntityTypeIcon(request.entity_type)}</span>
                              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {request.entity_type.replace('_', ' ').toUpperCase()} #{request.entity_id.slice(0, 8)}
                              </h3>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 mb-3">
                              Submitted by {request.submitted_by_name || 'Unknown'} • {formatTimeAgo(request.submitted_at)}
                            </p>
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-3">
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                <span className="font-semibold">Current Step:</span> {request.step_name} (Step {request.step_order})
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => handleViewDetails(request)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => handleApprove(request.id)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                            >
                              ✅ Approve
                            </button>
                            <button
                              onClick={() => handleViewDetails(request)}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                            >
                              ❌ Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Due Soon Requests */}
            {dueSoonRequests.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-yellow-600 dark:text-yellow-400 mb-3 flex items-center">
                  🟡 Due Soon ({dueSoonRequests.length})
                </h2>
                <div className="space-y-3">
                  {dueSoonRequests.map(request => {
                    const urgency = getUrgencyLevel(request.submitted_at);
                    return (
                      <div key={request.id} className={`rounded-xl border-2 p-6 ${urgency.color}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="text-2xl">{getEntityTypeIcon(request.entity_type)}</span>
                              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {request.entity_type.replace('_', ' ').toUpperCase()} #{request.entity_id.slice(0, 8)}
                              </h3>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 mb-3">
                              Submitted by {request.submitted_by_name || 'Unknown'} • {formatTimeAgo(request.submitted_at)}
                            </p>
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-3">
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                <span className="font-semibold">Current Step:</span> {request.step_name} (Step {request.step_order})
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => handleViewDetails(request)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => handleApprove(request.id)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                            >
                              ✅ Approve
                            </button>
                            <button
                              onClick={() => handleViewDetails(request)}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                            >
                              ❌ Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Normal Requests */}
            {normalRequests.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                  🟢 Normal Priority ({normalRequests.length})
                </h2>
                <div className="space-y-3">
                  {normalRequests.map(request => {
                    const urgency = getUrgencyLevel(request.submitted_at);
                    return (
                      <div key={request.id} className={`rounded-xl border-2 p-6 ${urgency.color} hover:shadow-lg transition-shadow`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="text-2xl">{getEntityTypeIcon(request.entity_type)}</span>
                              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {request.entity_type.replace('_', ' ').toUpperCase()} #{request.entity_id.slice(0, 8)}
                              </h3>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 mb-3">
                              Submitted by {request.submitted_by_name || 'Unknown'} • {formatTimeAgo(request.submitted_at)}
                            </p>
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                <span className="font-semibold">Current Step:</span> {request.step_name} (Step {request.step_order})
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => handleViewDetails(request)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => handleApprove(request.id)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                            >
                              ✅ Approve
                            </button>
                            <button
                              onClick={() => handleViewDetails(request)}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                            >
                              ❌ Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <ApprovalDetailModal
          request={selectedRequest}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedRequest(null);
          }}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
};

export default ApprovalQueue;
