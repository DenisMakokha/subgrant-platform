import { useState, useEffect } from 'react';

/**
 * useWidgets Hook
 * 
 * Manages widget data fetching and state
 * Provides real-time updates and refresh capabilities
 */

interface WidgetData {
  [key: string]: any;
}

interface UseWidgetsReturn {
  data: WidgetData;
  loading: boolean;
  error: string | null;
  refresh: (widgetId?: string) => Promise<void>;
  updateData: (widgetId: string, newData: any) => void;
}

export function useWidgets(widgetIds: string[], refreshInterval?: number): UseWidgetsReturn {
  const [data, setData] = useState<WidgetData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllWidgets();

    // Set up auto-refresh if interval is provided
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(() => {
        fetchAllWidgets();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [widgetIds, refreshInterval]);

  const fetchAllWidgets = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const promises = widgetIds.map(async (widgetId) => {
        try {
          const response = await fetch(`/api/dashboard/widgets/${widgetId}/data`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch widget ${widgetId}`);
          }

          const result = await response.json();
          return { widgetId, data: result.data };
        } catch (err) {
          console.error(`Error fetching widget ${widgetId}:`, err);
          return { widgetId, data: null };
        }
      });

      const results = await Promise.all(promises);
      
      const newData: WidgetData = {};
      results.forEach(({ widgetId, data }) => {
        newData[widgetId] = data;
      });

      setData(newData);
    } catch (err) {
      console.error('Error fetching widgets:', err);
      setError('Failed to load widget data');
    } finally {
      setLoading(false);
    }
  };

  const refresh = async (widgetId?: string) => {
    if (widgetId) {
      // Refresh single widget
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/dashboard/widgets/${widgetId}/data`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to refresh widget ${widgetId}`);
        }

        const result = await response.json();
        setData(prev => ({
          ...prev,
          [widgetId]: result.data
        }));
      } catch (err) {
        console.error(`Error refreshing widget ${widgetId}:`, err);
      }
    } else {
      // Refresh all widgets
      await fetchAllWidgets();
    }
  };

  const updateData = (widgetId: string, newData: any) => {
    setData(prev => ({
      ...prev,
      [widgetId]: newData
    }));
  };

  return {
    data,
    loading,
    error,
    refresh,
    updateData
  };
}
