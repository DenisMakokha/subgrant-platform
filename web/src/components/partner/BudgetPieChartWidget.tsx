import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { fetchWithAuth } from '../../services/api';

interface BudgetCategory {
  name: string;
  allocated: number;
  spent: number;
  percentage: number;
  [key: string]: string | number; // Index signature for Recharts compatibility
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export const BudgetPieChartWidget: React.FC = () => {
  const [data, setData] = useState<BudgetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBudgetData();
  }, []);

  const fetchBudgetData = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth('/partner/dashboard/budget-breakdown');
      
      if (response.success) {
        setData(response.data);
        setError(null);
      } else {
        throw new Error(response.error || 'Failed to fetch budget data');
      }
    } catch (err) {
      console.error('Error fetching budget data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load budget data');
      // Set sample data for display
      setData([
        { name: 'Personnel', allocated: 50000, spent: 35000, percentage: 30 },
        { name: 'Equipment', allocated: 30000, spent: 25000, percentage: 20 },
        { name: 'Training', allocated: 20000, spent: 15000, percentage: 15 },
        { name: 'Operations', allocated: 25000, spent: 20000, percentage: 18 },
        { name: 'Other', allocated: 15000, spent: 10000, percentage: 12 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Budget Allocation</h3>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const totalBudget = data.reduce((sum, item) => sum + item.allocated, 0);
  const totalSpent = data.reduce((sum, item) => sum + item.spent, 0);
  const utilizationRate = totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : '0.0';

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Budget Allocation</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Utilization:</span>
          <span className="text-lg font-bold text-blue-600">{utilizationRate}%</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">⚠️ Using sample data</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Total Allocated</p>
          <p className="text-2xl font-bold text-gray-900">
            ${totalBudget.toLocaleString()}
          </p>
        </div>
        <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Total Spent</p>
          <p className="text-2xl font-bold text-gray-900">
            ${totalSpent.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Pie Chart */}
      <div className="h-64 mb-6">
        {/* @ts-ignore - Recharts has type compatibility issues with React 18 */}
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data as any}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }: any) => `${name} (${percentage}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="allocated"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: any) => `$${Number(value).toLocaleString()}`}
              contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Category Breakdown */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700">Category Breakdown</h4>
        {data.map((category, index) => {
          const spentPercentage = category.allocated > 0 
            ? ((category.spent / category.allocated) * 100).toFixed(1)
            : '0.0';
          
          return (
            <div key={category.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm font-medium text-gray-700">{category.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    ${category.spent.toLocaleString()} / ${category.allocated.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">{spentPercentage}% used</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min(parseFloat(spentPercentage), 100)}%`,
                    backgroundColor: COLORS[index % COLORS.length]
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BudgetPieChartWidget;
