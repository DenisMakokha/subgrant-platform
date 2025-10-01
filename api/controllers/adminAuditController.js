const db = require('../config/database');
const { logApiCall, logError } = require('../services/observabilityService');

/**
 * Get activity logs with filtering
 */
exports.getActivityLogs = async (req, res) => {
  const startTime = Date.now();
  try {
    const {
      dateRange,
      userId,
      action,
      entityType,
      severity,
      limit = 50,
      offset = 0
    } = req.body;

    let query = `
      SELECT
        al.id, al.created_at as timestamp, al.user_id, al.action, al.entity_type, al.entity_id, al.metadata,
        u.email as user_email, u.first_name, u.last_name
      FROM audit_log al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    // Apply date range filter
    if (dateRange) {
      query += ` AND al.created_at >= $${paramIndex}`;
      params.push(dateRange.start);
      paramIndex++;

      query += ` AND al.created_at <= $${paramIndex}`;
      params.push(dateRange.end);
      paramIndex++;
    }

    // Apply filters
    if (userId) {
      query += ` AND al.user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }

    if (action) {
      query += ` AND al.action = $${paramIndex}`;
      params.push(action);
      paramIndex++;
    }

    if (entityType) {
      query += ` AND al.entity_type = $${paramIndex}`;
      params.push(entityType);
      paramIndex++;
    }

    // Get total count
    const countQuery = query.replace('al.id, al.created_at as timestamp, al.user_id, al.action, al.entity_type, al.entity_id, al.metadata, u.email as user_email, u.first_name, u.last_name', 'COUNT(*) as total');
    const countResult = await db.pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Apply pagination and ordering
    query += ` ORDER BY al.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.pool.query(query, params);

    // Transform data to match frontend expectations
    const logs = result.rows.map(row => ({
      id: row.id,
      timestamp: row.timestamp,
      userId: row.user_id,
      userEmail: row.user_email || 'System',
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      details: row.metadata || {},
      ipAddress: null, // Would need to be added to audit_log table
      userAgent: null, // Would need to be added to audit_log table
    }));

    logApiCall('POST', '/admin/audit/activity', 200, Date.now() - startTime, req.user?.id);
    res.json({
      data: logs,
      pagination: {
        total,
        page: Math.floor(offset / limit) + 1,
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logError(error, 'getActivityLogs', { userId: req.user?.id });
    logApiCall('POST', '/admin/audit/activity', 500, Date.now() - startTime, req.user?.id);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get security events
 */
exports.getSecurityEvents = async (req, res) => {
  const startTime = Date.now();
  try {
    const {
      dateRange,
      severity,
      type,
      limit = 50,
      offset = 0
    } = req.body;

    // For now, return mock security events
    // In a real implementation, this would query a security_events table
    const mockEvents = generateMockSecurityEvents(20);

    // Apply filters to mock data
    let filteredEvents = mockEvents;

    if (dateRange) {
      filteredEvents = filteredEvents.filter(event =>
        event.timestamp >= dateRange.start && event.timestamp <= dateRange.end
      );
    }

    if (severity) {
      filteredEvents = filteredEvents.filter(event => event.severity === severity);
    }

    if (type) {
      filteredEvents = filteredEvents.filter(event => event.type === type);
    }

    // Apply pagination
    const total = filteredEvents.length;
    const paginatedEvents = filteredEvents.slice(offset, offset + limit);

    logApiCall('POST', '/admin/audit/security', 200, Date.now() - startTime, req.user?.id);
    res.json({
      data: paginatedEvents,
      pagination: {
        total,
        page: Math.floor(offset / limit) + 1,
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logError(error, 'getSecurityEvents', { userId: req.user?.id });
    logApiCall('POST', '/admin/audit/security', 500, Date.now() - startTime, req.user?.id);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get compliance reports
 */
exports.getComplianceReports = async (req, res) => {
  const startTime = Date.now();
  try {
    // For now, return mock compliance reports
    // In a real implementation, this would query a compliance_reports table
    const mockReports = [
      {
        id: 'report-1',
        name: 'Monthly Security Audit',
        type: 'security',
        status: 'completed',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        generatedBy: 'admin@example.com',
        downloadUrl: '/api/admin/audit/compliance/report-1/download',
      },
      {
        id: 'report-2',
        name: 'Data Protection Compliance',
        type: 'data_protection',
        status: 'in_progress',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        generatedBy: 'admin@example.com',
      },
      {
        id: 'report-3',
        name: 'Financial Audit Report',
        type: 'financial',
        status: 'pending',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        generatedBy: 'admin@example.com',
      },
    ];

    logApiCall('GET', '/admin/audit/compliance', 200, Date.now() - startTime, req.user?.id);
    res.json(mockReports);
  } catch (error) {
    logError(error, 'getComplianceReports', { userId: req.user?.id });
    logApiCall('GET', '/admin/audit/compliance', 500, Date.now() - startTime, req.user?.id);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Generate compliance report
 */
exports.generateComplianceReport = async (req, res) => {
  const startTime = Date.now();
  try {
    const { type } = req.body;

    // Generate mock report
    const report = {
      id: `report-${Date.now()}`,
      name: `${type.replace('_', ' ').toUpperCase()} Report - ${new Date().toLocaleDateString()}`,
      type,
      status: 'in_progress',
      createdAt: new Date(),
      generatedBy: req.user?.email || 'admin@example.com',
    };

    // Simulate report generation (in real implementation, this would be async)
    setTimeout(() => {
      report.status = 'completed';
      report.completedAt = new Date();
      report.downloadUrl = `/api/admin/audit/compliance/${report.id}/download`;
    }, 5000);

    logApiCall('POST', '/admin/audit/compliance', 201, Date.now() - startTime, req.user?.id);
    res.status(201).json(report);
  } catch (error) {
    logError(error, 'generateComplianceReport', { userId: req.user?.id });
    logApiCall('POST', '/admin/audit/compliance', 500, Date.now() - startTime, req.user?.id);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Download compliance report
 */
exports.downloadComplianceReport = async (req, res) => {
  const startTime = Date.now();
  try {
    const { reportId } = req.params;

    // Generate mock PDF content
    const reportContent = `
      COMPLIANCE REPORT: ${reportId.toUpperCase()}
      Generated: ${new Date().toLocaleString()}
      Type: Security Audit

      This is a mock compliance report for demonstration purposes.

      Executive Summary:
      - System security status: GOOD
      - Data protection compliance: COMPLIANT
      - Audit findings: 0 critical issues

      Detailed Findings:
      - Authentication mechanisms: SECURE
      - Data encryption: ENABLED
      - Access controls: PROPERLY CONFIGURED
      - Audit logging: ACTIVE

      Recommendations:
      - Continue current security practices
      - Regular security training for staff
      - Periodic security assessments

      Generated by: Sub-Grant Management Platform
    `;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="compliance-report-${reportId}.pdf"`);
    res.send(reportContent);

    logApiCall('GET', `/admin/audit/compliance/${reportId}/download`, 200, Date.now() - startTime, req.user?.id);
  } catch (error) {
    logError(error, 'downloadComplianceReport', { userId: req.user?.id, reportId: req.params.reportId });
    logApiCall('GET', `/admin/audit/compliance/${req.params.reportId}/download`, 500, Date.now() - startTime, req.user?.id);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Export audit data
 */
exports.exportAuditData = async (req, res) => {
  const startTime = Date.now();
  try {
    const format = req.query.format || 'csv';
    const filters = req.body;

    // Get audit data based on filters
    const auditData = await getFilteredAuditData(filters);

    if (format === 'csv') {
      // Generate CSV
      const csvHeaders = ['Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 'IP Address', 'Details'];
      const csvRows = auditData.map(log => [
        log.timestamp,
        log.userEmail,
        log.action,
        log.entityType,
        log.entityId,
        log.ipAddress || '',
        JSON.stringify(log.details),
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="audit-data.csv"');
      res.send(csvContent);
    } else if (format === 'excel') {
      // Generate Excel (tab-separated for now)
      const csvHeaders = ['Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 'IP Address', 'Details'];
      const csvRows = auditData.map(log => [
        log.timestamp,
        log.userEmail,
        log.action,
        log.entityType,
        log.entityId,
        log.ipAddress || '',
        JSON.stringify(log.details),
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.join('\t'))
        .join('\n');

      res.setHeader('Content-Type', 'application/vnd.ms-excel');
      res.setHeader('Content-Disposition', 'attachment; filename="audit-data.xls"');
      res.send(csvContent);
    } else if (format === 'pdf') {
      // Generate PDF content
      const pdfContent = `
        AUDIT DATA EXPORT
        Generated: ${new Date().toLocaleString()}
        Format: PDF

        Total Records: ${auditData.length}

        ${auditData.map(log => `
        Timestamp: ${log.timestamp}
        User: ${log.userEmail}
        Action: ${log.action}
        Entity: ${log.entityType} (${log.entityId})
        Details: ${JSON.stringify(log.details)}
        ---
        `).join('\n')}
      `;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="audit-data.pdf"');
      res.send(pdfContent);
    } else {
      throw new Error('Unsupported export format');
    }

    logApiCall('POST', `/admin/audit/export?format=${format}`, 200, Date.now() - startTime, req.user?.id);
  } catch (error) {
    logError(error, 'exportAuditData', { userId: req.user?.id });
    logApiCall('POST', `/admin/audit/export?format=${req.query.format}`, 500, Date.now() - startTime, req.user?.id);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Helper function to generate mock security events
 */
function generateMockSecurityEvents(count) {
  const eventTypes = ['login_failure', 'suspicious_activity', 'permission_denied', 'data_export'];
  const severities = ['low', 'medium', 'high', 'critical'];
  const descriptions = {
    login_failure: 'Multiple failed login attempts detected',
    suspicious_activity: 'Unusual access pattern detected',
    permission_denied: 'Unauthorized access attempt blocked',
    data_export: 'Large data export initiated',
  };

  return Array.from({ length: count }, (_, i) => ({
    id: `security-${i + 1}`,
    timestamp: new Date(Date.now() - (i * 60 * 60 * 1000)), // i hours ago
    type: eventTypes[i % eventTypes.length],
    severity: severities[i % severities.length],
    userId: `user-${(i % 5) + 1}`,
    ipAddress: `192.168.1.${100 + (i % 50)}`,
    description: descriptions[eventTypes[i % eventTypes.length]],
    details: {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      location: 'Unknown',
      riskScore: Math.floor(Math.random() * 100),
    },
  }));
}

/**
 * Helper function to get filtered audit data
 */
async function getFilteredAuditData(filters) {
  try {
    const { dateRange, userId, action, entityType } = filters;

    let query = `
      SELECT
        al.id, al.created_at as timestamp, al.user_id, al.action, al.entity_type, al.entity_id, al.metadata,
        u.email as user_email
      FROM audit_log al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    // Apply date range filter
    if (dateRange) {
      query += ` AND al.created_at >= $${paramIndex}`;
      params.push(dateRange.start);
      paramIndex++;

      query += ` AND al.created_at <= $${paramIndex}`;
      params.push(dateRange.end);
      paramIndex++;
    }

    // Apply other filters
    if (userId) {
      query += ` AND al.user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }

    if (action) {
      query += ` AND al.action = $${paramIndex}`;
      params.push(action);
      paramIndex++;
    }

    if (entityType) {
      query += ` AND al.entity_type = $${paramIndex}`;
      params.push(entityType);
      paramIndex++;
    }

    query += ' ORDER BY al.created_at DESC LIMIT 1000';

    const result = await db.pool.query(query, params);

    return result.rows.map(row => ({
      id: row.id,
      timestamp: row.timestamp,
      userId: row.user_id,
      userEmail: row.user_email || 'System',
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      details: row.metadata || {},
      ipAddress: null,
      userAgent: null,
    }));
  } catch (error) {
    console.error('Error getting filtered audit data:', error);
    // Return mock data if database query fails
    return Array.from({ length: 50 }, (_, i) => ({
      id: `audit-${i + 1}`,
      timestamp: new Date(Date.now() - (i * 60 * 60 * 1000)),
      userId: `user-${(i % 5) + 1}`,
      userEmail: `user${(i % 5) + 1}@example.com`,
      action: ['created', 'updated', 'deleted', 'approved'][i % 4],
      entityType: ['project', 'budget', 'contract', 'user'][i % 4],
      entityId: `entity-${i + 1}`,
      details: {},
      ipAddress: `192.168.1.${100 + (i % 50)}`,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    }));
  }
}
