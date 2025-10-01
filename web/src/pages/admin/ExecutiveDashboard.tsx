import React, { useState, useEffect } from 'react';
import {
  ExecutiveDashboardData
} from '../../types/admin';
import { adminApi } from '../../services/adminApi';
import MetricsCard from '../../components/admin/MetricsCard';
import { toast } from 'react-toastify';

const ExecutiveDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<ExecutiveDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'financial' | 'programs' | 'initiatives'>('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch real data from the API
      const response = await adminApi.executive.getDashboardData();
      console.log('Executive Dashboard API Response:', response);
      
      // Check if response has a data property (API envelope pattern)
      const dashboardData = response.data || response;
      console.log('Dashboard Data:', dashboardData);
      
      setDashboardData(dashboardData);
    } catch (error) {
      console.error('Error fetching executive dashboard data:', error);
      toast.error('Failed to load executive dashboard data');

      // Fallback to mock data if API fails
      const mockData: ExecutiveDashboardData = {
        kpis: {
          totalBudget: 2500000,
          totalDisbursed: 1850000,
          activeProjects: 24,
          completedProjects: 156,
          partnerOrganizations: 18,
          programEfficiency: 87.5,
          riskScore: 23.1,
          complianceRate: 94.2
        },
        financialSummary: {
          totalBudget: 2500000,
          totalSpent: 1850000,
          remainingBudget: 650000,
          quarterlySpending: [
            { quarter: 'Q1 2025', amount: 450000, budget: 625000 },
            { quarter: 'Q2 2025', amount: 520000, budget: 625000 },
            { quarter: 'Q3 2025', amount: 480000, budget: 625000 },
            { quarter: 'Q4 2025', amount: 400000, budget: 625000 }
          ],
          topExpenseCategories: [
            { category: 'Program Implementation', amount: 850000, percentage: 46 },
            { category: 'Administrative Costs', amount: 320000, percentage: 17 },
            { category: 'Monitoring & Evaluation', amount: 280000, percentage: 15 },
            { category: 'Capacity Building', amount: 220000, percentage: 12 },
            { category: 'Other', amount: 180000, percentage: 10 }
          ]
        },
        programPerformance: {
          programs: [
            {
              id: '1',
              name: 'Education for All',
              status: 'on_track',
              progress: 78,
              budgetUtilization: 82,
              keyMilestones: [
                { name: 'Teacher Training Phase 1', dueDate: new Date('2025-03-15'), status: 'completed' },
                { name: 'School Infrastructure', dueDate: new Date('2025-06-30'), status: 'on_track' },
                { name: 'Learning Materials Distribution', dueDate: new Date('2025-09-15'), status: 'delayed' }
              ]
            },
            {
              id: '2',
              name: 'Healthcare Access Initiative',
              status: 'at_risk',
              progress: 45,
              budgetUtilization: 38,
              keyMilestones: [
                { name: 'Clinic Construction', dueDate: new Date('2025-04-30'), status: 'delayed' },
                { name: 'Medical Equipment Procurement', dueDate: new Date('2025-07-15'), status: 'at_risk' }
              ]
            },
            {
              id: '3',
              name: 'Economic Empowerment Program',
              status: 'on_track',
              progress: 92,
              budgetUtilization: 88,
              keyMilestones: [
                { name: 'Skills Training Completion', dueDate: new Date('2025-02-28'), status: 'completed' },
                { name: 'Business Setup Support', dueDate: new Date('2025-05-30'), status: 'on_track' }
              ]
            }
          ],
          overallHealth: 'good'
        },
        strategicInitiatives: [
          {
            id: '1',
            name: 'Digital Transformation Initiative',
            description: 'Implement comprehensive digital systems across all operations',
            status: 'in_progress',
            priority: 'high',
            progress: 65,
            startDate: new Date('2025-01-01'),
            targetDate: new Date('2025-12-31'),
            owner: 'Sarah Johnson',
            budget: 500000,
            spent: 325000,
            risks: [
              {
                description: 'Technical skills gap in partner organizations',
                impact: 'medium',
                probability: 'high',
                mitigation: 'Comprehensive training program implemented'
              }
            ]
          },
          {
            id: '2',
            name: 'Sustainability Framework Development',
            description: 'Create long-term sustainability model for program impacts',
            status: 'planning',
            priority: 'critical',
            progress: 15,
            startDate: new Date('2025-03-01'),
            targetDate: new Date('2026-02-28'),
            owner: 'Michael Chen',
            budget: 300000,
            spent: 45000,
            risks: [
              {
                description: 'Stakeholder alignment challenges',
                impact: 'high',
                probability: 'medium',
                mitigation: 'Regular stakeholder engagement sessions planned'
              }
            ]
          }
        ],
        alerts: [
          {
            id: '1',
            type: 'risk',
            title: 'Budget Variance Alert',
            description: 'Healthcare program showing 15% budget overrun risk',
            severity: 'medium',
            date: new Date()
          },
          {
            id: '2',
            type: 'milestone',
            title: 'Major Milestone Achieved',
            description: 'Education program reached 10,000 beneficiaries',
            severity: 'low',
            date: new Date()
          }
        ],
        trends: {
          budgetUtilization: [
            { month: 'Jan', value: 72 },
            { month: 'Feb', value: 75 },
            { month: 'Mar', value: 78 },
            { month: 'Apr', value: 74 },
            { month: 'May', value: 76 },
            { month: 'Jun', value: 79 }
          ],
          projectSuccess: [
            { month: 'Jan', value: 85 },
            { month: 'Feb', value: 87 },
            { month: 'Mar', value: 89 },
            { month: 'Apr', value: 86 },
            { month: 'May', value: 88 },
            { month: 'Jun', value: 90 }
          ],
          partnerPerformance: [
            { month: 'Jan', value: 82 },
            { month: 'Feb', value: 84 },
            { month: 'Mar', value: 83 },
            { month: 'Apr', value: 86 },
            { month: 'May', value: 85 },
            { month: 'Jun', value: 87 }
          ]
        }
      };

      setDashboardData(mockData);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'on_track': return 'text-blue-600 bg-blue-100';
      case 'delayed': return 'text-yellow-600 bg-yellow-100';
      case 'at_risk': return 'text-red-600 bg-red-100';
      case 'in_progress': return 'text-purple-600 bg-purple-100';
      case 'planning': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Executive Dashboard</h1>
              <p className="text-blue-100">Strategic insights and leadership overview</p>
            </div>
            <button
              onClick={fetchDashboardData}
              className="px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg font-medium transition-all flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        {dashboardData?.kpis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard
          title="Total Budget"
          value={`$${(dashboardData.kpis.totalBudget / 1000000).toFixed(1)}M`}
          icon={<span className="text-green-500">💰</span>}
        />
        <MetricsCard
          title="Active Projects"
          value={dashboardData.kpis.activeProjects.toString()}
          icon={<span className="text-blue-500">📋</span>}
        />
        <MetricsCard
          title="Program Efficiency"
          value={`${dashboardData.kpis.programEfficiency}%`}
          icon={<span className="text-purple-500">⚡</span>}
        />
        <MetricsCard
          title="Compliance Rate"
          value={`${dashboardData.kpis.complianceRate}%`}
          icon={<span className="text-green-500">✅</span>}
        />
        <MetricsCard
          title="Partner Organizations"
          value={dashboardData.kpis.partnerOrganizations.toString()}
          icon={<span className="text-orange-500">🤝</span>}
        />
        <MetricsCard
          title="Risk Score"
          value={`${dashboardData.kpis.riskScore}%`}
          icon={<span className="text-red-500">⚠️</span>}
        />
        <MetricsCard
          title="Budget Utilized"
          value={`${((dashboardData.kpis.totalDisbursed / dashboardData.kpis.totalBudget) * 100).toFixed(1)}%`}
          icon={<span className="text-indigo-500">📊</span>}
        />
        <MetricsCard
          title="Completed Projects"
          value={dashboardData.kpis.completedProjects.toString()}
          icon={<span className="text-emerald-500">🏆</span>}
        />
        </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'financial', label: 'Financial Summary' },
            { id: 'programs', label: 'Program Performance' },
            { id: 'initiatives', label: 'Strategic Initiatives' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
        {activeTab === 'overview' && dashboardData && (
          <div className="space-y-8">
            {/* Alerts */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Executive Alerts
              </h3>
              <div className="space-y-3">
                {dashboardData.alerts?.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        alert.severity === 'critical' ? 'bg-red-500' :
                        alert.severity === 'high' ? 'bg-orange-500' :
                        alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}></div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{alert.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{alert.description}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(alert.date).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trend Charts Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Budget Utilization Trend</h4>
                <div className="h-32 flex items-end justify-between space-x-2">
                  {dashboardData.trends?.budgetUtilization?.map((item, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div
                        className="bg-blue-500 rounded-t w-8"
                        style={{ height: `${item.value * 1.2}px` }}
                      ></div>
                      <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">{item.month}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Project Success Rate</h4>
                <div className="h-32 flex items-end justify-between space-x-2">
                  {dashboardData.trends?.projectSuccess?.map((item, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div
                        className="bg-green-500 rounded-t w-8"
                        style={{ height: `${item.value * 1.2}px` }}
                      ></div>
                      <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">{item.month}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Partner Performance</h4>
                <div className="h-32 flex items-end justify-between space-x-2">
                  {dashboardData.trends?.partnerPerformance?.map((item, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div
                        className="bg-purple-500 rounded-t w-8"
                        style={{ height: `${item.value * 1.2}px` }}
                      ></div>
                      <span className="text-xs text-gray-600 dark:text-gray-400 mt-1">{item.month}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'financial' && dashboardData?.financialSummary && (
          <div className="space-y-8">
            {/* Financial Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Budget Overview</h4>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Budget</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      ${dashboardData.financialSummary.totalBudget.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Spent</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      ${dashboardData.financialSummary.totalSpent.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Remaining</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      ${dashboardData.financialSummary.remainingBudget.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Quarterly Spending</h4>
                <div className="space-y-3">
                  {dashboardData.financialSummary.quarterlySpending.map((quarter, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{quarter.quarter}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${(quarter.amount / quarter.budget) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          ${quarter.amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Top Expense Categories</h4>
                <div className="space-y-3">
                  {dashboardData.financialSummary.topExpenseCategories.map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{category.category}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-purple-500 h-2 rounded-full"
                            style={{ width: `${category.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {category.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'programs' && dashboardData?.programPerformance && (
          <div className="space-y-8">
            {/* Program Performance Overview */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Program Performance Overview
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {dashboardData.programPerformance.programs.map((program) => (
                  <div key={program.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{program.name}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(program.status)}`}>
                        {program.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">Progress</span>
                          <span className="font-medium text-gray-900 dark:text-white">{program.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${program.progress}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">Budget Utilization</span>
                          <span className="font-medium text-gray-900 dark:text-white">{program.budgetUtilization}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${program.budgetUtilization}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Key Milestones</h5>
                        <div className="space-y-2">
                          {program.keyMilestones.map((milestone, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">{milestone.name}</span>
                              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(milestone.status)}`}>
                                {milestone.status.replace('_', ' ')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'initiatives' && dashboardData?.strategicInitiatives && (
          <div className="space-y-8">
            {/* Strategic Initiatives */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Strategic Initiatives
              </h3>
              <div className="space-y-6">
                {dashboardData.strategicInitiatives.map((initiative) => (
                  <div key={initiative.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {initiative.name}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400 mb-3">{initiative.description}</p>
                        <div className="flex items-center space-x-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(initiative.status)}`}>
                            {initiative.status.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(initiative.priority)}`}>
                            {initiative.priority.toUpperCase()} PRIORITY
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Progress</span>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${initiative.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {initiative.progress}%
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Budget</span>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          ${initiative.spent.toLocaleString()} / ${initiative.budget.toLocaleString()}
                        </p>
                      </div>

                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Owner</span>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{initiative.owner}</p>
                      </div>
                    </div>

                    {initiative.risks.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Key Risks</h5>
                        <div className="space-y-2">
                          {initiative.risks.map((risk, index) => (
                            <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <p className="text-sm text-gray-900 dark:text-white">{risk.description}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(risk.impact)}`}>
                                  {risk.impact} impact
                                </span>
                                <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(risk.probability)}`}>
                                  {risk.probability} probability
                                </span>
                              </div>
                              {risk.mitigation && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  <strong>Mitigation:</strong> {risk.mitigation}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
