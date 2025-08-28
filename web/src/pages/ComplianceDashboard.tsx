import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getComplianceDashboard,
  getComplianceAlerts,
  getAlertHistory,
  ComplianceDashboardData,
  ComplianceAlert,
  AlertHistoryItem
} from '../services/compliance';
import './ComplianceDashboard.css';

const ComplianceDashboard: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<ComplianceDashboardData | null>(null);
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [alertHistory, setAlertHistory] = useState<AlertHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboard, alerts, history] = await Promise.all([
        getComplianceDashboard(),
        getComplianceAlerts(),
        getAlertHistory()
      ]);
      
      setDashboardData(dashboard);
      setAlerts(alerts);
      setAlertHistory(history);
      setError(null);
    } catch (err) {
      setError('Failed to fetch compliance data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'severity-high';
      case 'medium':
        return 'severity-medium';
      case 'low':
        return 'severity-low';
      default:
        return '';
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'status-overdue';
      case 'completed':
        return 'status-completed';
      case 'pending':
        return 'status-pending';
      default:
        return '';
    }
  };

  if (!user) {
    return (
      <div className="compliance-dashboard-container">
        <div className="compliance-dashboard-card">
          <p>Please log in to view the compliance dashboard.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="compliance-dashboard-container">
        <div className="compliance-dashboard-card">
          <p>Loading compliance dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="compliance-dashboard-container">
        <div className="compliance-dashboard-card">
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="compliance-dashboard-container">
      <div className="compliance-dashboard-card">
        <div className="compliance-dashboard-header">
          <h1>Compliance Monitoring Dashboard</h1>
          <p>Welcome, {user.firstName} {user.lastName}!</p>
        </div>

        <div className="compliance-dashboard-grid">
          {/* Compliance Stats */}
          <div className="compliance-section">
            <h2>Compliance Statistics</h2>
            <div className="compliance-stats">
              <div className="stat-item">
                <span className="stat-label">Total Audit Logs</span>
                <span className="stat-value">{dashboardData?.complianceStats.totalAuditLogs || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Total Documents</span>
                <span className="stat-value">{dashboardData?.complianceStats.documentStats.total || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Versioned Documents</span>
                <span className="stat-value">{dashboardData?.complianceStats.documentStats.versioned || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">% Versioned</span>
                <span className="stat-value">{dashboardData?.complianceStats.documentStats.percentageVersioned || 0}%</span>
              </div>
            </div>
          </div>

          {/* Budget Actions */}
          <div className="compliance-section">
            <h2>Budget Actions</h2>
            <div className="budget-actions">
              <div className="action-item">
                <span className="action-label">Created</span>
                <span className="action-count">{dashboardData?.complianceStats.budgetActions.create || 0}</span>
              </div>
              <div className="action-item">
                <span className="action-label">Updated</span>
                <span className="action-count">{dashboardData?.complianceStats.budgetActions.update || 0}</span>
              </div>
              <div className="action-item">
                <span className="action-label">Submitted</span>
                <span className="action-count">{dashboardData?.complianceStats.budgetActions.submit || 0}</span>
              </div>
              <div className="action-item">
                <span className="action-label">Approved</span>
                <span className="action-count">{dashboardData?.complianceStats.budgetActions.approve || 0}</span>
              </div>
              <div className="action-item">
                <span className="action-label">Deleted</span>
                <span className="action-count">{dashboardData?.complianceStats.budgetActions.delete || 0}</span>
              </div>
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="compliance-section">
            <h2>Upcoming Deadlines</h2>
            {dashboardData?.upcomingDeadlines && dashboardData.upcomingDeadlines.length > 0 ? (
              <div className="deadlines-list">
                {dashboardData.upcomingDeadlines.map(deadline => (
                  <div key={deadline.id} className="deadline-item">
                    <div className="deadline-header">
                      <span className="deadline-title">{deadline.title}</span>
                      <span className={`deadline-status ${getStatusClass(deadline.status)}`}>
                        {deadline.status}
                      </span>
                    </div>
                    <div className="deadline-date">
                      Due: {new Date(deadline.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data">No upcoming deadlines</p>
            )}
          </div>

          {/* Active Alerts */}
          <div className="compliance-section">
            <h2>Active Alerts</h2>
            {alerts && alerts.length > 0 ? (
              <div className="alerts-list">
                {alerts.map(alert => (
                  <div key={alert.id} className={`alert-item ${getSeverityClass(alert.severity)}`}>
                    <div className="alert-header">
                      <span className="alert-title">{alert.title}</span>
                      <span className={`alert-severity ${getSeverityClass(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </div>
                    <div className="alert-description">
                      {alert.description}
                    </div>
                    <div className="alert-meta">
                      {alert.entity_type && (
                        <span className="alert-entity">
                          Entity: {alert.entity_type}
                        </span>
                      )}
                      <span className="alert-date">
                        {new Date(alert.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data">No active alerts</p>
            )}
          </div>

          {/* Alert History */}
          <div className="compliance-section">
            <h2>Alert History</h2>
            {alertHistory && alertHistory.length > 0 ? (
              <div className="alert-history-list">
                {alertHistory.map(alert => (
                  <div key={alert.id} className={`alert-history-item ${alert.resolved ? 'resolved' : ''}`}>
                    <div className="alert-history-header">
                      <span className="alert-history-title">{alert.title}</span>
                      <span className={`alert-history-severity ${getSeverityClass(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </div>
                    <div className="alert-history-description">
                      {alert.description}
                    </div>
                    <div className="alert-history-meta">
                      {alert.entity_type && (
                        <span className="alert-history-entity">
                          Entity: {alert.entity_type}
                        </span>
                      )}
                      <span className="alert-history-date">
                        {new Date(alert.created_at).toLocaleDateString()}
                      </span>
                      {alert.resolved && alert.resolved_at && (
                        <span className="alert-history-resolved">
                          Resolved: {new Date(alert.resolved_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data">No alert history</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceDashboard;