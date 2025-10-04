import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { getUserDisplayName } from '../../utils/format';
import { fetchWithAuth } from '../../services/api';
import { RecentActivityWidget } from '../../components/partner/RecentActivityWidget';
import { ActivityStatsWidget } from '../../components/partner/ActivityStatsWidget';

// SVG Icons
const DocumentIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const CheckCircleIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ChartBarIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const CurrencyDollarIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
  </svg>
);

interface DashboardKPIs {
  projectsActive: number;
  projectsTotal: number;
  budgetCeiling: number;
  spent: number;
  utilizationPct: number;
  reportsDue: number;
  reportsSubmitted: number;
}

export default function PartnerHome() {
  const { user, modules, organization, onboardingLocked } = useAuth();
  const { notifications, unreadCount } = useNotifications();
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard KPIs from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user || onboardingLocked) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetchWithAuth('/partner/dashboard/kpis');
        
        if (response.success) {
          setKpis(response.data);
          setError(null);
        } else {
          throw new Error(response.error || 'Failed to fetch dashboard data');
        }
      } catch (err) {
        console.error('Error fetching dashboard KPIs:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
        // Set fallback data
        setKpis({
          projectsActive: 0,
          projectsTotal: 0,
          budgetCeiling: 0,
          spent: 0,
          utilizationPct: 0,
          reportsDue: 0,
          reportsSubmitted: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, onboardingLocked]);
  
  // Get current project ID from localStorage
  const currentProjectId = (() => {
    try { return localStorage.getItem('currentProjectId') || ''; } catch { return ''; }
  })();

  const projectLink = (page: string) => currentProjectId ? `/partner/projects/${currentProjectId}/${page}` : '/partner/projects';
  
  if (!modules && !kpis) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-gradient-to-r from-blue-200 to-purple-200 rounded-3xl"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded-3xl"></div>
            ))}
          </div>
          <div className="text-center text-gray-600 dark:text-gray-400">
            Loading dashboard data...
          </div>
        </div>
      </div>
    );
  }

  // Show error state if there's an error but still render with fallback data
  if (error && !kpis) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Dashboard Error
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      <div className="space-y-4 sm:space-y-6">
        {/* Welcome Header with Enhanced Gradient */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-3xl shadow-2xl border border-white/10">
          <div className="absolute inset-0 bg-black/10"></div>
          {/* Enhanced Decorative Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>
          </div>
          <div className="relative p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-xl flex-shrink-0">
                    <span className="text-lg sm:text-2xl font-bold text-white">
                      {getUserDisplayName(user).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 truncate">
                      {getUserDisplayName(user)}
                    </h1>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <span className="inline-flex px-2 sm:px-3 py-1 bg-white/20 rounded-full text-xs sm:text-sm font-medium backdrop-blur-sm border border-white/30 w-fit">
                        ✨ PARTNER
                      </span>
                      <span className="text-white/80 hidden sm:inline">•</span>
                      <span className="font-medium text-white/90 text-sm sm:text-base truncate">{(organization as any)?.name || 'Your Organization'}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="hidden sm:block">
                <div className="text-right">
                  <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm text-blue-100 font-semibold">
                        {new Date().toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-blue-200 font-medium">
                        {new Date().toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Enhanced Decorative elements */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-white/10 to-white/5 rounded-full -translate-y-20 translate-x-20 blur-sm"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-white/8 to-white/3 rounded-full translate-y-16 -translate-x-16 blur-sm"></div>
          <div className="absolute top-1/2 right-1/4 w-6 h-6 bg-white/20 rounded-full animate-pulse"></div>
          <div className="absolute top-1/4 right-1/3 w-4 h-4 bg-white/15 rounded-full animate-pulse delay-1000"></div>
        </div>

        {/* Enhanced Key Metrics - Aligned with Sidebar Navigation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Active Projects Card */}
          <div className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-100/50 to-indigo-100/50 dark:from-blue-800/20 dark:to-indigo-800/20 rounded-full -translate-y-10 translate-x-10 group-hover:scale-110 transition-transform duration-300"></div>
            <div className="relative p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300">
                  <svg className="w-5 h-5 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 animate-pulse shadow-lg"></div>
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">Active</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">Active Projects</p>
                <p className="text-4xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                  {loading ? '...' : (kpis?.projectsActive || 0)}
                </p>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                    <span>{loading ? '...' : (kpis?.projectsTotal || 0)} total projects</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Budget Ceiling Card */}
          <div className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-gray-700 hover:border-green-200 dark:hover:border-green-700 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-100/50 to-emerald-100/50 dark:from-green-800/20 dark:to-emerald-800/20 rounded-full -translate-y-10 translate-x-10 group-hover:scale-110 transition-transform duration-300"></div>
            <div className="relative p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300">
                  <svg className="w-5 h-5 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-indigo-400 shadow-lg"></div>
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Budget</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">Budget Ceiling</p>
                <p className="text-4xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300">
                  {loading ? '...' : `$${(kpis?.budgetCeiling || 0).toLocaleString()}`}
                </p>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                    <span>Total allocation</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Budget Spent Card */}
          <div className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-700 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-100/50 to-pink-100/50 dark:from-purple-800/20 dark:to-pink-800/20 rounded-full -translate-y-10 translate-x-10 group-hover:scale-110 transition-transform duration-300"></div>
            <div className="relative p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300">
                  <svg className="w-5 h-5 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-400 to-red-400 shadow-lg"></div>
                    <span className="text-xs font-medium text-orange-600 dark:text-orange-400">Spent</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">Budget Spent</p>
                <p className="text-4xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">
                  {loading ? '...' : `$${(kpis?.spent || 0).toLocaleString()}`}
                </p>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                    <span>{loading ? '...' : `${(kpis?.utilizationPct || 0).toFixed(1)}% utilized`}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reports Due Card */}
          <div className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-700 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-100/50 to-red-100/50 dark:from-orange-800/20 dark:to-red-800/20 rounded-full -translate-y-10 translate-x-10 group-hover:scale-110 transition-transform duration-300"></div>
            <div className="relative p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300">
                  <svg className="w-5 h-5 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="text-right">
                  {(kpis?.reportsDue || 0) > 0 && (
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-400 to-pink-400 animate-pulse shadow-lg"></div>
                      <span className="text-xs font-medium text-red-600 dark:text-red-400">Due</span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">Reports Due</p>
                <p className="text-4xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-300">
                  {loading ? '...' : (kpis?.reportsDue || 0)}
                </p>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                    <span>{loading ? '...' : (kpis?.reportsSubmitted || 0)} submitted this quarter</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Tracking Dashboard */}
        {!onboardingLocked && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity Widget - Takes 2 columns */}
            <div className="lg:col-span-2">
              <RecentActivityWidget limit={8} />
            </div>
            
            {/* Activity Stats Widget - Takes 1 column */}
            <div className="lg:col-span-1">
              <ActivityStatsWidget />
            </div>
          </div>
        )}

        {/* Notifications Overview */}
        {unreadCount > 0 && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-3xl shadow-xl p-6 border border-blue-200 dark:border-blue-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Notifications</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{unreadCount} unread notifications</p>
                </div>
              </div>
              <Link
                to="/partner/notifications"
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              >
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {notifications.filter(n => !n.read).slice(0, 3).map((notification) => (
                <div key={notification.id} className="flex items-start space-x-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                      {notification.title}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      {notification.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Quick Actions */}
        <div className="relative bg-gradient-to-br from-white via-gray-50/30 to-blue-50/20 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900/50 rounded-3xl shadow-xl p-8 border border-gray-100/50 dark:border-gray-700/50 backdrop-blur-sm overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5 dark:opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>
          </div>
          
          <div className="relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-indigo-500/25">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Quick Actions</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Get things done faster</p>
                </div>
              </div>
              
              {/* Action Stats */}
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">8</div>
                  <div className="text-gray-500 dark:text-gray-400">Actions</div>
                </div>
                <div className="w-px h-8 bg-gray-200 dark:bg-gray-700"></div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {onboardingLocked ? '1' : '7'}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">Available</div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Onboarding Action */}
              <Link
                to={onboardingLocked ? "/partner/onboarding/landing" : "/partner/onboarding"}
                className="group relative overflow-hidden bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-800 dark:to-blue-900/10 rounded-2xl border border-blue-200/50 dark:border-blue-700/30 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                role="button"
                aria-label={onboardingLocked ? 'Complete your onboarding process' : 'View onboarding status'}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative p-6 text-center">
                  <div className="relative inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 group-hover:scale-110 transition-all duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {onboardingLocked && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center animate-bounce">
                        <span className="text-xs font-bold text-white">!</span>
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                    {onboardingLocked ? 'Complete Onboarding' : 'View Onboarding'}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-300 transition-colors duration-300">
                    {onboardingLocked ? 'Required to access features' : 'Review your progress'}
                  </p>
                  {onboardingLocked && (
                    <div className="mt-3 inline-flex items-center px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-xs font-medium text-amber-800 dark:text-amber-200">
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5 animate-pulse"></div>
                      Priority
                    </div>
                  )}
                </div>
              </Link>
              {/* Budget Management Action */}
              <Link
                to={onboardingLocked ? "/partner/onboarding/landing" : projectLink('budget')}
                className={`group relative overflow-hidden bg-gradient-to-br from-white to-green-50/30 dark:from-gray-800 dark:to-green-900/10 rounded-2xl border border-green-200/50 dark:border-green-700/30 hover:border-green-400 dark:hover:border-green-500 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10 hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-green-500/20 ${
                  onboardingLocked ? 'opacity-60 cursor-not-allowed' : ''
                }`}
                role="button"
                aria-label="Manage project budget and financial planning"
                aria-disabled={onboardingLocked}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative p-6 text-center">
                  <div className="relative inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/25 group-hover:shadow-green-500/40 group-hover:scale-110 transition-all duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    {onboardingLocked && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m8-7V7a4 4 0 00-8 0v4m0 0V9a2 2 0 114 0v2m-4 0h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300">
                    Manage Budget
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-green-500 dark:group-hover:text-green-300 transition-colors duration-300">
                    {onboardingLocked ? 'Complete onboarding first' : 'Track expenses & allocations'}
                  </p>
                  {onboardingLocked && (
                    <div className="mt-3 inline-flex items-center px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m8-7V7a4 4 0 00-8 0v4m0 0V9a2 2 0 114 0v2m-4 0h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2z" />
                      </svg>
                      Locked
                    </div>
                  )}
                </div>
              </Link>
              {/* Fund Request Action */}
              <Link
                to={onboardingLocked ? "/partner/onboarding/landing" : projectLink('fund-request')}
                className={`group relative overflow-hidden bg-gradient-to-br from-white to-purple-50/30 dark:from-gray-800 dark:to-purple-900/10 rounded-2xl border border-purple-200/50 dark:border-purple-700/30 hover:border-purple-400 dark:hover:border-purple-500 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-purple-500/20 ${
                  onboardingLocked ? 'opacity-60 cursor-not-allowed' : ''
                }`}
                role="button"
                aria-label="Submit fund request for project funding"
                aria-disabled={onboardingLocked}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative p-6 text-center">
                  <div className="relative inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/25 group-hover:shadow-purple-500/40 group-hover:scale-110 transition-all duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    {onboardingLocked && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m8-7V7a4 4 0 00-8 0v4m0 0V9a2 2 0 114 0v2m-4 0h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">
                    Fund Request
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-purple-500 dark:group-hover:text-purple-300 transition-colors duration-300">
                    {onboardingLocked ? 'Complete onboarding first' : 'Request project funding'}
                  </p>
                  {onboardingLocked && (
                    <div className="mt-3 inline-flex items-center px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m8-7V7a4 4 0 00-8 0v4m0 0V9a2 2 0 114 0v2m-4 0h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2z" />
                      </svg>
                      Locked
                    </div>
                  )}
                </div>
              </Link>
              {/* Submit Report Action */}
              <Link
                to={onboardingLocked ? "/partner/onboarding/landing" : projectLink('reports')}
                className={`group relative overflow-hidden bg-gradient-to-br from-white to-orange-50/30 dark:from-gray-800 dark:to-orange-900/10 rounded-2xl border border-orange-200/50 dark:border-orange-700/30 hover:border-orange-400 dark:hover:border-orange-500 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-orange-500/20 ${
                  onboardingLocked ? 'opacity-60 cursor-not-allowed' : ''
                }`}
                role="button"
                aria-label="Submit monitoring and evaluation reports"
                aria-disabled={onboardingLocked}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative p-6 text-center">
                  <div className="relative inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/25 group-hover:shadow-orange-500/40 group-hover:scale-110 transition-all duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    {onboardingLocked && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m8-7V7a4 4 0 00-8 0v4m0 0V9a2 2 0 114 0v2m-4 0h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-300">
                    Submit Report
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-orange-500 dark:group-hover:text-orange-300 transition-colors duration-300">
                    {onboardingLocked ? 'Complete onboarding first' : 'M&E and progress reports'}
                  </p>
                  {onboardingLocked && (
                    <div className="mt-3 inline-flex items-center px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m8-7V7a4 4 0 00-8 0v4m0 0V9a2 2 0 114 0v2m-4 0h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2z" />
                      </svg>
                      Locked
                    </div>
                  )}
                </div>
              </Link>

              {/* Documents Action */}
              <Link
                to={onboardingLocked ? "/partner/onboarding/landing" : projectLink('documents')}
                className={`group relative overflow-hidden bg-gradient-to-br from-white to-teal-50/30 dark:from-gray-800 dark:to-teal-900/10 rounded-2xl border border-teal-200/50 dark:border-teal-700/30 hover:border-teal-400 dark:hover:border-teal-500 transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/10 hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-teal-500/20 ${
                  onboardingLocked ? 'opacity-60 cursor-not-allowed' : ''
                }`}
                role="button"
                aria-label="Manage project documents and files"
                aria-disabled={onboardingLocked}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative p-6 text-center">
                  <div className="relative inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/25 group-hover:shadow-teal-500/40 group-hover:scale-110 transition-all duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {onboardingLocked && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m8-7V7a4 4 0 00-8 0v4m0 0V9a2 2 0 114 0v2m-4 0h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors duration-300">
                    Documents
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-teal-500 dark:group-hover:text-teal-300 transition-colors duration-300">
                    {onboardingLocked ? 'Complete onboarding first' : 'Manage project files'}
                  </p>
                  {onboardingLocked && (
                    <div className="mt-3 inline-flex items-center px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m8-7V7a4 4 0 00-8 0v4m0 0V9a2 2 0 114 0v2m-4 0h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2z" />
                      </svg>
                      Locked
                    </div>
                  )}
                </div>
              </Link>

              {/* Forum Action */}
              <Link
                to={onboardingLocked ? "/partner/onboarding/landing" : "/partner/forum"}
                className={`group relative overflow-hidden bg-gradient-to-br from-white to-indigo-50/30 dark:from-gray-800 dark:to-indigo-900/10 rounded-2xl border border-indigo-200/50 dark:border-indigo-700/30 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 ${
                  onboardingLocked ? 'opacity-60 cursor-not-allowed' : ''
                }`}
                role="button"
                aria-label="Access community forum and discussions"
                aria-disabled={onboardingLocked}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative p-6 text-center">
                  <div className="relative inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 group-hover:scale-110 transition-all duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {onboardingLocked && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m8-7V7a4 4 0 00-8 0v4m0 0V9a2 2 0 114 0v2m-4 0h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">
                    Forum
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-300 transition-colors duration-300">
                    {onboardingLocked ? 'Complete onboarding first' : 'Community discussions'}
                  </p>
                  {onboardingLocked && (
                    <div className="mt-3 inline-flex items-center px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m8-7V7a4 4 0 00-8 0v4m0 0V9a2 2 0 114 0v2m-4 0h8a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2z" />
                      </svg>
                      Locked
                    </div>
                  )}
                </div>
              </Link>

              {/* Help Center Action */}
              <Link
                to="/partner/help"
                className="group relative overflow-hidden bg-gradient-to-br from-white to-rose-50/30 dark:from-gray-800 dark:to-rose-900/10 rounded-2xl border border-rose-200/50 dark:border-rose-700/30 hover:border-rose-400 dark:hover:border-rose-500 transition-all duration-300 hover:shadow-xl hover:shadow-rose-500/10 hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-rose-500/20"
                role="button"
                aria-label="Access help center and support resources"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative p-6 text-center">
                  <div className="relative inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-lg shadow-rose-500/25 group-hover:shadow-rose-500/40 group-hover:scale-110 transition-all duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors duration-300">
                    Help Center
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-rose-500 dark:group-hover:text-rose-300 transition-colors duration-300">
                    Get support & guidance
                  </p>
                </div>
              </Link>

              {/* Profile Action */}
              <Link
                to="/partner/profile"
                className="group relative overflow-hidden bg-gradient-to-br from-white to-gray-50/30 dark:from-gray-800 dark:to-gray-900/10 rounded-2xl border border-gray-200/50 dark:border-gray-700/30 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-300 hover:shadow-xl hover:shadow-gray-500/10 hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-gray-500/20"
                role="button"
                aria-label="Manage your profile and account settings"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 to-slate-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative p-6 text-center">
                  <div className="relative inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-gray-500 to-slate-600 shadow-lg shadow-gray-500/25 group-hover:shadow-gray-500/40 group-hover:scale-110 transition-all duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors duration-300">
                    My Profile
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors duration-300">
                    Account & preferences
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
