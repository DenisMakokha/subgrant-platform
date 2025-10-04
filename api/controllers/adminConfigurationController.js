const db = require('../config/database');
const logger = require('../utils/logger');
const { logApiCall, logError } = require('../services/observabilityService');
const adminActivityLogService = require('../services/adminActivityLogService');

/**
 * Get feature flags
 */
exports.getFeatureFlags = async (req, res) => {
  const startTime = Date.now();
  try {
    // For now, return mock feature flags
    // In a real implementation, this would query a feature_flags table
    const mockFeatureFlags = [
      {
        key: 'new_dashboard',
        name: 'New Dashboard UI',
        description: 'Enable the new advanced admin dashboard',
        enabled: true,
        userScopes: ['admin'],
        organizationScopes: [],
        percentage: 100,
      },
      {
        key: 'enhanced_notifications',
        name: 'Enhanced Notifications',
        description: 'Enable enhanced notification system with templates',
        enabled: true,
        userScopes: [],
        organizationScopes: [],
        percentage: 100,
      },
      {
        key: 'beta_features',
        name: 'Beta Features',
        description: 'Enable beta features for testing',
        enabled: false,
        userScopes: ['admin'],
        organizationScopes: [],
        percentage: 0,
      },
      {
        key: 'ai_powered_insights',
        name: 'AI-Powered Insights',
        description: 'Enable AI-powered analytics and insights',
        enabled: false,
        userScopes: [],
        organizationScopes: [],
        percentage: 0,
      },
    ];

    logApiCall('GET', '/admin/config/feature-flags', 200, Date.now() - startTime, req.user?.id);
    res.json(mockFeatureFlags);
  } catch (error) {
    logError(error, 'getFeatureFlags', { userId: req.user?.id });
    logApiCall('GET', '/admin/config/feature-flags', 500, Date.now() - startTime, req.user?.id);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update feature flag
 */
exports.updateFeatureFlag = async (req, res) => {
  const startTime = Date.now();
  try {
    const { flagKey } = req.params;
    const { enabled } = req.body;

    // Get current state (mock - would fetch from DB in real impl)
    const beforeState = { enabled: !enabled };

    // In a real implementation, this would update the feature flag in the database
    logger.info(`Feature flag ${flagKey} ${enabled ? 'enabled' : 'disabled'}`);

    // Return updated flag
    const updatedFlag = {
      key: flagKey,
      name: `Feature Flag ${flagKey}`,
      description: 'Updated feature flag',
      enabled,
      userScopes: [],
      organizationScopes: [],
      percentage: enabled ? 100 : 0,
    };

    // Log admin activity
    await adminActivityLogService.logActivity({
      adminId: req.user?.id,
      action: 'update_feature_flag',
      entityType: 'feature_flag',
      entityId: flagKey,
      changes: {
        before: beforeState,
        after: { enabled }
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    logApiCall('PUT', `/admin/config/feature-flags/${flagKey}`, 200, Date.now() - startTime, req.user?.id);
    res.json(updatedFlag);
  } catch (error) {
    // Log failed activity
    await adminActivityLogService.logActivity({
      adminId: req.user?.id,
      action: 'update_feature_flag',
      entityType: 'feature_flag',
      entityId: req.params.flagKey,
      result: 'error',
      errorMessage: error.message,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    logError(error, 'updateFeatureFlag', { userId: req.user?.id, flagKey: req.params.flagKey });
    logApiCall('PUT', `/admin/config/feature-flags/${req.params.flagKey}`, 500, Date.now() - startTime, req.user?.id);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get system settings
 */
exports.getSystemSettings = async (req, res) => {
  const startTime = Date.now();
  try {
    // For now, return mock system settings
    // In a real implementation, this would query a system_settings table
    const mockSystemSettings = [
      {
        key: 'max_file_size',
        value: 10485760, // 10MB
        type: 'number',
        category: 'uploads',
        description: 'Maximum file size for uploads in bytes',
        updatedBy: 'admin@subgrant.com',
        updatedAt: new Date(),
      },
      {
        key: 'session_timeout',
        value: 3600, // 1 hour
        type: 'number',
        category: 'security',
        description: 'Session timeout in seconds',
        updatedBy: 'admin@subgrant.com',
        updatedAt: new Date(),
      },
      {
        key: 'email_provider',
        value: 'sendgrid',
        type: 'string',
        category: 'integrations',
        description: 'Email service provider',
        updatedBy: 'admin@subgrant.com',
        updatedAt: new Date(),
      },
      {
        key: 'backup_frequency',
        value: 'daily',
        type: 'string',
        category: 'backup',
        description: 'How often to run backups',
        updatedBy: 'admin@subgrant.com',
        updatedAt: new Date(),
      },
      {
        key: 'maintenance_mode',
        value: false,
        type: 'boolean',
        category: 'system',
        description: 'Enable maintenance mode',
        updatedBy: 'admin@subgrant.com',
        updatedAt: new Date(),
      },
      {
        key: 'api_rate_limit',
        value: {
          requests: 1000,
          window: 3600,
        },
        type: 'json',
        category: 'api',
        description: 'API rate limiting configuration',
        updatedBy: 'admin@subgrant.com',
        updatedAt: new Date(),
      },
    ];

    logApiCall('GET', '/admin/config/system-settings', 200, Date.now() - startTime, req.user?.id);
    res.json(mockSystemSettings);
  } catch (error) {
    logError(error, 'getSystemSettings', { userId: req.user?.id });
    logApiCall('GET', '/admin/config/system-settings', 500, Date.now() - startTime, req.user?.id);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update system setting
 */
exports.updateSystemSetting = async (req, res) => {
  const startTime = Date.now();
  try {
    const { settingKey } = req.params;
    const { value } = req.body;

    // In a real implementation, this would update the system setting in the database
    logger.info(`System setting ${settingKey} updated to:`, value);

    // Return updated setting
    const updatedSetting = {
      key: settingKey,
      value,
      type: typeof value,
      category: 'system',
      description: `Updated setting: ${settingKey}`,
      updatedBy: req.user?.email || 'admin@subgrant.com',
      updatedAt: new Date(),
    };

    // Log admin activity
    await adminActivityLogService.logActivity({
      adminId: req.user?.id,
      action: 'update_system_setting',
      entityType: 'system_setting',
      entityId: settingKey,
      changes: {
        before: null, // Would fetch current value in real impl
        after: { key: settingKey, value, type: typeof value }
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    logApiCall('PUT', `/admin/config/system-settings/${settingKey}`, 200, Date.now() - startTime, req.user?.id);
    res.json(updatedSetting);
  } catch (error) {
    // Log failed activity
    await adminActivityLogService.logActivity({
      adminId: req.user?.id,
      action: 'update_system_setting',
      entityType: 'system_setting',
      entityId: req.params.settingKey,
      result: 'error',
      errorMessage: error.message,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    logError(error, 'updateSystemSetting', { userId: req.user?.id, settingKey: req.params.settingKey });
    logApiCall('PUT', `/admin/config/system-settings/${req.params.settingKey}`, 500, Date.now() - startTime, req.user?.id);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get integration settings
 */
exports.getIntegrationSettings = async (req, res) => {
  const startTime = Date.now();
  try {
    // For now, return mock integration settings
    // In a real implementation, this would query an integrations table
    const mockIntegrations = {
      docusign: {
        name: 'DocuSign',
        type: 'contract_signing',
        status: 'connected',
        apiKey: '••••••••',
        lastSync: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
        config: {
          environment: 'production',
          webhookUrl: 'https://api.subgrant.com/webhooks/docusign',
        },
      },
      xero: {
        name: 'Xero',
        type: 'accounting',
        status: 'connected',
        organizationId: 'subgrant-org',
        lastSync: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        config: {
          tenantId: 'subgrant-tenant',
          webhookUrl: 'https://api.subgrant.com/webhooks/xero',
        },
      },
      email: {
        name: 'Email Service',
        type: 'notifications',
        status: 'warning',
        provider: 'sendgrid',
        apiKey: '••••••••',
        config: {
          dailyLimit: 1000,
          currentUsage: 950,
          resetTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        },
      },
    };

    logApiCall('GET', '/admin/config/integrations', 200, Date.now() - startTime, req.user?.id);
    res.json(mockIntegrations);
  } catch (error) {
    logError(error, 'getIntegrationSettings', { userId: req.user?.id });
    logApiCall('GET', '/admin/config/integrations', 500, Date.now() - startTime, req.user?.id);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update integration setting
 */
exports.updateIntegrationSetting = async (req, res) => {
  const startTime = Date.now();
  try {
    const { integrationKey } = req.params;
    const settings = req.body;

    // In a real implementation, this would update the integration settings in the database
    logger.info(`Integration ${integrationKey} updated:`, settings);

    // Return updated integration
    const updatedIntegration = {
      name: integrationKey,
      type: 'integration',
      status: 'connected',
      ...settings,
      updatedAt: new Date(),
      updatedBy: req.user?.email || 'admin@subgrant.com',
    };

    // Log admin activity
    await adminActivityLogService.logActivity({
      adminId: req.user?.id,
      action: 'update_integration_setting',
      entityType: 'integration',
      entityId: integrationKey,
      changes: {
        before: null, // Would fetch current settings in real impl
        after: { integrationKey, ...settings }
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    logApiCall('PUT', `/admin/config/integrations/${integrationKey}`, 200, Date.now() - startTime, req.user?.id);
    res.json(updatedIntegration);
  } catch (error) {
    // Log failed activity
    await adminActivityLogService.logActivity({
      adminId: req.user?.id,
      action: 'update_integration_setting',
      entityType: 'integration',
      entityId: req.params.integrationKey,
      result: 'error',
      errorMessage: error.message,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    logError(error, 'updateIntegrationSetting', { userId: req.user?.id, integrationKey: req.params.integrationKey });
    logApiCall('PUT', `/admin/config/integrations/${req.params.integrationKey}`, 500, Date.now() - startTime, req.user?.id);
    res.status(500).json({ error: error.message });
  }
};
