// Utility functions for validation

// Validate email format
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
export const validatePassword = (password: string): boolean => {
  // At least 12 characters, one uppercase, one lowercase, one number, one special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
  return passwordRegex.test(password);
};

// Validate phone number format
export const validatePhoneNumber = (phoneNumber: string): boolean => {
  // Basic US phone number format validation
  const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
  return phoneRegex.test(phoneNumber);
};

// Validate required field
export const validateRequired = (value: string | number | boolean): boolean => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  if (typeof value === 'number') {
    return !isNaN(value);
  }
  return value !== undefined && value !== null;
};

// Validate minimum length
export const validateMinLength = (value: string, minLength: number): boolean => {
  return value.length >= minLength;
};

// Validate maximum length
export const validateMaxLength = (value: string, maxLength: number): boolean => {
  return value.length <= maxLength;
};

// Validate numeric value
export const validateNumeric = (value: string | number): boolean => {
  if (typeof value === 'number') return true;
  return !isNaN(Number(value)) && !isNaN(parseFloat(value));
};

// Validate positive number
export const validatePositive = (value: number): boolean => {
  return value > 0;
};

// Validate URL format
export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

// Validate organization name
export const validateOrgName = (name: string): boolean => {
  // At least 2 characters, alphanumeric and spaces allowed
  const nameRegex = /^[a-zA-Z0-9\s]{2,}$/;
  return nameRegex.test(name);
};

// Validate user name
export const validateUserName = (name: string): boolean => {
  // At least 2 characters, letters and spaces allowed
  const nameRegex = /^[a-zA-Z\s]{2,}$/;
  return nameRegex.test(name);
};

// Validate role
export const validateRole = (role: string): boolean => {
  const validRoles = [
    'system_administrator',
    'accountant',
    'budget_holder',
    'finance_manager',
    'partner_user',
    'auditor'
  ];
  return validRoles.includes(role);
};

// Validation error messages
export const validationMessages = {
  email: 'Please enter a valid email address',
  password: 'Password must be at least 12 characters with uppercase, lowercase, number, and special character',
  phone: 'Please enter a valid phone number',
  required: 'This field is required',
  minLength: (min: number) => `This field must be at least ${min} characters long`,
  maxLength: (max: number) => `This field must be no more than ${max} characters long`,
  numeric: 'This field must be a number',
  positive: 'This field must be a positive number',
  url: 'Please enter a valid URL',
  orgName: 'Organization name must be at least 2 characters and contain only letters, numbers, and spaces',
  userName: 'Name must be at least 2 characters and contain only letters and spaces',
  role: 'Please select a valid role',
};