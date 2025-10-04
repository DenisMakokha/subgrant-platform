import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Activity types
export interface Activity {
  id: number;
  organization_id: string;
  user_id: string | null;
  activity_type: string;
  activity_category: 'budget' | 'report' | 'document' | 'project' | 'contract' | 'system';
  title: string;
  description: string | null;
  metadata: Record<string, any>;
  entity_type: string | null;
  entity_id: number | null;
  severity: 'info' | 'warning' | 'error' | 'success';
  is_read: boolean;
  created_at: string;
  updated_at: string;
  user_email?: string;
  organization_name?: string;
}

export interface ActivityStats {
  activity_category: string;
  count: number;
  unread_count: number;
}

interface UseActivityLogOptions {
  limit?: number;
  category?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseActivityLogReturn {
  activities: Activity[];
  stats: ActivityStats[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  totalCount: number;
  unreadCount: number;
  fetchActivities: () => Promise<void>;
  markAsRead: (activityId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshStats: () => Promise<void>;
}

const API_BASE_URL = '/api/partner/dashboard/activity';

export function useActivityLog(options: UseActivityLogOptions = {}): UseActivityLogReturn {
  const {
    limit = 20,
    category,
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
  } = options;

  const [activities, setActivities] = useState<Activity[]>([]);
  const [stats, setStats] = useState<ActivityStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch activities
  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, any> = { limit };
      if (category) params.category = category;

      const response = await axios.get(API_BASE_URL, { params });

      if (response.data.success) {
        setActivities(response.data.data.activities);
        setTotalCount(response.data.data.total);
        setHasMore(response.data.data.hasMore);
        
        // Calculate unread count
        const unread = response.data.data.activities.filter(
          (a: Activity) => !a.is_read
        ).length;
        setUnreadCount(unread);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch activities');
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  }, [limit, category]);

  // Fetch statistics
  const refreshStats = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/stats`);
      
      if (response.data.success) {
        setStats(response.data.data);
        
        // Calculate total unread from stats
        const totalUnread = response.data.data.reduce(
          (sum: number, stat: ActivityStats) => sum + stat.unread_count,
          0
        );
        setUnreadCount(totalUnread);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  // Mark activity as read
  const markAsRead = useCallback(async (activityId: number) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/${activityId}/read`);
      
      if (response.data.success) {
        // Update local state
        setActivities(prev =>
          prev.map(activity =>
            activity.id === activityId
              ? { ...activity, is_read: true }
              : activity
          )
        );
        
        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        // Refresh stats
        await refreshStats();
      }
    } catch (err: any) {
      console.error('Error marking activity as read:', err);
      throw err;
    }
  }, [refreshStats]);

  // Mark all activities as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/read-all`);
      
      if (response.data.success) {
        // Update local state
        setActivities(prev =>
          prev.map(activity => ({ ...activity, is_read: true }))
        );
        
        // Reset unread count
        setUnreadCount(0);
        
        // Refresh stats
        await refreshStats();
      }
    } catch (err: any) {
      console.error('Error marking all as read:', err);
      throw err;
    }
  }, [refreshStats]);

  // Initial fetch
  useEffect(() => {
    fetchActivities();
    refreshStats();
  }, [fetchActivities, refreshStats]);

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(() => {
        fetchActivities();
        refreshStats();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, fetchActivities, refreshStats]);

  return {
    activities,
    stats,
    loading,
    error,
    hasMore,
    totalCount,
    unreadCount,
    fetchActivities,
    markAsRead,
    markAllAsRead,
    refreshStats,
  };
}
