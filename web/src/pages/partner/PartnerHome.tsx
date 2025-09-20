import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

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

export default function PartnerHome() {
  const { user, modules, organization, onboardingLocked } = useAuth();
  
  if (!modules) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        {/* Welcome Header with Gradient */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl shadow-xl">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative p-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {(user?.first_name || user?.firstName || user?.email || 'P').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">
                      Welcome back, {user?.first_name || user?.firstName || 'Partner'}!
                    </h1>
                    <p className="text-blue-100 mt-1 flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/20 text-white">
                        PARTNER
                      </span>
                      • {(organization as any)?.name || 'Your Organization'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="hidden sm:block">
                <div className="text-right">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <p className="text-sm text-blue-100 font-medium">
                      {new Date().toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                    <p className="text-xs text-blue-200 mt-1">
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
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Applications Card */}
          <div className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                  <DocumentIcon className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  {modules.applications?.drafts > 0 && (
                    <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Applications</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {modules.applications?.submitted || 0}
                </p>
                <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                  <span>{modules.applications?.drafts || 0} drafts</span>
                </div>
              </div>
            </div>
          </div>

          {/* Compliance Card */}
          <div className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                  <CheckCircleIcon className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  {modules.compliance?.expiring_soon > 0 && (
                    <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></div>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Compliance</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {modules.compliance?.approved || 0}
                </p>
                <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                  <span>{modules.compliance?.required || 0} required</span>
                </div>
              </div>
            </div>
          </div>

          {/* M&E Reports Card */}
          <div className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
                  <ChartBarIcon className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  {modules.me_reports?.due > 0 && (
                    <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></div>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">M&E Reports</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {modules.me_reports?.submitted_this_quarter || 0}
                </p>
                <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                  <span>{modules.me_reports?.due || 0} due</span>
                </div>
              </div>
            </div>
          </div>

          {/* Disbursements Card */}
          <div className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 shadow-lg">
                  <CurrencyDollarIcon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Disbursements</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {modules.disbursements?.paid || 0}
                </p>
                <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                  <span>{modules.disbursements?.upcoming || 0} upcoming</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              to={onboardingLocked ? "/partner/onboarding/landing" : "/partner/onboarding"}
              className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-center"
            >
              <div className="text-2xl mb-2">📋</div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {onboardingLocked ? 'Complete Onboarding' : 'View Onboarding'}
              </p>
            </Link>
            <Link
              to={onboardingLocked ? "/partner/onboarding/landing" : "/partner/applications"}
              className={`p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-center ${
                onboardingLocked ? 'opacity-60' : ''
              }`}
            >
              <div className="text-2xl mb-2">📄</div>
              <p className="text-sm text-gray-700 dark:text-gray-300">New Application</p>
              {onboardingLocked && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Requires onboarding</p>
              )}
            </Link>
            <Link
              to={onboardingLocked ? "/partner/onboarding/landing" : "/partner/compliance"}
              className={`p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-center ${
                onboardingLocked ? 'opacity-60' : ''
              }`}
            >
              <div className="text-2xl mb-2">✅</div>
              <p className="text-sm text-gray-700 dark:text-gray-300">Upload Documents</p>
              {onboardingLocked && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Requires onboarding</p>
              )}
            </Link>
            <Link
              to={onboardingLocked ? "/partner/onboarding/landing" : "/partner/me"}
              className={`p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-center ${
                onboardingLocked ? 'opacity-60' : ''
              }`}
            >
              <div className="text-2xl mb-2">📊</div>
              <p className="text-sm text-gray-700 dark:text-gray-300">Submit Report</p>
              {onboardingLocked && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Requires onboarding</p>
              )}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
