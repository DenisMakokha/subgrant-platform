import React from 'react';

interface MetricsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  children?: React.ReactNode;
}

const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  icon,
  trend,
  className = '',
  children,
}) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <div className="flex items-center mt-2">
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {value}
            </p>
            {trend && (
              <span
                className={`ml-2 text-sm font-medium ${
                  trend.isPositive
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
              </span>
            )}
          </div>
          {children}
        </div>
        {icon && (
          <div className="flex-shrink-0 text-gray-400 dark:text-gray-500">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricsCard;
