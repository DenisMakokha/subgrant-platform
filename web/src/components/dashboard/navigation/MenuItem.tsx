import React, { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * MenuItem - Individual menu item component
 * 
 * Features:
 * - Active state styling
 * - Icon support
 * - Badge support (for counts)
 * - Collapsed mode support
 * - Tooltip in collapsed mode
 * - Click handling
 */

interface MenuItemProps {
  icon: ReactNode;
  label: string;
  path: string;
  isActive: boolean;
  isCollapsed: boolean;
  badge?: number;
  onClick?: () => void;
}

export default function MenuItem({
  icon,
  label,
  path,
  isActive,
  isCollapsed,
  badge,
  onClick
}: MenuItemProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(path);
    if (onClick) {
      onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
        isActive
          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
      } ${isCollapsed ? 'justify-center' : ''}`}
      title={isCollapsed ? label : undefined}
    >
      {/* Icon */}
      <span className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'}`}>
        {icon}
      </span>

      {/* Label */}
      {!isCollapsed && (
        <>
          <span className="flex-1 text-left text-sm font-medium">{label}</span>
          
          {/* Badge */}
          {badge !== undefined && badge > 0 && (
            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
              isActive
                ? 'bg-white/20 text-white'
                : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
            }`}>
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </>
      )}

      {/* Tooltip for collapsed mode */}
      {isCollapsed && (
        <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
          {label}
          {badge !== undefined && badge > 0 && (
            <span className="ml-2 px-1.5 py-0.5 text-xs font-semibold bg-white/20 rounded-full">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
          <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45"></div>
        </div>
      )}

      {/* Active indicator */}
      {isActive && !isCollapsed && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
      )}
    </button>
  );
}
