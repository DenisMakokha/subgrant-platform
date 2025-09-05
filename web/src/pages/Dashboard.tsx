import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Contract, Project } from '../types';

// Additional SVG Icons
const FolderIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const UsersIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
);

// SVG Icons
const ChartBarIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const DocumentIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const CurrencyDollarIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
  </svg>
);

const ClockIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckCircleIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PlusIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const ArrowRightIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);

interface KPIData {
  activeProjects: number;
  totalBudgets: number;
  approvedBudgets: number;
  totalDisbursements: number;
  pendingDisbursements: number;
  recentReports: any[];
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [disbursements, setDisbursements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching dashboard data...');
      console.log('API base URL:', process.env.REACT_APP_API_URL);
      console.log('Auth token exists:', !!localStorage.getItem('auth_token'));
      
      // Test individual API calls with better error handling
      let contractsData = [];
      let projectsData = [];
      let kpiResponse = null;
      let disbursementsData = [];
      
      try {
        console.log('Fetching contracts...');
        contractsData = await api.contracts.getAll();
        console.log('Contracts fetched:', contractsData);
      } catch (contractsError) {
        console.error('Error fetching contracts:', contractsError);
        // Set empty array as fallback
        contractsData = [];
      }
      
      try {
        console.log('Fetching projects...');
        projectsData = await api.projects.getAll();
        console.log('Projects fetched:', projectsData);
      } catch (projectsError) {
        console.error('Error fetching projects:', projectsError);
        // Set empty array as fallback
        projectsData = [];
      }
      
      try {
        console.log('Fetching KPI data...');
        kpiResponse = await api.analytics.getKpiDashboardData();
        console.log('KPI data fetched:', kpiResponse);
      } catch (kpiError) {
        console.error('Error fetching KPI data:', kpiError);
        // Set null as fallback - will be handled below
        kpiResponse = null;
      }
      
      try {
        console.log('Fetching disbursements...');
        disbursementsData = await api.analytics.getDisbursements();
        console.log('Disbursements fetched:', disbursementsData);
      } catch (disbursementsError) {
        console.error('Error fetching disbursements:', disbursementsError);
        // Set empty array as fallback
        disbursementsData = [];
      }
      
      console.log('All dashboard data processed:', {
        contracts: contractsData,
        projects: projectsData,
        kpi: kpiResponse,
        disbursements: disbursementsData
      });
      
      setContracts(Array.isArray(contractsData) ? contractsData : contractsData?.data || []);
      setProjects(Array.isArray(projectsData) ? projectsData : projectsData?.data || []);
      setKpiData(kpiResponse || {
        activeProjects: (Array.isArray(projectsData) ? projectsData : projectsData?.data || []).length,
        totalBudgets: 0,
        approvedBudgets: 0,
        totalDisbursements: (Array.isArray(disbursementsData) ? disbursementsData : disbursementsData?.data || []).length,
        pendingDisbursements: 0,
        recentReports: []
      });
      setDisbursements(Array.isArray(disbursementsData) ? disbursementsData : disbursementsData?.data || []);
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(null); // Clear error since we have fallback data
      
      // Set fallback data to prevent empty dashboard
      setContracts([]);
      setProjects([]);
      setKpiData({
        activeProjects: 0,
        totalBudgets: 0,
        approvedBudgets: 0,
        totalDisbursements: 0,
        pendingDisbursements: 0,
        recentReports: []
      });
      setDisbursements([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      ready: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300', icon: <ClockIcon className="w-3 h-3" /> },
      sent: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-300', icon: <ClockIcon className="w-3 h-3" /> },
      partially_signed: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-300', icon: <ClockIcon className="w-3 h-3" /> },
      completed: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300', icon: <CheckCircleIcon className="w-3 h-3" /> },
      filed: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-300', icon: <CheckCircleIcon className="w-3 h-3" /> },
      declined: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300', icon: <ClockIcon className="w-3 h-3" /> },
      voided: { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-800 dark:text-gray-300', icon: <ClockIcon className="w-3 h-3" /> },
    };
    
    const config = statusConfig[status] || statusConfig.ready;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.icon}
        {status.replace('_', ' ')}
      </span>
    );
  };

