import React, { useState, useEffect } from 'react';
import { DashboardShell } from '../../components/dashboard/shells';
import { PageLayout } from '../../components/dashboard/layouts';
import { ChartWidget, KPIWidget } from '../../components/dashboard/widgets/base';
import { fetchWithAuth } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { exportDashboardToPDF } from '../../utils/dashboardExport';

/**
 * Analytics Dashboard - Executive/COO Dashboard
 * 
 * Features:
 * - High-level KPIs
 * - Advanced charts with Chart.js
 * - Financial trends
 * - Portfolio overview
 * - Partner performance
 * - Compliance metrics
 * - PDF export
 */

export default function AnalyticsDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<any>({});
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await fetchWithAuth('/api/admin/executive/kpis');
      const result = await response.json();
      
      if (result.success) {
        setKpis(result.data);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportDashboardToPDF('analytics-dashboard-content', {
        filename: `analytics-dashboard-${new Date().toISOString().split('T')[0]}.pdf`,
        orientation: 'landscape',
        includeHeader: true,
        includeFooter: true
      });
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Financial Trends Data
  const financialTrendsData = [
    { label: 'Jan', value: 1250000 },
    { label: 'Feb', value: 1420000 },
    { label: 'Mar', value: 1380000 },
    { label: 'Apr', value: 1550000 },
    { label: 'May', value: 1680000 },
    { label: 'Jun', value: 1750000 }
  ];

  // Project Status Distribution
  const projectStatusData = [
    { label: 'Active', value: 45 },
    { label: 'Pending', value: 12 },
    { label: 'Completed', value: 78 },
    { label: 'On Hold', value: 5 }
  ];

  // Budget Allocation by Category
  const budgetAllocationData = [
    { label: 'Operations', value: 350000 },
    { label: 'Programs', value: 520000 },
    { label: 'Infrastructure', value: 280000 },
    { label: 'Capacity Building', value: 180000 },
    { label: 'M&E', value: 120000 }
  ];

  // Partner Performance Scores
  const partnerPerformanceData = [
    { label: 'Partner A', value: 92 },
    { label: 'Partner B', value: 88 },
    { label: 'Partner C', value: 95 },
    { label: 'Partner D', value: 85 },
    { label: 'Partner E', value: 90 },
    { label: 'Partner F', value: 87 }
  ];

  // Compliance Rate Over Time
  const complianceRateData = [
    { label: 'Jan', value: 85 },
    { label: 'Feb', value: 87 },
    { label: 'Mar', value: 89 },
    { label: 'Apr', value: 91 },
    { label: 'May', value: 93 },
    { label: 'Jun', value: 95 }
  ];

  // Disbursement vs Budget
  const disbursementVsBudgetData = [
    { label: 'Q1', value: 850000 },
    { label: 'Q2', value: 920000 },
    { label: 'Q3', value: 780000 },
    { label: 'Q4', value: 950000 }
  ];

  return (
    <DashboardShell>
      <PageLayout>
        <div id="analytics-dashboard-content" className="space-y-6">
          {/* Header */}
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-3xl p-8 shadow-2xl">
            {/* Decorative SVG pattern */}
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <circle cx="20" cy="20" r="1.5" fill="white" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    Analytics Dashboard
                  </h1>
                  <p className="text-white/90 text-lg">
                    Executive overview and performance metrics
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="px-6 py-3 bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white/30 transition-all duration-300 shadow-lg hover:shadow-xl rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {exporting ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>Exporting...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Export PDF</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-white/10 to-white/5 rounded-full -translate-y-20 translate-x-20 blur-sm"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-white/8 to-white/3 rounded-full translate-y-16 -translate-x-16 blur-sm"></div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPIWidget
              title="Portfolio Value"
              value={formatCurrency(kpis.portfolioValue || 5450000)}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              color="blue"
              trend="up"
              change="+12% from last quarter"
              loading={loading}
            />

            <KPIWidget
              title="Active Partners"
              value={kpis.activePartners || 24}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
              color="green"
              trend="up"
              change="+3 this month"
              loading={loading}
            />

            <KPIWidget
              title="Active Projects"
              value={kpis.activeProjects || 45}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
              color="purple"
              trend="neutral"
              loading={loading}
            />

            <KPIWidget
              title="Compliance Rate"
              value={`${kpis.complianceRate || 95}%`}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              color="emerald"
              trend="up"
              change="+2% improvement"
              loading={loading}
            />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Financial Trends */}
            <ChartWidget
              title="Financial Trends"
              subtitle="Monthly disbursements over time"
              data={financialTrendsData}
              chartType="line"
              height={300}
            />

            {/* Project Status */}
            <ChartWidget
              title="Project Status Distribution"
              subtitle="Current project portfolio"
              data={projectStatusData}
              chartType="doughnut"
              height={300}
            />

            {/* Budget Allocation */}
            <ChartWidget
              title="Budget Allocation"
              subtitle="Budget by category"
              data={budgetAllocationData}
              chartType="bar"
              height={300}
            />

            {/* Partner Performance */}
            <ChartWidget
              title="Partner Performance"
              subtitle="Performance scores by partner"
              data={partnerPerformanceData}
              chartType="bar"
              height={300}
            />

            {/* Compliance Rate Trend */}
            <ChartWidget
              title="Compliance Rate Trend"
              subtitle="Compliance improvement over time"
              data={complianceRateData}
              chartType="line"
              height={300}
            />

            {/* Disbursement vs Budget */}
            <ChartWidget
              title="Quarterly Disbursements"
              subtitle="Disbursement trends by quarter"
              data={disbursementVsBudgetData}
              chartType="bar"
              height={300}
            />
          </div>

          {/* Additional Insights */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Key Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Growth Rate</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">+18%</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">Success Rate</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">94%</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Avg. Turnaround</p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">14 days</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageLayout>
    </DashboardShell>
  );
}
