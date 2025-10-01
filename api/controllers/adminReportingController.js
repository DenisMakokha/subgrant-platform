const db = require('../config/database');
const { logApiCall, logError } = require('../services/observabilityService');

/**
 * Get report templates
 */
exports.getReportTemplates = async (req, res) => {
  const startTime = Date.now();
  try {
    // For now, return mock report templates
    // In a real implementation, this would query a report_templates table
    const mockTemplates = [
      {
        id: 'template-1',
        name: 'Monthly Financial Summary',
        type: 'financial',
        category: 'Finance',
        description: 'Comprehensive monthly financial overview',
        dataSources: ['budgets', 'disbursements', 'contracts'],
        filters: { dateRange: 'monthly' },
        groupBy: ['organization', 'project'],
        aggregations: { total: 'sum', count: 'count' },
        visualizations: ['bar_chart', 'pie_chart'],
        isActive: true,
        createdBy: 'admin@example.com',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        lastGenerated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        generationCount: 15,
      },
      {
        id: 'template-2',
        name: 'User Activity Report',
        type: 'operational',
        category: 'Operations',
        description: 'User login and activity tracking',
        dataSources: ['users', 'audit_logs'],
        filters: { activityType: 'login' },
        groupBy: ['user', 'date'],
        aggregations: { logins: 'count', uniqueUsers: 'distinct_count' },
        visualizations: ['line_chart', 'table'],
        isActive: true,
        createdBy: 'admin@example.com',
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        lastGenerated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        generationCount: 8,
      },
      {
        id: 'template-3',
        name: 'Compliance Audit Report',
        type: 'compliance',
        category: 'Compliance',
        description: 'Security and compliance audit summary',
        dataSources: ['audit_logs', 'security_events'],
        filters: { severity: 'high' },
        groupBy: ['event_type', 'date'],
        aggregations: { incidents: 'count', affectedUsers: 'distinct_count' },
        visualizations: ['table', 'alert_summary'],
        isActive: true,
        createdBy: 'admin@example.com',
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        lastGenerated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        generationCount: 5,
      },
    ];

    logApiCall('GET', '/admin/reporting/templates', 200, Date.now() - startTime, req.user?.id);
    res.json(mockTemplates);
  } catch (error) {
    logError(error, 'getReportTemplates', { userId: req.user?.id });
    logApiCall('GET', '/admin/reporting/templates', 500, Date.now() - startTime, req.user?.id);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get report template by ID
 */
exports.getReportTemplate = async (req, res) => {
  const startTime = Date.now();
  try {
    const { templateId } = req.params;

    // Mock template data
    const template = {
      id: templateId,
      name: `Report Template ${templateId}`,
      type: 'operational',
      category: 'Operations',
      description: 'Sample report template',
      dataSources: ['users', 'projects'],
      filters: {},
      groupBy: ['organization'],
      aggregations: { count: 'sum' },
      visualizations: ['table'],
      isActive: true,
      createdBy: 'admin@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
      generationCount: 0,
    };

    logApiCall('GET', `/admin/reporting/templates/${templateId}`, 200, Date.now() - startTime, req.user?.id);
    res.json(template);
  } catch (error) {
    logError(error, 'getReportTemplate', { userId: req.user?.id, templateId: req.params.templateId });
    logApiCall('GET', `/admin/reporting/templates/${req.params.templateId}`, 500, Date.now() - startTime, req.user?.id);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Create report template
 */
exports.createReportTemplate = async (req, res) => {
  const startTime = Date.now();
  try {
    const templateData = req.body;

    // In a real implementation, this would insert into report_templates table
    const newTemplate = {
      id: `template-${Date.now()}`,
      ...templateData,
      createdBy: req.user?.email || 'admin@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
      generationCount: 0,
    };

    logApiCall('POST', '/admin/reporting/templates', 201, Date.now() - startTime, req.user?.id);
    res.status(201).json(newTemplate);
  } catch (error) {
    logError(error, 'createReportTemplate', { userId: req.user?.id });
    logApiCall('POST', '/admin/reporting/templates', 500, Date.now() - startTime, req.user?.id);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update report template
 */
exports.updateReportTemplate = async (req, res) => {
  const startTime = Date.now();
  try {
    const { templateId } = req.params;
    const templateData = req.body;

    // In a real implementation, this would update the report_templates table
    const updatedTemplate = {
      id: templateId,
      ...templateData,
      updatedAt: new Date(),
    };

    logApiCall('PUT', `/admin/reporting/templates/${templateId}`, 200, Date.now() - startTime, req.user?.id);
    res.json(updatedTemplate);
  } catch (error) {
    logError(error, 'updateReportTemplate', { userId: req.user?.id, templateId: req.params.templateId });
    logApiCall('PUT', `/admin/reporting/templates/${req.params.templateId}`, 500, Date.now() - startTime, req.user?.id);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete report template
 */
exports.deleteReportTemplate = async (req, res) => {
  const startTime = Date.now();
  try {
    const { templateId } = req.params;

    // In a real implementation, this would delete from report_templates table
    logApiCall('DELETE', `/admin/reporting/templates/${templateId}`, 200, Date.now() - startTime, req.user?.id);
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    logError(error, 'deleteReportTemplate', { userId: req.user?.id, templateId: req.params.templateId });
    logApiCall('DELETE', `/admin/reporting/templates/${req.params.templateId}`, 500, Date.now() - startTime, req.user?.id);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get scheduled reports
 */
exports.getScheduledReports = async (req, res) => {
  const startTime = Date.now();
  try {
    // Mock scheduled reports data
    const mockScheduledReports = [
      {
        id: 'schedule-1',
        templateId: 'template-1',
        templateName: 'Monthly Financial Summary',
        frequency: 'monthly',
        nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
        lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last week
        recipients: ['admin@example.com', 'finance@example.com'],
        format: 'pdf',
        isActive: true,
        createdBy: 'admin@example.com',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        config: {
          templateId: 'template-1',
          parameters: {},
          filters: { dateRange: 'last_month' },
          format: 'pdf',
          includeCharts: true,
          includeRawData: false,
        },
      },
      {
        id: 'schedule-2',
        templateId: 'template-2',
        templateName: 'User Activity Report',
        frequency: 'weekly',
        nextRun: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // In 2 days
        lastRun: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        recipients: ['admin@example.com'],
        format: 'excel',
        isActive: true,
        createdBy: 'admin@example.com',
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        config: {
          templateId: 'template-2',
          parameters: {},
          filters: { activityType: 'login' },
          format: 'excel',
          includeCharts: false,
          includeRawData: true,
        },
      },
    ];

    logApiCall('GET', '/admin/reporting/scheduled', 200, Date.now() - startTime, req.user?.id);
    res.json(mockScheduledReports);
  } catch (error) {
    logError(error, 'getScheduledReports', { userId: req.user?.id });
    logApiCall('GET', '/admin/reporting/scheduled', 500, Date.now() - startTime, req.user?.id);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Schedule a report
 */
exports.scheduleReport = async (req, res) => {
  const startTime = Date.now();
  try {
    const scheduleData = req.body;

    // In a real implementation, this would insert into scheduled_reports table
    const newSchedule = {
      id: `schedule-${Date.now()}`,
      ...scheduleData,
      nextRun: calculateNextRun(scheduleData.frequency),
      createdBy: req.user?.email || 'admin@example.com',
      createdAt: new Date(),
    };

    logApiCall('POST', '/admin/reporting/schedule', 201, Date.now() - startTime, req.user?.id);
    res.status(201).json(newSchedule);
  } catch (error) {
    logError(error, 'scheduleReport', { userId: req.user?.id });
    logApiCall('POST', '/admin/reporting/schedule', 500, Date.now() - startTime, req.user?.id);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Generate report from template
 */
exports.generateReport = async (req, res) => {
  const startTime = Date.now();
  try {
    const { templateId } = req.params;
    const format = req.query.format || 'pdf';

    // Generate mock report content based on format
    const reportContent = generateMockReportContent(templateId, format);

    res.setHeader('Content-Type', getContentType(format));
    res.setHeader('Content-Disposition', `attachment; filename="report-${templateId}.${format}"`);
    res.send(reportContent);

    logApiCall('GET', `/admin/reporting/generate/${templateId}?format=${format}`, 200, Date.now() - startTime, req.user?.id);
  } catch (error) {
    logError(error, 'generateReport', { userId: req.user?.id, templateId: req.params.templateId });
    logApiCall('GET', `/admin/reporting/generate/${req.params.templateId}`, 500, Date.now() - startTime, req.user?.id);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get report analytics
 */
exports.getReportAnalytics = async (req, res) => {
  const startTime = Date.now();
  try {
    // Mock report analytics data
    const mockAnalytics = [
      {
        id: 'report-1',
        templateId: 'template-1',
        templateName: 'Monthly Financial Summary',
        generatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        generatedBy: 'admin@example.com',
        format: 'pdf',
        fileSize: 245760, // 240KB
        recordCount: 150,
        downloadUrl: `/api/admin/reporting/download/report-1`,
        status: 'completed',
      },
      {
        id: 'report-2',
        templateId: 'template-2',
        templateName: 'User Activity Report',
        generatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        generatedBy: 'admin@example.com',
        format: 'excel',
        fileSize: 51200, // 50KB
        recordCount: 89,
        downloadUrl: `/api/admin/reporting/download/report-2`,
        status: 'completed',
      },
    ];

    logApiCall('GET', '/admin/reporting/analytics', 200, Date.now() - startTime, req.user?.id);
    res.json(mockAnalytics);
  } catch (error) {
    logError(error, 'getReportAnalytics', { userId: req.user?.id });
    logApiCall('GET', '/admin/reporting/analytics', 500, Date.now() - startTime, req.user?.id);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get available data sources
 */
exports.getDataSources = async (req, res) => {
  const startTime = Date.now();
  try {
    const dataSources = [
      {
        key: 'users',
        label: 'User Data',
        type: 'table',
        fields: ['id', 'email', 'firstName', 'lastName', 'role', 'isActive', 'createdAt', 'lastLogin'],
      },
      {
        key: 'organizations',
        label: 'Organization Data',
        type: 'table',
        fields: ['id', 'name', 'legalName', 'type', 'status', 'createdAt', 'userCount', 'projectCount'],
      },
      {
        key: 'projects',
        label: 'Project Data',
        type: 'table',
        fields: ['id', 'name', 'status', 'budget', 'organizationId', 'createdAt', 'updatedAt'],
      },
      {
        key: 'budgets',
        label: 'Budget Data',
        type: 'table',
        fields: ['id', 'projectId', 'amount', 'status', 'approvedAt', 'createdAt'],
      },
      {
        key: 'contracts',
        label: 'Contract Data',
        type: 'table',
        fields: ['id', 'projectId', 'status', 'amount', 'signedAt', 'expiresAt'],
      },
      {
        key: 'audit_logs',
        label: 'Audit Logs',
        type: 'table',
        fields: ['id', 'timestamp', 'userId', 'action', 'entityType', 'entityId', 'details'],
      },
    ];

    logApiCall('GET', '/admin/reporting/data-sources', 200, Date.now() - startTime, req.user?.id);
    res.json(dataSources);
  } catch (error) {
    logError(error, 'getDataSources', { userId: req.user?.id });
    logApiCall('GET', '/admin/reporting/data-sources', 500, Date.now() - startTime, req.user?.id);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Preview report data
 */
exports.previewReportData = async (req, res) => {
  const startTime = Date.now();
  try {
    const config = req.body;

    // Generate mock preview data based on config
    const previewData = {
      columns: ['Name', 'Type', 'Status', 'Created At'],
      rows: [
        ['Sample Project 1', 'Research', 'Active', '2024-01-15'],
        ['Sample Project 2', 'Development', 'Active', '2024-02-20'],
        ['Sample Project 3', 'Training', 'Completed', '2024-03-10'],
      ],
      totalRecords: 3,
      estimatedSize: '2.5 KB',
    };

    logApiCall('POST', '/admin/reporting/preview', 200, Date.now() - startTime, req.user?.id);
    res.json(previewData);
  } catch (error) {
    logError(error, 'previewReportData', { userId: req.user?.id });
    logApiCall('POST', '/admin/reporting/preview', 500, Date.now() - startTime, req.user?.id);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Helper function to calculate next run date based on frequency
 */
function calculateNextRun(frequency) {
  const now = new Date();
  switch (frequency) {
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'monthly':
      return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
}

/**
 * Helper function to generate mock report content
 */
function generateMockReportContent(templateId, format) {
  const baseContent = `
    REPORT GENERATED FROM TEMPLATE: ${templateId.toUpperCase()}
    Generated: ${new Date().toLocaleString()}
    Format: ${format.toUpperCase()}

    Executive Summary:
    - Total Records Processed: 1,234
    - Report Generation Time: 2.3 seconds
    - Data Sources: Users, Organizations, Projects

    Sample Data:
    - Active Users: 89
    - Total Organizations: 23
    - Active Projects: 45
    - Total Budget: $2,450,000

    Detailed Findings:
    - User engagement increased by 15% this month
    - 3 new organizations onboarded
    - 12 projects completed successfully
    - Budget utilization at 78%

    Recommendations:
    - Continue current engagement strategies
    - Focus on partner training programs
    - Monitor budget spending closely

    Generated by: Sub-Grant Management Platform
    Report ID: ${templateId}
  `;

  if (format === 'pdf') {
    return `PDF Report Content\n${baseContent}`;
  } else if (format === 'excel') {
    // Convert to tab-separated values for Excel
    return `Report Data\tValue\n${baseContent.replace(/\n/g, '\t\n')}`;
  } else if (format === 'csv') {
    return `Report Data,Value\n${baseContent.replace(/\n/g, ',')}`;
  }

  return baseContent;
}

/**
 * Helper function to get content type based on format
 */
function getContentType(format) {
  switch (format) {
    case 'pdf':
      return 'application/pdf';
    case 'excel':
      return 'application/vnd.ms-excel';
    case 'csv':
      return 'text/csv';
    default:
      return 'text/plain';
  }
}
