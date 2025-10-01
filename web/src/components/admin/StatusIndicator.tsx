import React from 'react';

interface StatusIndicatorProps {
  status: 'healthy' | 'warning' | 'error' | 'unknown';
  label?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  showLabel = true,
  size = 'md',
  className = '',
}) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'healthy':
        return {
          color: 'bg-green-500',
          textColor: 'text-green-700 dark:text-green-300',
          bgColor: 'bg-green-100 dark:bg-green-900/20',
          label: label || 'Healthy',
        };
      case 'warning':
        return {
          color: 'bg-yellow-500',
          textColor: 'text-yellow-700 dark:text-yellow-300',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
          label: label || 'Warning',
        };
      case 'error':
        return {
          color: 'bg-red-500',
          textColor: 'text-red-700 dark:text-red-300',
          bgColor: 'bg-red-100 dark:bg-red-900/20',
          label: label || 'Error',
        };
      default:
        return {
          color: 'bg-gray-500',
          textColor: 'text-gray-700 dark:text-gray-300',
          bgColor: 'bg-gray-100 dark:bg-gray-900/20',
          label: label || 'Unknown',
        };
    }
  };

  const config = getStatusConfig(status);

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`rounded-full ${sizeClasses[size]} ${config.color}`} />
      {showLabel && (
        <span className={`text-sm font-medium ${config.textColor}`}>
          {config.label}
        </span>
      )}
    </div>
  );
};

export default StatusIndicator;
