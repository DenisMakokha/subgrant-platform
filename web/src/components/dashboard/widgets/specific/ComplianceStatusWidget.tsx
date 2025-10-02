import React, { useEffect, useState } from 'react';
import Widget from '../base/Widget';

interface ComplianceData {
  total: number;
  compliant: number;
  pending: number;
  overdue: number;
  complianceRate: number;
}

export default function ComplianceStatusWidget() {
  const [data, setData] = useState<ComplianceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchComplianceData();
  }, []);

  const fetchComplianceData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/partner/compliance/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch compliance data');
      
      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError('Failed to load compliance data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Widget
      title="Compliance Status"
      subtitle="Document compliance overview"
      capability="compliance.view"
      loading={loading}
      error={error || undefined}
    >
      {data && (
        <div className="space-y-4">
          {/* Compliance Rate Circle */}
          <div className="flex items-center justify-center">
            <div className="relative w-32 h-32">
              <svg className="transform -rotate-90 w-32 h-32">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-gray-200 dark:text-gray-700"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - data.complianceRate / 100)}`}
                  className="text-green-500 transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data.complianceRate}%
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Compliant</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {data.compliant}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Compliant</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {data.pending}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {data.overdue}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Overdue</p>
            </div>
          </div>
        </div>
      )}
    </Widget>
  );
}
