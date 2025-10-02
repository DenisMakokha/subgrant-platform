export interface User {
  id: string;
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: string; // Changed from union to string to support custom roles from Role Wizard
  capabilities?: string[]; // User's capabilities from role or custom role
  email_verified?: boolean;
  email_verified_at?: Date;
  organizationId?: string;
  organization_id?: string;
  organization?: {
    id: string;
    name: string;
    status: 'email_pending' | 'a_pending' | 'b_pending' | 'c_pending' | 'under_review_gm' | 'under_review_coo' | 'changes_requested' | 'rejected' | 'finalized';
  };
  status: 'active' | 'inactive' | 'suspended';
  mfaEnabled: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}
