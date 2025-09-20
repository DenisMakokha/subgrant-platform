// Utility functions for formatting data

// Format currency
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// Format date
export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
};

// Format date and time
export const formatDateTime = (date: string | Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

// Format percentage
export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Truncate text
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Format phone number
export const formatPhoneNumber = (phoneNumber: string): string => {
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  
  return phoneNumber;
};

// Format status badge
export const formatStatus = (status: string): string => {
  // Convert snake_case or kebab-case to Title Case
  return status
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
};

// Format role
export const formatRole = (role: string): string => {
  // Convert role to readable format
  const roleMap: { [key: string]: string } = {
    'admin': 'System Administrator',
    'accountant': 'Accountant',
    'budget_holder': 'Budget Holder',
    'finance_manager': 'Finance Manager',
    'partner_user': 'Partner User',
    'auditor': 'Auditor',
  };
  
  return roleMap[role] || formatStatus(role);
};

// Format organization status
export const formatOrgStatus = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    'pending': 'Pending',
    'active': 'Active',
    'inactive': 'Inactive',
    'suspended': 'Suspended',
  };
  
  return statusMap[status] || formatStatus(status);
};

// Format compliance status
export const formatComplianceStatus = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    'pending': 'Pending',
    'approved': 'Approved',
    'rejected': 'Rejected',
  };
  
  return statusMap[status] || formatStatus(status);
};