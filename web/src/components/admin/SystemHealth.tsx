import React, { useState, useEffect } from 'react';
import { SystemHealth as SystemHealthType, ServiceStatus, Alert } from '../../types/admin';
import { adminApi } from '../../services/adminApi';
import MetricsCard from './MetricsCard';
import StatusIndicator from './StatusIndicator';
import { toast } from 'react-toastify';

interface SystemHealthProps {
  className?: string;
}

const SystemHealth: React.FC<SystemHealthProps> = ({ className = '' }) => {
  const [health, setHealth] = useState<SystemHealthType | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHealthData = async () => {
    try {
      setRefreshing(true);
      const [servicesData, metricsData, alertsData] = await Promise.all([
        adminApi.systemHealth.getServiceStatus(),
        adminApi.systemHealth.getMetrics(),
        adminApi.systemHealth.getAlerts(),
      ]);

      setHealth({
        services: servicesData,
        metrics: metricsData,
        alerts: alertsData,
        lastUpdated: new Date(),
      });
    } catch (error) {
      console.error('Error fetching system health:', error);
      toast.error('Failed to fetch system health data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealthData();

    // Set up polling every 30 seconds
    const interval = setInterval(fetchHealthData, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleResolveAlert = async (alertId: string) => {
    try {
      await adminApi.systemHealth.resolveAlert(alertId);
      toast.success('Alert resolved successfully');
      fetchHealthData(); // Refresh data
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast.error('Failed to resolve alert');
    }
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!health) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
        <p className="text-gray-500 dark:text-gray-400">Unable to load system health data</p>
      </div>
    );
  }

  const getServiceIcon = (serviceName: string) => {
    switch (serviceName.toLowerCase()) {
      case 'database':
        return '🗄️';
      case 'api':
        return '🔗';
      case 'cache':
        return '⚡';
      case 'notifications':
        return '🔔';
      case 'email':
        return '📧';
      default:
        return '🔧';
    }
  };

  const activeAlerts = health.alerts.filter(alert => !alert.resolved);
  const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'critical');

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            System Health
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Last updated: {health.lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={fetchHealthData}
          disabled={refreshing}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
            🚨 Critical Alerts ({criticalAlerts.length})
          </h3>
          <div className="space-y-2">
            {criticalAlerts.map(alert => (
              <div key={alert.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-900 dark:text-red-100">
                    {alert.title}
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {alert.message}
                  </p>
                </div>
                <button
                  onClick={() => handleResolveAlert(alert.id)}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                >
                  Resolve
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Service Status */}
      <div>
        <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
          Service Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(health.services).map(([serviceName, service]) => (
            <div
              key={serviceName}
              className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {getServiceIcon(serviceName)} {serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}
                </span>
                <StatusIndicator status={service.status} size="sm" />
              </div>
              {service.responseTime && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Response time: {service.responseTime}ms
                </p>
              )}
              {service.message && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {service.message}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div>
        <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
          Key Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricsCard
            title="Total Users"
            value={health.metrics.totalUsers.toLocaleString()}
            icon={<span className="text-blue-500">👥</span>}
          />
          <MetricsCard
            title="Active Users"
            value={health.metrics.activeUsers.toLocaleString()}
            icon={<span className="text-green-500">🟢</span>}
          />
          <MetricsCard
            title="Organizations"
            value={health.metrics.totalOrganizations.toLocaleString()}
            icon={<span className="text-purple-500">🏢</span>}
          />
          <MetricsCard
            title="Projects"
            value={health.metrics.totalProjects.toLocaleString()}
            icon={<span className="text-orange-500">📋</span>}
          />
        </div>
      </div>

      {/* Performance Metrics */}
      <div>
        <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
          Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricsCard
            title="API Response Time"
            value={`${health.metrics.apiResponseTime}ms`}
            icon={<span className="text-green-500">⚡</span>}
          />
          <MetricsCard
            title="Error Rate"
            value={`${health.metrics.errorRate}%`}
            icon={<span className="text-red-500">❌</span>}
          />
          <MetricsCard
            title="System Load"
            value={`${health.metrics.systemLoad}%`}
            icon={<span className="text-yellow-500">📊</span>}
          />
        </div>
      </div>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div>
          <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
            Active Alerts ({activeAlerts.length})
          </h3>
          <div className="space-y-2">
            {activeAlerts.slice(0, 5).map(alert => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border ${
                  alert.severity === 'critical'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : alert.severity === 'high'
                    ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                    : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <StatusIndicator
                      status={alert.severity === 'critical' ? 'error' : 'warning'}
                      size="sm"
                      showLabel={false}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {alert.title}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {alert.message}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleResolveAlert(alert.id)}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    Resolve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemHealth;
