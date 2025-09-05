import api from './api';
import { Project, BudgetCategory } from '../types/projects';

export type { Project, BudgetCategory };

// Get all projects
export const getProjects = async (): Promise<Project[]> => {
  try {
    const response = await api.fetchWithAuth('/projects');
    return response;
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
};

// Get project by ID
export const getProjectById = async (id: string): Promise<Project & { budget_categories: BudgetCategory[] }> => {
  try {
    const response = await api.fetchWithAuth(`/projects/${id}`);
    return response;
  } catch (error) {
    console.error('Error fetching project:', error);
    throw error;
  }
};

// Create a new project
export const createProject = async (projectData: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by' | 'status'>): Promise<Project> => {
  try {
    const response = await api.fetchWithAuth('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
    return response;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};

// Update a project
export const updateProject = async (id: string, projectData: Partial<Project>): Promise<Project> => {
  try {
    const response = await api.fetchWithAuth(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    });
    return response;
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
};

// Delete a project
export const deleteProject = async (id: string): Promise<void> => {
  try {
    await api.fetchWithAuth(`/projects/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};

// Archive a project
export const archiveProject = async (id: string): Promise<Project> => {
  try {
    const response = await api.fetchWithAuth(`/projects/${id}/archive`, {
      method: 'PATCH',
    });
    return response.project;
  } catch (error) {
    console.error('Error archiving project:', error);
    throw error;
  }
};

// Close a project
export const closeProject = async (id: string): Promise<Project> => {
  try {
    const response = await api.fetchWithAuth(`/projects/${id}/close`, {
      method: 'PATCH',
    });
    return response.project;
  } catch (error) {
    console.error('Error closing project:', error);
    throw error;
  }
};

// Get archived projects
export const getArchivedProjects = async (): Promise<Project[]> => {
  try {
    const response = await api.fetchWithAuth('/projects/archived');
    return response;
  } catch (error) {
    console.error('Error fetching archived projects:', error);
    throw error;
  }
};

// Get closed projects
export const getClosedProjects = async (): Promise<Project[]> => {
  try {
    const response = await api.fetchWithAuth('/projects/closed');
    return response;
  } catch (error) {
    console.error('Error fetching closed projects:', error);
    throw error;
  }
};

// Search projects
export const searchProjects = async (query: string): Promise<Project[]> => {
  try {
    const response = await api.fetchWithAuth(`/projects/search?q=${encodeURIComponent(query)}`);
    return response;
  } catch (error) {
    console.error('Error searching projects:', error);
    throw error;
  }
};

// Add budget category to project
export const addBudgetCategory = async (projectId: string, categoryData: Omit<BudgetCategory, 'id' | 'project_id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<BudgetCategory> => {
  try {
    const response = await api.fetchWithAuth(`/projects/${projectId}/categories`, {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
    return response;
  } catch (error) {
    console.error('Error adding budget category:', error);
    throw error;
  }
};

// Get budget categories for project
export const getProjectBudgetCategories = async (projectId: string): Promise<BudgetCategory[]> => {
  try {
    const response = await api.fetchWithAuth(`/projects/${projectId}/categories`);
    return response;
  } catch (error) {
    console.error('Error fetching budget categories:', error);
    throw error;
  }
};