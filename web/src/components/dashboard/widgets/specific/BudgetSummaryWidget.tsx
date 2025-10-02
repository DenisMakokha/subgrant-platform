import React, { useEffect, useState } from 'react';
import Widget from '../base/Widget';

interface BudgetData {
  total: number;
  spent: number;
  remaining: number;
  utilization: number;
}

export default function BudgetSummaryWidget() {
  const [data, setData] = useState<BudgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBudgetData();
  }, []);

  const fetchBudgetData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/partner/budgets/summary', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch budget data');
      
      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError('Failed to load budget data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <Widget
      title="Budget Summary"
      subtitle="Overall budget utilization"
      capability="budgets.view"
      loading={loading}
      error={error || undefined}
    >
      {data && (
        <div className="space-y-4">
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400">Utilization</span>
              <span className="font-semibold text-gray-900 dark:text-white">{data.utilization}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(data.utilization, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Budget</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatCurrency(data.total)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Spent</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(data.spent)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Remaining</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                {formatCurrency(data.remaining)}
              </p>
            </div>
          </div>
        </div>
      )}
    </Widget>
  );
}