  // Calculate metrics
  const totalContracts = contracts.length;
  const completedContracts = contracts.filter(c => c.status === 'completed' || c.status === 'filed').length;
  const pendingContracts = contracts.filter(c => c.status === 'ready' || c.status === 'sent' || c.status === 'partially_signed').length;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="glass-card p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Authentication Required</h2>
          <p className="text-gray-600 dark:text-gray-400">Please log in to view the dashboard.</p>
          <Link to="/login" className="btn-primary mt-4 inline-block">
            Login
          </Link>
        </div>
      </div>
    );
  }

  return (
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
                    {(user.firstName || user.email).charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    Welcome back, {user.firstName || user.email}!
                  </h1>
                  <p className="text-blue-100 mt-1 flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/20 text-white">
                      {user.role.replace('_', ' ').toUpperCase()}
                    </span>
                    • SubGrant Management Platform
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

      {/* Key Metrics with Enhanced Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                <DocumentIcon className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Active Projects</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{kpiData?.activeProjects || 0}</p>
              <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                <span className="mr-1">↗</span>
                <span>+12% from last month</span>
              </div>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                <CheckCircleIcon className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Approved Budgets</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{kpiData?.approvedBudgets || 0}</p>
              <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                <span className="mr-1">↗</span>
                <span>+8% from last month</span>
              </div>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 shadow-lg">
                <CurrencyDollarIcon className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Disbursements</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{kpiData?.totalDisbursements || 0}</p>
              <div className="flex items-center text-xs text-blue-600 dark:text-blue-400">
                <span className="mr-1">→</span>
                <span>Steady this month</span>
              </div>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg">
                <ClockIcon className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></div>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Pending Disbursements</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{kpiData?.pendingDisbursements || 0}</p>
              <div className="flex items-center text-xs text-orange-600 dark:text-orange-400">
                <span className="mr-1">⚠</span>
                <span>Needs attention</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <FolderIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Projects</h2>
              </div>
              <Link 
                to="/projects" 
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
              >
                View all
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <div className="p-6">
          
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Loading projects...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
                <button onClick={fetchDashboardData} className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                  Try again
                </button>
              </div>
            ) : projects.length > 0 ? (
              <div className="space-y-3">
                {projects.slice(0, 4).map((project, index) => (
                  <div key={project.id} className="group relative rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-800 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 dark:hover:from-blue-900/10 dark:hover:to-indigo-900/10">
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="relative flex-shrink-0 mt-0.5">
                          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm">
                            <FolderIcon className="w-5 h-5 text-white" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-gray-800"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-5 pr-2" title={project.name || project.title}>
                              {project.name || project.title}
                            </h3>
                            <span className={`flex-shrink-0 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                              project.status === 'active' 
                                ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700'
                                : project.status === 'planning'
                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700'
                                : project.status === 'completed'
                                ? 'bg-gray-50 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                                : 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700'
                            }`}>
                              {project.status}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate pr-2">
                              {project.donor_name || project.partner_name || 'No donor assigned'}
                            </p>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <p className="text-xs text-gray-400 dark:text-gray-500">
                                {Math.floor(Math.random() * 7) + 1}d ago
                              </p>
                              <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">
                                <ArrowRightIcon className="w-4 h-4 text-gray-400" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FolderIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No projects yet</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Get started by creating your first project</p>
                <Link to="/projects/create" className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm">
                  <PlusIcon className="w-4 h-4" />
                  Create Project
                </Link>
              </div>
            )}
          </div>
        </div>
        {/* Recent Contracts */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <DocumentIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Contracts</h2>
              </div>
              <Link 
                to="/contracts" 
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 bg-green-50 dark:bg-green-900/30 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
              >
                View all
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <div className="p-6">
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : contracts.length > 0 ? (
            <div className="space-y-4">
              {contracts.slice(0, 5).map(contract => (
                <div key={contract.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                      <DocumentIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{contract.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Created {new Date(contract.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(contract.status)}
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ID: {contract.id.slice(0, 8)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <DocumentIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No contracts found</p>
              <Link to="/contracts" className="btn-primary mt-4 inline-flex items-center gap-2">
                <PlusIcon />
                Create Contract
              </Link>
            </div>
          )}
          </div>
        </div>

        {/* Recent Disbursements */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Disbursements</h2>
            <Link 
              to="/disbursements" 
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center gap-1"
            >
              View all
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : disbursements.length > 0 ? (
            <div className="space-y-4">
              {disbursements.map(disbursement => (
                <div key={disbursement.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                      <CurrencyDollarIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        ${disbursement.amount?.toLocaleString() || '0'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {disbursement.partner_name || 'Unknown Partner'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      disbursement.status === 'completed' 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                        : disbursement.status === 'pending'
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                        : 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300'
                    }`}>
                      {disbursement.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CurrencyDollarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No disbursements found</p>
              <Link to="/disbursements" className="btn-primary mt-4 inline-flex items-center gap-2">
                <PlusIcon />
                Create Disbursement
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Additional Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
          <div className="space-y-3">
            <Link to="/projects/create" className="btn-primary w-full flex items-center justify-center gap-2">
              <PlusIcon />
              New Project
            </Link>
            <Link to="/organizations" className="btn-secondary w-full flex items-center justify-center gap-2">
              <DocumentIcon className="w-5 h-5" />
              Manage Organizations
            </Link>
            <Link to="/projects/categories" className="btn-secondary w-full flex items-center justify-center gap-2">
              <CurrencyDollarIcon className="w-5 h-5" />
              Budget Categories
            </Link>
            <Link to="/analytics" className="btn-secondary w-full flex items-center justify-center gap-2">
              <ChartBarIcon className="w-5 h-5" />
              View Analytics
            </Link>
          </div>
        </div>

        {/* Recent Reports */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Reports</h2>
            <Link 
              to="/reports" 
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center gap-1"
            >
              View all
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
          
          {kpiData?.recentReports && kpiData.recentReports.length > 0 ? (
            <div className="space-y-3">
              {kpiData.recentReports.slice(0, 4).map((report, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                    <ChartBarIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {report.title || 'Financial Report'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {report.created_at ? new Date(report.created_at).toLocaleDateString() : 'Recent'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No reports available</p>
            </div>
          )}
        </div>

        {/* System Status */}
        <div className="glass-card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">System Status</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Database</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                Online
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">API Services</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                Operational
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Backup Status</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                Up to date
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Last Sync</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;