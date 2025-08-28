export interface Contract {
  id: string;
  budget_id: string;
  template_id: string;
  title: string;
  description: string;
  envelope_id: string | null;
  status: 'ready' | 'sent' | 'partially_signed' | 'completed' | 'filed' | 'declined' | 'voided';
  sent_at: string | null;
  completed_at: string | null;
  filed_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface ContractArtifact {
  id: string;
  contract_id: string;
  document_uri: string;
  document_name: string;
  mime_type: string;
  version: number;
  checksum: string;
  created_at: string;
}

export {};