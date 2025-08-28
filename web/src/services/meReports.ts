import api from './api';
import { MeReport, MeReportFormData } from '../types/reports';

// Get all ME reports with optional filters
export const getMeReports = async (filters?: { status?: string; budget_id?: string }) => {
  try {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.budget_id) params.append('budget_id', filters.budget_id);
    
    const response = await api.fetchWithAuth(`/me-reports?${params.toString()}`);
    return response;
  } catch (error) {
    console.error('Error fetching ME reports:', error);
    throw error;
  }
};

// Get an ME report by ID
export const getMeReportById = async (id: string) => {
  try {
    const response = await api.fetchWithAuth(`/me-reports/${id}`);
    return response;
  } catch (error) {
    console.error('Error fetching ME report:', error);
    throw error;
  }
};

// Get ME reports by budget ID
export const getMeReportsByBudgetId = async (budgetId: string) => {
  try {
    const response = await api.fetchWithAuth(`/me-reports/budget/${budgetId}`);
    return response;
  } catch (error) {
    console.error('Error fetching ME reports by budget ID:', error);
    throw error;
  }
};

// Create a new ME report
export const createMeReport = async (meReportData: MeReportFormData) => {
  try {
    const response = await api.fetchWithAuth('/me-reports', {
      method: 'POST',
      body: JSON.stringify(meReportData),
    });
    return response;
  } catch (error) {
    console.error('Error creating ME report:', error);
    throw error;
  }
};

// Update an ME report
export const updateMeReport = async (id: string, meReportData: Partial<MeReport>) => {
  try {
    const response = await api.fetchWithAuth(`/me-reports/${id}`, {
      method: 'PUT',
      body: JSON.stringify(meReportData),
    });
    return response;
  } catch (error) {
    console.error('Error updating ME report:', error);
    throw error;
  }
};

// Delete an ME report
export const deleteMeReport = async (id: string) => {
  try {
    const response = await api.fetchWithAuth(`/me-reports/${id}`, {
      method: 'DELETE',
    });
    return response;
  } catch (error) {
    console.error('Error deleting ME report:', error);
    throw error;
  }
};

// Submit an ME report
export const submitMeReport = async (id: string) => {
  try {
    const response = await api.fetchWithAuth(`/me-reports/${id}/submit`, {
      method: 'PATCH',
    });
    return response;
  } catch (error) {
    console.error('Error submitting ME report:', error);
    throw error;
  }
};

// Approve an ME report
export const approveMeReport = async (id: string) => {
  try {
    const response = await api.fetchWithAuth(`/me-reports/${id}/approve`, {
      method: 'PATCH',
    });
    return response;
  } catch (error) {
    console.error('Error approving ME report:', error);
    throw error;
  }
};

// Export an ME report as PDF
export const exportMeReportAsPdf = async (id: string) => {
  try {
    const response = await api.fetchWithAuth(`/me-reports/${id}/export/pdf`, {
      method: 'GET',
      headers: {
        'Accept': 'application/pdf',
      },
    });
    return response;
  } catch (error) {
    console.error('Error exporting ME report as PDF:', error);
    throw error;
  }
};

// Export an ME report as Excel
export const exportMeReportAsExcel = async (id: string) => {
  try {
    const response = await api.fetchWithAuth(`/me-reports/${id}/export/excel`, {
      method: 'GET',
      headers: {
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });
    return response;
  } catch (error) {
    console.error('Error exporting ME report as Excel:', error);
    throw error;
  }
};