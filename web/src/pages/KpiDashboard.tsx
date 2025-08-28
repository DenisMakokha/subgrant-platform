import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getKpiDashboardData } from '../services/kpi';
import { KpiDashboardData } from '../types/reports';
import './KpiDashboard.css';

const KpiDashboard: React.FC = () => {
  const { user } = useAuth();
  const [kpiData, setKpiData] = useState<KpiDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchKpiData = async () => {
      try {
        setLoading(true);
        const data = await getKpiDashboardData();
        setKpiData(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch KPI data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchKpiData();
  }, []);

  if (loading) {
    return <div className="kpi-dashboard">Loading...</div>;
  }

  if (error) {
    return <div className="kpi-dashboard error">{error}</div>;
  }

  if (!kpiData) {
    return <div className="kpi-dashboard">No data available</div>;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="kpi-dashboard">
      <div className="dashboard-header">
        <h1>KPI Dashboard</h1>
        <p>Welcome, {user?.firstName} {user?.lastName}!</p>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-section">
          <h2>Overview</h2>
          <div className="overview-stats">
            {kpiData.overview.activeProjects !== undefined && (
              <div className="stat-item">
                <span className="stat-label">Active Projects</span>
                <span className="stat-value">{kpiData.overview.activeProjects}</span>
              </div>
            )}
            <div className="stat-item">
              <span className="stat-label">Total Budgets</span>
              <span className="stat-value">{kpiData.overview.totalBudgets}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Approved Budgets</span>
              <span className="stat-value">{kpiData.overview.approvedBudgets}</span>
            </div>
            {kpiData.overview.pendingReports !== undefined && (
              <div className="stat-item">
                <span className="stat-label">Pending Reports</span>
                <span className="stat-value">{kpiData.overview.pendingReports}</span>
              </div>
            )}
            {kpiData.overview.totalDisbursements !== undefined && (
              <div className="stat-item">
                <span className="stat-label">Total Disbursements</span>
                <span className="stat-value">{kpiData.overview.totalDisbursements}</span>
              </div>
            )}
            {kpiData.overview.completedDisbursements !== undefined && (
              <div className="stat-item">
                <span className="stat-label">Completed Disbursements</span>
                <span className="stat-value">{kpiData.overview.completedDisbursements}</span>
              </div>
            )}
            {kpiData.overview.totalBudgetAmount !== undefined && (
              <div className="stat-item">
                <span className="stat-label">Total Budget Amount</span>
                <span className="stat-value">{formatCurrency(kpiData.overview.totalBudgetAmount)}</span>
              </div>
            )}
            {kpiData.overview.totalDisbursedAmount !== undefined && (
              <div className="stat-item">
                <span className="stat-label">Total Disbursed Amount</span>
                <span className="stat-value">{formatCurrency(kpiData.overview.totalDisbursedAmount)}</span>
              </div>
            )}
          </div>
        </div>

        {kpiData.recentReports && (
          <>
            <div className="dashboard-section">
              <h2>Recent ME Reports</h2>
              {kpiData.recentReports.meReports.length > 0 ? (
                <div className="recent-reports">
                  {kpiData.recentReports.meReports.map((report: any) => (
                    <div key={report.id} className="report-item">
                      <div className="report-header">
                        <span className="report-title">{report.title}</span>
                        <span className={`status-badge status-${report.status}`}>
                          {report.status}
                        </span>
                      </div>
                      <div className="report-meta">
                        Date: {formatDate(report.report_date)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">No ME reports found</p>
              )}
            </div>

            <div className="dashboard-section">
              <h2>Recent Financial Reports</h2>
              {kpiData.recentReports.financialReports.length > 0 ? (
                <div className="recent-reports">
                  {kpiData.recentReports.financialReports.map((report: any) => (
                    <div key={report.id} className="report-item">
                      <div className="report-header">
                        <span className="report-title">{report.title}</span>
                      </div>
                      <div className="report-meta">
                        Date: {formatDate(report.report_date)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">No financial reports found</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default KpiDashboard;