import { fetchWithAuth } from './api';
import {
  SystemHealth,
  User,
  Organization,
  ActivityEntry,
  SecurityEvent,
  ComplianceReport,
  FeatureFlag,
  SystemSetting,
  RoleDefinition,
  DashboardDefinition,
  AuditFilters,
  UserFilters,
  OrganizationFilters,
  DashboardStats,
  ApiResponse,
  PaginatedResponse,
  ReportTemplate,
  ReportConfig,
  ScheduledReport,
  ReportData,
  SecurityPolicy,
  AccessPattern,
  ThreatIndicator,
  SystemMetric,
  LogEntry,
  ServerStatus,
  MaintenanceWindow,
} from '../types/admin';

// Base admin API URL
const ADMIN_API_BASE = '/admin';

/**
 * System Health API functions
 */
export const systemHealthApi = {
  /**
   * Get overall system health
   */
  getSystemHealth: async (): Promise<SystemHealth> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/health/system`);
  },

  /**
   * Get service status details
   */
  getServiceStatus: async (): Promise<SystemHealth['services']> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/health/services`);
  },

  /**
   * Get system metrics
   */
  getMetrics: async (): Promise<SystemHealth['metrics']> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/health/metrics`);
  },

  /**
   * Get active alerts
   */
  getAlerts: async (): Promise<SystemHealth['alerts']> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/health/alerts`);
  },

  /**
   * Resolve an alert
   */
  resolveAlert: async (alertId: string): Promise<void> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/health/alerts/${alertId}/resolve`, {
      method: 'PUT',
    });
  },
};

/**
 * User Management API functions
 */
export const userManagementApi = {
  /**
   * Get users with filtering and pagination
   */
  getUsers: async (filters: UserFilters = {}): Promise<PaginatedResponse<User>> => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    const queryString = queryParams.toString();
    const url = queryString ? `${ADMIN_API_BASE}/users?${queryString}` : `${ADMIN_API_BASE}/users`;
    return fetchWithAuth(url);
  },

  /**
   * Get user by ID
   */
  getUserById: async (userId: string): Promise<User> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/users/${userId}`);
  },

  /**
   * Create new user
   */
  createUser: async (userData: Partial<User>): Promise<User> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/users`, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  /**
   * Update user
   */
  updateUser: async (userId: string, userData: Partial<User>): Promise<User> => {
    return fetchWithAuth(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  /**
   * Delete user
   */
  deleteUser: async (userId: string): Promise<void> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/users/${userId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Reset user password
   */
  resetPassword: async (userId: string, newPassword: string): Promise<void> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/users/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
  },

  /**
   * Get user access logs
   */
  getUserAccessLogs: async (userId: string): Promise<ActivityEntry[]> => {
    return fetchWithAuth(`/users/${userId}/access-logs`);
  },

  /**
   * Bulk assign roles to users
   */
  bulkAssignRoles: async (userIds: string[], roleId: string): Promise<void> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/users/bulk-assign-roles`, {
      method: 'POST',
      body: JSON.stringify({ userIds, roleId }),
    });
  },

  /**
   * Export users data
   */
  exportUsers: async (format: 'csv' | 'excel' = 'csv'): Promise<Blob> => {
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000/api'}/users/export?format=${format}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.blob();
  },
};

/**
 * Organization Management API functions
 */
export const organizationManagementApi = {
  /**
   * Get organizations with filtering and pagination
   */
  getOrganizations: async (filters: OrganizationFilters = {}): Promise<PaginatedResponse<Organization>> => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    const queryString = queryParams.toString();
    const url = queryString ? `/organizations?${queryString}` : '/organizations';
    return fetchWithAuth(url);
  },

  /**
   * Get organization by ID
   */
  getOrganizationById: async (orgId: string): Promise<Organization> => {
    return fetchWithAuth(`/organizations/${orgId}`);
  },

  /**
   * Update organization
   */
  updateOrganization: async (orgId: string, orgData: Partial<Organization>): Promise<Organization> => {
    return fetchWithAuth(`/organizations/${orgId}`, {
      method: 'PUT',
      body: JSON.stringify(orgData),
    });
  },

  /**
   * Get organization users
   */
  getOrganizationUsers: async (orgId: string): Promise<User[]> => {
    return fetchWithAuth(`/organizations/${orgId}/users`);
  },

  /**
   * Get organization projects
   */
  getOrganizationProjects: async (orgId: string): Promise<any[]> => {
    return fetchWithAuth(`/organizations/${orgId}/projects`);
  },
};

