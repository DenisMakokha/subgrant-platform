import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getTotalDisbursementAmount } from '../services/disbursements';
import { DisbursementTotal } from '../types';

// SVG Icons
const CurrencyDollarIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
  </svg>
);

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
      <div className="space-y-6">
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl shadow-xl">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative p-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <CurrencyDollarIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">
                      Financial Dashboard
                    </h1>
                    <p className="text-blue-100 mt-1">
                      Monitor financial performance and disbursements
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

        <div className="glass-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Display Settings</h2>
            <div className="flex items-center gap-3">
              <label htmlFor="currency-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Currency:
              </label>
              <select 
                id="currency-select"
                value={selectedCurrency} 
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="input-field w-24"
              >
                {supportedCurrencies.map(currency => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="glass-card p-4 border-l-4 border-red-500">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-300">Please log in to view the financial dashboard.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl shadow-xl">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative p-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <CurrencyDollarIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    Financial Dashboard
                  </h1>
                  <p className="text-blue-100 mt-1">
                    Monitor financial performance and disbursements
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

      <div className="glass-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Display Settings</h2>
          <div className="flex items-center gap-3">
            <label htmlFor="currency-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Currency:
            </label>
            <select 
              id="currency-select"
              value={selectedCurrency} 
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="input-field w-24"
            >
              {supportedCurrencies.map(currency => (
                <option key={currency} value={currency}>{currency}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error Messages */}
      {error && (
        <div className="glass-card p-4 border-l-4 border-red-500">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}

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