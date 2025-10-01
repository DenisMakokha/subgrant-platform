import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchWithAuth } from '../services/api';
import { useAuth } from './AuthContext';

export interface Notification {
  id: string;
  user_id: string;
  tenant_id?: string;
  event_key: string;
  title: string;
  body: string;
  message: string; // Alias for body
  link_url?: string;
  action_url?: string; // Alias for link_url
  action_text?: string;
  unread: boolean;
  read: boolean; // Inverse of unread
  type?: string; // Notification type (info, warning, error, success)
  category?: string; // Category (budget, report, contract, etc.)
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'created_at' | 'unread'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | undefined>(undefined);
  const { user } = useAuth();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // Use SSoT notification list endpoint
      if (!user) {
        // If user is not authenticated, clear notifications
        setNotifications([]);
        setUnreadCount(0);
        return;
      }
      
      const data = await fetchWithAuth(`/ssot/data/notification.list?userId=${user.id}`);
      
      // Map notifications to include all required properties
      const mappedNotifications = (data?.items || []).map((n: any) => ({
        ...n,
        message: n.message || n.body, // Use message if available, fallback to body
        action_url: n.action_url || n.link_url, // Use action_url if available, fallback to link_url
        read: !n.unread, // Compute read as inverse of unread
        type: n.type || 'info', // Default type
        category: n.category || 'general', // Default category
        priority: n.priority || 'normal', // Default priority
      }));
      
      setNotifications(mappedNotifications);
      
      // Calculate unread count from the fetched notifications
      const unread = mappedNotifications.filter((n: Notification) => n.unread).length || 0;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // Use SSoT notification mark as read action
      await fetchWithAuth('/ssot/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          actionKey: 'notification.markAsRead',
          payload: {
            notificationId
          }
        })
      });
      
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, unread: false, read: true }
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Use SSoT notification mark all as read action
      await fetchWithAuth('/ssot/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          actionKey: 'notification.markAllAsRead',
          payload: {}
        })
      });
      
      setNotifications(prev => 
        prev.map(notification => ({ 
          ...notification, 
          unread: false,
          read: true
        }))
      );
      
      // Reset unread count
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      // Note: Delete endpoint may not be available in SSoT, keeping for compatibility
      // In a real implementation, we might need to add a delete action to the SSOT system
      console.warn('Delete notification functionality not implemented in SSOT');
      
      // Update local state
      setNotifications(prev => {
        const filtered = prev.filter(notification => notification.id !== notificationId);
        // Update unread count if deleted notification was unread
        const deletedNotification = prev.find(n => n.id === notificationId);
        if (deletedNotification && deletedNotification.unread) {
          setUnreadCount(prevCount => Math.max(0, prevCount - 1));
        }
        return filtered;
      });
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'created_at' | 'unread' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      unread: true,
      read: false,
      message: notification.body,
      type: notification.type || 'info',
      category: notification.category || 'general',
      priority: notification.priority || 'normal',
    };
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  useEffect(() => {
    fetchNotifications();
    
    // Set up polling for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
