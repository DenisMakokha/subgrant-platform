// ME Report types
export interface MeReport {
  id: string;
  budget_id: string;
  title: string;
  description: string;
  report_date: string;
  indicators: Record<string, any>;
  status: 'draft' | 'submitted' | 'approved';
  submitted_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface MeReportFormData {
  budget_id: string;
  title: string;
  description: string;
  report_date: string;
  indicators?: Record<string, any>;
  status?: 'draft' | 'submitted' | 'approved';
}

// Financial Report types
export interface FinancialReport {
  id: string;
  budget_id: string;
  title: string;
  description: string;
  report_date: string;
  total_spent: number;
  variance: number;
  status: 'draft' | 'submitted' | 'approved';
  submitted_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface FinancialReportFormData {
  budget_id: string;
  title: string;
  description: string;
  report_date: string;
  total_spent?: number;
  variance?: number;
  status?: 'draft' | 'submitted' | 'approved';
}

// Receipt types
export interface Receipt {
  id: string;
  financial_report_id: string;
  budget_line_id: string | null;
  amount: number;
  currency: string;
  description: string;
  document_uri: string;
  document_name: string;
  mime_type: string;
  checksum: string | null;
  created_at: string;
  created_by: string;
}

export interface ReceiptFormData {
  financial_report_id: string;
  budget_line_id?: string;
  amount: number;
  currency?: string;
  description: string;
  document_uri: string;
  document_name: string;
  mime_type: string;
  checksum?: string;
}

// KPI types
export interface KpiOverview {
  activeProjects?: number;
  totalBudgets: number;
  approvedBudgets: number;
  pendingReports?: number;
  totalDisbursements?: number;
  completedDisbursements?: number;
  totalBudgetAmount?: number;
  totalDisbursedAmount?: number;
}

export interface KpiReport {
  id: string;
  title: string;
  status: string;
  report_date: string;
  created_at: string;
}

export interface KpiDashboardData {
  overview: KpiOverview;
  recentReports?: {
    meReports: KpiReport[];
    financialReports: KpiReport[];
  };
  project?: {
    id: string;
    name: string;
    status: string;
  };
}

export {};