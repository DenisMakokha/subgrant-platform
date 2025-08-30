import api from './api';

export interface AuditLog {
  id: string;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  before_state: any;
  after_state: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export interface AuditLogFilters {
  actor_id?: string;
  entity_type?: string;
  entity_id?: string;
  action?: string;
  start_date?: string;
  end_date?: string;
}

export interface AuditLogPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface AuditLogResponse {
  data: AuditLog[];
  pagination: AuditLogPagination;
}

export interface AuditLogTrend {
  date: string;
  count: number;
}

class AuditLogService {
  // Get audit logs with filters
  async getAuditLogs(filters: AuditLogFilters = {}, page: number = 1, limit: number = 50): Promise<AuditLogResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters.actor_id) params.append('actor_id', filters.actor_id);
      if (filters.entity_type) params.append('entity_type', filters.entity_type);
      if (filters.entity_id) params.append('entity_id', filters.entity_id);
      if (filters.action) params.append('action', filters.action);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      const response = await api.fetchWithAuth(`/audit-logs?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  }

  // Get audit logs for a specific entity
  async getAuditLogsForEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    try {
      const response = await api.fetchWithAuth(`/audit-logs/entity/${entityType}/${entityId}`);
      return response;
    } catch (error) {
      console.error('Error fetching audit logs for entity:', error);
      throw error;
    }
  }

  // Get audit logs for a specific user
  async getAuditLogsForUser(userId: string): Promise<AuditLog[]> {
    try {
      const response = await api.fetchWithAuth(`/audit-logs/user/${userId}`);
      return response;
    } catch (error) {
      console.error('Error fetching audit logs for user:', error);
      throw error;
    }
  }

  // Get audit logs by action type
  async getAuditLogsByAction(action: string): Promise<AuditLog[]> {
    try {
      const response = await api.fetchWithAuth(`/audit-logs/action/${action}`);
      return response;
    } catch (error) {
      console.error('Error fetching audit logs by action:', error);
      throw error;
    }
  }

  // Get recent audit logs
  async getRecentAuditLogs(limit: number = 50): Promise<AuditLog[]> {
    try {
      const response = await api.fetchWithAuth(`/audit-logs/recent?limit=${limit}`);
      return response;
    } catch (error) {
      console.error('Error fetching recent audit logs:', error);
      throw error;
    }
  }

  // Get audit log trends
  async getAuditLogTrends(days: number = 30): Promise<AuditLogTrend[]> {
    try {
      const response = await api.fetchWithAuth(`/audit-logs/trends?days=${days}`);
      return response;
    } catch (error) {
      console.error('Error fetching audit log trends:', error);
      throw error;
    }
  }

  // Export audit logs
  async exportAuditLogs(filters: AuditLogFilters = {}, format: 'json' | 'csv' = 'json'): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      
      if (filters.actor_id) params.append('actor_id', filters.actor_id);
      if (filters.entity_type) params.append('entity_type', filters.entity_type);
      if (filters.entity_id) params.append('entity_id', filters.entity_id);
      if (filters.action) params.append('action', filters.action);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      
      params.append('format', format);
      
      // For export, we need to use fetch directly to handle blob responses
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      };
      
      const response = await fetch(`http://localhost:3000/api/audit-logs/export?${params.toString()}`, {
        headers,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.blob();
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      throw error;
    }
  }
}

const auditLogService = new AuditLogService();
export default auditLogService;