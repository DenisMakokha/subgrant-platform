import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getKpiDashboardData, getProjects, getDisbursements } from '../services/api';

// SVG Icons
const ChartBarIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const DocumentChartBarIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const CurrencyDollarIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
  </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TrendingUpIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const CalendarIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ArrowDownTrayIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

interface AnalyticsData {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalBudget: number;
  totalDisbursed: number;
  pendingDisbursements: number;
  projectsByStatus: { [key: string]: number };
  disbursementsByMonth: { month: string; amount: number }[];
  topPerformingProjects: { name: string; completion: number; budget: number }[];
}

const ReportingAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedReportType, setSelectedReportType] = useState<'overview' | 'financial' | 'projects' | 'performance'>('overview');

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedTimeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch data from multiple sources
      const [kpiData, projects, disbursements] = await Promise.all([
        getKpiDashboardData(),
        getProjects(),
        getDisbursements()
      ]);

      // Process and combine data
      const processedData: AnalyticsData = {
        totalProjects: projects?.length || 0,
        activeProjects: projects?.filter((p: any) => p.status === 'active').length || 0,
        completedProjects: projects?.filter((p: any) => p.status === 'completed').length || 0,
        totalBudget: kpiData?.totalBudgets || 0,
        totalDisbursed: kpiData?.totalDisbursements || 0,
        pendingDisbursements: kpiData?.pendingDisbursements || 0,
        projectsByStatus: {
          active: projects?.filter((p: any) => p.status === 'active').length || 0,
          planning: projects?.filter((p: any) => p.status === 'planning').length || 0,
          completed: projects?.filter((p: any) => p.status === 'completed').length || 0,
          on_hold: projects?.filter((p: any) => p.status === 'on_hold').length || 0,
        },
        disbursementsByMonth: generateMockDisbursementData(),
        topPerformingProjects: generateMockProjectPerformance(projects || [])
      };

      setAnalyticsData(processedData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch analytics data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateMockDisbursementData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      amount: Math.floor(Math.random() * 100000) + 50000
    }));
  };

  const generateMockProjectPerformance = (projects: any[]) => {
    return projects.slice(0, 5).map((project: any) => ({
      name: project.title || project.name || 'Unnamed Project',
      completion: Math.floor(Math.random() * 100),
      budget: Math.floor(Math.random() * 200000) + 50000
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const exportReport = (type: string) => {
    // Mock export functionality
    const reportData = {
      type,
      timeRange: selectedTimeRange,
      generatedAt: new Date().toISOString(),
      data: analyticsData
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-report-${selectedTimeRange}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No data available</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Analytics data could not be loaded.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header with Gradient */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl shadow-xl">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative p-8">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <ChartBarIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-white">
                        Reporting & Analytics
                      </h1>
                      <p className="text-blue-100 mt-1">
                        Comprehensive insights and performance metrics
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
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl"></div>
          </div>
      </div>

      {/* Controls */}
      <div className="flex justify-end">
        <div className="flex items-center gap-3">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="input-field text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button
            onClick={() => exportReport(selectedReportType)}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <ArrowDownTrayIcon />
            Export
          </button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="glass-card p-6">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'overview', label: 'Overview', icon: ChartBarIcon },
            { key: 'financial', label: 'Financial', icon: CurrencyDollarIcon },
            { key: 'projects', label: 'Projects', icon: DocumentChartBarIcon },
            { key: 'performance', label: 'Performance', icon: TrendingUpIcon }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSelectedReportType(key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedReportType === key
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="glass-card p-4 border-l-4 border-red-500">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <DocumentChartBarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Projects</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analyticsData?.totalProjects || 0}</p>
              <p className="text-xs text-green-600 dark:text-green-400">
                {analyticsData?.activeProjects || 0} active
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
              <CurrencyDollarIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Budget</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(analyticsData?.totalBudget || 0)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Across all projects
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <TrendingUpIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Disbursed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(analyticsData?.totalDisbursed || 0)}
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400">
                {analyticsData?.totalBudget ? (((analyticsData?.totalDisbursed || 0) / analyticsData.totalBudget) * 100).toFixed(1) : 0}% of budget
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
              <ClockIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(analyticsData?.pendingDisbursements || 0)}
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400">
                Awaiting approval
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Status Distribution */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Projects by Status
          </h3>
          <div className="space-y-4">
            {Object.entries(analyticsData?.projectsByStatus || {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    status === 'active' ? 'bg-green-500' :
                    status === 'planning' ? 'bg-blue-500' :
                    status === 'completed' ? 'bg-purple-500' :
                    'bg-gray-500'
                  }`} />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                    {status.replace('_', ' ')}
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Disbursement Trends */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Disbursement Trends
          </h3>
          <div className="space-y-3">
            {(analyticsData?.disbursementsByMonth || []).map((item, index) => (
              <div key={item.month} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {item.month}
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${(item.amount / 150000) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white w-20 text-right">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performing Projects */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Top Performing Projects
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Project Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Completion
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Budget
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Performance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900/50 divide-y divide-gray-200 dark:divide-gray-700">
              {(analyticsData?.topPerformingProjects || []).map((project, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {project.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${project.completion}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {project.completion}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {formatCurrency(project.budget)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      project.completion >= 80 ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                      project.completion >= 60 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                      'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                    }`}>
                      {project.completion >= 80 ? 'Excellent' : project.completion >= 60 ? 'Good' : 'Needs Attention'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Options */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Export Reports
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { type: 'financial', label: 'Financial Report', description: 'Budget and disbursement data' },
            { type: 'projects', label: 'Project Report', description: 'Project status and progress' },
            { type: 'performance', label: 'Performance Report', description: 'KPIs and metrics' },
            { type: 'comprehensive', label: 'Full Report', description: 'Complete analytics package' }
          ].map(({ type, label, description }) => (
            <button
              key={type}
              onClick={() => exportReport(type)}
              className="p-4 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-start gap-3">
                <ArrowDownTrayIcon className="w-5 h-5 text-primary-600 dark:text-primary-400 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    {label}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {description}
                  </p>
                </div>
              </div>
            </button>
          ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportingAnalytics;
