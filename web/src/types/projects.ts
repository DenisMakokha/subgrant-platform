export interface Project {
  id: string;
  title: string;
  name?: string;
  description: string;
  partner_name?: string;
  donor_name?: string;
  open_date: string;
  close_date: string;
  currency: string;
  status: 'draft' | 'active' | 'planning' | 'completed' | 'closed' | 'archived';
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface BudgetCategory {
  id: string;
  project_id: string;
  name: string;
  description: string;
  cap_amount: number | null;
  cap_percentage: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface NewProject {
  title: string;
  description: string;
  partner_name?: string;
  open_date: string;
  close_date: string;
  currency: string;
}
