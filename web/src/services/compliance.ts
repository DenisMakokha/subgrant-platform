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