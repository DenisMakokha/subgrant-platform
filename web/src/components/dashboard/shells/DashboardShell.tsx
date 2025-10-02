import React, { useState, ReactNode } from 'react';
import HeaderShell from './HeaderShell';
import SidebarShell from './SidebarShell';

/**
 * DashboardShell - Universal dashboard container
 * 
 * This is the main structural component that provides:
 * - Responsive layout
 * - Sidebar management
 * - Header integration
 * - Content area
 * - Dark mode support
 * - Mobile-friendly design
 * 
 * Works with ANY role - admin, partner, or custom roles from Role Wizard
 */

interface DashboardShellProps {
  children: ReactNode;
  className?: string;
}

export default function DashboardShell({ children, className = '' }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <SidebarShell
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        isMobileOpen={mobileSidebarOpen}
        onToggle={toggleSidebar}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        sidebarCollapsed ? 'ml-0 lg:ml-20' : 'ml-0 lg:ml-64'
      }`}>
        {/* Header */}
        <HeaderShell
          onMenuClick={toggleMobileSidebar}
          sidebarCollapsed={sidebarCollapsed}
        />

        {/* Page Content */}
        <main className={`flex-1 overflow-x-hidden overflow-y-auto ${className}`}>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600 dark:text-gray-400">
              <p>© {new Date().getFullYear()} Grants Platform. All rights reserved.</p>
              <div className="flex space-x-4 mt-2 sm:mt-0">
                <a href="/help" className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
                  Help
                </a>
                <a href="/privacy" className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
                  Privacy
                </a>
                <a href="/terms" className="hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
                  Terms
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
