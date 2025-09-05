import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getFinancialReports, exportFinancialReportAsPdf, exportFinancialReportAsExcel } from '../services/financialReports';
import { getMeReports, exportMeReportAsPdf, exportMeReportAsExcel } from '../services/meReports';
import { FinancialReport, MeReport } from '../types/reports';

// SVG Icons
const DocumentChartBarIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const DonorReporting: React.FC = () => {
  const { user } = useAuth();
  const [financialReports, setFinancialReports] = useState<FinancialReport[]>([]);
  const [meReports, setMeReports] = useState<MeReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'financial' | 'me'>('financial');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        // Fetch only approved reports for donors
        const financialData = await getFinancialReports({ status: 'approved' });
        const meData = await getMeReports({ status: 'approved' });
        setFinancialReports(financialData);
        setMeReports(meData);
        setError(null);
      } catch (err) {
        setError('Failed to fetch reports');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'donor') {
      fetchReports();
    }
  }, [user]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (user?.role !== 'donor') {
    return (
      <div className="donor-reporting">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="donor-reporting">Loading...</div>;
  }

  if (error) {
    return <div className="donor-reporting error">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl shadow-xl">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative p-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <DocumentChartBarIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    Donor Reporting
                  </h1>
                  <p className="text-blue-100 mt-1">
                    Welcome, {user.firstName} {user.lastName}! Access approved reports and analytics
                  </p>
                </div>
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="text-right">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <p className="text-sm text-blue-100 font-medium">
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  <p className="text-xs text-blue-200 mt-1">
                    {new Date().toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl"></div>
      </div>

      {/* Tab Navigation */}
      <div className="glass-card p-6">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button 
            className={`px-4 py-2 font-medium text-sm rounded-t-lg border-b-2 transition-colors ${
              activeTab === 'financial' 
                ? 'text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400' 
                : 'text-gray-500 border-transparent hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('financial')}
          >
            Financial Reports
          </button>
          <button 
            className={`px-4 py-2 font-medium text-sm rounded-t-lg border-b-2 transition-colors ${
              activeTab === 'me' 
                ? 'text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400' 
                : 'text-gray-500 border-transparent hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('me')}
          >
            ME Reports
          </button>
        </div>
      </div>

      {activeTab === 'financial' && (
        <div className="reports-section">
          <h2>Financial Reports</h2>
          {financialReports.length > 0 ? (
            <div className="reports-grid">
              {financialReports.map(report => (
                <div key={report.id} className="report-card">
                  <h3>{report.title}</h3>
                  <p className="report-date">Date: {formatDate(report.report_date)}</p>
                  <p className="report-amount">Total Spent: {formatCurrency(report.total_spent)}</p>
                  <p className="report-variance">Variance: {formatCurrency(report.variance)}</p>
                  <div className="report-status">
                    <span className={`status-badge status-${report.status}`}>
                      {report.status}
                    </span>
                  </div>
                  <div className="report-actions">
                    <button
                      className="export-button"
                      onClick={() => exportFinancialReportAsPdf(report.id)}
                    >
                      Export PDF
                    </button>
                    <button
                      className="export-button"
                      onClick={() => exportFinancialReportAsExcel(report.id)}
                    >
                      Export Excel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No financial reports available</p>
          )}
        </div>
      )}

      {activeTab === 'me' && (
        <div className="reports-section">
          <h2>ME Reports</h2>
          {meReports.length > 0 ? (
            <div className="reports-grid">
              {meReports.map(report => (
                <div key={report.id} className="report-card">
                  <h3>{report.title}</h3>
                  <p className="report-date">Date: {formatDate(report.report_date)}</p>
                  <div className="report-status">
                    <span className={`status-badge status-${report.status}`}>
                      {report.status}
                    </span>
                  </div>
                  {report.indicators && Object.keys(report.indicators).length > 0 && (
                    <div className="indicators">
                      <h4>Key Indicators:</h4>
                      <ul>
                        {Object.entries(report.indicators).map(([key, value]) => (
                          <li key={key}>{key}: {String(value)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="report-actions">
                    <button
                      className="export-button"
                      onClick={() => exportMeReportAsPdf(report.id)}
                    >
                      Export PDF
                    </button>
                    <button
                      className="export-button"
                      onClick={() => exportMeReportAsExcel(report.id)}
                    >
                      Export Excel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No ME reports available</p>
          )}
        </div>
      )}
    </div>
  );
};

export default DonorReporting;