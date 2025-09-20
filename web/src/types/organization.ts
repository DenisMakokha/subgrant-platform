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
  status: 'email_pending' | 'a_pending' | 'b_pending' | 'c_pending' | 'under_review' | 'changes_requested' | 'finalized' | 'rejected' | 'pending' | 'approved' | 'suspended';
  compliance_status: 'pending' | 'in_review' | 'approved' | 'rejected';
  due_diligence_completed: boolean;
  due_diligence_date?: string;
  // Primary Contact Information
  primary_contact_name?: string;
  primary_contact_title?: string;
  primary_contact_phone?: string;
  primary_contact_email?: string;
  // Enhanced Address Information
  city?: string;
  state_province?: string;
  postal_code?: string;
  // Banking Information
  bank_name?: string;
  bank_branch?: string;
  account_name?: string;
  account_number?: string;
  swift_code?: string;
  // Authorized Signatory
  signatory_name?: string;
  signatory_title?: string;
  signatory_email?: string;
  // Legal Structure
  legal_structure?: string;
  incorporation_country?: string;
  incorporation_date?: string;
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
  status?: 'email_pending' | 'a_pending' | 'b_pending' | 'c_pending' | 'under_review' | 'changes_requested' | 'finalized' | 'rejected' | 'pending' | 'approved' | 'suspended';
  compliance_status?: 'pending' | 'in_review' | 'approved' | 'rejected';
  // Primary Contact Information
  primary_contact_name: string;
  primary_contact_title: string;
  primary_contact_phone: string;
  primary_contact_email: string;
  // Enhanced Address Information
  city: string;
  state_province: string;
  postal_code: string;
  // Banking Information
  bank_name: string;
  bank_branch: string;
  account_name: string;
  account_number: string;
  swift_code: string;
  // Authorized Signatory
  signatory_name: string;
  signatory_title: string;
  signatory_email: string;
  // Legal Structure
  legal_structure: string;
  incorporation_country: string;
  incorporation_date: string;
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
