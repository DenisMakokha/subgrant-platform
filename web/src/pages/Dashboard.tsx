import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getContracts } from '../services/contracts';
import { Contract } from '../types';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchContractData();
  }, []);

  const fetchContractData = async () => {
    try {
      setLoading(true);
      // For now, we'll just fetch all contracts
      // In a real implementation, you might want to filter by user/organization
      const contractData = await getContracts();
      setContracts(contractData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch contract data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusClasses: Record<string, string> = {
      ready: 'status-ready',
      sent: 'status-sent',
      partially_signed: 'status-partially-signed',
      completed: 'status-completed',
      filed: 'status-filed',
      declined: 'status-declined',
      voided: 'status-voided',
    };
    
    return (
      <span className={`status-badge ${statusClasses[status] || 'status-default'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  if (!user) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-card">
          <p>Please log in to view the dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <p>Welcome, {user.firstName} {user.lastName}!</p>
          <p>Role: {user.role}</p>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-section">
            <h2>Contracts Overview</h2>
            <div className="overview-stats">
              <div className="stat-item">
                <span className="stat-label">Total Contracts</span>
                <span className="stat-value">{contracts.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Completed</span>
                <span className="stat-value">
                  {contracts.filter(c => c.status === 'completed').length}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Pending</span>
                <span className="stat-value">
                  {contracts.filter(c => c.status === 'ready' || c.status === 'sent').length}
                </span>
              </div>
            </div>
          </div>

          <div className="dashboard-section">
            <h2>Recent Contracts</h2>
            {loading ? (
              <p>Loading...</p>
            ) : error ? (
              <p className="error-message">{error}</p>
            ) : contracts.length > 0 ? (
              <div className="recent-contracts">
                {contracts.slice(0, 3).map(contract => (
                  <div key={contract.id} className="contract-item">
                    <div className="contract-header">
                      <span className="contract-title">{contract.title}</span>
                      {getStatusBadge(contract.status)}
                    </div>
                    <div className="contract-meta">
                      Created: {new Date(contract.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data">No contracts found</p>
            )}
          </div>

          <div className="dashboard-section">
            <h2>Quick Actions</h2>
            <div className="quick-actions">
              <button className="action-button">
                Create New Contract
              </button>
              <button className="action-button">
                View All Contracts
              </button>
              <button className="action-button">
                Contract Reports
              </button>
            </div>
          </div>

          <div className="dashboard-section">
            <h2>Contract Status Distribution</h2>
            <div className="status-distribution">
              {Object.entries(
                contracts.reduce((acc, contract) => {
                  acc[contract.status] = (acc[contract.status] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([status, count]) => (
                <div key={status} className="status-item">
                  <div className="status-count">{count}</div>
                  <div className="status-name">{status.replace('_', ' ')}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;