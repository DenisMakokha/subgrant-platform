import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCapabilities } from './useCapabilities';
import {
  DashboardConfig,
  UserDashboardPreferences,
  generateDashboardFromCapabilities,
  getDefaultDashboardForRole,
  filterWidgetsByCapabilities
} from '../config/dashboards';

/**
 * useDashboard Hook
 * 
 * Manages dashboard configuration, preferences, and state
 * Automatically generates dashboard based on user capabilities
 */

interface UseDashboardReturn {
  dashboard: DashboardConfig | null;
  preferences: UserDashboardPreferences | null;
  loading: boolean;
  error: string | null;
  refreshDashboard: () => Promise<void>;
  updatePreferences: (prefs: Partial<UserDashboardPreferences>) => Promise<void>;
  resetToDefault: () => Promise<void>;
}

export function useDashboard(): UseDashboardReturn {
  const { user } = useAuth();
  const { capabilities } = useCapabilities();
  
  const [dashboard, setDashboard] = useState<DashboardConfig | null>(null);
  const [preferences, setPreferences] = useState<UserDashboardPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && capabilities.length > 0) {
      loadDashboard();
    }
  }, [user, capabilities]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to load user preferences from backend
      const token = localStorage.getItem('token');
      const prefsResponse = await fetch('/api/dashboard/preferences', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      let userPrefs: UserDashboardPreferences | null = null;
      
      if (prefsResponse.ok) {
        const result = await prefsResponse.json();
        userPrefs = result.data;
        setPreferences(userPrefs);
      }

      // Generate or load dashboard config
      let config: DashboardConfig;

      if (userPrefs?.dashboardId) {
        // Load custom dashboard
        const dashboardResponse = await fetch(`/api/dashboard/config/${userPrefs.dashboardId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (dashboardResponse.ok) {
          const result = await dashboardResponse.json();
          config = result.data;
        } else {
          // Fallback to default
          config = generateDefaultDashboard();
        }
      } else {
        // Generate default dashboard
        config = generateDefaultDashboard();
      }

      // Filter widgets based on capabilities
      config.widgets = filterWidgetsByCapabilities(config.widgets, capabilities);

      setDashboard(config);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Failed to load dashboard');
      
      // Fallback to generated dashboard
      const fallbackConfig = generateDefaultDashboard();
      fallbackConfig.widgets = filterWidgetsByCapabilities(fallbackConfig.widgets, capabilities);
      setDashboard(fallbackConfig);
    } finally {
      setLoading(false);
    }
  };

  const generateDefaultDashboard = (): DashboardConfig => {
    if (!user) {
      return {
        id: 'empty',
        name: 'Dashboard',
        layout: 'grid',
        columns: 3,
        widgets: []
      };
    }

    // Try to get role-specific template
    const template = getDefaultDashboardForRole(user.role);
    
    if (template) {
      return template.config;
    }

    // Generate from capabilities
    return generateDashboardFromCapabilities(
      capabilities,
      user.id,
      user.name || user.email
    );
  };

  const refreshDashboard = async () => {
    await loadDashboard();
  };

  const updatePreferences = async (prefs: Partial<UserDashboardPreferences>) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/dashboard/preferences', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(prefs)
      });

      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }

      const result = await response.json();
      setPreferences(result.data);
      
      // Reload dashboard with new preferences
      await loadDashboard();
    } catch (err) {
      console.error('Error updating preferences:', err);
      throw err;
    }
  };

  const resetToDefault = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/dashboard/preferences', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setPreferences(null);
      await loadDashboard();
    } catch (err) {
      console.error('Error resetting dashboard:', err);
      throw err;
    }
  };

  return {
    dashboard,
    preferences,
    loading,
    error,
    refreshDashboard,
    updatePreferences,
    resetToDefault
  };
}
