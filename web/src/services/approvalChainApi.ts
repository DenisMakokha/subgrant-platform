import { fetchWithAuth } from './api';

const API_BASE = '/approval-chain';

export interface ApprovalWorkflow {
  id: string;
  name: string;
  description?: string;
  entity_type: string;
  is_active: boolean;
  step_count?: number;
  created_by?: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface ApprovalStep {
  id: string;
  workflow_id: string;
  step_order: number;
  step_name: string;
  approver_type: 'role' | 'user' | 'dynamic';
  approver_role_id?: string;
  approver_user_id?: string;
  approver_user_name?: string;
  approval_type: 'sequential' | 'parallel' | 'any_one';
  required_approvers: number;
  conditions?: any;
  escalation_hours?: number;
  escalation_to?: string;
  escalation_to_name?: string;
}

export interface ApprovalRequest {
  id: string;
  workflow_id: string;
  workflow_name?: string;
  entity_type: string;
  entity_id: string;
  current_step: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  submitted_by: string;
  submitted_by_name?: string;
  submitted_at: string;
  created_at: string;
  completed_at?: string;
  metadata?: any;
  step_name?: string;
  step_order?: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  actions?: ApprovalAction[];
}

export interface ApprovalAction {
  id: string;
  request_id: string;
  step_id: string;
  step_order: number;
  step_name?: string;
  approver_id: string;
  approver_name?: string;
  action: 'approved' | 'rejected' | 'delegated' | 'escalated' | 'info_requested';
  comments?: string;
  acted_at: string;
  delegated_to?: string;
}

export interface ApprovalDelegate {
  id: string;
  delegator_id: string;
  delegator_name?: string;
  delegate_id: string;
  delegate_name?: string;
  start_date: string;
  end_date: string;
  reason?: string;
  is_active: boolean;
}

export interface ApprovalAnalytics {
  summary: {
    total_requests: number;
    approved_count: number;
    rejected_count: number;
    pending_count: number;
    avg_hours_to_complete: number;
  };
  bottlenecks: Array<{
    step_name: string;
    step_order: number;
    request_count: number;
    avg_hours: number;
  }>;
}

const approvalChainApi = {
  // ==================== WORKFLOW MANAGEMENT ====================
  
  /**
   * Get all workflows
   */
  getWorkflows: async (params?: { entity_type?: string; is_active?: boolean }): Promise<ApprovalWorkflow[]> => {
    const query = new URLSearchParams();
    if (params?.entity_type) query.append('entity_type', params.entity_type);
    if (params?.is_active !== undefined) query.append('is_active', params.is_active.toString());
    
    return fetchWithAuth(`${API_BASE}/workflows?${query.toString()}`);
  },

  /**
   * Get workflow by ID with steps
   */
  getWorkflowById: async (id: string): Promise<ApprovalWorkflow & { steps: ApprovalStep[] }> => {
    return fetchWithAuth(`${API_BASE}/workflows/${id}`);
  },

  /**
   * Create new workflow
   */
  createWorkflow: async (data: {
    name: string;
    description?: string;
    entity_type: string;
    steps: Partial<ApprovalStep>[];
  }): Promise<ApprovalWorkflow> => {
    return fetchWithAuth(`${API_BASE}/workflows`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update workflow
   */
  updateWorkflow: async (id: string, data: {
    name?: string;
    description?: string;
    is_active?: boolean;
    steps?: Partial<ApprovalStep>[];
  }): Promise<void> => {
    return fetchWithAuth(`${API_BASE}/workflows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete workflow
   */
  deleteWorkflow: async (id: string): Promise<void> => {
    return fetchWithAuth(`${API_BASE}/workflows/${id}`, {
      method: 'DELETE',
    });
  },

  // ==================== APPROVAL REQUESTS ====================

  /**
   * Create approval request
   */
  createRequest: async (data: {
    workflow_id: string;
    entity_type: string;
    entity_id: string;
    metadata?: any;
  }): Promise<ApprovalRequest> => {
    return fetchWithAuth(`${API_BASE}/request`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get approval queue for current user
   */
  getQueue: async (params?: {
    entity_type?: string;
    status?: string;
    sort_by?: string;
    order?: 'ASC' | 'DESC';
  }): Promise<ApprovalRequest[]> => {
    const query = new URLSearchParams();
    if (params?.entity_type) query.append('entity_type', params.entity_type);
    if (params?.status) query.append('status', params.status);
    if (params?.sort_by) query.append('sort_by', params.sort_by);
    if (params?.order) query.append('order', params.order);
    
    return fetchWithAuth(`${API_BASE}/queue?${query.toString()}`);
  },

  /**
   * Get approval request by ID
   */
  getRequestById: async (id: string): Promise<ApprovalRequest> => {
    return fetchWithAuth(`${API_BASE}/${id}`);
  },

  /**
   * Approve request
   */
  approveRequest: async (id: string, comments?: string): Promise<void> => {
    return fetchWithAuth(`${API_BASE}/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ comments }),
    });
  },

