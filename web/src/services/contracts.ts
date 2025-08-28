import api from './api';
import { Contract, ContractArtifact } from '../types/index';

// Get all contracts with optional filters
export const getContracts = async (filters?: { status?: string; budget_id?: string }) => {
  try {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.budget_id) params.append('budget_id', filters.budget_id);
    
    const response = await api.fetchWithAuth(`/contracts?${params.toString()}`);
    return response;
  } catch (error) {
    console.error('Error fetching contracts:', error);
    throw error;
  }
};

// Get a contract by ID
export const getContractById = async (id: string) => {
  try {
    const response = await api.fetchWithAuth(`/contracts/${id}`);
    return response;
  } catch (error) {
    console.error('Error fetching contract:', error);
    throw error;
  }
};

// Get contracts by budget ID
export const getContractsByBudgetId = async (budgetId: string) => {
  try {
    const response = await api.fetchWithAuth(`/contracts/budget/${budgetId}`);
    return response;
  } catch (error) {
    console.error('Error fetching contracts by budget ID:', error);
    throw error;
  }
};

// Create a new contract
export const createContract = async (contractData: Partial<Contract>) => {
  try {
    const response = await api.fetchWithAuth('/contracts', {
      method: 'POST',
      body: JSON.stringify(contractData),
    });
    return response;
  } catch (error) {
    console.error('Error creating contract:', error);
    throw error;
  }
};

// Update a contract
export const updateContract = async (id: string, contractData: Partial<Contract>) => {
  try {
    const response = await api.fetchWithAuth(`/contracts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(contractData),
    });
    return response;
  } catch (error) {
    console.error('Error updating contract:', error);
    throw error;
  }
};

// Delete a contract
export const deleteContract = async (id: string) => {
  try {
    const response = await api.fetchWithAuth(`/contracts/${id}`, {
      method: 'DELETE',
    });
    return response;
  } catch (error) {
    console.error('Error deleting contract:', error);
    throw error;
  }
};

// Send contract for signing
export const sendContractForSigning = async (contractId: string, signerData: { signerEmail: string; signerName: string }) => {
  try {
    const response = await api.fetchWithAuth(`/contracts/${contractId}/send-for-signing`, {
      method: 'POST',
      body: JSON.stringify(signerData),
    });
    return response;
  } catch (error) {
    console.error('Error sending contract for signing:', error);
    throw error;
  }
};

// Upload a contract document
export const uploadContractDocument = async (contractId: string, documentData: Partial<ContractArtifact>) => {
  try {
    const response = await api.fetchWithAuth(`/contracts/${contractId}/artifacts`, {
      method: 'POST',
      body: JSON.stringify(documentData),
    });
    return response;
  } catch (error) {
    console.error('Error uploading contract document:', error);
    throw error;
  }
};

// Get contract artifacts
export const getContractArtifacts = async (contractId: string) => {
  try {
    const response = await api.fetchWithAuth(`/contracts/${contractId}/artifacts`);
    return response;
  } catch (error) {
    console.error('Error fetching contract artifacts:', error);
    throw error;
  }
};

// Get latest contract artifact
export const getLatestContractArtifact = async (contractId: string) => {
  try {
    const response = await api.fetchWithAuth(`/contracts/${contractId}/artifacts/latest`);
    return response;
  } catch (error) {
    console.error('Error fetching latest contract artifact:', error);
    throw error;
  }
};

// Download contract document
export const downloadContractDocument = async (artifactId: string) => {
  try {
    const response = await api.fetchWithAuth(`/contracts/artifacts/${artifactId}/download`);
    return response;
  } catch (error) {
    console.error('Error downloading contract document:', error);
    throw error;
  }
};