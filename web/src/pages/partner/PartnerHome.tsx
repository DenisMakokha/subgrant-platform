import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getUserDisplayName } from '../../utils/format';

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

        {/* Enhanced Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Enhanced Applications Card */}
          <div className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-100/50 to-indigo-100/50 dark:from-blue-800/20 dark:to-indigo-800/20 rounded-full -translate-y-10 translate-x-10 group-hover:scale-110 transition-transform duration-300"></div>
            <div className="relative p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300">
                  <DocumentIcon className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                </div>
                <div className="text-right">
                  {modules.applications?.drafts > 0 && (
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 animate-pulse shadow-lg"></div>
                      <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">{modules.applications?.drafts}</span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">Applications</p>
                <p className="text-4xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                  {modules.applications?.submitted || 0}
                </p>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                    <span>{modules.applications?.drafts || 0} drafts</span>
                  </div>
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

        {/* Enhanced Quick Actions */}
        <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50 rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-gray-700 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              to={onboardingLocked ? "/partner/onboarding/landing" : "/partner/onboarding"}
              className="group p-6 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 transition-all duration-300 text-center hover:shadow-lg hover:-translate-y-0.5"
            >
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">📋</div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
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
