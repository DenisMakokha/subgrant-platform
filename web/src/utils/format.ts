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
    // Onboarding statuses
    'email_pending': 'Email Verification Pending',
    'a_pending': 'Organization Profile Incomplete',
    'b_pending': 'Financial Assessment Incomplete', 
    'c_pending': 'Document Upload Incomplete',
    'under_review': 'Application Under Review',
    'under_review_gm': 'Under Grant Manager Review',
    'under_review_coo': 'Under COO Review',
    'changes_requested': 'Changes Requested',
    'rejected': 'Application Rejected',
    'finalized': 'Onboarding Complete',
    
    // General statuses
    'pending': 'Pending',
    'active': 'Active',
    'inactive': 'Inactive',
    'suspended': 'Suspended',
    'approved': 'Approved',
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

// Get user-friendly status description
export const getStatusDescription = (status: string): string => {
  const descriptionMap: { [key: string]: string } = {
    // Onboarding statuses
    'email_pending': 'Please verify your email address to continue with the onboarding process.',
    'a_pending': 'Complete your organization profile with basic information and contact details.',
    'b_pending': 'Provide your financial assessment and banking information.',
    'c_pending': 'Upload required compliance documents to complete your application.',
    'under_review': 'Your application is being reviewed by our team. We\'ll notify you of any updates.',
    'under_review_gm': 'Your application is currently under review by our Grant Manager.',
    'under_review_coo': 'Your application is being reviewed by our Chief Operating Officer.',
    'changes_requested': 'Please review and address the requested changes to your application.',
    'rejected': 'Your application has been declined. Contact support for more information.',
    'finalized': 'Congratulations! Your onboarding is complete and you can access all features.',
    
    // General statuses
    'pending': 'Your request is pending review.',
    'active': 'Your account is active and fully functional.',
    'inactive': 'Your account is currently inactive.',
    'suspended': 'Your account has been temporarily suspended.',
    'approved': 'Your request has been approved.',
  };
  
  return descriptionMap[status] || 'Status information not available.';
};

// Get user display name with fallbacks
export const getUserDisplayName = (user: any): string => {
  if (!user) return 'User';
  
  // Try different name fields in order of preference
  if (user.name) return user.name;
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
  if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
  if (user.firstName) return user.firstName;
  if (user.first_name) return user.first_name;
  
  // Fallback to email username (part before @)
  if (user.email) {
    const emailUsername = user.email.split('@')[0];
    // Capitalize first letter and replace dots/underscores with spaces
    return emailUsername
      .replace(/[._]/g, ' ')
      .replace(/\b\w/g, (char: string) => char.toUpperCase());
  }
  
  return 'Partner';
};

// Get status color classes for consistent styling
export const getStatusColor = (status: string): { bg: string; text: string; border: string } => {
  const colorMap: { [key: string]: { bg: string; text: string; border: string } } = {
    // Onboarding statuses - using warm, encouraging colors
    'email_pending': { 
      bg: 'bg-amber-50 dark:bg-amber-900/20', 
      text: 'text-amber-800 dark:text-amber-200', 
      border: 'border-amber-200 dark:border-amber-800' 
    },
    'a_pending': { 
      bg: 'bg-blue-50 dark:bg-blue-900/20', 
      text: 'text-blue-800 dark:text-blue-200', 
      border: 'border-blue-200 dark:border-blue-800' 
    },
    'b_pending': { 
      bg: 'bg-indigo-50 dark:bg-indigo-900/20', 
      text: 'text-indigo-800 dark:text-indigo-200', 
      border: 'border-indigo-200 dark:border-indigo-800' 
    },
    'c_pending': { 
      bg: 'bg-purple-50 dark:bg-purple-900/20', 
      text: 'text-purple-800 dark:text-purple-200', 
      border: 'border-purple-200 dark:border-purple-800' 
    },
    'under_review': { 
      bg: 'bg-yellow-50 dark:bg-yellow-900/20', 
      text: 'text-yellow-800 dark:text-yellow-200', 
      border: 'border-yellow-200 dark:border-yellow-800' 
    },
    'under_review_gm': { 
      bg: 'bg-orange-50 dark:bg-orange-900/20', 
      text: 'text-orange-800 dark:text-orange-200', 
      border: 'border-orange-200 dark:border-orange-800' 
    },
    'under_review_coo': { 
      bg: 'bg-pink-50 dark:bg-pink-900/20', 
      text: 'text-pink-800 dark:text-pink-200', 
      border: 'border-pink-200 dark:border-pink-800' 
    },
    'changes_requested': { 
      bg: 'bg-amber-50 dark:bg-amber-900/20', 
      text: 'text-amber-800 dark:text-amber-200', 
      border: 'border-amber-200 dark:border-amber-800' 
    },
    'rejected': { 
      bg: 'bg-red-50 dark:bg-red-900/20', 
      text: 'text-red-800 dark:text-red-200', 
      border: 'border-red-200 dark:border-red-800' 
    },
    'finalized': { 
      bg: 'bg-emerald-50 dark:bg-emerald-900/20', 
      text: 'text-emerald-800 dark:text-emerald-200', 
      border: 'border-emerald-200 dark:border-emerald-800' 
    },
    
    // General statuses
    'pending': { 
      bg: 'bg-gray-50 dark:bg-gray-900/20', 
      text: 'text-gray-800 dark:text-gray-200', 
      border: 'border-gray-200 dark:border-gray-800' 
    },
    'active': { 
      bg: 'bg-green-50 dark:bg-green-900/20', 
      text: 'text-green-800 dark:text-green-200', 
      border: 'border-green-200 dark:border-green-800' 
    },
    'inactive': { 
      bg: 'bg-gray-50 dark:bg-gray-900/20', 
      text: 'text-gray-800 dark:text-gray-200', 
      border: 'border-gray-200 dark:border-gray-800' 
    },
    'suspended': { 
      bg: 'bg-red-50 dark:bg-red-900/20', 
      text: 'text-red-800 dark:text-red-200', 
      border: 'border-red-200 dark:border-red-800' 
    },
    'approved': { 
      bg: 'bg-green-50 dark:bg-green-900/20', 
      text: 'text-green-800 dark:text-green-200', 
      border: 'border-green-200 dark:border-green-800' 
    },
  };
  
  return colorMap[status] || { 
    bg: 'bg-gray-50 dark:bg-gray-900/20', 
    text: 'text-gray-800 dark:text-gray-200', 
    border: 'border-gray-200 dark:border-gray-800' 
  };
};