/**
 * Audit Center API functions
 */
export const auditApi = {
  /**
   * Get activity logs with filtering
   */
  getActivityLogs: async (filters: AuditFilters): Promise<PaginatedResponse<ActivityEntry>> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/audit/activity`, {
      method: 'POST',
      body: JSON.stringify(filters),
    });
  },

  /**
   * Get security events
   */
  getSecurityEvents: async (filters: Partial<AuditFilters> = {}): Promise<PaginatedResponse<SecurityEvent>> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/audit/security`, {
      method: 'POST',
      body: JSON.stringify(filters),
    });
  },

  /**
   * Get compliance reports
   */
  getComplianceReports: async (): Promise<ComplianceReport[]> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/audit/compliance`);
  },

  /**
   * Generate compliance report
   */
  generateComplianceReport: async (type: ComplianceReport['type']): Promise<ComplianceReport> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/audit/compliance`, {
      method: 'POST',
      body: JSON.stringify({ type }),
    });
  },

  /**
   * Download compliance report
   */
  downloadComplianceReport: async (reportId: string): Promise<Blob> => {
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000/api'}/audit/compliance/${reportId}/download`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.blob();
  },

  /**
   * Export audit data
   */
  exportAuditData: async (format: 'csv' | 'excel' | 'pdf' = 'csv', filters: AuditFilters): Promise<Blob> => {
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000/api'}/audit/export?format=${format}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(filters),
    });
    return response.blob();
  },
};

/**
 * Configuration Management API functions
 */
