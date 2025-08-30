import api from './api';

export interface ComplianceDashboardData {
  recentAuditLogs: any[];
  recentDocuments: any[];
  complianceStats: {
    totalAuditLogs: number;
    budgetActions: {
      create: number;
      update: number;
      delete: number;
      submit: number;
      approve: number;
    };
    documentStats: {
      total: number;
      versioned: number;
      percentageVersioned: string;
    };
  };
  upcomingDeadlines: {
    id: number;
    title: string;
    dueDate: string;
    status: string;
  }[];
}

export interface ComplianceAlert {
  id: number;
  type: string;
  title: string;
  description: string;
  severity: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
}

export interface AlertHistoryItem {
  id: number;
  type: string;
  title: string;
  description: string;
  severity: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
  resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
}

// Get compliance dashboard data
export const getComplianceDashboard = async (): Promise<ComplianceDashboardData> => {
  try {
    const response = await api.fetchWithAuth('/compliance/dashboard');
    return response;
  } catch (error) {
    console.error('Error fetching compliance dashboard data:', error);
    throw error;
  }
};

// Get audit logs for compliance review
export const getAuditLogsForCompliance = async (params?: {
  page?: number;
  limit?: number;
  start_date?: string;
  end_date?: string;
  action?: string;
}): Promise<any> => {
  try {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const response = await api.fetchWithAuth(`/compliance/audit-logs?${queryParams.toString()}`);
    return response;
  } catch (error) {
    console.error('Error fetching audit logs for compliance:', error);
    throw error;
  }
};

// Get documents for compliance review
export const getDocumentsForCompliance = async (params?: {
  page?: number;
  limit?: number;
  entity_type?: string;
}): Promise<any> => {
  try {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const response = await api.fetchWithAuth(`/compliance/documents?${queryParams.toString()}`);
    return response;
  } catch (error) {
    console.error('Error fetching documents for compliance:', error);
    throw error;
  }
};

// Get compliance alerts
export const getComplianceAlerts = async (): Promise<ComplianceAlert[]> => {
  try {
    const response = await api.fetchWithAuth('/compliance/alerts');
    return response;
  } catch (error) {
    console.error('Error fetching compliance alerts:', error);
    throw error;
  }
};

// Get alert history
export const getAlertHistory = async (limit?: number): Promise<AlertHistoryItem[]> => {
  try {
    const queryParams = new URLSearchParams();
    if (limit) {
      queryParams.append('limit', limit.toString());
    }
    
    const response = await api.fetchWithAuth(`/compliance/alerts/history?${queryParams.toString()}`);
    return response;
  } catch (error) {
    console.error('Error fetching alert history:', error);
    throw error;
  }
};

// Resolve an alert
export const resolveAlert = async (alertId: number): Promise<any> => {
  try {
    const response = await api.fetchWithAuth(`/compliance/alerts/${alertId}/resolve`, {
      method: 'PUT'
    });
    return response;
  } catch (error) {
    console.error('Error resolving alert:', error);
    throw error;
  }
};

// Get audit log trends (for chart)
export const getAuditLogTrends = async (days: number = 30): Promise<any> => {
  try {
    const response = await api.fetchWithAuth(`/compliance/audit-logs/trends?days=${days}`);
    return response;
  } catch (error) {
    console.error('Error fetching audit log trends:', error);
    throw error;
  }
};

// Get document version history
export const getDocumentVersionHistory = async (entityType: string, entityId: string): Promise<any> => {
  try {
    const response = await api.fetchWithAuth(`/compliance/documents/${entityType}/${entityId}/versions`);
    return response;
  } catch (error) {
    console.error('Error fetching document version history:', error);
    throw error;
  }
};

// Get all compliance document templates
export const getComplianceDocumentTemplates = async (): Promise<any> => {
  try {
    const response = await api.fetchWithAuth('/compliance-document-templates');
    return response;
  } catch (error) {
    console.error('Error fetching compliance document templates:', error);
    throw error;
  }
};

// Get a specific compliance document template by ID
export const getComplianceDocumentTemplate = async (templateId: string): Promise<any> => {
  try {
    const response = await api.fetchWithAuth(`/compliance-document-templates/${templateId}`);
    return response;
  } catch (error) {
    console.error('Error fetching compliance document template:', error);
    throw error;
  }
};

// Create a new compliance document template
export const createComplianceDocumentTemplate = async (templateData: any): Promise<any> => {
  try {
    const response = await api.fetchWithAuth('/compliance-document-templates', {
      method: 'POST',
      body: JSON.stringify(templateData)
    });
    return response;
  } catch (error) {
    console.error('Error creating compliance document template:', error);
    throw error;
  }
};

// Update a compliance document template
export const updateComplianceDocumentTemplate = async (templateId: string, templateData: any): Promise<any> => {
  try {
    const response = await api.fetchWithAuth(`/compliance-document-templates/${templateId}`, {
      method: 'PUT',
      body: JSON.stringify(templateData)
    });
    return response;
  } catch (error) {
    console.error('Error updating compliance document template:', error);
    throw error;
  }
};

// Delete a compliance document template
export const deleteComplianceDocumentTemplate = async (templateId: string): Promise<any> => {
  try {
    const response = await api.fetchWithAuth(`/compliance-document-templates/${templateId}`, {
      method: 'DELETE'
    });
    return response;
  } catch (error) {
    console.error('Error deleting compliance document template:', error);
    throw error;
  }
};

// Review a compliance document
export const reviewComplianceDocument = async (complianceDocId: string, reviewData: { review_status: string, review_comments: string }): Promise<any> => {
  try {
    const response = await api.fetchWithAuth(`/compliance-documentation/documents/${complianceDocId}/review`, {
      method: 'PUT',
      body: JSON.stringify(reviewData)
    });
    return response;
  } catch (error) {
    console.error('Error reviewing compliance document:', error);
    throw error;
  }
};

// Get expired compliance documents for an organization
export const getExpiredDocuments = async (organizationId: string): Promise<any> => {
  try {
    const response = await api.fetchWithAuth(`/compliance-documentation/organizations/${organizationId}/expired-documents`);
    return response;
  } catch (error) {
    console.error('Error fetching expired compliance documents:', error);
    throw error;
  }
};

// Search and filter compliance documents
export const searchComplianceDocuments = async (params?: {
  organizationId?: string;
  documentTypeId?: string;
  status?: string;
  reviewStatus?: string;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
}): Promise<any> => {
  try {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const response = await api.fetchWithAuth(`/compliance-documentation/documents/search?${queryParams.toString()}`);
    return response;
  } catch (error) {
    console.error('Error searching compliance documents:', error);
    throw error;
  }
};

// Get compliance document status report
export const getComplianceDocumentStatusReport = async (): Promise<any> => {
  try {
    const response = await api.fetchWithAuth('/compliance/reports/document-status');
    return response;
  } catch (error) {
    console.error('Error fetching compliance document status report:', error);
    throw error;
  }
};

// Get compliance document type report
export const getComplianceDocumentTypeReport = async (): Promise<any> => {
  try {
    const response = await api.fetchWithAuth('/compliance/reports/document-type');
    return response;
  } catch (error) {
    console.error('Error fetching compliance document type report:', error);
    throw error;
  }
};

// Get compliance document organization report
export const getComplianceDocumentOrganizationReport = async (): Promise<any> => {
  try {
    const response = await api.fetchWithAuth('/compliance/reports/document-organization');
    return response;
  } catch (error) {
    console.error('Error fetching compliance document organization report:', error);
    throw error;
  }
};