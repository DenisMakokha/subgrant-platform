import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getTotalDisbursementAmount } from '../services/disbursements';
import { DisbursementTotal } from '../types';
import './FinancialDashboard.css';

const FinancialDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [financialData, setFinancialData] = useState<Record<string, DisbursementTotal>>({});
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  // Supported currencies for the dashboard
  const supportedCurrencies = ['USD', 'EUR', 'GBP', 'KES', 'UGX'];

  useEffect(() => {
    fetchFinancialData();
  }, [selectedCurrency]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch total amounts for different categories
      const totalDisbursements = await getTotalDisbursementAmount(selectedCurrency);
      
      setFinancialData({
        totalDisbursements
      });
    } catch (err) {
      setError('Failed to fetch financial data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  if (!user) {
    return (
      <div className="financial-dashboard">
        <div className="dashboard-card">
          <p>Please log in to view the financial dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="financial-dashboard">
      <div className="dashboard-header">
        <h1>Financial Dashboard</h1>
        <div className="currency-selector">
          <label htmlFor="currency-select">Display Currency: </label>
          <select 
            id="currency-select"
            value={selectedCurrency} 
            onChange={(e) => setSelectedCurrency(e.target.value)}
          >
            {supportedCurrencies.map(currency => (
              <option key={currency} value={currency}>{currency}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="loading">Loading financial data...</div>
      ) : (
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h2>Total Disbursements</h2>
            <div className="stat-value">
              {formatCurrency(financialData.totalDisbursements?.totalAmount || 0, selectedCurrency)}
            </div>
            <div className="stat-detail">
              {financialData.totalDisbursements?.count || 0} disbursements
            </div>
          </div>

          <div className="dashboard-card">
            <h2>Financial Overview</h2>
            <div className="chart-placeholder">
              <p>Disbursement distribution chart</p>
            </div>
          </div>

          <div className="dashboard-card">
            <h2>Recent Activity</h2>
            <div className="activity-list">
              <p>Recent disbursement activities</p>
            </div>
          </div>

          <div className="dashboard-card">
            <h2>Currency Conversion Rates</h2>
            <div className="rates-list">
              <p>Current exchange rates</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialDashboard;