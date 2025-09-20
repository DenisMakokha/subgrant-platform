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

  const items = [
    { 
      to: '/partner', 
      label: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      exact: true
    },
    { 
      to: '/partner/onboarding', 
      label: 'Onboarding',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      badge: modules?.onboarding?.status !== 'finalized' ? '!' : null
    },
    { 
      to: '/partner/applications', 
      label: 'Applications',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      badge: modules?.applications?.drafts > 0 ? modules.applications.drafts : null
    },
    { 
      to: '/partner/compliance', 
      label: 'Compliance',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      badge: modules?.compliance?.expiring_soon > 0 ? '!' : null
    },
    { 
      to: '/partner/me', 
      label: 'M&E Reports',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      badge: modules?.me_reports?.due > 0 ? modules.me_reports.due : null
    },
    { 
      to: '/partner/finance', 
      label: 'Finance',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      )
    },
    { 
      to: '/partner/messages', 
      label: 'Messages',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      badge: modules?.messages?.unread > 0 ? modules.messages.unread : null
    },
    { 
      to: '/partner/settings', 
      label: 'Settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572C2.562 11.445 2.562 8.997 4.317 8.571a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
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
          <nav className="bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-3xl p-4 sticky top-24 mx-4 shadow-xl shadow-gray-200/20 dark:shadow-gray-900/20">
            {/* Navigation Items */}
            <div className="space-y-2">
              {items.map((item) => {
                const isLocked = disabled && !item.to.startsWith('/partner/onboarding');
                return (
                  <NavLink
                    key={item.to}
                    to={guardLink(item.to)}
                    end={item.exact}
                    onClick={() => setIsOpen?.(false)}
                    aria-disabled={isLocked}
                    className={({ isActive }) => `
                      group w-full flex items-center px-4 py-3 text-sm font-medium rounded-2xl transition-all duration-300
                      ${isLocked 
                        ? 'opacity-50 cursor-pointer' 
                        : isActive 
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 transform scale-[1.02]' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-800 dark:hover:to-gray-700 hover:shadow-md hover:scale-[1.01]'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="ml-auto px-2.5 py-1 text-xs font-semibold bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full shadow-lg animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
            
            {/* Enhanced Logout Section */}
            <div className="mt-6 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
              <button
                onClick={handleLogout}
                className="group w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 dark:hover:from-red-900/20 dark:hover:to-pink-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-2xl transition-all duration-300 hover:shadow-md hover:scale-[1.01]"
              >
                <svg className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
