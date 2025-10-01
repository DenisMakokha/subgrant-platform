import React, { useState, useEffect } from 'react';
import {
  ReportTemplate,
  ReportConfig,
  ScheduledReport,
  ReportData,
  TableColumn,
  FilterOption,
  BulkAction
} from '../../types/admin';
import { adminApi } from '../../services/adminApi';
import DataTable from '../../components/admin/DataTable';
import MetricsCard from '../../components/admin/MetricsCard';
import StatusIndicator from '../../components/admin/StatusIndicator';
import { toast } from 'react-toastify';

const AdvancedReporting: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'templates' | 'scheduled' | 'analytics' | 'builder'>('templates');
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([]);
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplates, setSelectedTemplates] = useState<ReportTemplate[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ReportTemplate | null>(null);

  useEffect(() => {
    fetchReportingData();
  }, [activeTab]);

  const fetchReportingData = async () => {
    try {
      setLoading(true);

      if (activeTab === 'templates') {
        const templates = await adminApi.reporting.getReportTemplates();
        setReportTemplates(templates);
      } else if (activeTab === 'scheduled') {
        const scheduled = await adminApi.reporting.getScheduledReports();
        setScheduledReports(scheduled);
      } else if (activeTab === 'analytics') {
        const data = await adminApi.reporting.getReportAnalytics();
        setReportData(data);
      }
    } catch (error) {
      console.error('Error fetching reporting data:', error);
      toast.error('Failed to fetch reporting data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (templateData: Partial<ReportTemplate>) => {
    try {
      await adminApi.reporting.createReportTemplate(templateData);
      toast.success('Report template created successfully');
      setShowTemplateModal(false);
      fetchReportingData();
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create report template');
    }
  };

  const handleScheduleReport = async (scheduleData: Partial<ScheduledReport>) => {
    try {
      await adminApi.reporting.scheduleReport(scheduleData);
      toast.success('Report scheduled successfully');
      setShowScheduleModal(false);
      fetchReportingData();
    } catch (error) {
      console.error('Error scheduling report:', error);
      toast.error('Failed to schedule report');
    }
  };

  const handleGenerateReport = async (templateId: string, format: 'pdf' | 'excel' | 'csv' = 'pdf') => {
    try {
      const blob = await adminApi.reporting.generateReport(templateId, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${templateId}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    }
  };

  const handleBulkSchedule = async (selectedTemplates: ReportTemplate[]) => {
    const frequencyInput = prompt('Enter schedule frequency (daily/weekly/monthly):');
    if (!frequencyInput) return;

    const frequency = frequencyInput as 'daily' | 'weekly' | 'monthly';
    if (!['daily', 'weekly', 'monthly'].includes(frequency)) {
      toast.error('Invalid frequency. Please use daily, weekly, or monthly.');
      return;
    }

    try {
      await Promise.all(
        selectedTemplates.map(template =>
          adminApi.reporting.scheduleReport({
            templateId: template.id,
            frequency,
            recipients: ['admin@example.com'],
            format: 'pdf'
          })
        )
      );
      toast.success(`Scheduled ${selectedTemplates.length} reports`);
      setSelectedTemplates([]);
      fetchReportingData();
    } catch (error) {
      console.error('Error bulk scheduling reports:', error);
      toast.error('Failed to schedule reports');
    }
  };

  // Report Templates Columns
  const templateColumns: TableColumn<ReportTemplate>[] = [
    {
      key: 'name',
      label: 'Template Name',
      sortable: true,
      render: (value: string) => (
        <div className="font-medium text-gray-900 dark:text-white">
          {value}
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (value: string) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          value === 'financial' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
          value === 'operational' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
          value === 'compliance' ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200' :
          'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
        }`}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (value: string) => value || '-',
    },
    {
      key: 'isActive',
      label: 'Status',
      sortable: true,
      render: (value: boolean) => (
        <StatusIndicator
          status={value ? 'healthy' : 'error'}
          label={value ? 'Active' : 'Inactive'}
          size="sm"
        />
      ),
    },
    {
      key: 'lastGenerated',
      label: 'Last Generated',
      sortable: true,
      render: (value: Date) => value ? new Date(value).toLocaleDateString() : 'Never',
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (value: Date) => new Date(value).toLocaleDateString(),
    },
  ];

  // Scheduled Reports Columns
  const scheduledColumns: TableColumn<ScheduledReport>[] = [
    {
      key: 'templateName',
      label: 'Report Template',
      sortable: true,
      render: (value: string) => (
        <div className="font-medium text-gray-900 dark:text-white">
          {value}
        </div>
      ),
    },
    {
      key: 'frequency',
      label: 'Frequency',
      sortable: true,
      render: (value: string) => (
        <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ),
    },
    {
      key: 'nextRun',
      label: 'Next Run',
      sortable: true,
      render: (value: Date) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'recipients',
      label: 'Recipients',
      sortable: true,
      render: (value: string[]) => (
        <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-full">
          {value.length} recipients
        </span>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      sortable: true,
      render: (value: boolean) => (
        <StatusIndicator
          status={value ? 'healthy' : 'error'}
          label={value ? 'Active' : 'Inactive'}
          size="sm"
        />
      ),
    },
    {
      key: 'lastRun',
      label: 'Last Run',
      sortable: true,
      render: (value: Date) => value ? new Date(value).toLocaleDateString() : 'Never',
    },
  ];

  const templateFilters = [
    {
      key: 'type',
      label: 'Filter by Type',
      options: [
        { value: 'financial', label: 'Financial' },
        { value: 'operational', label: 'Operational' },
        { value: 'compliance', label: 'Compliance' },
        { value: 'analytical', label: 'Analytical' },
      ],
    },
    {
      key: 'isActive',
      label: 'Filter by Status',
      options: [
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' },
      ],
    },
  ];

  const bulkActions: BulkAction<ReportTemplate>[] = [
    {
      key: 'schedule',
      label: 'Schedule Selected',
      action: handleBulkSchedule,
    },
    {
      key: 'activate',
      label: 'Activate Selected',
      action: async (selected) => {
        await Promise.all(
          selected.map(template =>
            adminApi.reporting.updateReportTemplate(template.id, { isActive: true })
          )
        );
        toast.success('Templates activated');
        fetchReportingData();
      },
    },
    {
      key: 'deactivate',
      label: 'Deactivate Selected',
      action: async (selected) => {
        await Promise.all(
          selected.map(template =>
            adminApi.reporting.updateReportTemplate(template.id, { isActive: false })
          )
        );
        toast.success('Templates deactivated');
        fetchReportingData();
      },
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Advanced Reporting</h1>
              <p className="text-blue-100">Create, schedule, and manage comprehensive reports</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setActiveTab('builder')}
                className="px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg font-medium transition-all flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                </svg>
                <span>Report Builder</span>
              </button>
              <button
                onClick={() => setShowTemplateModal(true)}
                className="px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg font-medium transition-all flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Create Template</span>
              </button>
            </div>
          </div>
        </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'templates', label: 'Report Templates', icon: '📋' },
            { key: 'scheduled', label: 'Scheduled Reports', icon: '⏰' },
            { key: 'analytics', label: 'Report Analytics', icon: '📊' },
            { key: 'builder', label: 'Report Builder', icon: '🔧' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'templates' && (
          <div className="space-y-6">
            {/* Templates Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <MetricsCard
                title="Total Templates"
                value={reportTemplates.length.toString()}
                icon={<span className="text-blue-500">📋</span>}
              />
              <MetricsCard
                title="Active Templates"
                value={reportTemplates.filter(t => t.isActive).length.toString()}
                icon={<span className="text-green-500">✅</span>}
              />
              <MetricsCard
                title="Scheduled Reports"
                value={scheduledReports.length.toString()}
                icon={<span className="text-purple-500">⏰</span>}
              />
              <MetricsCard
                title="This Month"
                value={reportTemplates.filter(t => {
                  const lastGen = t.lastGenerated ? new Date(t.lastGenerated) : null;
                  const monthAgo = new Date();
                  monthAgo.setMonth(monthAgo.getMonth() - 1);
                  return lastGen && lastGen > monthAgo;
                }).length.toString()}
                icon={<span className="text-orange-500">📈</span>}
              />
            </div>

            {/* Templates Table */}
            <DataTable
              data={reportTemplates}
              columns={templateColumns}
              loading={loading}
              searchable={true}
              searchPlaceholder="Search report templates..."
              filters={templateFilters}
              bulkActions={bulkActions}
              selectedItems={selectedTemplates}
              onSelectionChange={setSelectedTemplates}
              onRowClick={(template) => {
                const format = prompt('Select format (pdf/excel/csv):') as 'pdf' | 'excel' | 'csv';
                if (format && ['pdf', 'excel', 'csv'].includes(format)) {
                  handleGenerateReport(template.id, format);
                }
              }}
            />
          </div>
        )}

        {activeTab === 'scheduled' && (
          <div className="space-y-6">
            {/* Scheduled Reports Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricsCard
                title="Active Schedules"
                value={scheduledReports.filter(s => s.isActive).length.toString()}
                icon={<span className="text-green-500">⏰</span>}
              />
              <MetricsCard
                title="Daily Reports"
                value={scheduledReports.filter(s => s.frequency === 'daily').length.toString()}
                icon={<span className="text-blue-500">📅</span>}
              />
              <MetricsCard
                title="Weekly Reports"
                value={scheduledReports.filter(s => s.frequency === 'weekly').length.toString()}
                icon={<span className="text-purple-500">📊</span>}
              />
            </div>

            {/* Scheduled Reports Table */}
            <DataTable
              data={scheduledReports}
              columns={scheduledColumns}
              loading={loading}
              searchable={true}
              searchPlaceholder="Search scheduled reports..."
            />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Report Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricsCard
                title="Reports Generated"
                value="1,234"
                icon={<span className="text-green-500">📊</span>}
              />
              <MetricsCard
                title="Avg Generation Time"
                value="2.3s"
                icon={<span className="text-blue-500">⚡</span>}
              />
              <MetricsCard
                title="Success Rate"
                value="99.2%"
                icon={<span className="text-purple-500">✅</span>}
              />
              <MetricsCard
                title="Data Points"
                value="45.2K"
                icon={<span className="text-orange-500">📈</span>}
              />
            </div>

            {/* Analytics Chart Placeholder */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Report Generation Trends
              </h3>
              <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                Chart visualization would go here (Chart.js or similar)
              </div>
            </div>
          </div>
        )}

        {activeTab === 'builder' && (
          <ReportBuilder
            onTemplateCreate={handleCreateTemplate}
            availableDataSources={[
              { key: 'users', label: 'User Data', type: 'table' },
              { key: 'organizations', label: 'Organization Data', type: 'table' },
              { key: 'projects', label: 'Project Data', type: 'table' },
              { key: 'budgets', label: 'Budget Data', type: 'table' },
              { key: 'contracts', label: 'Contract Data', type: 'table' },
              { key: 'audit_logs', label: 'Audit Logs', type: 'table' },
            ]}
          />
        )}
      </div>

      {/* Create Template Modal */}
      {showTemplateModal && (
        <ReportTemplateForm
          onSubmit={handleCreateTemplate}
          onCancel={() => setShowTemplateModal(false)}
        />
      )}

      {/* Schedule Report Modal */}
      {showScheduleModal && (
        <ScheduleReportForm
          templates={reportTemplates}
          onSubmit={handleScheduleReport}
          onCancel={() => setShowScheduleModal(false)}
        />
      )}
      </div>
    </div>
  );
};

// Report Builder Component
interface ReportBuilderProps {
  onTemplateCreate: (template: Partial<ReportTemplate>) => void;
  availableDataSources: Array<{ key: string; label: string; type: string }>;
}

const ReportBuilder: React.FC<ReportBuilderProps> = ({ onTemplateCreate, availableDataSources }) => {
  const [selectedDataSources, setSelectedDataSources] = useState<string[]>([]);
  const [templateConfig, setTemplateConfig] = useState<Partial<ReportTemplate>>({
    name: '',
    type: 'operational',
    category: '',
    description: '',
    dataSources: [],
    filters: {},
    groupBy: [],
    aggregations: {},
    visualizations: [],
  });

  const handleDataSourceToggle = (sourceKey: string) => {
    setSelectedDataSources(prev =>
      prev.includes(sourceKey)
        ? prev.filter(key => key !== sourceKey)
        : [...prev, sourceKey]
    );
  };

  const handleCreateTemplate = () => {
    if (!templateConfig.name) {
      toast.error('Please enter a template name');
      return;
    }

    onTemplateCreate({
      ...templateConfig,
      dataSources: selectedDataSources,
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Report Builder
        </h3>

        {/* Template Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Template Name *
            </label>
            <input
              type="text"
              value={templateConfig.name}
              onChange={(e) => setTemplateConfig(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter template name..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Report Type *
            </label>
            <select
              value={templateConfig.type}
              onChange={(e) => setTemplateConfig(prev => ({ ...prev, type: e.target.value as ReportTemplate['type'] }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="financial">Financial</option>
              <option value="operational">Operational</option>
              <option value="compliance">Compliance</option>
              <option value="analytical">Analytical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <input
              type="text"
              value={templateConfig.category}
              onChange={(e) => setTemplateConfig(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter category..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <input
              type="text"
              value={templateConfig.description}
              onChange={(e) => setTemplateConfig(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter description..."
            />
          </div>
        </div>

        {/* Data Source Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Data Sources
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {availableDataSources.map(source => (
              <button
                key={source.key}
                onClick={() => handleDataSourceToggle(source.key)}
                className={`p-3 border rounded-lg text-left transition-colors ${
                  selectedDataSources.includes(source.key)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="font-medium">{source.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{source.type}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Report Preview */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Report Preview
          </label>
          <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Selected {selectedDataSources.length} data source(s): {selectedDataSources.join(', ')}
            </div>
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Template: {templateConfig.name || 'Untitled'} ({templateConfig.type})
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleCreateTemplate}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Create Template
          </button>
        </div>
      </div>
    </div>
  );
};

// Report Template Form Component
interface ReportTemplateFormProps {
  template?: ReportTemplate;
  onSubmit: (template: Partial<ReportTemplate>) => void;
  onCancel: () => void;
}

const ReportTemplateForm: React.FC<ReportTemplateFormProps> = ({ template, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Partial<ReportTemplate>>({
    name: template?.name || '',
    type: template?.type || 'operational',
    category: template?.category || '',
    description: template?.description || '',
    isActive: template?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {template ? 'Edit Template' : 'Create Report Template'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Template Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as ReportTemplate['type'] }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              <option value="financial">Financial</option>
              <option value="operational">Operational</option>
              <option value="compliance">Compliance</option>
              <option value="analytical">Analytical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Active Template
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              {template ? 'Update' : 'Create'} Template
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Schedule Report Form Component
interface ScheduleReportFormProps {
  templates: ReportTemplate[];
  onSubmit: (schedule: Partial<ScheduledReport>) => void;
  onCancel: () => void;
}

const ScheduleReportForm: React.FC<ScheduleReportFormProps> = ({ templates, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Partial<ScheduledReport>>({
    templateId: '',
    frequency: 'weekly',
    recipients: [''],
    format: 'pdf',
    isActive: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.templateId || !formData.recipients?.[0]) {
      toast.error('Please fill in all required fields');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Schedule Report
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Report Template *
            </label>
            <select
              value={formData.templateId}
              onChange={(e) => setFormData(prev => ({ ...prev, templateId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              <option value="">Select Template</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name} ({template.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Frequency *
            </label>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value as ScheduledReport['frequency'] }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Recipients *
            </label>
            <input
              type="email"
              value={formData.recipients?.[0] || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, recipients: [e.target.value] }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="admin@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Format
            </label>
            <select
              value={formData.format}
              onChange={(e) => setFormData(prev => ({ ...prev, format: e.target.value as ScheduledReport['format'] }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Active Schedule
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Schedule Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdvancedReporting;
