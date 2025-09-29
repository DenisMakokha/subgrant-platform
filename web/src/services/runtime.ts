import { fetchWithAuth } from './api';

export interface UserExperience {
  user: {
    id: string;
    email: string;
  };
  roles: Array<{ id: string; label: string }>;
  caps: string[];
  scopes: Record<string, string>;
  flags: Record<string, boolean>;
}

export interface DashboardConfig {
  role_id: string;
  version: number;
  menus_json: any[];
  pages_json: any[];
}

/**
 * Fetch user experience data
 * @returns Promise<UserExperience>
 */
export async function getExperience(): Promise<UserExperience> {
  try {
    const response = await fetchWithAuth('/app/experience');
    return response;
  } catch (error) {
    console.error('Error fetching user experience:', error);
    throw error;
  }
}

/**
 * Fetch dashboard configuration for a role
 * @param role Role ID
 * @returns Promise<DashboardConfig>
 */
export async function getDashboardConfig(role: string): Promise<DashboardConfig> {
  try {
    const response = await fetchWithAuth(`/app/dashboard-config?role=${role}`);
    return response;
  } catch (error) {
    console.error('Error fetching dashboard config:', error);
    throw error;
  }
}

/**
 * Fetch data by key with parameters
 * @param key Data key
 * @param params Query parameters
 * @returns Promise<any>
 */
export async function getDataByKey(key: string, params: Record<string, any> = {}): Promise<any> {
  try {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/ssot/data/${key}?${queryString}` : `/ssot/data/${key}`;
    const response = await fetchWithAuth(url);
    return response;
  } catch (error) {
    console.error(`Error fetching data for key ${key}:`, error);
    throw error;
  }
}

/**
 * Execute an action
 * @param actionKey Action key
 * @param payload Action payload
 * @returns Promise<any>
 */
export async function executeAction(actionKey: string, payload: Record<string, any> = {}): Promise<any> {
  try {
    const response = await fetchWithAuth('/ssot/action', {
      method: 'POST',
      body: JSON.stringify({ actionKey, payload })
    });
    return response;
  } catch (error) {
    console.error(`Error executing action ${actionKey}:`, error);
    throw error;
  }
}