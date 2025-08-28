import api from './api';
import { Receipt, ReceiptFormData } from '../types';

// Get all receipts with optional filters
export const getReceipts = async (filters?: { financial_report_id?: string; budget_line_id?: string }) => {
  try {
    const params = new URLSearchParams();
    if (filters?.financial_report_id) params.append('financial_report_id', filters.financial_report_id);
    if (filters?.budget_line_id) params.append('budget_line_id', filters.budget_line_id);
    
    const response = await api.fetchWithAuth(`/receipts?${params.toString()}`);
    return response;
  } catch (error) {
    console.error('Error fetching receipts:', error);
    throw error;
  }
};

// Get a receipt by ID
export const getReceiptById = async (id: string) => {
  try {
    const response = await api.fetchWithAuth(`/receipts/${id}`);
    return response;
  } catch (error) {
    console.error('Error fetching receipt:', error);
    throw error;
  }
};

// Get receipts by financial report ID
export const getReceiptsByFinancialReportId = async (financialReportId: string) => {
  try {
    const response = await api.fetchWithAuth(`/receipts/financial-report/${financialReportId}`);
    return response;
  } catch (error) {
    console.error('Error fetching receipts by financial report ID:', error);
    throw error;
  }
};

// Get receipts by budget line ID
export const getReceiptsByBudgetLineId = async (budgetLineId: string) => {
  try {
    const response = await api.fetchWithAuth(`/receipts/budget-line/${budgetLineId}`);
    return response;
  } catch (error) {
    console.error('Error fetching receipts by budget line ID:', error);
    throw error;
  }
};

// Create a new receipt
export const createReceipt = async (receiptData: ReceiptFormData) => {
  try {
    const response = await api.fetchWithAuth('/receipts', {
      method: 'POST',
      body: JSON.stringify(receiptData),
    });
    return response;
  } catch (error) {
    console.error('Error creating receipt:', error);
    throw error;
  }
};

// Update a receipt
export const updateReceipt = async (id: string, receiptData: Partial<Receipt>) => {
  try {
    const response = await api.fetchWithAuth(`/receipts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(receiptData),
    });
    return response;
  } catch (error) {
    console.error('Error updating receipt:', error);
    throw error;
  }
};

// Delete a receipt
export const deleteReceipt = async (id: string) => {
  try {
    const response = await api.fetchWithAuth(`/receipts/${id}`, {
      method: 'DELETE',
    });
    return response;
  } catch (error) {
    console.error('Error deleting receipt:', error);
    throw error;
  }
};