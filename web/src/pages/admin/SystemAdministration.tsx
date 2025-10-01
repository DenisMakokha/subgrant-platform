import React, { useState, useEffect } from 'react';
import {
  SystemMetric,
  LogEntry,
  ServerStatus,
  MaintenanceWindow,
  TableColumn,
  FilterOption,
  BulkAction
} from '../../types/admin';
import { adminApi } from '../../services/adminApi';
import DataTable from '../../components/admin/DataTable';
import MetricsCard from '../../components/admin/MetricsCard';
import StatusIndicator from '../../components/admin/StatusIndicator';
import { toast } from 'react-toastify';

const SystemAdministration: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'monitoring' | 'logs' | 'maintenance' | 'performance' | 'infrastructure'>('monitoring');
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([]);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [serverStatuses, setServerStatuses] = useState<ServerStatus[]>([]);
  const [maintenanceWindows, setMaintenanceWindows] = useState<MaintenanceWindow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLogs, setSelectedLogs] = useState<LogEntry[]>([]);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);

  useEffect(() => {
    fetchSystemData();
  }, [activeTab]);

  const fetchSystemData = async () => {
    try {
      setLoading(true);

      if (activeTab === 'monitoring') {
        const metrics = await adminApi.system.getSystemMetrics();
        setSystemMetrics(metrics);
      } else if (activeTab === 'logs') {
        const logs = await adminApi.system.getLogEntries();
        setLogEntries(logs);
      } else if (activeTab === 'maintenance') {
        const maintenance = await adminApi.system.getMaintenanceWindows();
        setMaintenanceWindows(maintenance);
      } else if (activeTab === 'performance') {
        const servers = await adminApi.system.getServerStatuses();
        setServerStatuses(servers);
      }
    } catch (error) {
      console.error('Error fetching system data:', error);
      toast.error('Failed to fetch system data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMaintenanceWindow = async (windowData: Partial<MaintenanceWindow>) => {
    try {
      await adminApi.system.createMaintenanceWindow(windowData);
      toast.success('Maintenance window scheduled successfully');
      setShowMaintenanceModal(false);
      fetchSystemData();
    } catch (error) {
      console.error('Error creating maintenance window:', error);
      toast.error('Failed to schedule maintenance window');
    }
  };

  const handleRotateLogs = async () => {
    try {
      await adminApi.system.rotateLogs();
      toast.success('Log rotation initiated');
      fetchSystemData();
    } catch (error) {
      console.error('Error rotating logs:', error);
      toast.error('Failed to rotate logs');
    }
  };

  const handleClearCache = async () => {
    try {
      await adminApi.system.clearCache();
      toast.success('Cache cleared successfully');
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast.error('Failed to clear cache');
    }
  };

  const handleBulkArchiveLogs = async (selectedLogs: LogEntry[]) => {
    try {
      await Promise.all(
        selectedLogs.map(log =>
          adminApi.system.archiveLogEntry(log.id)
        )
      );
      toast.success(`Archived ${selectedLogs.length} log entries`);
      setSelectedLogs([]);
      fetchSystemData();
    } catch (error) {
      console.error('Error archiving logs:', error);
      toast.error('Failed to archive log entries');
    }
  };

  // System Metrics Columns
  const metricColumns: TableColumn<SystemMetric>[] = [
    {
      key: 'name',
      label: 'Metric Name',
      sortable: true,
      render: (value: string) => (
        <div className="font-medium text-gray-900 dark:text-white">
          {value}
        </div>
      ),
    },
    {
      key: 'value',
      label: 'Current Value',
      sortable: true,
      render: (value: number, item: SystemMetric) => (
        <div className="flex items-center space-x-2">
          <span className="font-mono text-sm">{value.toFixed(2)}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{item.unit}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => (
        <StatusIndicator
          status={value === 'normal' ? 'healthy' : value === 'warning' ? 'warning' : 'error'}
          label={value.charAt(0).toUpperCase() + value.slice(1)}
          size="sm"
        />
      ),
    },
    {
      key: 'threshold',
      label: 'Threshold',
      sortable: true,
      render: (value: number, item: SystemMetric) => (
        <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
          {value} {item.unit}
        </span>
      ),
    },
    {
      key: 'lastUpdated',
      label: 'Last Updated',
      sortable: true,
      render: (value: Date) => new Date(value).toLocaleTimeString(),
    },
  ];

  // Log Entries Columns
  const logColumns: TableColumn<LogEntry>[] = [
    {
      key: 'timestamp',
      label: 'Timestamp',
      sortable: true,
      render: (value: Date) => new Date(value).toLocaleString(),
    },
    {
      key: 'level',
      label: 'Level',
      sortable: true,
      render: (value: string) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          value === 'error' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
          value === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
          value === 'info' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
          'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
        }`}>
          {value.toUpperCase()}
        </span>
      ),
    },
    {
      key: 'source',
      label: 'Source',
      sortable: true,
      render: (value: string) => (
        <span className="px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full">
          {value}
        </span>
      ),
    },
    {
      key: 'message',
      label: 'Message',
      sortable: true,
    },
    {
      key: 'userId',
      label: 'User ID',
      sortable: true,
      render: (value: string) => value || 'System',
    },
  ];

  // Server Status Columns
  const serverColumns: TableColumn<ServerStatus>[] = [
    {
      key: 'name',
      label: 'Server Name',
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
        <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
          {value}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => (
        <StatusIndicator
          status={value === 'online' ? 'healthy' : value === 'maintenance' ? 'warning' : 'error'}
          label={value.charAt(0).toUpperCase() + value.slice(1)}
          size="sm"
        />
      ),
    },
    {
      key: 'cpuUsage',
      label: 'CPU Usage',
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center">
          <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mr-2">
            <div
              className="h-2 bg-current rounded-full"
              style={{ width: `${Math.min(value, 100)}%` }}
            />
          </div>
          <span className="text-sm font-medium">{value}%</span>
        </div>
      ),
    },
    {
      key: 'memoryUsage',
      label: 'Memory Usage',
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center">
          <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mr-2">
            <div
              className="h-2 bg-current rounded-full"
              style={{ width: `${Math.min(value, 100)}%` }}
            />
          </div>
          <span className="text-sm font-medium">{value}%</span>
        </div>
      ),
    },
    {
      key: 'uptime',
      label: 'Uptime',
      sortable: true,
      render: (value: number) => {
        const days = Math.floor(value / 86400);
        const hours = Math.floor((value % 86400) / 3600);
        return `${days}d ${hours}h`;
      },
    },
  ];

  const logFilters = [
    {
      key: 'level',
      label: 'Filter by Level',
      options: [
        { value: 'error', label: 'Error' },
        { value: 'warning', label: 'Warning' },
        { value: 'info', label: 'Info' },
        { value: 'debug', label: 'Debug' },
      ],
    },
    {
      key: 'source',
      label: 'Filter by Source',
      options: [
        { value: 'api', label: 'API' },
        { value: 'database', label: 'Database' },
        { value: 'auth', label: 'Authentication' },
        { value: 'security', label: 'Security' },
      ],
    },
  ];

  const bulkActions: BulkAction<LogEntry>[] = [
    {
      key: 'archive',
      label: 'Archive Selected',
      action: handleBulkArchiveLogs,
    },
    {
      key: 'export',
      label: 'Export Selected',
      action: async (selected) => {
        toast.info('Log export functionality coming soon!');
      },
    },
  ];

  const avgCpuUsage = serverStatuses.reduce((sum, server) => sum + server.cpuUsage, 0) / serverStatuses.length || 0;
  const avgMemoryUsage = serverStatuses.reduce((sum, server) => sum + server.memoryUsage, 0) / serverStatuses.length || 0;
  const errorLogs = logEntries.filter(log => log.level === 'error').length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">System Administration</h1>
              <p className="text-blue-100">Monitor system performance, manage logs, and maintain infrastructure</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleClearCache}
                className="px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg font-medium transition-all flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Clear Cache</span>
              </button>
              <button
                onClick={fetchSystemData}
                className="px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg font-medium transition-all flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </button>
              {activeTab === 'maintenance' && (
                <button
                  onClick={() => setShowMaintenanceModal(true)}
                  className="px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg font-medium transition-all flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Schedule Maintenance</span>
                </button>
              )}
            </div>
          </div>
        </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricsCard
          title="Avg CPU Usage"
          value={`${avgCpuUsage.toFixed(1)}%`}
          icon={<span className="text-blue-500">🖥️</span>}
        />
        <MetricsCard
          title="Avg Memory Usage"
          value={`${avgMemoryUsage.toFixed(1)}%`}
          icon={<span className="text-green-500">🧠</span>}
        />
        <MetricsCard
          title="Error Logs (24h)"
          value={errorLogs.toString()}
          icon={<span className="text-red-500">🚨</span>}
        />
        <MetricsCard
          title="Active Servers"
          value={serverStatuses.filter(s => s.status === 'online').length.toString()}
          icon={<span className="text-purple-500">🖥️</span>}
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {[
            { key: 'monitoring', label: 'System Monitoring', icon: '📊' },
            { key: 'logs', label: 'Log Management', icon: '📋' },
            { key: 'maintenance', label: 'Maintenance', icon: '🔧' },
            { key: 'performance', label: 'Performance', icon: '⚡' },
            { key: 'infrastructure', label: 'Infrastructure', icon: '🏗️' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 whitespace-nowrap ${
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
        {activeTab === 'monitoring' && (
          <div className="space-y-6">
            {/* Real-time Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: 'Response Time', value: '45ms', status: 'normal', unit: 'ms' },
                { name: 'Throughput', value: '1,234', status: 'normal', unit: 'req/min' },
                { name: 'Error Rate', value: '0.2%', status: 'normal', unit: '%' },
                { name: 'Active Connections', value: '89', status: 'normal', unit: 'conn' },
              ].map((metric, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">{metric.name}</h4>
                    <StatusIndicator
                      status={metric.status === 'normal' ? 'healthy' : 'warning'}
                      size="sm"
                    />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {metric.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {metric.unit}
                  </div>
                </div>
              ))}
            </div>

            {/* System Metrics Table */}
            <DataTable
              data={systemMetrics}
              columns={metricColumns}
              loading={loading}
              searchable={true}
              searchPlaceholder="Search system metrics..."
            />
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-6">
            {/* Log Management Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Log Management
                </h3>
                <button
                  onClick={handleRotateLogs}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Rotate Logs
                </button>
              </div>

              {/* Log Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {logEntries.filter(log => log.level === 'error').length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Errors</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {logEntries.filter(log => log.level === 'warning').length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Warnings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {logEntries.filter(log => log.level === 'info').length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Info</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                    {logEntries.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
                </div>
              </div>
            </div>

            {/* Log Entries Table */}
            <DataTable
              data={logEntries}
              columns={logColumns}
              loading={loading}
              searchable={true}
              searchPlaceholder="Search log entries..."
              filters={logFilters}
              bulkActions={bulkActions}
              selectedItems={selectedLogs}
              onSelectionChange={setSelectedLogs}
            />
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="space-y-6">
            {/* Maintenance Windows */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Scheduled Maintenance Windows
              </h3>

              <div className="space-y-3">
                {maintenanceWindows.map((window, index) => (
                  <div key={window.id || index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <StatusIndicator
                        status={window.status === 'scheduled' ? 'warning' : window.status === 'in_progress' ? 'error' : 'healthy'}
                        size="sm"
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {window.title}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(window.startTime).toLocaleString()} - {new Date(window.endTime).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      window.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                      window.status === 'in_progress' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
                      'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                    }`}>
                      {window.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-6">
            {/* Server Performance */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {serverStatuses.map((server, index) => (
                <div key={server.id || index} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {server.name}
                    </h4>
                    <StatusIndicator
                      status={server.status === 'online' ? 'healthy' : server.status === 'maintenance' ? 'warning' : 'error'}
                      size="sm"
                    />
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">CPU Usage</span>
                        <span className="font-medium">{server.cpuUsage}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                        <div
                          className="h-2 bg-blue-500 rounded-full"
                          style={{ width: `${Math.min(server.cpuUsage, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">Memory Usage</span>
                        <span className="font-medium">{server.memoryUsage}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                        <div
                          className="h-2 bg-green-500 rounded-full"
                          style={{ width: `${Math.min(server.memoryUsage, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Uptime: {Math.floor(server.uptime / 86400)}d {Math.floor((server.uptime % 86400) / 3600)}h
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Performance Metrics Table */}
            <DataTable
              data={serverStatuses}
              columns={serverColumns}
              loading={loading}
              searchable={true}
              searchPlaceholder="Search servers..."
            />
          </div>
        )}

        {activeTab === 'infrastructure' && (
          <div className="space-y-6">
            {/* Infrastructure Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Services Status */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Service Status
                </h3>

                <div className="space-y-3">
                  {[
                    { name: 'Web Server', status: 'online', version: '2.4.1' },
                    { name: 'Database', status: 'online', version: '13.2' },
                    { name: 'Cache Server', status: 'online', version: '6.2.1' },
                    { name: 'Load Balancer', status: 'online', version: '1.8.0' },
                    { name: 'Message Queue', status: 'warning', version: '3.1.2' },
                  ].map((service, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <StatusIndicator
                          status={service.status === 'online' ? 'healthy' : 'warning'}
                          size="sm"
                        />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{service.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">v{service.version}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Infrastructure Actions */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Infrastructure Actions
                </h3>

                <div className="space-y-3">
                  <button className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
                    <span className="mr-2">🔄</span>
                    Restart Services
                  </button>

                  <button className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
                    <span className="mr-2">📊</span>
                    View Infrastructure Diagram
                  </button>

                  <button className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
                    <span className="mr-2">⚙️</span>
                    Configure Auto-scaling
                  </button>

                  <button className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
                    <span className="mr-2">🔍</span>
                    Infrastructure Health Check
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Schedule Maintenance Modal */}
      {showMaintenanceModal && (
        <MaintenanceWindowForm
          onSubmit={handleCreateMaintenanceWindow}
          onCancel={() => setShowMaintenanceModal(false)}
        />
      )}
      </div>
    </div>
  );
};

// Maintenance Window Form Component
interface MaintenanceWindowFormProps {
  window?: MaintenanceWindow;
  onSubmit: (window: Partial<MaintenanceWindow>) => void;
  onCancel: () => void;
}

const MaintenanceWindowForm: React.FC<MaintenanceWindowFormProps> = ({ window, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Partial<MaintenanceWindow>>({
    title: window?.title || '',
    description: window?.description || '',
    startTime: window?.startTime || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    endTime: window?.endTime || new Date(Date.now() + 28 * 60 * 60 * 1000).toISOString().slice(0, 16),
    affectedServices: window?.affectedServices || [],
    status: window?.status || 'scheduled',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Schedule Maintenance Window
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Maintenance window title..."
              required
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
              placeholder="Describe the maintenance activities..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Time *
              </label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Time *
              </label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Affected Services
            </label>
            <input
              type="text"
              value={formData.affectedServices?.join(', ')}
              onChange={(e) => setFormData(prev => ({ ...prev, affectedServices: e.target.value.split(',').map(s => s.trim()) }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="API, Database, Cache..."
            />
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
              Schedule Maintenance
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SystemAdministration;