  /**
   * Reject request
   */
  rejectRequest: async (id: string, comments: string): Promise<void> => {
    return fetchWithAuth(`${API_BASE}/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ comments }),
    });
  },

  /**
   * Cancel request (by submitter)
   */
  cancelRequest: async (id: string): Promise<void> => {
    return fetchWithAuth(`${API_BASE}/${id}/cancel`, {
      method: 'POST',
    });
  },

  // ==================== DELEGATION ====================

  /**
   * Get delegations
   */
  getDelegations: async (): Promise<ApprovalDelegate[]> => {
    return fetchWithAuth(`${API_BASE}/delegates`);
  },

  /**
   * Create delegation
   */
  createDelegation: async (data: {
    delegate_id: string;
    start_date: string;
    end_date: string;
    reason?: string;
  }): Promise<ApprovalDelegate> => {
    return fetchWithAuth(`${API_BASE}/delegates`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete delegation
   */
  deleteDelegation: async (id: string): Promise<void> => {
    return fetchWithAuth(`${API_BASE}/delegates/${id}`, {
      method: 'DELETE',
    });
  },

  // ==================== ANALYTICS ====================

  /**
   * Get approval analytics
   */
  getAnalytics: async (params?: {
    start_date?: string;
    end_date?: string;
    entity_type?: string;
  }): Promise<ApprovalAnalytics> => {
    const query = new URLSearchParams();
    if (params?.start_date) query.append('start_date', params.start_date);
    if (params?.end_date) query.append('end_date', params.end_date);
    if (params?.entity_type) query.append('entity_type', params.entity_type);
    
    return fetchWithAuth(`${API_BASE}/analytics?${query.toString()}`);
  },

  // ==================== ORGANIZATION-SPECIFIC WORKFLOWS ====================

  /**
   * Get workflows for a specific organization
   */
  getOrganizationWorkflows: async (organizationId: string): Promise<ApprovalWorkflow[]> => {
    return fetchWithAuth(`${API_BASE}/organizations/${organizationId}/workflows`);
  },

  /**
   * Create organization-specific workflow
   */
  createOrganizationWorkflow: async (
    organizationId: string,
    data: {
      name: string;
      description?: string;
      entity_type: string;
      parent_workflow_id?: string;
      steps: Partial<ApprovalStep>[];
    }
  ): Promise<ApprovalWorkflow> => {
    return fetchWithAuth(`${API_BASE}/organizations/${organizationId}/workflows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete organization workflow (revert to default)
   */
  deleteOrganizationWorkflow: async (organizationId: string, workflowId: string): Promise<void> => {
    return fetchWithAuth(`${API_BASE}/organizations/${organizationId}/workflows/${workflowId}`, {
      method: 'DELETE',
    });
  },

  // ==================== DASHBOARD METRICS ====================

  /**
   * Get approval metrics for dashboard
   */
  getApprovalMetrics: async (timeRange: 'today' | 'week' | 'month' = 'week'): Promise<{
    total_pending: number;
    total_approved: number;
    total_rejected: number;
    avg_approval_time_hours: number;
    my_pending: number;
    my_approved_today: number;
    overdue_count: number;
    approval_rate: number;
  }> => {
    return fetchWithAuth(`${API_BASE}/metrics?timeRange=${timeRange}`);
  },

  /**
   * Get my pending approvals for dashboard widget
   */
  getMyPendingApprovals: async (): Promise<ApprovalRequest[]> => {
    return fetchWithAuth(`${API_BASE}/my-pending`);
  },
};

export default approvalChainApi;
