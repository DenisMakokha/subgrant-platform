import api from './api';
import { FinancialReport, FinancialReportFormData } from '../types/reports';

// Get all financial reports with optional filters
export const getFinancialReports = async (filters?: { status?: string; budget_id?: string }) => {
  try {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.budget_id) params.append('budget_id', filters.budget_id);
    
    const response = await api.fetchWithAuth(`/financial-reports?${params.toString()}`);
    return response;
  } catch (error) {
    console.error('Error fetching financial reports:', error);
    throw error;
  }
};

// Get a financial report by ID
export const getFinancialReportById = async (id: string) => {
  try {
    const response = await api.fetchWithAuth(`/financial-reports/${id}`);
    return response;
  } catch (error) {
    console.error('Error fetching financial report:', error);
    throw error;
  }
};

// Get financial reports by budget ID
export const getFinancialReportsByBudgetId = async (budgetId: string) => {
  try {
    const response = await api.fetchWithAuth(`/financial-reports/budget/${budgetId}`);
    return response;
  } catch (error) {
    console.error('Error fetching financial reports by budget ID:', error);
    throw error;
  }
};

// Create a new financial report
export const createFinancialReport = async (financialReportData: FinancialReportFormData) => {
  try {
    const response = await api.fetchWithAuth('/financial-reports', {
      method: 'POST',
      body: JSON.stringify(financialReportData),
    });
    return response;
  } catch (error) {
    console.error('Error creating financial report:', error);
    throw error;
  }
};

// Update a financial report
export const updateFinancialReport = async (id: string, financialReportData: Partial<FinancialReport>) => {
  try {
    const response = await api.fetchWithAuth(`/financial-reports/${id}`, {
      method: 'PUT',
      body: JSON.stringify(financialReportData),
    });
    return response;
  } catch (error) {
    console.error('Error updating financial report:', error);
    throw error;
  }
};

// Delete a financial report
export const deleteFinancialReport = async (id: string) => {
  try {
    const response = await api.fetchWithAuth(`/financial-reports/${id}`, {
      method: 'DELETE',
    });
    return response;
  } catch (error) {
    console.error('Error deleting financial report:', error);
    throw error;
  }
};

// Submit a financial report
export const submitFinancialReport = async (id: string) => {
  try {
    const response = await api.fetchWithAuth(`/financial-reports/${id}/submit`, {
      method: 'PATCH',
    });
    return response;
  } catch (error) {
    console.error('Error submitting financial report:', error);
    throw error;
  }
};

// Approve a financial report
export const approveFinancialReport = async (id: string) => {
  try {
    const response = await api.fetchWithAuth(`/financial-reports/${id}/approve`, {
      method: 'PATCH',
    });
    return response;
  } catch (error) {
    console.error('Error approving financial report:', error);
    throw error;
  }
};

// Get receipts for a financial report
export const getReceiptsForFinancialReport = async (id: string) => {
  try {
    const response = await api.fetchWithAuth(`/financial-reports/${id}/receipts`);
    return response;
  } catch (error) {
    console.error('Error fetching receipts for financial report:', error);
    throw error;
  }
};

// Export a financial report as PDF
export const exportFinancialReportAsPdf = async (id: string) => {
  try {
    const response = await api.fetchWithAuth(`/financial-reports/${id}/export/pdf`, {
      method: 'GET',
      headers: {
        'Accept': 'application/pdf',
      },
    });
    return response;
  } catch (error) {
    console.error('Error exporting financial report as PDF:', error);
    throw error;
  }
};

// Export a financial report as Excel
export const exportFinancialReportAsExcel = async (id: string) => {
  try {
    const response = await api.fetchWithAuth(`/financial-reports/${id}/export/excel`, {
      method: 'GET',
      headers: {
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });
    return response;
  } catch (error) {
    console.error('Error exporting financial report as Excel:', error);
    throw error;
  }
};