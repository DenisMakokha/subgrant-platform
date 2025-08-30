import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getFinancialReports, createFinancialReport, updateFinancialReport, deleteFinancialReport, submitFinancialReport, approveFinancialReport, getReceiptsForFinancialReport } from '../services/financialReports';
import { FinancialReport, FinancialReportFormData, Receipt } from '../types';

// SVG Icons
const CurrencyDollarIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
  </svg>
);

const DocumentTextIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const PlusIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const XMarkIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ExclamationTriangleIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);

const PencilIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const PaperAirplaneIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
  </svg>
);

const ReceiptPercentIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
  </svg>
);

const ChartBarIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const FinancialReportManagement: React.FC = () => {
  const { user } = useAuth();
  const [financialReports, setFinancialReports] = useState<FinancialReport[]>([]);
  const [receipts, setReceipts] = useState<Record<string, Receipt[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingFinancialReport, setEditingFinancialReport] = useState<FinancialReport | null>(null);
  const [formData, setFormData] = useState<FinancialReportFormData>({
    budget_id: '',
    title: '',
    description: '',
    report_date: new Date().toISOString().split('T')[0],
    total_spent: 0,
    variance: 0
  });

  // Fetch financial reports
  useEffect(() => {
    const fetchFinancialReports = async () => {
      try {
        setLoading(true);
        const data = await getFinancialReports();
        setFinancialReports(data);
      } catch (err) {
        setError('Failed to fetch financial reports');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialReports();
  }, []);

  // Fetch receipts for a financial report
  const fetchReceiptsForReport = async (reportId: string) => {
    try {
      const reportReceipts = await getReceiptsForFinancialReport(reportId);
      setReceipts(prev => ({
        ...prev,
        [reportId]: reportReceipts
      }));
    } catch (err) {
      console.error('Failed to fetch receipts for report:', err);
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'total_spent' || name === 'variance' ? Number(value) : value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingFinancialReport) {
        // Update existing financial report
        const updatedFinancialReport = await updateFinancialReport(editingFinancialReport.id, formData);
        setFinancialReports(prev => 
          prev.map(r => r.id === editingFinancialReport.id ? updatedFinancialReport : r)
        );
      } else {
        // Create new financial report
        const newFinancialReport = await createFinancialReport(formData);
        setFinancialReports(prev => [...prev, newFinancialReport]);
      }
      
      // Reset form
      setFormData({
        budget_id: '',
        title: '',
        description: '',
        report_date: new Date().toISOString().split('T')[0],
        total_spent: 0,
        variance: 0
      });
      setShowForm(false);
      setEditingFinancialReport(null);
    } catch (err) {
      setError('Failed to save financial report');
      console.error(err);
    }
  };

  // Handle edit financial report
  const handleEdit = (financialReport: FinancialReport) => {
    setEditingFinancialReport(financialReport);
    setFormData({
      budget_id: financialReport.budget_id,
      title: financialReport.title,
      description: financialReport.description,
      report_date: financialReport.report_date.split('T')[0],
      total_spent: financialReport.total_spent,
      variance: financialReport.variance
    });
    setShowForm(true);
  };

  // Handle delete financial report
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this financial report?')) {
      return;
    }
    
    try {
      await deleteFinancialReport(id);
      setFinancialReports(prev => prev.filter(r => r.id !== id));
      // Remove receipts for this report
      setReceipts(prev => {
        const newReceipts = { ...prev };
        delete newReceipts[id];
        return newReceipts;
      });
    } catch (err) {
      setError('Failed to delete financial report');
      console.error(err);
    }
  };

  // Handle submit financial report
  const handleSubmitReport = async (id: string) => {
    if (!window.confirm('Are you sure you want to submit this financial report?')) {
      return;
    }
    
    try {
      const submittedFinancialReport = await submitFinancialReport(id);
      setFinancialReports(prev => 
        prev.map(r => r.id === id ? submittedFinancialReport : r)
      );
    } catch (err) {
      setError('Failed to submit financial report');
      console.error(err);
    }
  };

  // Handle approve financial report
  const handleApprove = async (id: string) => {
    if (!window.confirm('Are you sure you want to approve this financial report?')) {
      return;
    }
    
    try {
      const approvedFinancialReport = await approveFinancialReport(id);
      setFinancialReports(prev => 
        prev.map(r => r.id === id ? approvedFinancialReport : r)
      );
    } catch (err) {
      setError('Failed to approve financial report');
      console.error(err);
    }
  };

  // Handle view receipts
  const handleViewReceipts = async (id: string) => {
    // Fetch receipts if not already loaded
    if (!receipts[id]) {
      await fetchReceiptsForReport(id);
    }
    
    // Display receipts in a modal or separate page
    console.log('Receipts for report', id, receipts[id]);
    alert(`Viewing receipts for report ${id}. Check console for details.`);
  };

  // Cancel form
  const handleCancel = () => {
    setShowForm(false);
    setEditingFinancialReport(null);
    setFormData({
      budget_id: '',
      title: '',
      description: '',
      report_date: new Date().toISOString().split('T')[0],
      total_spent: 0,
      variance: 0
    });
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      draft: { 
        bg: 'bg-gray-100 dark:bg-gray-900/30', 
        text: 'text-gray-800 dark:text-gray-300',
        icon: <DocumentTextIcon className="w-4 h-4" />
      },
      submitted: { 
        bg: 'bg-blue-100 dark:bg-blue-900/30', 
        text: 'text-blue-800 dark:text-blue-300',
        icon: <PaperAirplaneIcon className="w-4 h-4" />
      },
      under_review: { 
        bg: 'bg-yellow-100 dark:bg-yellow-900/30', 
        text: 'text-yellow-800 dark:text-yellow-300',
        icon: <ClockIcon className="w-4 h-4" />
      },
      approved: { 
        bg: 'bg-green-100 dark:bg-green-900/30', 
        text: 'text-green-800 dark:text-green-300',
        icon: <CheckCircleIcon className="w-4 h-4" />
      },
      rejected: { 
        bg: 'bg-red-100 dark:bg-red-900/30', 
        text: 'text-red-800 dark:text-red-300',
        icon: <ExclamationTriangleIcon className="w-4 h-4" />
      },
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.icon}
        {status.replace('_', ' ')}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Calculate metrics
  const totalReports = financialReports.length;
  const totalSpent = financialReports.reduce((sum, report) => sum + report.total_spent, 0);
  const draftCount = financialReports.filter(r => r.status === 'draft').length;
  const approvedCount = financialReports.filter(r => r.status === 'approved').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Financial Report Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Create and manage financial reports with expense tracking
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon />
            Create Financial Report
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <ChartBarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Reports</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalReports}</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
              <CurrencyDollarIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalSpent)}</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-900/30">
              <DocumentTextIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Draft</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{draftCount}</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
              <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Approved</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{approvedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="glass-card p-4 border-l-4 border-red-500">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {editingFinancialReport ? 'Edit Financial Report' : 'Create New Financial Report'}
            </h2>
            <button
              onClick={handleCancel}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <XMarkIcon />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="budget_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Budget ID *
                </label>
                <input
                  type="text"
                  id="budget_id"
                  name="budget_id"
                  value={formData.budget_id}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Report Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Enter report title..."
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="input-field resize-none"
                  placeholder="Describe the financial report content..."
                />
              </div>

              <div>
                <label htmlFor="report_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Report Date *
                </label>
                <input
                  type="date"
                  id="report_date"
                  name="report_date"
                  value={formData.report_date}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label htmlFor="total_spent" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Total Spent *
                </label>
                <input
                  type="number"
                  id="total_spent"
                  name="total_spent"
                  value={formData.total_spent}
                  onChange={handleInputChange}
                  className="input-field"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label htmlFor="variance" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Variance
                </label>
                <input
                  type="number"
                  id="variance"
                  name="variance"
                  value={formData.variance}
                  onChange={handleInputChange}
                  className="input-field"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleCancel}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                {editingFinancialReport ? 'Update Report' : 'Create Report'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reports List */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Financial Reports</h2>
        </div>

        {financialReports.length === 0 ? (
          <div className="text-center py-12">
            <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No financial reports</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating your first financial report.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowForm(true)}
                className="btn-primary flex items-center gap-2 mx-auto"
              >
                <PlusIcon />
                Create Financial Report
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Report
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Budget ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total Spent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Report Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800/50 divide-y divide-gray-200 dark:divide-gray-700">
                {financialReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {report.title}
                        </div>
                        {report.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {report.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white font-mono">
                        {report.budget_id.substring(0, 8)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(report.total_spent)}
                      </div>
                      {report.variance !== 0 && (
                        <div className={`text-xs ${report.variance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                          Variance: {formatCurrency(report.variance)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatDate(report.report_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(report.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewReceipts(report.id)}
                          className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                          title="View receipts"
                        >
                          <ReceiptPercentIcon />
                        </button>
                        {report.status === 'draft' && (
                          <>
                            <button
                              onClick={() => handleEdit(report)}
                              className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                              title="Edit report"
                            >
                              <PencilIcon />
                            </button>
                            <button
                              onClick={() => handleSubmitReport(report.id)}
                              className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                              title="Submit report"
                            >
                              <PaperAirplaneIcon />
                            </button>
                          </>
                        )}
                        {report.status === 'submitted' && user?.role === 'finance_officer' && (
                          <button
                            onClick={() => handleApprove(report.id)}
                            className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                            title="Approve report"
                          >
                            <CheckCircleIcon />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(report.id)}
                          className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                          title="Delete report"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialReportManagement;