import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getFinancialReports, exportFinancialReportAsPdf, exportFinancialReportAsExcel } from '../services/financialReports';
import { getMeReports, exportMeReportAsPdf, exportMeReportAsExcel } from '../services/meReports';
import { FinancialReport, MeReport } from '../types/reports';
import './DonorReporting.css';

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
    <div className="donor-reporting">
      <div className="dashboard-header">
        <h1>Donor Reporting</h1>
        <p>Welcome, {user.firstName} {user.lastName}!</p>
      </div>

      <div className="tabs">
        <button 
          className={`tab-button ${activeTab === 'financial' ? 'active' : ''}`}
          onClick={() => setActiveTab('financial')}
        >
          Financial Reports
        </button>
        <button 
          className={`tab-button ${activeTab === 'me' ? 'active' : ''}`}
          onClick={() => setActiveTab('me')}
        >
          ME Reports
        </button>
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