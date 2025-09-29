import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PartnerSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  disabled?: boolean;
}

export default function PartnerSidebar({ isOpen = false, setIsOpen, disabled = false }: PartnerSidebarProps) {
  const { user, modules, logout } = useAuth();
  
  // Guard function to redirect locked routes to onboarding landing
  const guardLink = (to: string) => 
    disabled && !to.startsWith('/partner/onboarding') ? '/partner/onboarding/landing' : to;

  const handleLogout = () => {
    logout();
  };

  if (!user || user.role !== 'partner_user') return null;

  const currentProjectId = (() => {
    try { return localStorage.getItem('currentProjectId') || ''; } catch { return ''; }
  })();

  const projectLink = (page: string) => currentProjectId ? `/partner/projects/${currentProjectId}/${page}` : '/partner/projects';

  const items = [
    { 
      to: '/partner', 
      label: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
        </svg>
      ),
      exact: true
    },
    { 
      to: '/partner/onboarding', 
      label: 'Onboarding',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      badge: modules?.onboarding?.status !== 'finalized' ? '!' : null
    },
    {
      to: projectLink('budget'),
      label: 'Budget',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      to: projectLink('fund-request'),
      label: 'Fund Request',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11v6m-3-3h6" />
        </svg>
      )
    },
    {
      to: projectLink('reconciliation'),
      label: 'Reconciliation',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      to: projectLink('reports'),
      label: 'Reports',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      to: projectLink('contracts'),
      label: 'Contracts',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      to: projectLink('documents'),
      label: 'Documents',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707L13.293 3.293A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      to: '/partner/forum', 
      label: 'Forum',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
        </svg>
      )
    },
    {
      to: '/partner/help',
      label: 'Help Center',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-gray-500 bg-opacity-75 lg:hidden"
          onClick={() => setIsOpen?.(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:w-64
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex h-full flex-col pt-20 lg:pt-6">
          <nav className="bg-white/90 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-600/50 rounded-3xl p-3 sticky top-24 mx-4 shadow-lg shadow-gray-200/20 dark:shadow-black/40">
            {/* Navigation Items */}
            <div className="space-y-1.5">
              {items.map((item) => {
                  const isLocked = disabled && !item.to.startsWith('/partner/onboarding');
                  const showProjectHeader = item.label === 'Budget';
                  return (
                    <React.Fragment key={item.to}>
                      {showProjectHeader && (
                        <div className="px-3 pt-1 pb-0 text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400/90">Project</div>
                      )}
                      <NavLink
                        to={guardLink(item.to)}
                        end={(item as any).exact}
                        onClick={() => setIsOpen?.(false)}
                        aria-disabled={isLocked}
                        className={({ isActive }) => `
                          group w-full flex items-center px-3 py-1.5 text-[15px] font-medium rounded-xl transition-all duration-300
                          ${isLocked 
                            ? 'opacity-50 cursor-pointer' 
                            : isActive 
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25' 
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-700/80 dark:hover:to-gray-600/80 dark:hover:text-white hover:shadow-md'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="inline-flex items-center justify-center">{item.icon}</span>
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="ml-auto px-2 py-0.5 text-[10px] font-semibold bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full shadow">
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    </React.Fragment>
                  );
                })}
            </div>
            
            {/* Enhanced Logout Section */}
            <div className="mt-6 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
              <button
                onClick={handleLogout}
                className="group w-full flex items-center px-3 py-1.5 text-[15px] font-medium text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 dark:hover:from-red-900/20 dark:hover:to-pink-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-xl transition-all duration-300 hover:shadow-md"
              >
                <svg className="w-4 h-4 mr-3 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
}
