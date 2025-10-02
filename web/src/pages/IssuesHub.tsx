import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

const IssuesHub: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'report');
  
  // Report form state
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: searchParams.get('category') || 'bug',
    priority: 'medium',
    page_url: window.location.href,
    browser_info: navigator.userAgent
  });

  // Tracking state
  const [issues, setIssues] = useState<ReportedIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<ReportedIssue | null>(null);

  useEffect(() => {
    if (activeTab === 'track') {
      fetchMyIssues();
    }
  }, [activeTab]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reported-issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to submit issue');
      }

      toast.success('Issue reported successfully! We\'ll review it shortly.');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: 'bug',
        priority: 'medium',
        page_url: window.location.href,
        browser_info: navigator.userAgent
      });

      // Switch to tracking tab
      handleTabChange('track');
    } catch (error) {
      console.error('Error submitting issue:', error);
      toast.error('Failed to submit issue. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-500 to-pink-500 rounded-2xl p-8 text-white mb-8 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5.07 19h13.86A2 2 0 0021 17.07V6.93A2 2 0 0018.93 5H5.07A2 2 0 003 6.93v10.14A2 2 0 005.07 19z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold">Issues Hub</h1>
              <p className="text-rose-100 mt-1">Report issues and track their status</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px">
              <button
                onClick={() => handleTabChange('report')}
                className={`flex-1 py-4 px-6 text-center font-semibold transition-all ${
                  activeTab === 'report'
                    ? 'border-b-2 border-rose-500 text-rose-600 dark:text-rose-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5.07 19h13.86A2 2 0 0021 17.07V6.93A2 2 0 0018.93 5H5.07A2 2 0 003 6.93v10.14A2 2 0 005.07 19z" />
                  </svg>
                  <span>Report Issue</span>
                </div>
              </button>
              <button
                onClick={() => handleTabChange('track')}
                className={`flex-1 py-4 px-6 text-center font-semibold transition-all ${
                  activeTab === 'track'
                    ? 'border-b-2 border-rose-500 text-rose-600 dark:text-rose-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>Track Status</span>
                  {issues.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded-full text-xs font-bold">
                      {issues.length}
                    </span>
                  )}
                </div>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'report' ? (
              /* Report Form */
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Category and Priority - Two Column Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Category */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Issue Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                    >
                      <option value="bug">🐛 Bug Report</option>
                      <option value="feature_request">✨ Feature Request</option>
                      <option value="question">❓ Question</option>
                      <option value="complaint">⚠️ Complaint</option>
                      <option value="other">📝 Other</option>
                    </select>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Select the type that best describes your issue
                    </p>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Priority <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                    >
                      <option value="low">🟢 Low - Minor issue, no rush</option>
                      <option value="medium">🟡 Medium - Normal priority</option>
                      <option value="high">🟠 High - Important issue</option>
                      <option value="critical">🔴 Critical - Urgent, blocking work</option>
                    </select>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Issue Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    maxLength={255}
                    placeholder="Brief summary of the issue"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                  />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Provide a clear, concise title (max 255 characters)
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Detailed Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={8}
                    placeholder="Please provide as much detail as possible:&#10;- What were you trying to do?&#10;- What happened?&#10;- What did you expect to happen?&#10;- Steps to reproduce (if applicable)"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all resize-none"
                  />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    The more details you provide, the faster we can help you
                  </p>
                </div>

                {/* System Info (Read-only) */}
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    System Information (automatically captured)
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-24">Page URL:</span>
                      <span className="break-all">{formData.page_url}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-24">Browser:</span>
                      <span className="break-all">{formData.browser_info}</span>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex items-center justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-8 py-3 text-sm font-semibold text-white bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Submit Issue
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Track Status */
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total</p>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{issues.length}</p>
                      </div>
                      <span className="text-3xl">📋</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Open</p>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                          {issues.filter(i => i.status === 'open').length}
                        </p>
                      </div>
                      <span className="text-3xl">🔵</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl border border-yellow-200 dark:border-yellow-800 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">In Progress</p>
                        <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                          {issues.filter(i => i.status === 'in_progress').length}
                        </p>
                      </div>
                      <span className="text-3xl">🟡</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-800 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600 dark:text-green-400 font-medium">Resolved</p>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                          {issues.filter(i => i.status === 'resolved' || i.status === 'closed').length}
                        </p>
                      </div>
                      <span className="text-3xl">✅</span>
                    </div>
                  </div>
                </div>

                {/* Issues List */}
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your issues...</p>
                  </div>
                ) : issues.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">You haven't reported any issues yet</p>
                    <button
                      onClick={() => handleTabChange('report')}
                      className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl hover:from-rose-600 hover:to-pink-600 transition-all"
                    >
                      Report Your First Issue
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {issues.map((issue) => (
                      <div
                        key={issue.id}
                        className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 p-6 hover:shadow-lg transition-all cursor-pointer"
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
                            </div>
                          </div>
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
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

export default IssuesHub;
