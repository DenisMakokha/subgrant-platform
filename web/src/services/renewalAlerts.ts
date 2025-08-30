// Renewal Alerts service for making HTTP requests to the backend
import api from './api';
import { RenewalAlert } from '../types';

// Get renewal alerts for the current user
export const getRenewalAlerts = async (): Promise<RenewalAlert[]> => {
  try {
    const response = await api.fetchWithAuth('/renewal-alerts');
    return response;
  } catch (error) {
    console.error('Error fetching renewal alerts:', error);
    throw error;
  }
};

// Send renewal alerts (admin only)
export const sendRenewalAlerts = async (): Promise<any> => {
  try {
    const response = await api.fetchWithAuth('/renewal-alerts/send', {
      method: 'POST',
    });
    return response;
  } catch (error) {
    console.error('Error sending renewal alerts:', error);
    throw error;
  }
};

// Check for renewal alerts (for testing)
export const checkRenewalAlerts = async (): Promise<RenewalAlert[]> => {
  try {
    const response = await api.fetchWithAuth('/renewal-alerts/check');
    return response;
  } catch (error) {
    console.error('Error checking renewal alerts:', error);
    throw error;
  }
};