import React, { useState, useEffect } from 'react';
import approvalChainApi, { ApprovalRequest } from '../../services/approvalChainApi';
import { toast } from 'react-toastify';

interface ApprovalStatusTrackerProps {
  requestId: string;
  onCancel?: () => void;
}

const ApprovalStatusTracker: React.FC<ApprovalStatusTrackerProps> = ({ requestId, onCancel }) => {
  const [request, setRequest] = useState<ApprovalRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequest();
  }, [requestId]);

  const fetchRequest = async () => {
    try {
      setLoading(true);
      const data = await approvalChainApi.getRequestById(requestId);
      setRequest(data);
    } catch (error) {
      console.error('Error fetching approval status:', error);
      toast.error('Failed to load approval status');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this approval request?')) return;

    try {
      await approvalChainApi.cancelRequest(requestId);
      toast.success('Approval request cancelled');
      if (onCancel) onCancel();
    } catch (error: any) {
      console.error('Error cancelling request:', error);
      toast.error(error.message || 'Failed to cancel request');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      case 'cancelled':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
      default:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <p className="text-gray-600 dark:text-gray-400">Approval request not found</p>
      </div>
    );
  }

  // Calculate progress
  const totalSteps = request.actions ? Math.max(...request.actions.map(a => a.step_order), request.current_step) : request.current_step;
  const completedSteps = request.actions ? request.actions.filter(a => a.action === 'approved').length : 0;
  const progressPercentage = (completedSteps / totalSteps) * 100;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Approval Status</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
          {request.status.toUpperCase()}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Progress</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {completedSteps} of {totalSteps} steps completed
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Visual Timeline */}
      <div className="mb-6">
        <div className="flex items-center justify-between relative">
          {/* Progress Line */}
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700"></div>
          <div
            className="absolute top-4 left-0 h-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          ></div>

          {/* Steps */}
          {[...Array(totalSteps)].map((_, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < request.current_step || request.status === 'approved';
            const isCurrent = stepNumber === request.current_step && request.status === 'pending';
            const isPending = stepNumber > request.current_step;

            return (
              <div key={index} className="relative flex flex-col items-center z-10">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isCurrent
                      ? 'bg-blue-600 text-white animate-pulse'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {isCompleted ? '✓' : stepNumber}
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  {isCompleted ? 'Done' : isCurrent ? 'Current' : 'Pending'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Step Info */}
      {request.status === 'pending' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                {request.step_name} (Step {request.current_step})
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Awaiting approval • Submitted {formatDate(request.submitted_at)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Approval History */}
      {request.actions && request.actions.length > 0 && (
        <div className="space-y-3 mb-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Approval History</h4>
          {request.actions.map((action) => (
            <div key={action.id} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center space-x-2">
                  <span className={action.action === 'approved' ? 'text-green-600' : 'text-red-600'}>
                    {action.action === 'approved' ? '✅' : '❌'}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white text-sm">
                    {action.step_name}
                  </span>
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Step {action.step_order}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                {action.approver_name} • {formatDate(action.acted_at)}
              </p>
              {action.comments && (
                <p className="text-xs text-gray-700 dark:text-gray-300 mt-2 pl-3 border-l-2 border-gray-300 dark:border-gray-600">
                  "{action.comments}"
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Completion Info */}
      {request.status === 'approved' && request.completed_at && (
        <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold text-green-900 dark:text-green-100 mb-1">
                Request Approved
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                Completed on {formatDate(request.completed_at)}
              </p>
            </div>
          </div>
        </div>
      )}

      {request.status === 'rejected' && request.completed_at && (
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold text-red-900 dark:text-red-100 mb-1">
                Request Rejected
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">
                Rejected on {formatDate(request.completed_at)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {request.status === 'pending' && (
        <div className="flex items-center space-x-3">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 border-2 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium"
          >
            Cancel Request
          </button>
          <button
            onClick={fetchRequest}
            className="px-4 py-2 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-sm font-medium"
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  );
};

export default ApprovalStatusTracker;
