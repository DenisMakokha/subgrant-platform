import React, { useState, useEffect } from 'react';
import { FeatureFlag, SystemSetting } from '../../types/admin';
import { adminApi } from '../../services/adminApi';
import DataTable from '../../components/admin/DataTable';
import MetricsCard from '../../components/admin/MetricsCard';
import { toast } from 'react-toastify';

const ConfigurationCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'feature-flags' | 'system-settings' | 'integrations' | 'database' | 'backup' | 'notifications'>('feature-flags');
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [showSettingModal, setShowSettingModal] = useState(false);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  const [editingSetting, setEditingSetting] = useState<SystemSetting | null>(null);

  useEffect(() => {
    fetchConfigurationData();
  }, [activeTab]);

  const fetchConfigurationData = async () => {
    try {
      setLoading(true);

      if (activeTab === 'feature-flags') {
        const flags = await adminApi.configuration.getFeatureFlags();
        setFeatureFlags(flags);
      } else if (activeTab === 'system-settings') {
        const settings = await adminApi.configuration.getSystemSettings();
        setSystemSettings(settings);
      } else if (activeTab === 'integrations') {
        const integrations = await adminApi.configuration.getIntegrationSettings();
        // Handle integrations data
        console.log('Integrations:', integrations);
      }
    } catch (error) {
      console.error('Error fetching configuration data:', error);
      toast.error('Failed to fetch configuration data');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeatureFlag = async (flagKey: string, enabled: boolean) => {
    try {
      await adminApi.configuration.updateFeatureFlag(flagKey, enabled);
      toast.success(`Feature flag ${enabled ? 'enabled' : 'disabled'} successfully`);
      fetchConfigurationData();
    } catch (error) {
      console.error('Error updating feature flag:', error);
      toast.error('Failed to update feature flag');
    }
  };

  const handleUpdateSystemSetting = async (settingKey: string, value: any) => {
    try {
      await adminApi.configuration.updateSystemSetting(settingKey, value);
      toast.success('System setting updated successfully');
      setShowSettingModal(false);
      setEditingSetting(null);
      fetchConfigurationData();
    } catch (error) {
      console.error('Error updating system setting:', error);
      toast.error('Failed to update system setting');
    }
  };

  // Feature Flags Columns
  const flagColumns = [
    {
      key: 'key' as keyof FeatureFlag,
      label: 'Flag Key',
      sortable: true,
      render: (value: string) => (
        <div className="font-medium text-gray-900 dark:text-white">
          {value}
        </div>
      ),
    },
    {
      key: 'name' as keyof FeatureFlag,
      label: 'Name',
      sortable: true,
    },
    {
      key: 'description' as keyof FeatureFlag,
      label: 'Description',
      sortable: true,
    },
    {
      key: 'enabled' as keyof FeatureFlag,
      label: 'Status',
      sortable: true,
      render: (value: boolean) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          value
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
            : 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300'
        }`}>
          {value ? 'Enabled' : 'Disabled'}
        </span>
      ),
    },
    {
      key: 'percentage' as keyof FeatureFlag,
      label: 'Rollout %',
      sortable: true,
      render: (value: number) => value ? `${value}%` : '-',
    },
  ];

  // System Settings Columns
  const settingColumns = [
    {
      key: 'key' as keyof SystemSetting,
      label: 'Setting Key',
      sortable: true,
      render: (value: string) => (
        <div className="font-medium text-gray-900 dark:text-white">
          {value}
        </div>
      ),
    },
    {
      key: 'category' as keyof SystemSetting,
      label: 'Category',
      sortable: true,
      render: (value: string) => (
        <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
          {value}
        </span>
      ),
    },
    {
      key: 'type' as keyof SystemSetting,
      label: 'Type',
      sortable: true,
      render: (value: string) => (
        <span className="px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full">
          {value}
        </span>
      ),
    },
    {
      key: 'value' as keyof SystemSetting,
      label: 'Value',
      sortable: true,
      render: (value: any) => (
        <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
        </span>
      ),
    },
    {
      key: 'updatedAt' as keyof SystemSetting,
      label: 'Last Updated',
      sortable: true,
      render: (value: Date) => new Date(value).toLocaleDateString(),
    },
  ];

  const enabledFlags = featureFlags.filter(flag => flag.enabled).length;
  const totalFlags = featureFlags.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Configuration Center</h1>
              <p className="text-blue-100">Manage system settings, feature flags, and integrations</p>
            </div>
            <button
              onClick={fetchConfigurationData}
              className="px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg font-medium transition-all flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        </div>

      {/* Configuration Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricsCard
          title="Feature Flags"
          value={`${enabledFlags}/${totalFlags} enabled`}
          icon={<span className="text-green-500">🚀</span>}
        />
        <MetricsCard
          title="System Settings"
          value={systemSettings.length.toString()}
          icon={<span className="text-blue-500">⚙️</span>}
        />
        <MetricsCard
          title="Integrations"
          value="3 active"
          icon={<span className="text-purple-500">🔗</span>}
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {[
            { key: 'feature-flags', label: 'Feature Flags', icon: '🚀' },
            { key: 'system-settings', label: 'System Settings', icon: '⚙️' },
            { key: 'integrations', label: 'Integrations', icon: '🔗' },
            { key: 'database', label: 'Database', icon: '🗄️' },
            { key: 'backup', label: 'Backup & Recovery', icon: '💾' },
            { key: 'notifications', label: 'Notifications', icon: '🔔' },
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
        {activeTab === 'feature-flags' && (
          <div className="space-y-6">
            {/* Feature Flags Overview */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Feature Flags
                </h3>
                <button
                  onClick={() => toast.info('Feature flag creation coming soon!')}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Create Flag
                </button>
              </div>

              {/* Feature Flags Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featureFlags.map(flag => (
                  <div
                    key={flag.key}
                    className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {flag.name}
                      </h4>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={flag.enabled}
                          onChange={(e) => handleToggleFeatureFlag(flag.key, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {flag.description}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400">
                        Key: {flag.key}
                      </span>
                      {flag.percentage && (
                        <span className="text-blue-600 dark:text-blue-400">
                          {flag.percentage}% rollout
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system-settings' && (
          <div className="space-y-6">
            {/* System Settings Overview */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  System Settings
                </h3>
                <button
                  onClick={() => toast.info('System setting creation coming soon!')}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Add Setting
                </button>
              </div>

              {/* Settings Table */}
              <DataTable
                data={systemSettings}
                columns={settingColumns}
                loading={loading}
                searchable={true}
                searchPlaceholder="Search system settings..."
                onRowClick={(setting) => setEditingSetting(setting)}
              />
            </div>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="space-y-6">
            {/* Integrations Overview */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Integration Management
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* DocuSign Integration */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">DocuSign</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Contract signing</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                      Connected
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">API Key:</span>
                      <span className="font-mono text-gray-900 dark:text-white">••••••••</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Last Sync:</span>
                      <span className="text-gray-900 dark:text-white">2 min ago</span>
                    </div>
                  </div>
                </div>

                {/* Xero Integration */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Xero</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Accounting integration</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                      Connected
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Organization:</span>
                      <span className="font-mono text-gray-900 dark:text-white">SubGrant Org</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Last Sync:</span>
                      <span className="text-gray-900 dark:text-white">5 min ago</span>
                    </div>
                  </div>
                </div>

                {/* Email Integration */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">Email Service</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Notification delivery</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                      Warning
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Provider:</span>
                      <span className="font-mono text-gray-900 dark:text-white">SendGrid</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Status:</span>
                      <span className="text-yellow-600 dark:text-yellow-400">Rate Limited</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'database' && (
          <div className="space-y-6">
            {/* Database Configuration */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Database Configuration
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Connection Settings */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Connection Settings</h4>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Database Host
                      </label>
                      <input
                        type="text"
                        defaultValue="localhost"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Database Port
                      </label>
                      <input
                        type="number"
                        defaultValue="5432"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Database Name
                      </label>
                      <input
                        type="text"
                        defaultValue="subgrant_platform"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Connection Pool Size
                      </label>
                      <input
                        type="number"
                        defaultValue="20"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Performance Settings */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Performance Settings</h4>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Query Timeout (seconds)
                      </label>
                      <input
                        type="number"
                        defaultValue="30"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Max Connections
                      </label>
                      <input
                        type="number"
                        defaultValue="100"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="enableQueryLogging"
                        defaultChecked
                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="enableQueryLogging" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Enable Query Logging
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="enableConnectionPooling"
                        defaultChecked
                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="enableConnectionPooling" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Enable Connection Pooling
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
                  Test Connection
                </button>
                <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'backup' && (
          <div className="space-y-6">
            {/* Backup & Recovery */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Backup & Recovery Management
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Backup Settings */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Backup Settings</h4>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Backup Frequency
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Backup Time
                      </label>
                      <input
                        type="time"
                        defaultValue="02:00"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Retention Period (days)
                      </label>
                      <input
                        type="number"
                        defaultValue="30"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="enableEncryption"
                        defaultChecked
                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="enableEncryption" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Encrypt Backups
                      </label>
                    </div>
                  </div>
                </div>

                {/* Recent Backups */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Recent Backups</h4>

                  <div className="space-y-3">
                    {[
                      { name: 'backup_2024_01_15.sql', size: '245 MB', date: '2024-01-15 02:00', status: 'completed' },
                      { name: 'backup_2024_01_14.sql', size: '243 MB', date: '2024-01-14 02:00', status: 'completed' },
                      { name: 'backup_2024_01_13.sql', size: '241 MB', date: '2024-01-13 02:00', status: 'completed' },
                    ].map((backup, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{backup.name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{backup.size} • {backup.date}</div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          backup.status === 'completed'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                        }`}>
                          {backup.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
                  Create Manual Backup
                </button>
                <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                  Save Backup Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            {/* Notification Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Notification Configuration
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email Settings */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Email Notifications</h4>

                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="enableEmailNotifications"
                        defaultChecked
                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="enableEmailNotifications" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        Enable Email Notifications
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        SMTP Server
                      </label>
                      <input
                        type="text"
                        defaultValue="smtp.gmail.com"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        SMTP Port
                      </label>
                      <input
                        type="number"
                        defaultValue="587"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        From Email
                      </label>
                      <input
                        type="email"
                        defaultValue="noreply@subgrant.com"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Notification Types */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">Notification Types</h4>

                  <div className="space-y-3">
                    {[
                      { key: 'user_registration', label: 'User Registration', enabled: true },
                      { key: 'contract_approval', label: 'Contract Approval', enabled: true },
                      { key: 'budget_alert', label: 'Budget Alerts', enabled: true },
                      { key: 'system_maintenance', label: 'System Maintenance', enabled: false },
                      { key: 'security_alert', label: 'Security Alerts', enabled: true },
                    ].map((notification) => (
                      <div key={notification.key} className="flex items-center justify-between">
                        <label className="text-sm text-gray-700 dark:text-gray-300">
                          {notification.label}
                        </label>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            defaultChecked={notification.enabled}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
                  Test Email
                </button>
                <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                  Save Notification Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Setting Modal */}
      {showSettingModal && editingSetting && (
        <SystemSettingForm
          setting={editingSetting}
          onSubmit={(value) => handleUpdateSystemSetting(editingSetting.key, value)}
          onCancel={() => {
            setShowSettingModal(false);
            setEditingSetting(null);
          }}
        />
      )}
      </div>
    </div>
  );
};

// System Setting Form Component
interface SystemSettingFormProps {
  setting: SystemSetting;
  onSubmit: (value: any) => void;
  onCancel: () => void;
}

const SystemSettingForm: React.FC<SystemSettingFormProps> = ({ setting, onSubmit, onCancel }) => {
  const [formValue, setFormValue] = useState(setting.value);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let processedValue = formValue;

    // Process value based on type
    if (setting.type === 'number') {
      processedValue = Number(formValue);
    } else if (setting.type === 'boolean') {
      processedValue = formValue === 'true';
    } else if (setting.type === 'json') {
      try {
        processedValue = JSON.parse(formValue);
      } catch (error) {
        toast.error('Invalid JSON format');
        return;
      }
    }

    onSubmit(processedValue);
  };

  const renderInputField = () => {
    switch (setting.type) {
      case 'boolean':
        return (
          <select
            value={String(formValue)}
            onChange={(e) => setFormValue(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        );
      case 'number':
        return (
          <input
            type="number"
            value={formValue}
            onChange={(e) => setFormValue(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        );
      case 'json':
        return (
          <textarea
            value={typeof formValue === 'object' ? JSON.stringify(formValue, null, 2) : formValue}
            onChange={(e) => setFormValue(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
            placeholder="Enter JSON value..."
          />
        );
      default:
        return (
          <input
            type="text"
            value={formValue}
            onChange={(e) => setFormValue(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Edit System Setting
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Setting Key
            </label>
            <input
              type="text"
              value={setting.key}
              disabled
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <input
              type="text"
              value={setting.category}
              disabled
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type
            </label>
            <input
              type="text"
              value={setting.type}
              disabled
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Value
            </label>
            {renderInputField()}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {setting.description}
            </p>
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
              Update Setting
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfigurationCenter;
