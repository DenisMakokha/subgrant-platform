export interface User {
  id: string;
  email: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: 'admin' | 'partner_user' | 'grants_manager' | 'chief_operations_officer' | 'donor';
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
