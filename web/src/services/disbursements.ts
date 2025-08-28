import api from './api';
import { Disbursement, DisbursementFormData } from '../types/index';

// Get all disbursements with optional filters
export const getDisbursements = async (filters?: { status?: string; budget_id?: string }) => {
  try {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.budget_id) params.append('budget_id', filters.budget_id);
    
    const response = await api.fetchWithAuth(`/disbursements?${params.toString()}`);
    return response;
  } catch (error) {
    console.error('Error fetching disbursements:', error);
    throw error;
  }
};

// Get a disbursement by ID
export const getDisbursementById = async (id: string) => {
  try {
    const response = await api.fetchWithAuth(`/disbursements/${id}`);
    return response;
  } catch (error) {
    console.error('Error fetching disbursement:', error);
    throw error;
  }
};

// Get disbursements by budget ID
export const getDisbursementsByBudgetId = async (budgetId: string) => {
  try {
    const response = await api.fetchWithAuth(`/disbursements/budget/${budgetId}`);
    return response;
  } catch (error) {
    console.error('Error fetching disbursements by budget ID:', error);
    throw error;
  }
};

// Create a new disbursement
export const createDisbursement = async (disbursementData: DisbursementFormData) => {
  try {
    const response = await api.fetchWithAuth('/disbursements', {
      method: 'POST',
      body: JSON.stringify(disbursementData),
    });
    return response;
  } catch (error) {
    console.error('Error creating disbursement:', error);
    throw error;
  }
};

// Update a disbursement
export const updateDisbursement = async (id: string, disbursementData: Partial<Disbursement>) => {
  try {
    const response = await api.fetchWithAuth(`/disbursements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(disbursementData),
    });
    return response;
  } catch (error) {
    console.error('Error updating disbursement:', error);
    throw error;
  }
};

// Delete a disbursement
export const deleteDisbursement = async (id: string) => {
  try {
    const response = await api.fetchWithAuth(`/disbursements/${id}`, {
      method: 'DELETE',
    });
    return response;
  } catch (error) {
    console.error('Error deleting disbursement:', error);
    throw error;
  }
};

// Update disbursement status
export const updateDisbursementStatus = async (id: string, status: 'planned' | 'invoiced' | 'paid' | 'reconciled') => {
  try {
    const response = await api.fetchWithAuth(`/disbursements/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return response;
  } catch (error) {
    console.error('Error updating disbursement status:', error);
    throw error;
  }
};

// Mark disbursement as paid
export const markDisbursementAsPaid = async (id: string, paidAt?: string) => {
  try {
    const response = await api.fetchWithAuth(`/disbursements/${id}/pay`, {
      method: 'PATCH',
      body: JSON.stringify({ paid_at: paidAt }),
    });
    return response;
  } catch (error) {
    console.error('Error marking disbursement as paid:', error);
    throw error;
  }
};

// Mark disbursement as reconciled
export const markDisbursementAsReconciled = async (id: string) => {
  try {
    const response = await api.fetchWithAuth(`/disbursements/${id}/reconcile`, {
      method: 'PATCH',
    });
    return response;
  } catch (error) {
    console.error('Error marking disbursement as reconciled:', error);
    throw error;
  }
};

// Get total disbursement amount in a specific currency
export const getTotalDisbursementAmount = async (targetCurrency: string, budgetId?: string) => {
  try {
    const params = new URLSearchParams();
    if (budgetId) params.append('budgetId', budgetId);
    
    const response = await api.fetchWithAuth(`/disbursements/total/${targetCurrency}?${params.toString()}`);
    return response;
  } catch (error) {
    console.error('Error fetching total disbursement amount:', error);
    throw error;
  }
};