export const configurationApi = {
  /**
   * Get feature flags
   */
  getFeatureFlags: async (): Promise<FeatureFlag[]> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/config/feature-flags`);
  },

  /**
   * Update feature flag
   */
  updateFeatureFlag: async (flagKey: string, enabled: boolean): Promise<FeatureFlag> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/config/feature-flags/${flagKey}`, {
      method: 'PUT',
      body: JSON.stringify({ enabled }),
    });
  },

  /**
   * Get system settings
   */
  getSystemSettings: async (): Promise<SystemSetting[]> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/config/system-settings`);
  },

  /**
   * Update system setting
   */
  updateSystemSetting: async (settingKey: string, value: any): Promise<SystemSetting> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/config/system-settings/${settingKey}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });
  },

  /**
   * Get integration settings
   */
  getIntegrationSettings: async (): Promise<any> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/config/integrations`);
  },

  /**
   * Update integration setting
   */
  updateIntegrationSetting: async (integrationKey: string, settings: any): Promise<any> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/config/integrations/${integrationKey}`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },
};

/**
 * Role Management API functions
 */
export const roleManagementApi = {
  /**
   * Get roles
   */
  getRoles: async (): Promise<RoleDefinition[]> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/roles`);
  },

  /**
   * Get role by ID
   */
  getRoleById: async (roleId: string): Promise<RoleDefinition> => {
    return fetchWithAuth(`/roles/${roleId}`);
  },

  /**
   * Create or update role
   */
  createOrUpdateRole: async (roleData: Partial<RoleDefinition>): Promise<RoleDefinition> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/roles`, {
      method: 'POST',
      body: JSON.stringify(roleData),
    });
  },

  /**
   * Publish role
   */
  publishRole: async (roleId: string, version: number): Promise<void> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/roles/publish`, {
      method: 'POST',
      body: JSON.stringify({ id: roleId, version }),
    });
  },

  /**
   * Get dashboards
   */
  getDashboards: async (): Promise<DashboardDefinition[]> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/dashboards`);
  },

  /**
   * Create or update dashboard
   */
  createOrUpdateDashboard: async (dashboardData: Partial<DashboardDefinition>): Promise<DashboardDefinition> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/dashboards`, {
      method: 'POST',
      body: JSON.stringify(dashboardData),
    });
  },

  /**
   * Publish dashboard
   */
  publishDashboard: async (roleId: string, version: number): Promise<void> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/dashboards/publish`, {
      method: 'POST',
      body: JSON.stringify({ role_id: roleId, version }),
    });
  },

  /**
   * Delete role
   */
  deleteRole: async (roleId: string): Promise<void> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/roles/${roleId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Toggle role active status
   */
  toggleRoleActive: async (roleId: string, active: boolean): Promise<RoleDefinition> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/roles/${roleId}/toggle`, {
      method: 'PUT',
      body: JSON.stringify({ active }),
    });
  },

  /**
   * Clone role
   */
  cloneRole: async (roleId: string, newRoleId: string, newLabel: string): Promise<RoleDefinition> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/roles/${roleId}/clone`, {
      method: 'POST',
      body: JSON.stringify({ newRoleId, newLabel }),
    });
  },

  /**
   * Get all roles (alias for getRoles)
   */
  getAllRoles: async (): Promise<RoleDefinition[]> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/roles`);
  },

  /**
   * Assign role to user
   */
  assignRoleToUser: async (userId: string, roleId: string): Promise<void> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ roleId }),
    });
  },

  /**
   * Get users by role
   */
  getUsersByRole: async (roleId: string): Promise<User[]> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/roles/${roleId}/users`);
  },

  /**
   * Get capabilities catalog (comprehensive)
   */
  getCapabilitiesCatalog: async (): Promise<any[]> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/catalog/capabilities`);
  },

  /**
   * Get scopes catalog (comprehensive)
   */
  getScopesCatalog: async (): Promise<any> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/catalog/scopes`);
  },

  /**
   * Get data keys catalog
   */
  getDataKeysCatalog: async (): Promise<any[]> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/catalog/data-keys`);
  },

  /**
   * Preview data for a data key
   */
  previewData: async (dataKey: string, params: Record<string, any> = {}): Promise<any> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/preview`, {
      method: 'POST',
      body: JSON.stringify({ dataKey, params }),
    });
  },
};

/**
 * Dashboard Stats API functions
 */
export const dashboardStatsApi = {
  /**
   * Get dashboard statistics
   */
  getDashboardStats: async (): Promise<DashboardStats> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/dashboard/stats`);
  },

  /**
   * Get recent activity
   */
  getRecentActivity: async (limit: number = 10): Promise<ActivityEntry[]> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/dashboard/recent-activity?limit=${limit}`);
  },

  /**
   * Get pending approvals count
   */
  getPendingApprovalsCount: async (): Promise<number> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/dashboard/pending-approvals`);
  },
};



/**
 * Reporting API functions
 */
export const reportingApi = {
  /**
   * Get report templates
   */
  getReportTemplates: async (): Promise<ReportTemplate[]> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/reporting/templates`);
  },

  /**
   * Get report template by ID
   */
  getReportTemplate: async (templateId: string): Promise<ReportTemplate> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/reporting/templates/${templateId}`);
  },

  /**
   * Create report template
   */
  createReportTemplate: async (templateData: Partial<ReportTemplate>): Promise<ReportTemplate> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/reporting/templates`, {
      method: 'POST',
      body: JSON.stringify(templateData),
    });
  },

  /**
   * Update report template
   */
  updateReportTemplate: async (templateId: string, templateData: Partial<ReportTemplate>): Promise<ReportTemplate> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/reporting/templates/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(templateData),
    });
  },

  /**
   * Delete report template
   */
  deleteReportTemplate: async (templateId: string): Promise<void> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/reporting/templates/${templateId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get scheduled reports
   */
  getScheduledReports: async (): Promise<ScheduledReport[]> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/reporting/scheduled`);
  },

  /**
   * Schedule a report
   */
  scheduleReport: async (scheduleData: Partial<ScheduledReport>): Promise<ScheduledReport> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/reporting/schedule`, {
      method: 'POST',
      body: JSON.stringify(scheduleData),
    });
  },

  /**
   * Update scheduled report
   */
  updateScheduledReport: async (scheduleId: string, scheduleData: Partial<ScheduledReport>): Promise<ScheduledReport> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/reporting/scheduled/${scheduleId}`, {
      method: 'PUT',
      body: JSON.stringify(scheduleData),
    });
  },

  /**
   * Delete scheduled report
   */
  deleteScheduledReport: async (scheduleId: string): Promise<void> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/reporting/scheduled/${scheduleId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Generate report from template
   */
  generateReport: async (templateId: string, format: 'pdf' | 'excel' | 'csv' = 'pdf'): Promise<Blob> => {
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000/api'}${ADMIN_API_BASE}/reporting/generate/${templateId}?format=${format}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.blob();
  },

  /**
   * Get report analytics
   */
  getReportAnalytics: async (): Promise<ReportData[]> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/reporting/analytics`);
  },

  /**
   * Get report data by ID
   */
  getReportData: async (reportId: string): Promise<ReportData> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/reporting/data/${reportId}`);
  },

  /**
   * Download generated report
   */
  downloadReport: async (reportId: string): Promise<Blob> => {
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000/api'}${ADMIN_API_BASE}/reporting/download/${reportId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.blob();
  },

  /**
   * Get available data sources
   */
  getDataSources: async (): Promise<Array<{ key: string; label: string; type: string; fields: string[] }>> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/reporting/data-sources`);
  },

  /**
   * Preview report data
   */
  previewReportData: async (config: ReportConfig): Promise<any> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/reporting/preview`, {
      method: 'POST',
      body: JSON.stringify(config),
    });
  },

  /**
   * Export report templates
   */
  exportTemplates: async (format: 'csv' | 'excel' = 'csv'): Promise<Blob> => {
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000/api'}${ADMIN_API_BASE}/reporting/templates/export?format=${format}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.blob();
  },
};

