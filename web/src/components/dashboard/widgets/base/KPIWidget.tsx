import React from 'react';
import { useCapabilities } from '../../../../hooks/useCapabilities';

/**
 * KPIWidget - Key Performance Indicator widget
 * 
 * Features:
 * - Large value display
 * - Trend indicator
 * - Change percentage
 * - Icon support
 * - Color variants
 */

interface KPIWidgetProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
  capability?: string;
  loading?: boolean;
  onClick?: () => void;
}

export default function KPIWidget({
  title,
  value,
  change,
  trend = 'neutral',
  icon,
  color = 'blue',
  capability,
  loading = false,
  onClick
}: KPIWidgetProps) {
  const { hasCapability } = useCapabilities();

  if (capability && !hasCapability(capability)) {
    return null;
  }

  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
    indigo: 'from-indigo-500 to-indigo-600'
  };

  const trendColors = {
    up: 'text-green-600 dark:text-green-400',
    down: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-600 dark:text-gray-400'
  };

  const trendIcons = {
    up: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    down: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
      </svg>
    ),
    neutral: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
      </svg>
    )
  };

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden bg-white dark:bg-gray-800 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-gray-700 hover:border-${color}-200 dark:hover:border-${color}-700 hover:-translate-y-1 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* Gradient Background Overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br from-${color}-50 to-${color === 'blue' ? 'indigo' : color === 'green' ? 'emerald' : color === 'purple' ? 'pink' : color === 'red' ? 'rose' : color === 'yellow' ? 'orange' : 'indigo'}-50 dark:from-${color}-900/20 dark:to-${color === 'blue' ? 'indigo' : color === 'green' ? 'emerald' : color === 'purple' ? 'pink' : color === 'red' ? 'rose' : color === 'yellow' ? 'orange' : 'indigo'}-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
      
      {/* Decorative Circle */}
      <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-${color}-100/50 to-${color === 'blue' ? 'indigo' : color === 'green' ? 'emerald' : color === 'purple' ? 'pink' : color === 'red' ? 'rose' : color === 'yellow' ? 'orange' : 'indigo'}-100/50 dark:from-${color}-800/20 dark:to-${color === 'blue' ? 'indigo' : color === 'green' ? 'emerald' : color === 'purple' ? 'pink' : color === 'red' ? 'rose' : color === 'yellow' ? 'orange' : 'indigo'}-800/20 rounded-full -translate-y-10 translate-x-10 group-hover:scale-110 transition-transform duration-300`}></div>
      
      <div className="relative p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          {icon && (
            <div className={`p-3 sm:p-4 rounded-2xl bg-gradient-to-br ${colorClasses[color]} shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300`}>
              {icon}
            </div>
          )}
          
          {trend !== 'neutral' && (
            <div className="text-right">
              <div className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${trend === 'up' ? 'from-green-400 to-emerald-400' : 'from-red-400 to-rose-400'} ${trend === 'up' ? 'animate-pulse' : ''} shadow-lg`}></div>
                <span className={`text-xs font-medium ${trendColors[trend]}`}>
                  {trend === 'up' ? 'Up' : 'Down'}
                </span>
              </div>
            </div>
          )}
        </div>
        
        <div>
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">
            {title}
          </p>
          
          {loading ? (
            <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          ) : (
            <p className={`text-4xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-${color}-600 dark:group-hover:text-${color}-400 transition-colors duration-300`}>
              {value}
            </p>
          )}

          {change && !loading && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                <span>{change}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
