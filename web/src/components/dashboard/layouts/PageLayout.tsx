import React, { ReactNode } from 'react';
import Breadcrumbs from '../navigation/Breadcrumbs';

/**
 * PageLayout - Standard page wrapper component
 * 
 * Features:
 * - Page title and subtitle
 * - Breadcrumb navigation
 * - Action buttons area
 * - Consistent spacing
 * - Responsive design
 */

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function PageLayout({
  title,
  subtitle,
  breadcrumbs,
  actions,
  children,
  className = ''
}: PageLayoutProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Page Header */}
      <div className="space-y-4">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumbs items={breadcrumbs} />
        )}

        {/* Title and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>

          {actions && (
            <div className="flex items-center space-x-3">
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* Page Content */}
      <div>
        {children}
      </div>
    </div>
  );
}
