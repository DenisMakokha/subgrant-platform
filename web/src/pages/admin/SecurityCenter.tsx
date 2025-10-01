import React, { useState, useEffect } from 'react';
import {
  SecurityEvent,
  SecurityPolicy,
  AccessPattern,
  ThreatIndicator,
  TableColumn,
  FilterOption,
  BulkAction
} from '../../types/admin';
import { adminApi } from '../../services/adminApi';
import DataTable from '../../components/admin/DataTable';
import MetricsCard from '../../components/admin/MetricsCard';
import StatusIndicator from '../../components/admin/StatusIndicator';
import { toast } from 'react-toastify';

const SecurityCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'threats' | 'policies' | 'access' | 'incidents' | 'compliance'>('threats');
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [securityPolicies, setSecurityPolicies] = useState<SecurityPolicy[]>([]);
  const [accessPatterns, setAccessPatterns] = useState<AccessPattern[]>([]);
  const [threatIndicators, setThreatIndicators] = useState<ThreatIndicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvents, setSelectedEvents] = useState<SecurityEvent[]>([]);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);

  useEffect(() => {
    fetchSecurityData();
  }, [activeTab]);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);

      if (activeTab === 'threats') {
        const events = await adminApi.security.getThreatIndicators();
        setThreatIndicators(events);
      } else if (activeTab === 'policies') {
        const policies = await adminApi.security.getSecurityPolicies();
        setSecurityPolicies(policies);
      } else if (activeTab === 'access') {
        const patterns = await adminApi.security.getAccessPatterns();
        setAccessPatterns(patterns);
      } else if (activeTab === 'incidents') {
        const events = await adminApi.security.getSecurityIncidents();
        setSecurityEvents(events);
      }
    } catch (error) {
      console.error('Error fetching security data:', error);
      toast.error('Failed to fetch security data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePolicy = async (policyData: Partial<SecurityPolicy>) => {
    try {
      await adminApi.security.createSecurityPolicy(policyData);
      toast.success('Security policy created successfully');
      setShowPolicyModal(false);
      fetchSecurityData();
    } catch (error) {
      console.error('Error creating policy:', error);
      toast.error('Failed to create security policy');
    }
  };

  const handleRespondToIncident = async (incidentId: string, response: string) => {
    try {
      await adminApi.security.respondToIncident(incidentId, response);
      toast.success('Incident response recorded');
      fetchSecurityData();
    } catch (error) {
      console.error('Error responding to incident:', error);
      toast.error('Failed to record incident response');
    }
  };

  const handleBulkFlagEvents = async (selectedEvents: SecurityEvent[]) => {
    try {
      await Promise.all(
        selectedEvents.map(event =>
          adminApi.security.flagSecurityEvent(event.id, { flagged: true, notes: 'Bulk flagged by admin' })
        )
      );
      toast.success(`Flagged ${selectedEvents.length} security events`);
      setSelectedEvents([]);
      fetchSecurityData();
    } catch (error) {
      console.error('Error flagging events:', error);
      toast.error('Failed to flag security events');
    }
  };

  // Threat Indicators Columns
  const threatColumns: TableColumn<ThreatIndicator>[] = [
    {
      key: 'timestamp',
      label: 'Detected',
      sortable: true,
      render: (value: Date) => new Date(value).toLocaleString(),
    },
    {
      key: 'type',
      label: 'Threat Type',
      sortable: true,
      render: (value: string) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          value === 'suspicious_login' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
          value === 'unusual_activity' ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200' :
          value === 'data_exfiltration' ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200' :
          'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
        }`}>
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
      key: 'affectedUsers',
      label: 'Affected Users',
      sortable: true,
      render: (value: number) => value || 0,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => (
        <StatusIndicator
          status={value === 'resolved' ? 'healthy' : value === 'investigating' ? 'warning' : 'error'}
          label={value.charAt(0).toUpperCase() + value.slice(1)}
          size="sm"
        />
      ),
    },
  ];

  // Security Policies Columns
  const policyColumns: TableColumn<SecurityPolicy>[] = [
    {
      key: 'name',
      label: 'Policy Name',
      sortable: true,
      render: (value: string) => (
        <div className="font-medium text-gray-900 dark:text-white">
          {value}
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (value: string) => (
        <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
          {value}
        </span>
      ),
    },
    {
      key: 'enforcement',
      label: 'Enforcement',
      sortable: true,
      render: (value: string) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          value === 'strict' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
          value === 'moderate' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
          'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
        }`}>
          {value.toUpperCase()}
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
      key: 'lastUpdated',
      label: 'Last Updated',
      sortable: true,
      render: (value: Date) => new Date(value).toLocaleDateString(),
    },
  ];

  // Access Patterns Columns
  const accessColumns: TableColumn<AccessPattern>[] = [
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
      key: 'pattern',
      label: 'Access Pattern',
      sortable: true,
      render: (value: string) => (
        <span className="px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full">
          {value}
        </span>
      ),
    },
    {
      key: 'riskScore',
      label: 'Risk Score',
      sortable: true,
      render: (value: number) => (
        <div className="flex items-center">
          <div className={`w-16 h-2 rounded-full mr-2 ${
            value > 70 ? 'bg-red-500' : value > 40 ? 'bg-yellow-500' : 'bg-green-500'
          }`}>
            <div
              className="h-2 bg-current rounded-full"
              style={{ width: `${Math.min(value, 100)}%` }}
            />
          </div>
          <span className="text-sm font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: 'lastSeen',
      label: 'Last Seen',
      sortable: true,
      render: (value: Date) => new Date(value).toLocaleString(),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => (
        <StatusIndicator
          status={value === 'normal' ? 'healthy' : value === 'suspicious' ? 'warning' : 'error'}
          label={value.charAt(0).toUpperCase() + value.slice(1)}
          size="sm"
        />
      ),
    },
  ];

  const threatFilters = [
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
      key: 'status',
      label: 'Filter by Status',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'investigating', label: 'Investigating' },
        { value: 'resolved', label: 'Resolved' },
      ],
    },
  ];

  const bulkActions: BulkAction<SecurityEvent>[] = [
    {
      key: 'flag',
      label: 'Flag Selected',
      action: handleBulkFlagEvents,
    },
    {
      key: 'export',
      label: 'Export Selected',
      action: async (selected) => {
        // Export functionality would go here
        toast.info('Export functionality coming soon!');
      },
    },
  ];

  const criticalThreats = threatIndicators.filter(t => t.severity === 'critical').length;
  const activeIncidents = threatIndicators.filter(t => t.status === 'active').length;
  const highRiskUsers = accessPatterns.filter(p => p.riskScore > 70).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Security Center</h1>
              <p className="text-blue-100">Monitor threats, manage policies, and ensure compliance</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={fetchSecurityData}
                className="px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg font-medium transition-all flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </button>
              {activeTab === 'policies' && (
                <button
                  onClick={() => setShowPolicyModal(true)}
                  className="px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg font-medium transition-all flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Create Policy</span>
                </button>
              )}
            </div>
          </div>
        </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricsCard
          title="Critical Threats"
          value={criticalThreats.toString()}
          icon={<span className="text-red-500">🚨</span>}
        />
        <MetricsCard
          title="Active Incidents"
          value={activeIncidents.toString()}
          icon={<span className="text-orange-500">⚠️</span>}
        />
        <MetricsCard
          title="High Risk Users"
          value={highRiskUsers.toString()}
          icon={<span className="text-yellow-500">👤</span>}
        />
        <MetricsCard
          title="Security Score"
          value="94/100"
          icon={<span className="text-green-500">🛡️</span>}
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {[
            { key: 'threats', label: 'Threat Monitoring', icon: '🚨' },
            { key: 'policies', label: 'Security Policies', icon: '📋' },
            { key: 'access', label: 'Access Patterns', icon: '👤' },
            { key: 'incidents', label: 'Security Incidents', icon: '🚨' },
            { key: 'compliance', label: 'Compliance', icon: '✅' },
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
        {activeTab === 'threats' && (
          <div className="space-y-6">
            {/* Threat Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {threatIndicators.slice(0, 6).map((threat, index) => (
                <div
                  key={threat.id || index}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-red-500"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {threat.type.replace('_', ' ').toUpperCase()}
                    </h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      threat.severity === 'critical' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' :
                      threat.severity === 'high' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200' :
                      'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                    }`}>
                      {threat.severity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {threat.description}
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">
                      {threat.affectedUsers} users affected
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {new Date(threat.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'policies' && (
          <div className="space-y-6">
            {/* Security Policies Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricsCard
                title="Active Policies"
                value={securityPolicies.filter(p => p.isActive).length.toString()}
                icon={<span className="text-green-500">📋</span>}
              />
              <MetricsCard
                title="Strict Policies"
                value={securityPolicies.filter(p => p.enforcement === 'strict').length.toString()}
                icon={<span className="text-red-500">🔒</span>}
              />
              <MetricsCard
                title="Updated This Month"
                value={securityPolicies.filter(p => {
                  const updated = new Date(p.lastUpdated);
                  const monthAgo = new Date();
                  monthAgo.setMonth(monthAgo.getMonth() - 1);
                  return updated > monthAgo;
                }).length.toString()}
                icon={<span className="text-blue-500">📅</span>}
              />
            </div>

            {/* Policies Table */}
            <DataTable
              data={securityPolicies}
              columns={policyColumns}
              loading={loading}
              searchable={true}
              searchPlaceholder="Search security policies..."
            />
          </div>
        )}

        {activeTab === 'access' && (
          <div className="space-y-6">
            {/* Access Patterns Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricsCard
                title="Users Analyzed"
                value={accessPatterns.length.toString()}
                icon={<span className="text-blue-500">👥</span>}
              />
              <MetricsCard
                title="Suspicious Patterns"
                value={accessPatterns.filter(p => p.status === 'suspicious').length.toString()}
                icon={<span className="text-orange-500">⚠️</span>}
              />
              <MetricsCard
                title="Risk Score Avg"
                value={`${Math.round(accessPatterns.reduce((sum, p) => sum + p.riskScore, 0) / accessPatterns.length) || 0}`}
                icon={<span className="text-purple-500">📊</span>}
              />
            </div>

            {/* Access Patterns Table */}
            <DataTable
              data={accessPatterns}
              columns={accessColumns}
              loading={loading}
              searchable={true}
              searchPlaceholder="Search access patterns..."
            />
          </div>
        )}

        {activeTab === 'incidents' && (
          <div className="space-y-6">
            {/* Security Incidents */}
            <DataTable
              data={securityEvents}
              columns={[
                {
                  key: 'timestamp',
                  label: 'Timestamp',
                  sortable: true,
                  render: (value: Date) => new Date(value).toLocaleString(),
                },
                {
                  key: 'type',
                  label: 'Incident Type',
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
                      'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
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
                  key: 'userId',
                  label: 'User ID',
                  sortable: true,
                },
                {
                  key: 'ipAddress',
                  label: 'IP Address',
                  sortable: true,
                },
              ]}
              loading={loading}
              searchable={true}
              searchPlaceholder="Search security incidents..."
              filters={threatFilters}
              bulkActions={bulkActions}
              selectedItems={selectedEvents}
              onSelectionChange={setSelectedEvents}
            />
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="space-y-6">
            {/* Compliance Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricsCard
                title="Compliance Score"
                value="96%"
                icon={<span className="text-green-500">✅</span>}
              />
              <MetricsCard
                title="Active Policies"
                value={securityPolicies.filter(p => p.isActive).length.toString()}
                icon={<span className="text-blue-500">📋</span>}
              />
              <MetricsCard
                title="Audit Trail"
                value="Complete"
                icon={<span className="text-purple-500">📋</span>}
              />
              <MetricsCard
                title="Last Assessment"
                value="2 days ago"
                icon={<span className="text-orange-500">📅</span>}
              />
            </div>

            {/* Compliance Checklist */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Compliance Status
              </h3>

              <div className="space-y-3">
                {[
                  { item: 'Password Policy Enforcement', status: 'compliant', lastChecked: '2024-01-15' },
                  { item: 'Data Encryption at Rest', status: 'compliant', lastChecked: '2024-01-14' },
                  { item: 'Access Logging', status: 'compliant', lastChecked: '2024-01-15' },
                  { item: 'Regular Security Audits', status: 'compliant', lastChecked: '2024-01-10' },
                  { item: 'Incident Response Plan', status: 'review', lastChecked: '2024-01-01' },
                ].map((checklist, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <StatusIndicator
                        status={checklist.status === 'compliant' ? 'healthy' : checklist.status === 'review' ? 'warning' : 'error'}
                        size="sm"
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {checklist.item}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Checked: {checklist.lastChecked}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Policy Modal */}
      {showPolicyModal && (
        <SecurityPolicyForm
          onSubmit={handleCreatePolicy}
          onCancel={() => setShowPolicyModal(false)}
        />
      )}
      </div>
    </div>
  );
};

// Security Policy Form Component
interface SecurityPolicyFormProps {
  policy?: SecurityPolicy;
  onSubmit: (policy: Partial<SecurityPolicy>) => void;
  onCancel: () => void;
}

const SecurityPolicyForm: React.FC<SecurityPolicyFormProps> = ({ policy, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<Partial<SecurityPolicy>>({
    name: policy?.name || '',
    category: policy?.category || 'access_control',
    description: policy?.description || '',
    enforcement: policy?.enforcement || 'moderate',
    rules: policy?.rules || [],
    isActive: policy?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {policy ? 'Edit Security Policy' : 'Create Security Policy'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Policy Name *
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
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as SecurityPolicy['category'] }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              <option value="access_control">Access Control</option>
              <option value="password_policy">Password Policy</option>
              <option value="data_protection">Data Protection</option>
              <option value="network_security">Network Security</option>
              <option value="audit_logging">Audit Logging</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Enforcement Level *
            </label>
            <select
              value={formData.enforcement}
              onChange={(e) => setFormData(prev => ({ ...prev, enforcement: e.target.value as SecurityPolicy['enforcement'] }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              <option value="strict">Strict</option>
              <option value="moderate">Moderate</option>
              <option value="lenient">Lenient</option>
            </select>
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
              Active Policy
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
              {policy ? 'Update' : 'Create'} Policy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SecurityCenter;