/**
 * Security Center API functions
 */
export const securityApi = {
  /**
   * Get threat indicators
   */
  getThreatIndicators: async (): Promise<ThreatIndicator[]> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/security/threats`);
  },

  /**
   * Get security policies
   */
  getSecurityPolicies: async (): Promise<SecurityPolicy[]> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/security/policies`);
  },

  /**
   * Create security policy
   */
  createSecurityPolicy: async (policyData: Partial<SecurityPolicy>): Promise<SecurityPolicy> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/security/policies`, {
      method: 'POST',
      body: JSON.stringify(policyData),
    });
  },

  /**
   * Update security policy
   */
  updateSecurityPolicy: async (policyId: string, policyData: Partial<SecurityPolicy>): Promise<SecurityPolicy> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/security/policies/${policyId}`, {
      method: 'PUT',
      body: JSON.stringify(policyData),
    });
  },

  /**
   * Get access patterns
   */
  getAccessPatterns: async (): Promise<AccessPattern[]> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/security/access-patterns`);
  },

  /**
   * Get security incidents
   */
  getSecurityIncidents: async (): Promise<SecurityEvent[]> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/security/incidents`);
  },

  /**
   * Respond to security incident
   */
  respondToIncident: async (incidentId: string, response: string): Promise<void> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/security/incidents/${incidentId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ response }),
    });
  },

  /**
   * Flag security event
   */
  flagSecurityEvent: async (eventId: string, flagData: { flagged: boolean; notes?: string }): Promise<void> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/security/events/${eventId}/flag`, {
      method: 'POST',
      body: JSON.stringify(flagData),
    });
  },

  /**
   * Get compliance status
   */
  getComplianceStatus: async (): Promise<any> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/security/compliance`);
  },

  /**
   * Run security scan
   */
  runSecurityScan: async (): Promise<any> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/security/scan`, {
      method: 'POST',
    });
  },

  /**
   * Get security analytics
   */
  getSecurityAnalytics: async (): Promise<any> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/security/analytics`);
  },
};

/**
 * System Administration API functions
 */
