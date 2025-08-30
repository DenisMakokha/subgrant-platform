import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getRenewalAlerts } from '../services/renewalAlerts';
import { RenewalAlert } from '../types';
import './RenewalAlerts.css';

const RenewalAlerts: React.FC = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<RenewalAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRenewalAlerts();
  }, []);

  const fetchRenewalAlerts = async () => {
    try {
      setLoading(true);
      const alertsData = await getRenewalAlerts();
      setAlerts(alertsData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch renewal alerts');
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
      case 'critical':
        return 'severity-critical';
      default:
        return '';
    }
  };

  const getDaysMessage = (alert: RenewalAlert) => {
    if (alert.daysUntilClose !== undefined && alert.daysUntilClose > 0) {
      return `${alert.daysUntilClose} days remaining`;
    } else if (alert.daysSinceClose !== undefined && alert.daysSinceClose > 0) {
      return `${alert.daysSinceClose} days overdue`;
    }
    return '';
  };

  if (!user) {
    return (
      <div className="renewal-alerts-container">
        <div className="renewal-alerts-card">
          <p>Please log in to view renewal alerts.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="renewal-alerts-container">
        <div className="renewal-alerts-card">
          <p>Loading renewal alerts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="renewal-alerts-container">
        <div className="renewal-alerts-card">
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="renewal-alerts-container">
      <div className="renewal-alerts-card">
        <div className="renewal-alerts-header">
          <h1>Renewal Alerts</h1>
          <p>Monitor upcoming project expirations and renewal requirements</p>
        </div>

        <div className="renewal-alerts-content">
          {alerts.length === 0 ? (
            <div className="no-alerts">
              <p>No renewal alerts at this time.</p>
              <p>All projects are up to date with their renewal requirements.</p>
            </div>
          ) : (
            <div className="alerts-list">
              <h2>Active Alerts</h2>
              <div className="alerts-grid">
                {alerts.map((alert, index) => (
                  <div key={index} className={`alert-item ${getSeverityClass(alert.severity)}`}>
                    <div className="alert-header">
                      <span className="alert-title">{alert.projectName || 'Project'}</span>
                      <span className={`alert-severity ${getSeverityClass(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </div>
                    <div className="alert-description">
                      {alert.message}
                    </div>
                    <div className="alert-meta">
                      <span className="alert-type">{alert.type.replace(/_/g, ' ')}</span>
                      {getDaysMessage(alert) && (
                        <span className="alert-days">{getDaysMessage(alert)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RenewalAlerts;