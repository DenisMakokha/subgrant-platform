import React, { ReactNode } from 'react';
import { useCapabilities } from '../../../../hooks/useCapabilities';

/**
 * Widget - Base widget wrapper component
 * 
 * Features:
 * - Capability-based visibility
 * - Loading states
 * - Error states
 * - Action buttons
 * - Consistent styling
 */

interface WidgetProps {
  title: string;
  subtitle?: string;
  capability?: string;
  loading?: boolean;
  error?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  span?: number;
}

export default function Widget({
  title,
  subtitle,
  capability,
  loading = false,
  error,
  actions,
  children,
  className = '',
  span = 1
}: WidgetProps) {
  const { hasCapability } = useCapabilities();

  // Check capability if specified
  if (capability && !hasCapability(capability)) {
    return null;
  }

  const spanClass = span > 1 ? `col-span-${span}` : '';

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 ${spanClass} ${className}`}>
      {/* Widget Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* Widget Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <svg className="w-12 h-12 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
