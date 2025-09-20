import React from 'react';
import { formatOrgStatus, getStatusDescription, getStatusColor } from '../utils/format';

interface StatusBadgeProps {
  status: string;
  showDescription?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  showDescription = false, 
  size = 'md',
  className = '' 
}) => {
  const colors = getStatusColor(status);
  const formattedStatus = formatOrgStatus(status);
  const description = getStatusDescription(status);

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  };

  if (showDescription) {
    return (
      <div className={`rounded-xl border ${colors.bg} ${colors.border} p-4 ${className}`}>
        <div className="flex items-start space-x-3">
          <div className={`w-3 h-3 rounded-full ${colors.text.replace('text-', 'bg-')} mt-1 flex-shrink-0`}></div>
          <div>
            <h4 className={`font-semibold ${colors.text}`}>{formattedStatus}</h4>
            <p className={`mt-1 text-sm ${colors.text} opacity-80`}>{description}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <span className={`
      inline-flex items-center font-medium rounded-full border
      ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses[size]} ${className}
    `}>
      <div className={`w-2 h-2 rounded-full ${colors.text.replace('text-', 'bg-')} mr-2`}></div>
      {formattedStatus}
    </span>
  );
};

export default StatusBadge;
