import React from 'react';
import { useCapabilities } from '../../../../hooks/useCapabilities';

/**
 * ChartWidget - Chart display widget
 * 
 * Features:
 * - Multiple chart types
 * - Responsive design
 * - Loading states
 * - Empty states
 * - Legend support
 */

interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface ChartWidgetProps {
  title: string;
  subtitle?: string;
  type: 'line' | 'bar' | 'pie' | 'donut';
  data: ChartDataPoint[];
  capability?: string;
  loading?: boolean;
  height?: number;
}

export default function ChartWidget({
  title,
  subtitle,
  type,
  data,
  capability,
  loading = false,
  height = 300
}: ChartWidgetProps) {
  const { hasCapability } = useCapabilities();

  if (capability && !hasCapability(capability)) {
    return null;
  }

  const renderPlaceholder = () => (
    <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
      <div className="text-center">
        <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-sm text-gray-600 dark:text-gray-400">Chart visualization</p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          Integrate chart library (Chart.js, Recharts, etc.)
        </p>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-lg transition-shadow">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {subtitle}
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
          <p className="text-sm text-gray-500 dark:text-gray-400">No data available</p>
        </div>
      ) : (
        renderPlaceholder()
      )}

      {/* Legend */}
      {data.length > 0 && !loading && (
        <div className="mt-4 flex flex-wrap gap-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color || `hsl(${(index * 360) / data.length}, 70%, 50%)` }}
              ></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {item.label}: <span className="font-medium text-gray-900 dark:text-white">{item.value}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
