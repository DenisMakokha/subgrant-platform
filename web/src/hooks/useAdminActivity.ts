import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '../services/api';

interface AdminActivity {
  id: number;
  admin_id: number;
  admin_email: string;
  admin_role: string;
  action: string;
  entity_type: string;
  entity_id: number | null;
  changes: any;
  ip_address: string | null;
  user_agent: string | null;
  request_id: string | null;
  session_id: string | null;
  result: 'success' | 'failure' | 'error';
  error_message: string | null;
  created_at: string;
}

interface ActivityStats {
  total_actions: number;
  unique_admins: number;
  successful_actions: number;
  failed_actions: number;
  error_actions: number;
  actions_last_24h: number;
  actions_last_week: number;
  actions_last_month: number;
}

interface ActivityFilters {
  adminId?: number;
  action?: string;
  entityType?: string;
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
}

interface UseAdminActivityReturn {
  activities: AdminActivity[];
  stats: ActivityStats | null;
  loading: boolean;
  error: string | null;
  refreshActivities: () => void;
  refreshStats: () => void;
}

/**
 * Custom hook for managing admin activity data
 * @param filters - Optional filters for activities
 * @param autoRefresh - Auto-refresh interval in milliseconds (default: 30000)
 */
export const useAdminActivity = (
  filters: ActivityFilters = {},
  autoRefresh: number = 30000
): UseAdminActivityReturn => {
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      
      if (filters.adminId) params.append('adminId', filters.adminId.toString());
      if (filters.action) params.append('action', filters.action);
      if (filters.entityType) params.append('entityType', filters.entityType);
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.offset) params.append('offset', filters.offset.toString());
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await fetchWithAuth(`/admin/activity?${params.toString()}`);
      
      if (response.success) {
        setActivities(response.data);
        setError(null);
      } else {
        setError('Failed to fetch activities');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching activities');
      console.error('Error fetching admin activities:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchStats = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      
      if (filters.adminId) params.append('adminId', filters.adminId.toString());
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await fetchWithAuth(`/admin/activity/stats?${params.toString()}`);
      
      if (response.success) {
        setStats(response.data);
      }
    } catch (err: any) {
      console.error('Error fetching activity stats:', err);
    }
  }, [filters]);

  const refreshActivities = useCallback(() => {
    setLoading(true);
    fetchActivities();
  }, [fetchActivities]);

  const refreshStats = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

  // Initial fetch
  useEffect(() => {
    fetchActivities();
    fetchStats();
  }, [fetchActivities, fetchStats]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh > 0) {
      const interval = setInterval(() => {
        fetchActivities();
        fetchStats();
      }, autoRefresh);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchActivities, fetchStats]);

  return {
    activities,
    stats,
    loading,
    error,
    refreshActivities,
    refreshStats,
  };
};

/**
 * Hook for fetching activity timeline data
 */
export const useActivityTimeline = (
  interval: 'hour' | 'day' = 'day',
  startDate?: string,
  endDate?: string
) => {
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const params = new URLSearchParams();
        params.append('interval', interval);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const response = await fetchWithAuth(`/admin/activity/timeline?${params.toString()}`);
        
        if (response.success) {
          setTimeline(response.data);
          setError(null);
        }
      } catch (err: any) {
        setError(err.message || 'Error fetching timeline');
        console.error('Error fetching activity timeline:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTimeline();
  }, [interval, startDate, endDate]);

  return { timeline, loading, error };
};

/**
 * Hook for fetching top admins
 */
export const useTopAdmins = (limit: number = 10) => {
  const [topAdmins, setTopAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopAdmins = async () => {
      try {
        const response = await fetchWithAuth(`/admin/activity/top-admins?limit=${limit}`);
        
        if (response.success) {
          setTopAdmins(response.data);
          setError(null);
        }
      } catch (err: any) {
        setError(err.message || 'Error fetching top admins');
        console.error('Error fetching top admins:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTopAdmins();
  }, [limit]);

  return { topAdmins, loading, error };
};

/**
 * Hook for searching activities
 */
export const useActivitySearch = (query: string, limit: number = 50) => {
  const [results, setResults] = useState<AdminActivity[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const searchActivities = async () => {
      setLoading(true);
      try {
        const response = await fetchWithAuth(`/admin/activity/search?q=${encodeURIComponent(query)}&limit=${limit}`);
        
        if (response.success) {
          setResults(response.data);
          setError(null);
        }
      } catch (err: any) {
        setError(err.message || 'Error searching activities');
        console.error('Error searching activities:', err);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(() => {
      searchActivities();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, limit]);

  return { results, loading, error };
};

export default useAdminActivity;
