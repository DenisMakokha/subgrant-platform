// Authentication utility functions

// Token storage key
const TOKEN_KEY = 'auth_token';

// Save token to localStorage
export const saveToken = (token: string): void => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('Error saving token to localStorage:', error);
  }
};

// Get token from localStorage
export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting token from localStorage:', error);
    return null;
  }
};

// Remove token from localStorage
export const removeToken = (): void => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error removing token from localStorage:', error);
  }
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const token = getToken();
  return token !== null;
};

// Parse JWT token to get user data
export const parseToken = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing token:', error);
    return null;
  }
};

// Get user data from token
export const getUserFromToken = (): any => {
  const token = getToken();
  if (!token) return null;
  
  return parseToken(token);
};

// Check if user has a specific role
export const hasRole = (role: string): boolean => {
  const user = getUserFromToken();
  return user && user.role === role;
};

// Check if user has any of the specified roles
export const hasAnyRole = (roles: string[]): boolean => {
  const user = getUserFromToken();
  return user && roles.includes(user.role);
};

// Check if user has all of the specified roles
export const hasAllRoles = (roles: string[]): boolean => {
  const user = getUserFromToken();
  return user && roles.every(role => user.role === role);
};

// Check if token is expired
export const isTokenExpired = (token: string): boolean => {
  try {
    const parsed = parseToken(token);
    if (!parsed || !parsed.exp) {
      console.warn('Token missing expiration time, treating as expired');
      return true;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    const isExpired = parsed.exp < currentTime;
    
    console.log('Token expiration check:', {
      currentTime,
      tokenExp: parsed.exp,
      timeUntilExpiry: parsed.exp - currentTime,
      isExpired
    });
    
    return isExpired;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};

// Check if user is admin
export const isAdmin = (): boolean => {
  return hasRole('admin');
};

// Check if user is a partner user
export const isPartnerUser = (): boolean => {
  return hasRole('partner_user');
};

// Check if user is an approver (accountant, budget_holder, or finance_manager)
export const isApprover = (): boolean => {
  return hasAnyRole(['accountant', 'budget_holder', 'finance_manager']);
};

// Check if user is an auditor
export const isAuditor = (): boolean => {
  return hasRole('auditor');
};