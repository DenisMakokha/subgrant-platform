import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

interface ReportedIssue {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  closed_at?: string;
  admin_notes?: string;
  resolution_notes?: string;
}

const MyReportedIssues: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [issues, setIssues] = useState<ReportedIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<ReportedIssue | null>(null);

  useEffect(() => {
    fetchMyIssues();
  }, []);

  const fetchMyIssues = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reported-issues', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch issues');
      
      const data = await response.json();
      setIssues(data.data || []);
    } catch (error) {
      console.error('Error fetching issues:', error);
      toast.error('Failed to load your reported issues');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'in_progress': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'resolved': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'closed': return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
      case 'wont_fix': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      case 'high': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'bug': return '🐛';
      case 'feature_request': return '✨';
      case 'question': return '❓';
      case 'complaint': return '⚠️';
      default: return '📝';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return '🔵';
      case 'in_progress': return '🟡';
      case 'resolved': return '✅';
      case 'closed': return '⚫';
      case 'wont_fix': return '❌';
      default: return '⚪';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Reported Issues</h1>
              <p className="text-blue-100">Track the status of your reported issues</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchMyIssues}
                className="px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg font-medium transition-all flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </button>
              <button
                onClick={() => {
                  if (user?.role === 'admin') {
                    navigate('/admin/report-issue');
                  } else {
                    navigate('/partner/report-issue');
                  }
                }}
                className="px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg font-medium transition-all flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Report New Issue</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Issues</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{issues.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Open</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {issues.filter(i => i.status === 'open').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🔵</span>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {issues.filter(i => i.status === 'in_progress').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🟡</span>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Resolved</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {issues.filter(i => i.status === 'resolved' || i.status === 'closed').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>
        </div>

        {/* Issues List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your issues...</p>
            </div>
          ) : issues.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400 mb-4">You haven't reported any issues yet</p>
              <button
                onClick={() => {
                  if (user?.role === 'admin') {
                    navigate('/admin/report-issue');
                  } else {
                    navigate('/partner/report-issue');
                  }
                }}
                className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl hover:from-rose-600 hover:to-pink-600 transition-all"
              >
                Report Your First Issue
              </button>
            </div>
          ) : (
            issues.map((issue) => (
              <div
                key={issue.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setSelectedIssue(issue)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getCategoryIcon(issue.category)}</span>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{issue.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}>
                        {getStatusIcon(issue.status)} {issue.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(issue.priority)}`}>
                        {issue.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{issue.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>Reported: {formatDate(issue.created_at)}</span>
                      {issue.updated_at !== issue.created_at && (
                        <>
                          <span>•</span>
                          <span>Updated: {formatDate(issue.updated_at)}</span>
                        </>
                      )}
                      {issue.resolved_at && (
                        <>
                          <span>•</span>
                          <span className="text-green-600 dark:text-green-400">Resolved: {formatDate(issue.resolved_at)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Issue Detail Modal */}
        {selectedIssue && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedIssue(null)}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">{getCategoryIcon(selectedIssue.category)}</span>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedIssue.title}</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedIssue.status)}`}>
                        {getStatusIcon(selectedIssue.status)} {selectedIssue.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedIssue.priority)}`}>
                        {selectedIssue.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedIssue(null)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Description</h3>
                  <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{selectedIssue.description}</p>
                </div>

                {selectedIssue.admin_notes && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                    <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">Admin Notes</h3>
                    <p className="text-blue-800 dark:text-blue-400 whitespace-pre-wrap">{selectedIssue.admin_notes}</p>
                  </div>
                )}

                {selectedIssue.resolution_notes && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                    <h3 className="text-sm font-semibold text-green-900 dark:text-green-300 mb-2">Resolution</h3>
                    <p className="text-green-800 dark:text-green-400 whitespace-pre-wrap">{selectedIssue.resolution_notes}</p>
                  </div>
                )}

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Timeline</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Issue Reported</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(selectedIssue.created_at)}</p>
                      </div>
                    </div>
                    {selectedIssue.updated_at !== selectedIssue.created_at && (
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Last Updated</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(selectedIssue.updated_at)}</p>
                        </div>
                      </div>
                    )}
                    {selectedIssue.resolved_at && (
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Resolved</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(selectedIssue.resolved_at)}</p>
                        </div>
                      </div>
                    )}
                    {selectedIssue.closed_at && (
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-gray-500 mt-2"></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Closed</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(selectedIssue.closed_at)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyReportedIssues;
