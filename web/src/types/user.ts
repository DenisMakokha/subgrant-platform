export interface User {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role: 'system_administrator' | 'admin' | 'accountant' | 'budget_holder' | 'finance_manager' | 'm&e_officer' | 'donor' | 'partner_user';
  organizationId?: string;
  status: 'active' | 'inactive' | 'suspended';
  mfaEnabled: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}
