// API service for making HTTP requests to the backend
import { getToken } from '../utils/auth';

// Base API URL from environment variables
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Generic fetch function with authentication
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // Get the authentication token
  const token = getToken();
  
  // Set default headers
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };
  
  // Make the request
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });
  
  // Handle response
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

// Auth API functions
export const authApi = {
  // Login user
  login: async (email: string, password: string) => {
    return fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  
  // Logout user
  logout: async () => {
    return fetchWithAuth('/auth/logout', {
      method: 'POST',
    });
  },
  
  // Register user
  register: async (userData: any) => {
    return fetchWithAuth('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
  
  // Refresh token
  refreshToken: async () => {
    return fetchWithAuth('/auth/refresh', {
      method: 'POST',
    });
  },
};

// Organization API functions
export const organizationApi = {
  // Get all organizations
  getAll: async () => {
    return fetchWithAuth('/organizations');
  },
  
  // Get organization by ID
  getById: async (id: string) => {
    return fetchWithAuth(`/organizations/${id}`);
  },
  
  // Create organization
  create: async (organizationData: any) => {
    return fetchWithAuth('/organizations', {
      method: 'POST',
      body: JSON.stringify(organizationData),
    });
  },
  
  // Update organization
  update: async (id: string, organizationData: any) => {
    return fetchWithAuth(`/organizations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(organizationData),
    });
  },
  
  // Delete organization
  delete: async (id: string) => {
    return fetchWithAuth(`/organizations/${id}`, {
      method: 'DELETE',
    });
  },
};

// User API functions
export const userApi = {
  // Get all users
  getAll: async () => {
    return fetchWithAuth('/users');
  },
  
  // Get user by ID
  getById: async (id: string) => {
    return fetchWithAuth(`/users/${id}`);
  },
  
  // Create user
  create: async (userData: any) => {
    return fetchWithAuth('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
  
  // Update user
  update: async (id: string, userData: any) => {
    return fetchWithAuth(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },
  
  // Delete user
  delete: async (id: string) => {
    return fetchWithAuth(`/users/${id}`, {
      method: 'DELETE',
    });
  },
};

// Project API functions
export const projectApi = {
  // Get all projects
  getAll: async () => {
    return fetchWithAuth('/projects');
  },
  
  // Get project by ID
  getById: async (id: string) => {
    return fetchWithAuth(`/projects/${id}`);
  },
  
  // Create project
  create: async (projectData: any) => {
    return fetchWithAuth('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  },
  
  // Update project
  update: async (id: string, projectData: any) => {
    return fetchWithAuth(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    });
  },
  
  // Delete project
  delete: async (id: string) => {
    return fetchWithAuth(`/projects/${id}`, {
      method: 'DELETE',
    });
  },
  
  // Get projects by status
  getByStatus: async (status: string) => {
    return fetchWithAuth(`/projects/status/${status}`);
  },
  
  // Add budget category to project
  addBudgetCategory: async (projectId: string, categoryData: any) => {
    return fetchWithAuth(`/projects/${projectId}/categories`, {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  },
  
  // Get budget categories for project
  getBudgetCategories: async (projectId: string) => {
    return fetchWithAuth(`/projects/${projectId}/categories`);
  },
};

// Budget Category API functions
export const budgetCategoryApi = {
  // Get all budget categories
  getAll: async () => {
    return fetchWithAuth('/budget-categories');
  },
  
  // Get budget category by ID
  getById: async (id: string) => {
    return fetchWithAuth(`/budget-categories/${id}`);
  },
  
  // Create budget category
  create: async (categoryData: any) => {
    return fetchWithAuth('/budget-categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  },
  
  // Update budget category
  update: async (id: string, categoryData: any) => {
    return fetchWithAuth(`/budget-categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  },
  
  // Delete budget category
  delete: async (id: string) => {
    return fetchWithAuth(`/budget-categories/${id}`, {
      method: 'DELETE',
    });
  },
};

// Budget API functions
export const budgetApi = {
  // Get all budgets
  getAll: async () => {
    return fetchWithAuth('/budgets');
  },
  
  // Get budget by ID
  getById: async (id: string) => {
    return fetchWithAuth(`/budgets/${id}`);
  },
  
  // Get budgets by organization
  getByOrganization: async (organizationId: string) => {
    return fetchWithAuth(`/budgets/organization/${organizationId}`);
  },
  
  // Create budget
  create: async (budgetData: any) => {
    return fetchWithAuth('/budgets', {
      method: 'POST',
      body: JSON.stringify(budgetData),
    });
  },
  
  // Update budget
  update: async (id: string, budgetData: any) => {
    return fetchWithAuth(`/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(budgetData),
    });
  },
  
  // Delete budget
  delete: async (id: string) => {
    return fetchWithAuth(`/budgets/${id}`, {
      method: 'DELETE',
    });
  },
  
  // Submit budget for approval
  submit: async (id: string) => {
    return fetchWithAuth(`/budgets/${id}/submit`, {
      method: 'POST',
    });
  },
  
  // Request revisions for budget
  requestRevisions: async (id: string, comments: string) => {
    return fetchWithAuth(`/budgets/${id}/request-revisions`, {
      method: 'POST',
      body: JSON.stringify({ comments }),
    });
  },
  
  // Approve budget
  approve: async (id: string) => {
    return fetchWithAuth(`/budgets/${id}/approve`, {
      method: 'POST',
    });
  },
};

// Budget Line API functions
export const budgetLineApi = {
  // Get all budget lines for a budget
  getByBudget: async (budgetId: string) => {
    return fetchWithAuth(`/budget-lines/budget/${budgetId}`);
  },
  
  // Create budget line
  create: async (lineData: any) => {
    return fetchWithAuth('/budget-lines', {
      method: 'POST',
      body: JSON.stringify(lineData),
    });
  },
  
  // Update budget line
  update: async (id: string, lineData: any) => {
    return fetchWithAuth(`/budget-lines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(lineData),
    });
  },
  
  // Delete budget line
  delete: async (id: string) => {
    return fetchWithAuth(`/budget-lines/${id}`, {
      method: 'DELETE',
    });
  },
};

// Review Comment API functions
export const reviewCommentApi = {
  // Get comments for an entity
  getByEntity: async (entityType: string, entityId: string) => {
    return fetchWithAuth(`/review-comments/${entityType}/${entityId}`);
  },
  
  // Create comment
  create: async (commentData: any) => {
    return fetchWithAuth('/review-comments', {
      method: 'POST',
      body: JSON.stringify(commentData),
    });
  },
  
  // Update comment
  update: async (id: string, commentData: any) => {
    return fetchWithAuth(`/review-comments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(commentData),
    });
  },
  
  // Delete comment
  delete: async (id: string) => {
    return fetchWithAuth(`/review-comments/${id}`, {
      method: 'DELETE',
    });
  },
  
  // Resolve comment
  resolve: async (id: string) => {
    return fetchWithAuth(`/review-comments/${id}/resolve`, {
      method: 'PUT',
    });
  },
};

// Notification API functions
export const notificationApi = {
  // Get user notifications
  getNotifications: async () => {
    return fetchWithAuth('/notifications');
  },
  
  // Mark notification as read
  markAsRead: async (id: string) => {
    return fetchWithAuth(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  },
};

// Health check API function
export const healthApi = {
  // Check API health
  checkHealth: async () => {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
};

// Renewal Alerts API functions
export const renewalAlertsApi = {
  // Get renewal alerts for the current user
  getRenewalAlerts: async () => {
    return fetchWithAuth('/renewal-alerts');
  },
  
  // Send renewal alerts (admin only)
  sendRenewalAlerts: async () => {
    return fetchWithAuth('/renewal-alerts/send', {
      method: 'POST',
    });
  },
  
  // Check for renewal alerts (for testing)
  checkRenewalAlerts: async () => {
    return fetchWithAuth('/renewal-alerts/check');
  },
};

// Create a combined API object for easier imports
const api = {
  auth: authApi,
  organizations: organizationApi,
  users: userApi,
  projects: projectApi,
  budgetCategories: budgetCategoryApi,
  budgets: budgetApi,
  budgetLines: budgetLineApi,
  reviewComments: reviewCommentApi,
  notifications: notificationApi,
  health: healthApi,
  renewalAlerts: renewalAlertsApi,
  fetchWithAuth,
};

// Export everything
export { API_BASE_URL };
export default api;