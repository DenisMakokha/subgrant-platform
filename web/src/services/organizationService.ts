import { Organization, OrganizationFormData, ComplianceDocumentType } from '../types/organization';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const organizationService = {
  // Get all organizations
  async getOrganizations(): Promise<Organization[]> {
    const response = await fetch(`${API_BASE_URL}/organizations`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch organizations');
    }

    return response.json();
  },

  // Get organization by ID
  async getOrganizationById(id: string): Promise<Organization> {
    const response = await fetch(`${API_BASE_URL}/organizations/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch organization');
    }

    return response.json();
  },

  // Create new organization
  async createOrganization(organizationData: OrganizationFormData): Promise<Organization> {
    const response = await fetch(`${API_BASE_URL}/organizations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(organizationData),
    });

    if (!response.ok) {
      throw new Error('Failed to create organization');
    }

    return response.json();
  },

  // Update organization
  async updateOrganization(id: string, organizationData: Partial<OrganizationFormData>): Promise<Organization> {
    const response = await fetch(`${API_BASE_URL}/organizations/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(organizationData),
    });

    if (!response.ok) {
      throw new Error('Failed to update organization');
    }

    return response.json();
  },

  // Delete organization
  async deleteOrganization(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/organizations/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete organization');
    }
  },

  // Get required compliance documents for organization
  async getRequiredComplianceDocuments(organizationId: string): Promise<ComplianceDocumentType[]> {
    const response = await fetch(`${API_BASE_URL}/organizations/${organizationId}/compliance-documents`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch compliance documents');
    }

    return response.json();
  },

  // Upload compliance document
  async uploadComplianceDocument(organizationId: string, documentTypeId: string, file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type_id', documentTypeId);

    const response = await fetch(`${API_BASE_URL}/organizations/${organizationId}/compliance-documents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload compliance document');
    }
  },

  // Check compliance completion status
  async checkComplianceCompletion(organizationId: string): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/organizations/${organizationId}/compliance-status`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to check compliance status');
    }

    const result = await response.json();
    return result.completed;
  },
};
