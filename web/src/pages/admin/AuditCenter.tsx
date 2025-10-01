import React, { useState, useEffect } from 'react';
import {
  ActivityEntry,
  SecurityEvent,
  ComplianceReport,
  AuditFilters,
  TableColumn,
  FilterOption,
  BulkAction
} from '../../types/admin';
import { adminApi } from '../../services/adminApi';
import DataTable from '../../components/admin/DataTable';
import MetricsCard from '../../components/admin/MetricsCard';
import { toast } from 'react-toastify';

const AuditCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'activity' | 'security' | 'compliance'>('activity');
  const [activityLogs, setActivityLogs] = useState<ActivityEntry[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [complianceReports, setComplianceReports] = useState<ComplianceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    fetchAuditData();
  }, [activeTab]);

  const fetchAuditData = async () => {
    try {
      setLoading(true);

      if (activeTab === 'activity') {
        try {
          const response = await adminApi.audit.getActivityLogs({
            dateRange: {
              start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
              end: new Date(),
            },
            limit: 100,
          });
          // Handle both direct array and paginated response formats
          const activityData = Array.isArray(response) ? response : (response as any)?.data || [];
          setActivityLogs(activityData);
        } catch (error) {
          console.error('Error fetching activity logs:', error);
          setActivityLogs([]);
        }
      } else if (activeTab === 'security') {
        try {
          const response = await adminApi.audit.getSecurityEvents({
            dateRange: {
              start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
              end: new Date(),
            },
          });
          // Handle both direct array and paginated response formats
          const securityData = Array.isArray(response) ? response : (response as any)?.data || [];
          setSecurityEvents(securityData);
        } catch (error) {
          console.error('Error fetching security events:', error);
          setSecurityEvents([]);
        }
      } else if (activeTab === 'compliance') {
        try {
          const reports = await adminApi.audit.getComplianceReports();
          // Handle both direct array and paginated response formats
          const complianceData = Array.isArray(reports) ? reports : (reports as any)?.data || [];
          setComplianceReports(complianceData);
        } catch (error) {
          console.error('Error fetching compliance reports:', error);
          setComplianceReports([]);
        }
      }
    } catch (error) {
      console.error('Error fetching audit data:', error);
      toast.error('Failed to fetch audit data');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (type: ComplianceReport['type']) => {
    try {
      const report = await adminApi.audit.generateComplianceReport(type);
      toast.success('Compliance report generated successfully');
      setComplianceReports(prev => [report, ...prev]);
      setShowReportModal(false);
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate compliance report');
    }
  };

  const handleDownloadReport = async (reportId: string) => {
    try {
      const blob = await adminApi.audit.downloadComplianceReport(reportId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance-report-${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Report downloaded successfully');
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download report');
    }
  };

  const handleExportAuditData = async (format: 'csv' | 'excel' | 'pdf' = 'csv') => {
    try {
      const filters: AuditFilters = {
        dateRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: new Date(),
        },
      };

      const blob = await adminApi.audit.exportAuditData(format, filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-data.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Audit data exported successfully');
    } catch (error) {
      console.error('Error exporting audit data:', error);
      toast.error('Failed to export audit data');
    }
  };

  // Activity Logs Columns
  const activityColumns: TableColumn<ActivityEntry>[] = [
    {
      key: 'timestamp',
      label: 'Timestamp',
      sortable: true,
      render: (value: Date) => new Date(value).toLocaleString(),
    },
    {
      key: 'userEmail',
      label: 'User',
      sortable: true,
      render: (value: string) => (
        <div className="font-medium text-gray-900 dark:text-white">
          {value}
        </div>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      sortable: true,
      render: (value: string) => (
        <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
          {value}
        </span>
      ),
    },
    {
      key: 'entityType',
      label: 'Entity Type',
      sortable: true,
      render: (value: string) => (
        <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-full">
          {value}
        </span>
      ),
    },
    {
      key: 'entityId',
      label: 'Entity ID',
      sortable: true,
    },
    {
      key: 'ipAddress',
      label: 'IP Address',
      sortable: true,
      render: (value: string) => value || '-',
    },
  ];

  // Security Events Columns
  const securityColumns: TableColumn<SecurityEvent>[] = [
    {
      key: 'timestamp',
      label: 'Timestamp',
      sortable: true,
      render: (value: Date) => new Date(value).toLocaleString(),
    },
    {
      key: 'type',
      label: 'Event Type',
      sortable: true,
      render: (value: string) => (
        <span className="px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full">
          {value.replace('_', ' ').toUpperCase()}
        </span>
      ),
    },
    {
      key: 'severity',
      label: 'Severity',
      sortable: true,
      render: (value: string) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          value === 'critical' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
          value === 'high' ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200' :
          value === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
          'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
        }`}>
          {value.toUpperCase()}
        </span>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      sortable: true,
    },
    {
      key: 'ipAddress',
      label: 'IP Address',
      sortable: true,
    },
    {
      key: 'userId',
      label: 'User ID',
      sortable: true,
      render: (value: string) => value || '-',
    },
  ];

  // Compliance Reports Columns
  const complianceColumns: TableColumn<ComplianceReport>[] = [
    {
      key: 'name',
      label: 'Report Name',
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
        <span className="px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full">
          {value.replace('_', ' ').toUpperCase()}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          value === 'completed' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
          value === 'in_progress' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
          value === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
          'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
        }`}>
          {value.replace('_', ' ').toUpperCase()}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (value: Date) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'completedAt',
      label: 'Completed',
      sortable: true,
      render: (value: Date) => value ? new Date(value).toLocaleDateString() : '-',
    },
    {
      key: 'generatedBy',
      label: 'Generated By',
      sortable: true,
    },
  ];

  const activityFilters = [
    {
      key: 'action',
      label: 'Filter by Action',
      options: [
        { value: 'created', label: 'Created' },
        { value: 'updated', label: 'Updated' },
        { value: 'deleted', label: 'Deleted' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
      ],
    },
    {
      key: 'entityType',
      label: 'Filter by Entity',
      options: [
        { value: 'user', label: 'User' },
        { value: 'project', label: 'Project' },
        { value: 'budget', label: 'Budget' },
        { value: 'contract', label: 'Contract' },
        { value: 'organization', label: 'Organization' },
      ],
    },
  ];

  const securityFilters = [
    {
      key: 'severity',
      label: 'Filter by Severity',
      options: [
        { value: 'critical', label: 'Critical' },
        { value: 'high', label: 'High' },
        { value: 'medium', label: 'Medium' },
        { value: 'low', label: 'Low' },
      ],
    },
    {
      key: 'type',
      label: 'Filter by Event Type',
      options: [
        { value: 'login_failure', label: 'Login Failure' },
        { value: 'suspicious_activity', label: 'Suspicious Activity' },
        { value: 'permission_denied', label: 'Permission Denied' },
        { value: 'data_export', label: 'Data Export' },
      ],
    },
  ];

  const bulkActions: BulkAction<any>[] = [
    {
      key: 'export',
      label: 'Export Selected',
      action: async (selectedItems) => {
        await handleExportAuditData('csv');
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
              <h1 className="text-3xl font-bold mb-2">Audit Center</h1>
              <p className="text-blue-100">Monitor system activity, security events, and compliance</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => handleExportAuditData('csv')}
                className="px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg font-medium transition-all flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export Data</span>
              </button>
              {activeTab === 'compliance' && (
                <button
                  onClick={() => setShowReportModal(true)}
                  className="px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg font-medium transition-all flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Generate Report</span>
                </button>
              )}
            </div>
          </div>
        </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'activity', label: 'Activity Logs', icon: '📋' },
            { key: 'security', label: 'Security Events', icon: '🔒' },
            { key: 'compliance', label: 'Compliance Reports', icon: '📊' },
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
        {activeTab === 'activity' && (
          <DataTable
            data={activityLogs}
            columns={activityColumns}
            loading={loading}
            searchable={true}
            searchPlaceholder="Search activity logs..."
            filters={activityFilters}
            bulkActions={bulkActions}
            selectedItems={selectedItems}
            onSelectionChange={setSelectedItems}
          />
        )}

        {activeTab === 'security' && (
          <DataTable
            data={securityEvents}
            columns={securityColumns}
            loading={loading}
            searchable={true}
            searchPlaceholder="Search security events..."
            filters={securityFilters}
            bulkActions={bulkActions}
            selectedItems={selectedItems}
            onSelectionChange={setSelectedItems}
          />
        )}

        {activeTab === 'compliance' && (
          <div className="space-y-6">
            {/* Compliance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricsCard
                title="Total Reports"
                value={complianceReports.length.toString()}
                icon={<span className="text-blue-500">📊</span>}
              />
              <MetricsCard
                title="Completed"
                value={complianceReports.filter(r => r.status === 'completed').length.toString()}
                icon={<span className="text-green-500">✅</span>}
              />
              <MetricsCard
                title="In Progress"
                value={complianceReports.filter(r => r.status === 'in_progress').length.toString()}
                icon={<span className="text-yellow-500">⏳</span>}
              />
            </div>

            {/* Reports Table */}
            <DataTable
              data={complianceReports}
              columns={complianceColumns}
              loading={loading}
              searchable={true}
              searchPlaceholder="Search compliance reports..."
              onRowClick={(report) => {
                if (report.downloadUrl) {
                  handleDownloadReport(report.id);
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Generate Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Generate Compliance Report
            </h2>

            <div className="space-y-3">
              {[
                { type: 'audit' as const, label: 'Audit Report', description: 'Comprehensive system audit' },
                { type: 'security' as const, label: 'Security Report', description: 'Security events and incidents' },
                { type: 'data_protection' as const, label: 'Data Protection', description: 'GDPR and data compliance' },
                { type: 'financial' as const, label: 'Financial Report', description: 'Financial compliance and reporting' },
              ].map(reportType => (
                <button
                  key={reportType.type}
                  onClick={() => handleGenerateReport(reportType.type)}
                  className="w-full text-left p-3 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {reportType.label}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {reportType.description}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default AuditCenter;
