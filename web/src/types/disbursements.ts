export interface Disbursement {
  id: string;
  budget_id: string;
  title: string;
  description: string;
  tranche_number: number;
  amount: number;
  currency: string;
  planned_date: string;
  status: 'planned' | 'invoiced' | 'paid' | 'reconciled';
  invoice_id: string | null;
  bill_id: string | null;
  paid_at: string | null;
  reconciled_at: string | null;
  reconciled_by: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface DisbursementFormData {
  budget_id: string;
  title: string;
  description: string;
  tranche_number: number;
  amount: number;
  currency: string;
  planned_date: string;
}

export interface DisbursementTotal {
  totalAmount: number;
  currency: string;
  count: number;
}

export {};