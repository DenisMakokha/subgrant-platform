import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { getUserDisplayName } from '../utils/format';
import { formatDistanceToNow } from 'date-fns';

interface AdminHeaderProps {
  darkMode: boolean;
  toggleTheme: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ 
  darkMode, 
  toggleTheme,
  sidebarOpen,
  setSidebarOpen 
}) => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [reportedIssuesCount, setReportedIssuesCount] = useState(0);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Get recent unread notifications for dropdown (max 5)
  const recentNotifications = notifications
    .filter(n => !n.read)
    .slice(0, 5);

  // Fetch reported issues count
  useEffect(() => {
    const fetchIssuesCount = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/reported-issues/stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Count open and in_progress issues
          const openCount = parseInt(data.data.open || 0) + parseInt(data.data.in_progress || 0);
          setReportedIssuesCount(openCount);
        }
      } catch (error) {
        console.error('Error fetching issues count:', error);
        setReportedIssuesCount(0);
      }
    };
    fetchIssuesCount();
    
    // Refresh count every 5 minutes
    const interval = setInterval(fetchIssuesCount, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
      <div className="mx-auto max-w-full px-2 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {sidebarOpen ? (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
            <Link to="/admin/dashboard" className="group flex items-center gap-3 ml-4 lg:ml-0 transition-all duration-300 hover:scale-105">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:shadow-blue-500/25 transition-all duration-300">
                <span className="text-white font-bold text-lg">GP</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:via-purple-700 group-hover:to-indigo-800 transition-all duration-300">
                Grants Platform
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {/* Reported Issues quick action */}
            <button
              onClick={() => {
                navigate('/admin/reported-issues');
              }}
              className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-xl text-white bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 shadow-md hover:shadow-lg text-sm relative"
              title="View reported issues"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5.07 19h13.86A2 2 0 0021 17.07V6.93A2 2 0 0018.93 5H5.07A2 2 0 003 6.93v10.14A2 2 0 005.07 19z" />
              </svg>
              <span>Reported Issues ({reportedIssuesCount})</span>
            </button>

            {/* Enhanced Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-300 hover:shadow-md hover:scale-110"
            >
              {darkMode ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Enhanced Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-300 hover:shadow-md hover:scale-110 relative"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-red-500 to-pink-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse">{unreadCount}</span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                  <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="text-xs bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium shadow-sm">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
                    {recentNotifications.length > 0 ? (
                      recentNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-all border-l-2 border-blue-500 bg-blue-50/30 dark:bg-blue-900/10`}
                          onClick={() => {
                            markAsRead(notification.id);
                            setShowNotifications(false);
                            if (notification.action_url) {
                              navigate(notification.action_url);
                            }
                          }}
                        >
                          <div className="flex items-start space-x-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-1">
                                {notification.message}
                              </p>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                              </p>
                            </div>
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 flex-shrink-0"></div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400">No unread notifications</p>
                      </div>
                    )}
                  </div>
                  <Link 
                    to="/admin/notifications" 
                    className="block px-4 py-2.5 text-center text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 transition-colors"
                    onClick={() => setShowNotifications(false)}
                  >
                    View all notifications →
                  </Link>
                </div>
              )}
            </div>

            {/* Enhanced User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="group flex items-center space-x-3 p-2.5 rounded-2xl hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-300 hover:shadow-lg"
              >
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:shadow-blue-500/25 group-hover:scale-110 transition-all duration-300">
                  <span className="text-white font-bold text-sm">
                    {getUserDisplayName(user).charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="hidden sm:block text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors duration-300">
                  {getUserDisplayName(user)}
                </span>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 group-hover:rotate-180 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {getUserDisplayName(user)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{user?.email}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">Admin</p>
                  </div>
                  
                  <div className="py-2">
                    <Link
                      to="/admin/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Dashboard
                      </div>
                    </Link>
                    
                    <Link
                      to="/admin/users"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        User Management
                      </div>
                    </Link>
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 py-2">
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