export const systemApi = {
  /**
   * Get system metrics
   */
  getSystemMetrics: async (): Promise<SystemMetric[]> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/system/metrics`);
  },

  /**
   * Get log entries
   */
  getLogEntries: async (): Promise<LogEntry[]> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/system/logs`);
  },

  /**
   * Get server statuses
   */
  getServerStatuses: async (): Promise<ServerStatus[]> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/system/servers`);
  },

  /**
   * Get maintenance windows
   */
  getMaintenanceWindows: async (): Promise<MaintenanceWindow[]> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/system/maintenance`);
  },

  /**
   * Create maintenance window
   */
  createMaintenanceWindow: async (windowData: Partial<MaintenanceWindow>): Promise<MaintenanceWindow> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/system/maintenance`, {
      method: 'POST',
      body: JSON.stringify(windowData),
    });
  },

  /**
   * Rotate logs
   */
  rotateLogs: async (): Promise<void> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/system/logs/rotate`, {
      method: 'POST',
    });
  },

  /**
   * Clear cache
   */
  clearCache: async (): Promise<void> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/system/cache/clear`, {
      method: 'POST',
    });
  },

  /**
   * Archive log entry
   */
  archiveLogEntry: async (logId: string): Promise<void> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/system/logs/${logId}/archive`, {
      method: 'POST',
    });
  },

  /**
   * Get system health summary
   */
  getSystemHealthSummary: async (): Promise<any> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/system/health`);
  },

  /**
   * Restart service
   */
  restartService: async (serviceName: string): Promise<void> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/system/services/${serviceName}/restart`, {
      method: 'POST',
    });
  },

  /**
   * Get system performance analytics
   */
  getPerformanceAnalytics: async (): Promise<any> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/system/performance`);
  },
};

/**
 * Executive Dashboard API functions
 */
export const executiveDashboardApi = {
  /**
   * Get complete executive dashboard data
   */
  getDashboardData: async (): Promise<any> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/executive/dashboard`);
  },

  /**
   * Get executive KPIs
   */
  getExecutiveKPIs: async (): Promise<any> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/executive/kpis`);
  },

  /**
   * Get financial summary
   */
  getFinancialSummary: async (): Promise<any> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/executive/financial`);
  },

  /**
   * Get program performance data
   */
  getProgramPerformance: async (): Promise<any> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/executive/programs`);
  },

  /**
   * Get strategic initiatives
   */
  getStrategicInitiatives: async (): Promise<any> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/executive/initiatives`);
  },

  /**
   * Get executive alerts
   */
  getExecutiveAlerts: async (): Promise<any> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/executive/alerts`);
  },

  /**
   * Get trend data
   */
  getTrends: async (): Promise<any> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/executive/trends`);
  },

  /**
   * Get dashboard summary
   */
  getDashboardSummary: async (): Promise<any> => {
    return fetchWithAuth(`${ADMIN_API_BASE}/executive/summary`);
  },

  /**
   * Export dashboard data
   */
  exportDashboardData: async (format: string = 'json'): Promise<Blob> => {
    const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000/api'}${ADMIN_API_BASE}/executive/export?format=${format}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.blob();
  },
};

/**
 * Knowledge Management API functions
 */
