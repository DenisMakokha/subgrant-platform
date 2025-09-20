import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import PartnerSidebar from './PartnerSidebar';
import PartnerHeader from './PartnerHeader';
import { useAuth } from '../contexts/AuthContext';

export default function PartnerShell() {
  const { user, onboardingLocked } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = darkMode ? 'light' : 'dark';
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark', !darkMode);
    localStorage.setItem('theme', newTheme);
  };

  if (!user || user.role !== 'partner_user') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 text-lg font-medium">Access denied</div>
          <div className="text-gray-600 dark:text-gray-400 mt-2">Partner role required</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PartnerHeader 
        darkMode={darkMode} 
        toggleTheme={toggleTheme}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      
      <div className="mx-auto max-w-full px-2 sm:px-4 lg:px-6">
        {/* Onboarding Lock Banner */}
        {onboardingLocked && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 p-3 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-amber-600 dark:text-amber-400">⚠️</span>
                <span className="text-amber-800 dark:text-amber-200">
                  Onboarding is required before you can use other features.
                </span>
              </div>
              <a 
                href="/partner/onboarding/landing" 
                className="text-amber-700 dark:text-amber-300 underline hover:text-amber-900 dark:hover:text-amber-100"
              >
                Complete Onboarding
              </a>
            </div>
          </div>
        )}
        
        <div className="flex gap-6 py-6">
          <PartnerSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} disabled={onboardingLocked} />
          
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
