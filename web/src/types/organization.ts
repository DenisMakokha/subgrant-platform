export interface Organization {
  id: string;
  name: string;
  legal_name: string;
  registration_number: string;
  tax_id: string;
  address: string;
  country: string;
  phone: string;
  email: string;
  website?: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  compliance_status: 'pending' | 'in_review' | 'approved' | 'rejected';
  due_diligence_completed: boolean;
  due_diligence_date?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface OrganizationFormData {
  name: string;
  legal_name: string;
  registration_number: string;
  tax_id: string;
  address: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  description: string;
}

export interface ComplianceDocument {
  id: string;
  organization_id: string;
  document_type_id: string;
  document_name: string;
  file_path: string;
  status: 'pending' | 'approved' | 'rejected';
  uploaded_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  comments?: string;
}

export interface ComplianceDocumentType {
  id: string;
  name: string;
  description: string;
  required: boolean;
  country?: string;
  compliance_document?: ComplianceDocument | null;
}

export {};
