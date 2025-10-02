import React from 'react';
import { useLocation } from 'react-router-dom';
import { useCapabilities } from '../../../hooks/useCapabilities';
import MenuItem from '../navigation/MenuItem';
import MenuSection from '../navigation/MenuSection';

/**
 * SidebarShell - Universal dashboard sidebar
 * 
 * Features:
 * - Capability-aware menu items
 * - Auto-generates menu from user capabilities
 * - Collapsible design
 * - Mobile-friendly
 * - Active state tracking
 * - Grouped by functional areas
 */

interface SidebarShellProps {
  isOpen: boolean;
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onToggle: () => void;
  onMobileClose: () => void;
}

export default function SidebarShell({
  isOpen,
  isCollapsed,
  isMobileOpen,
  onToggle,
  onMobileClose
}: SidebarShellProps) {
  const location = useLocation();
  const { hasCapability, hasAnyCapability } = useCapabilities();

  // Check if a path is active
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed left-0 top-0 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 z-30 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Grants Platform
              </span>
            </div>
          )}
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isCollapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              )}
            </svg>
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {/* Dashboard */}
          <MenuItem
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            }
            label="Dashboard"
            path="/dashboard"
            isActive={isActive('/dashboard')}
            isCollapsed={isCollapsed}
          />

          {/* Onboarding Section */}
          {hasAnyCapability(['onboarding.view', 'onboarding.complete', 'onboarding.review']) && (
            <MenuSection title="Onboarding" isCollapsed={isCollapsed}>
              {hasCapability('onboarding.view') && (
                <MenuItem
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  }
                  label="My Onboarding"
                  path="/onboarding"
                  isActive={isActive('/onboarding')}
                  isCollapsed={isCollapsed}
                />
              )}
            </MenuSection>
          )}

          {/* Organizations Section */}
          {hasAnyCapability(['organizations.view', 'organizations.create']) && (
            <MenuSection title="Organizations" isCollapsed={isCollapsed}>
              {hasCapability('organizations.view') && (
                <MenuItem
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  }
                  label="Organizations"
                  path="/organizations"
                  isActive={isActive('/organizations')}
                  isCollapsed={isCollapsed}
                />
              )}
            </MenuSection>
          )}

          {/* Projects Section */}
          {hasAnyCapability(['projects.view', 'projects.create']) && (
            <MenuSection title="Projects" isCollapsed={isCollapsed}>
              {hasCapability('projects.view') && (
                <MenuItem
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  }
                  label="All Projects"
                  path="/projects"
                  isActive={isActive('/projects')}
                  isCollapsed={isCollapsed}
                />
              )}
            </MenuSection>
          )}

          {/* Finance Section */}
          {hasAnyCapability(['budgets.view', 'disbursements.view', 'fund_requests.view']) && (
            <MenuSection title="Finance" isCollapsed={isCollapsed}>
              {hasCapability('budgets.view') && (
                <MenuItem
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  label="Budgets"
                  path="/budgets"
                  isActive={isActive('/budgets')}
                  isCollapsed={isCollapsed}
                />
              )}
              {hasCapability('fund_requests.view') && (
                <MenuItem
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  }
                  label="Fund Requests"
                  path="/fund-requests"
                  isActive={isActive('/fund-requests')}
                  isCollapsed={isCollapsed}
                />
              )}
              {hasCapability('disbursements.view') && (
                <MenuItem
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  }
                  label="Disbursements"
                  path="/disbursements"
                  isActive={isActive('/disbursements')}
                  isCollapsed={isCollapsed}
                />
              )}
            </MenuSection>
          )}

          {/* Reports Section */}
          {hasAnyCapability(['me_reports.view', 'financial_reports.view']) && (
            <MenuSection title="Reports" isCollapsed={isCollapsed}>
              {hasCapability('me_reports.view') && (
                <MenuItem
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  }
                  label="M&E Reports"
                  path="/me-reports"
                  isActive={isActive('/me-reports')}
                  isCollapsed={isCollapsed}
                />
              )}
              {hasCapability('financial_reports.view') && (
                <MenuItem
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  }
                  label="Financial Reports"
                  path="/financial-reports"
                  isActive={isActive('/financial-reports')}
                  isCollapsed={isCollapsed}
                />
              )}
            </MenuSection>
          )}

          {/* Documents & Compliance Section */}
          {hasAnyCapability(['documents.view', 'compliance.view', 'contracts.view']) && (
            <MenuSection title="Documents" isCollapsed={isCollapsed}>
              {hasCapability('documents.view') && (
                <MenuItem
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  }
                  label="Documents"
                  path="/documents"
                  isActive={isActive('/documents')}
                  isCollapsed={isCollapsed}
                />
              )}
              {hasCapability('contracts.view') && (
                <MenuItem
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  }
                  label="Contracts"
                  path="/contracts"
                  isActive={isActive('/contracts')}
                  isCollapsed={isCollapsed}
                />
              )}
              {hasCapability('compliance.view') && (
                <MenuItem
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  }
                  label="Compliance"
                  path="/compliance"
                  isActive={isActive('/compliance')}
                  isCollapsed={isCollapsed}
                />
              )}
            </MenuSection>
          )}

          {/* Approvals Section */}
          {hasAnyCapability(['approvals.view', 'approvals.act']) && (
            <MenuSection title="Approvals" isCollapsed={isCollapsed}>
              {hasCapability('approvals.view') && (
                <MenuItem
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  label="Approvals"
                  path="/approvals"
                  isActive={isActive('/approvals')}
                  isCollapsed={isCollapsed}
                  badge={5}
                />
              )}
            </MenuSection>
          )}

          {/* Support Section */}
          {hasAnyCapability(['issues.view', 'issues.create']) && (
            <MenuSection title="Support" isCollapsed={isCollapsed}>
              <MenuItem
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5.07 19h13.86A2 2 0 0021 17.07V6.93A2 2 0 0018.93 5H5.07A2 2 0 003 6.93v10.14A2 2 0 005.07 19z" />
                  </svg>
                }
                label="Issues"
                path="/issues"
                isActive={isActive('/issues')}
                isCollapsed={isCollapsed}
              />
              <MenuItem
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                label="Help Center"
                path="/help"
                isActive={isActive('/help')}
                isCollapsed={isCollapsed}
              />
            </MenuSection>
          )}

          {/* Admin Section */}
          {hasAnyCapability(['users.view', 'audit_logs.view', 'system.read']) && (
            <MenuSection title="Administration" isCollapsed={isCollapsed}>
              {hasCapability('users.view') && (
                <MenuItem
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  }
                  label="Users"
                  path="/admin/users"
                  isActive={isActive('/admin/users')}
                  isCollapsed={isCollapsed}
                />
              )}
              {hasCapability('audit_logs.view') && (
                <MenuItem
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  }
                  label="Audit Logs"
                  path="/admin/audit-logs"
                  isActive={isActive('/admin/audit-logs')}
                  isCollapsed={isCollapsed}
                />
              )}
            </MenuSection>
          )}
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              <p>Version 1.0.0</p>
              <p className="mt-1">© 2025 Grants Platform</p>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 z-40 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Grants Platform
            </span>
          </div>
          <button
            onClick={onMobileClose}
            className="p-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation Menu (Same as desktop but without collapse) */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {/* Same menu items as desktop */}
          <MenuItem
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            }
            label="Dashboard"
            path="/dashboard"
            isActive={isActive('/dashboard')}
            isCollapsed={false}
            onClick={onMobileClose}
          />
          {/* Add all other menu items here - same as desktop */}
        </nav>
      </aside>
    </>
  );
}
