import React, { useState } from 'react';
import { ApprovalRequest } from '../../services/approvalChainApi';

interface ApprovalDetailModalProps {
  request: ApprovalRequest;
  onClose: () => void;
  onApprove: (id: string, comments?: string) => void;
  onReject: (id: string, comments: string) => void;
}

const ApprovalDetailModal: React.FC<ApprovalDetailModalProps> = ({
  request,
  onClose,
  onApprove,
  onReject
}) => {
  const [comments, setComments] = useState('');
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);

  const handleSubmit = () => {
    if (action === 'approve') {
      onApprove(request.id, comments || undefined);
    } else if (action === 'reject') {
      if (!comments) {
        alert('Comments are required for rejection');
        return;
      }
      onReject(request.id, comments);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'approved':
        return 'text-green-600 dark:text-green-400';
      case 'rejected':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Approval Request Details</h2>
              <p className="text-blue-100">
                {request.entity_type.replace('_', ' ').toUpperCase()} #{request.entity_id.slice(0, 8)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Request Info */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Request Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Submitted By:</span>
                <p className="font-medium text-gray-900 dark:text-white">{request.submitted_by_name || 'Unknown'}</p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Submitted At:</span>
                <p className="font-medium text-gray-900 dark:text-white">{formatDate(request.submitted_at)}</p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Workflow:</span>
                <p className="font-medium text-gray-900 dark:text-white">{request.workflow_name}</p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Current Step:</span>
                <p className="font-medium text-gray-900 dark:text-white">
                  {request.step_name} (Step {request.step_order})
                </p>
              </div>
            </div>
          </div>

          {/* Metadata */}
          {request.metadata && Object.keys(request.metadata).length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Additional Details</h3>
              <div className="space-y-2 text-sm">
                {Object.entries(request.metadata).map(([key, value]) => (
                  <div key={key} className="flex items-start">
                    <span className="text-gray-600 dark:text-gray-400 w-1/3">{key}:</span>
                    <span className="font-medium text-gray-900 dark:text-white w-2/3">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Approval History */}
          {request.actions && request.actions.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Approval History</h3>
              <div className="space-y-3">
                {request.actions.map((action, index) => (
                  <div key={action.id} className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {action.step_name} (Step {action.step_order})
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {action.approver_name} • {formatDate(action.acted_at)}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        action.action === 'approved' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {action.action.toUpperCase()}
                      </span>
                    </div>
                    {action.comments && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 pl-4 border-l-2 border-gray-300 dark:border-gray-600">
                        {action.comments}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Section */}
          {request.status === 'pending' && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Your Decision</h3>
              
              {/* Action Buttons */}
              {!action && (
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setAction('approve')}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => setAction('reject')}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    ❌ Reject
                  </button>
                </div>
              )}

              {/* Comments Form */}
              {action && (
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-blue-900 dark:text-blue-100 font-medium">
                      {action === 'approve' ? '✅ Approving this request' : '❌ Rejecting this request'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Comments {action === 'reject' && <span className="text-red-500">*</span>}
                    </label>
                    <textarea
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                      placeholder={action === 'approve' ? 'Add optional comments...' : 'Explain why you are rejecting this request...'}
                      required={action === 'reject'}
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <button
                      onClick={handleSubmit}
                      className={`flex-1 px-6 py-3 rounded-lg text-white font-medium transition-colors ${
                        action === 'approve'
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-red-600 hover:bg-red-700'
                      }`}
                    >
                      Confirm {action === 'approve' ? 'Approval' : 'Rejection'}
                    </button>
                    <button
                      onClick={() => {
                        setAction(null);
                        setComments('');
                      }}
                      className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApprovalDetailModal;