export const knowledgeManagementApi = {
  /**
   * Document Management
   */
  documents: {
    /**
     * Get all documents with filtering and pagination
     */
    getAll: async (filters: any = {}): Promise<any> => {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
      const queryString = queryParams.toString();
      const url = queryString ? `/knowledge/documents?${queryString}` : '/knowledge/documents';
      return fetchWithAuth(url);
    },

    /**
     * Get document by ID
     */
    getById: async (documentId: string): Promise<any> => {
      return fetchWithAuth(`/knowledge/documents/${documentId}`);
    },

    /**
     * Create new document
     */
    create: async (documentData: any): Promise<any> => {
      return fetchWithAuth('/knowledge/documents', {
        method: 'POST',
        body: JSON.stringify(documentData),
      });
    },

    /**
     * Update document
     */
    update: async (documentId: string, documentData: any): Promise<any> => {
      return fetchWithAuth(`/knowledge/documents/${documentId}`, {
        method: 'PUT',
        body: JSON.stringify(documentData),
      });
    },

    /**
     * Delete document
     */
    delete: async (documentId: string): Promise<void> => {
      return fetchWithAuth(`/knowledge/documents/${documentId}`, {
        method: 'DELETE',
      });
    },

    /**
     * Download document file
     */
    download: async (documentId: string): Promise<Blob> => {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000/api'}/knowledge/documents/${documentId}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.blob();
    },

    /**
     * Get popular documents
     */
    getPopular: async (limit?: number): Promise<any> => {
      const url = limit ? `/knowledge/documents/popular?limit=${limit}` : '/knowledge/documents/popular';
      return fetchWithAuth(url);
    },

    /**
     * Get recent documents
     */
    getRecent: async (limit?: number): Promise<any> => {
      const url = limit ? `/knowledge/documents/recent?limit=${limit}` : '/knowledge/documents/recent';
      return fetchWithAuth(url);
    },

    /**
     * Get document statistics
     */
    getStatistics: async (): Promise<any> => {
      return fetchWithAuth('/knowledge/documents/statistics');
    },

    /**
     * Get document categories
     */
    getCategories: async (): Promise<any> => {
      return fetchWithAuth('/knowledge/documents/categories');
    },

    /**
     * Get document tags
     */
    getTags: async (): Promise<any> => {
      return fetchWithAuth('/knowledge/documents/tags');
    },

    /**
     * Bulk update document status
     */
    bulkUpdateStatus: async (documentIds: string[], status: string): Promise<any> => {
      return fetchWithAuth('/knowledge/documents/bulk-status', {
        method: 'POST',
        body: JSON.stringify({ documentIds, status }),
      });
    },
  },

  /**
   * Training Modules Management
   */
  modules: {
    /**
     * Get all training modules with filtering and pagination
     */
    getAll: async (filters: any = {}): Promise<any> => {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
      const queryString = queryParams.toString();
      const url = queryString ? `/knowledge/modules?${queryString}` : '/knowledge/modules';
      return fetchWithAuth(url);
    },

    /**
     * Get module by ID
     */
    getById: async (moduleId: string): Promise<any> => {
      return fetchWithAuth(`/knowledge/modules/${moduleId}`);
    },

    /**
     * Create new training module
     */
    create: async (moduleData: any): Promise<any> => {
      return fetchWithAuth('/knowledge/modules', {
        method: 'POST',
        body: JSON.stringify(moduleData),
      });
    },

    /**
     * Update training module
     */
    update: async (moduleId: string, moduleData: any): Promise<any> => {
      return fetchWithAuth(`/knowledge/modules/${moduleId}`, {
        method: 'PUT',
        body: JSON.stringify(moduleData),
      });
    },

    /**
     * Delete training module
     */
    delete: async (moduleId: string): Promise<void> => {
      return fetchWithAuth(`/knowledge/modules/${moduleId}`, {
        method: 'DELETE',
      });
    },

    /**
     * Enroll in training module
     */
    enroll: async (moduleId: string): Promise<any> => {
      return fetchWithAuth(`/knowledge/modules/${moduleId}/enroll`, {
        method: 'POST',
      });
    },

    /**
     * Get popular modules
     */
    getPopular: async (limit?: number): Promise<any> => {
      const url = limit ? `/knowledge/modules/popular?limit=${limit}` : '/knowledge/modules/popular';
      return fetchWithAuth(url);
    },

    /**
     * Get recent modules
     */
    getRecent: async (limit?: number): Promise<any> => {
      const url = limit ? `/knowledge/modules/recent?limit=${limit}` : '/knowledge/modules/recent';
      return fetchWithAuth(url);
    },

    /**
     * Get module statistics
     */
    getStatistics: async (): Promise<any> => {
      return fetchWithAuth('/knowledge/modules/statistics');
    },

    /**
     * Get module categories
     */
    getCategories: async (): Promise<any> => {
      return fetchWithAuth('/knowledge/modules/categories');
    },

    /**
     * Get module tags
     */
    getTags: async (): Promise<any> => {
      return fetchWithAuth('/knowledge/modules/tags');
    },

    /**
     * Bulk update module status
     */
    bulkUpdateStatus: async (moduleIds: string[], status: string): Promise<any> => {
      return fetchWithAuth('/knowledge/modules/bulk-status', {
        method: 'POST',
        body: JSON.stringify({ moduleIds, status }),
      });
    },
  },
};

/**
 * Combined Admin API object
 */
export const adminApi = {
  systemHealth: systemHealthApi,
  users: userManagementApi,
  organizations: organizationManagementApi,
  audit: auditApi,
  configuration: configurationApi,
  roles: roleManagementApi,
  stats: dashboardStatsApi,
  reporting: reportingApi,
  security: securityApi,
  system: systemApi,
  executive: executiveDashboardApi,
  knowledge: knowledgeManagementApi,
};

export default adminApi;
