import React from 'react';
import { useCapabilities } from '../../../../hooks/useCapabilities';

interface ListItem {
  id: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  onClick?: () => void;
}

interface ListWidgetProps {
  title: string;
  items: ListItem[];
  capability?: string;
  loading?: boolean;
  emptyMessage?: string;
  maxItems?: number;
  showViewAll?: boolean;
  onViewAll?: () => void;
}

export default function ListWidget({
  title,
  items,
  capability,
  loading = false,
  emptyMessage = 'No items to display',
  maxItems,
  showViewAll = false,
  onViewAll
}: ListWidgetProps) {
  const { hasCapability } = useCapabilities();

  if (capability && !hasCapability(capability)) {
    return null;
  }

  const displayItems = maxItems ? items.slice(0, maxItems) : items;

  return (
    <div className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-gray-700">
      {/* Gradient Background Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        {showViewAll && items.length > 0 && (
          <button
            onClick={onViewAll}
            className="px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
          >
            View All
          </button>
        )}
      </div>

      <div className="relative p-6">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : displayItems.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayItems.map((item) => (
              <div
                key={item.id}
                onClick={item.onClick}
                className={`group/item flex items-center space-x-3 p-4 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 transition-all duration-300 border border-transparent hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-md ${
                  item.onClick ? 'cursor-pointer' : ''
                }`}
              >
                {item.icon && (
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg group-hover/item:shadow-xl group-hover/item:scale-110 transition-all duration-300">
                    {item.icon}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400 transition-colors">
                    {item.title}
                  </p>
                  {item.subtitle && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-0.5">
                      {item.subtitle}
                    </p>
                  )}
                </div>
                {item.badge && (
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full shadow-sm ${
                    item.badgeColor || 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
