import api from './api';

// Get KPI dashboard data
export const getKpiDashboardData = async () => {
  try {
    const response = await api.fetchWithAuth('/kpi/dashboard');
    return response;
  } catch (error) {
    console.error('Error fetching KPI dashboard data:', error);
    throw error;
  }
};

// Get KPI data for a specific project
export const getProjectKpiData = async (projectId: string) => {
  try {
    const response = await api.fetchWithAuth(`/kpi/project/${projectId}`);
    return response;
  } catch (error) {
    console.error('Error fetching project KPI data:', error);
    throw error;
  }
};