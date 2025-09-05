import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fetchWithAuth } from '../services/api';
import {
  BellIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XMarkIcon,
  EyeIcon,
  TrashIcon,
  CogIcon,
  ClockIcon,
  CalendarIcon,
  UserGroupIcon,
  ChartBarIcon,
  DocumentTextIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'system' | 'project' | 'financial' | 'compliance' | 'deadline';
  is_read: boolean;
  created_at: string;
  project_id?: string;
  project_name?: string;
  action_url?: string;
}

interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  system_alerts: boolean;
  project_updates: boolean;
  financial_alerts: boolean;
  compliance_reminders: boolean;
  deadline_warnings: boolean;
  notification_frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

interface DeadlineReminder {
  id: string;
  title: string;
  description: string;
  due_date: string;
  project_name: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'upcoming' | 'overdue' | 'completed';
  days_until_due: number;
  reminder_sent: boolean;
}

interface EscalationRule {
  id: string;
  name: string;
  trigger_condition: string;
  escalation_level: number;
  notify_users: string[];
  delay_hours: number;
  is_active: boolean;
  created_at: string;
}

interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: 'email' | 'push' | 'sms';
  category: string;
  variables: string[];
  is_active: boolean;
}

const NotificationsManagementTabs: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Tab management
  const [activeTab, setActiveTab] = useState('notifications');
  
  // Notifications tab state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Settings tab state
  const [settings, setSettings] = useState<NotificationSettings>({
    email_notifications: true,
    push_notifications: true,
    system_alerts: true,
    project_updates: true,
    financial_alerts: true,
    compliance_reminders: true,
    deadline_warnings: true,
    notification_frequency: 'immediate',
    quiet_hours_enabled: false,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00'
  });
  
  // Deadlines tab state
  const [deadlines, setDeadlines] = useState<DeadlineReminder[]>([]);
  const [deadlineFilter, setDeadlineFilter] = useState<string>('all');
  
  // Escalation tab state
  const [escalationRules, setEscalationRules] = useState<EscalationRule[]>([]);
  const [showEscalationModal, setShowEscalationModal] = useState(false);
  
  // Templates tab state
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  
  // Common state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab configuration
  const tabs = [
    { id: 'notifications', name: 'Notifications', icon: BellIcon, path: '/notifications' },
    { id: 'settings', name: 'Settings', icon: CogIcon, path: '/notifications/settings' },
    { id: 'deadlines', name: 'Deadlines', icon: ClockIcon, path: '/notifications/deadlines' },
    { id: 'escalation', name: 'Escalation', icon: ExclamationTriangleIcon, path: '/notifications/escalation' },
    { id: 'templates', name: 'Templates', icon: DocumentTextIcon, path: '/notifications/templates' }
  ];

  // Set active tab based on URL
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/settings')) setActiveTab('settings');
    else if (path.includes('/deadlines')) setActiveTab('deadlines');
    else if (path.includes('/escalation')) setActiveTab('escalation');
    else if (path.includes('/templates')) setActiveTab('templates');
    else setActiveTab('notifications');
  }, [location.pathname]);

  // Handle tab change
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      navigate(tab.path);
    }
  };

  // Fetch data based on active tab
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      switch (activeTab) {
        case 'notifications':
          await fetchNotifications();
          break;
        case 'settings':
          await fetchSettings();
          break;
        case 'deadlines':
          await fetchDeadlines();
          break;
        case 'escalation':
          await fetchEscalationRules();
          break;
        case 'templates':
          await fetchTemplates();
          break;
      }
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetchWithAuth('/api/notifications');
      const data = await response.json();
      
      // Mock data for demonstration
      const mockNotifications: Notification[] = [
        {
          id: '1',
          title: 'Budget Review Required',
          message: 'Budget for Rural Education Enhancement project requires your review and approval.',
          type: 'warning',
          priority: 'high',
          category: 'financial',
          is_read: false,
          created_at: '2024-01-25T10:30:00Z',
          project_id: 'proj-1',
          project_name: 'Rural Education Enhancement'
        },
        {
          id: '2',
          title: 'Contract Signed',
          message: 'Community Health Program contract has been successfully signed by all parties.',
          type: 'success',
          priority: 'medium',
          category: 'project',
          is_read: false,
          created_at: '2024-01-24T14:15:00Z',
          project_id: 'proj-2',
          project_name: 'Community Health Program'
        },
        {
          id: '3',
          title: 'Compliance Document Expiring',
          message: 'Your organization compliance certificate will expire in 30 days. Please renew.',
          type: 'warning',
          priority: 'high',
          category: 'compliance',
          is_read: true,
          created_at: '2024-01-23T09:00:00Z'
        },
        {
          id: '4',
          title: 'System Maintenance Scheduled',
          message: 'System maintenance is scheduled for this weekend from 2:00 AM to 6:00 AM.',
          type: 'info',
          priority: 'low',
          category: 'system',
          is_read: false,
          created_at: '2024-01-22T16:45:00Z'
        }
      ];

      setNotifications(data?.notifications || mockNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetchWithAuth('/api/notifications/settings');
      const data = await response.json();
      if (data?.settings) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchDeadlines = async () => {
    try {
      const response = await fetchWithAuth('/api/notifications/deadlines');
      const data = await response.json();
      
      // Mock data for demonstration
      const mockDeadlines: DeadlineReminder[] = [
        {
          id: '1',
          title: 'Project Report Submission',
          description: 'Submit quarterly progress report for Rural Education Enhancement',
          due_date: '2024-02-15T23:59:59Z',
          project_name: 'Rural Education Enhancement',
          priority: 'high',
          status: 'upcoming',
          days_until_due: 5,
          reminder_sent: false
        },
        {
          id: '2',
          title: 'Budget Review Deadline',
          description: 'Complete budget review and approval for Community Health Program',
          due_date: '2024-02-10T17:00:00Z',
          project_name: 'Community Health Program',
          priority: 'urgent',
          status: 'overdue',
          days_until_due: -2,
          reminder_sent: true
        },
        {
          id: '3',
          title: 'Compliance Certificate Renewal',
          description: 'Renew organization compliance certificate',
          due_date: '2024-03-01T23:59:59Z',
          project_name: 'Organization Management',
          priority: 'medium',
          status: 'upcoming',
          days_until_due: 20,
          reminder_sent: false
        }
      ];

      setDeadlines(data?.deadlines || mockDeadlines);
    } catch (error) {
      console.error('Error fetching deadlines:', error);
    }
  };

  const fetchEscalationRules = async () => {
    try {
      const response = await fetchWithAuth('/api/notifications/escalation-rules');
      const data = await response.json();
      
      // Mock data for demonstration
      const mockRules: EscalationRule[] = [
        {
          id: '1',
          name: 'Budget Approval Overdue',
          trigger_condition: 'Budget pending approval > 48 hours',
          escalation_level: 1,
          notify_users: ['manager@example.com', 'admin@example.com'],
          delay_hours: 48,
          is_active: true,
          created_at: '2024-01-15T10:00:00Z'
        },
        {
          id: '2',
          name: 'Critical System Alert',
          trigger_condition: 'System error with high priority',
          escalation_level: 2,
          notify_users: ['sysadmin@example.com', 'cto@example.com'],
          delay_hours: 1,
          is_active: true,
          created_at: '2024-01-10T15:30:00Z'
        }
      ];

      setEscalationRules(data?.rules || mockRules);
    } catch (error) {
      console.error('Error fetching escalation rules:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetchWithAuth('/api/notifications/templates');
      const data = await response.json();
      
      // Mock data for demonstration
      const mockTemplates: NotificationTemplate[] = [
        {
          id: '1',
          name: 'Budget Approval Required',
          subject: 'Budget Approval Required for {{project_name}}',
          content: 'The budget for {{project_name}} requires your approval. Amount: {{amount}}. Please review and approve.',
          type: 'email',
          category: 'financial',
          variables: ['project_name', 'amount'],
          is_active: true
        },
        {
          id: '2',
          name: 'Project Deadline Reminder',
          subject: 'Deadline Reminder: {{task_name}}',
          content: 'This is a reminder that {{task_name}} is due on {{due_date}}. Please complete it on time.',
          type: 'push',
          category: 'deadline',
          variables: ['task_name', 'due_date'],
          is_active: true
        }
      ];

      setTemplates(data?.templates || mockTemplates);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  // Notification handlers
  const handleMarkAsRead = async (id: string) => {
    try {
      await fetchWithAuth(`/api/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, is_read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await fetchWithAuth(`/api/notifications/${id}`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetchWithAuth('/api/notifications/mark-all-read', { method: 'PUT' });
      setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Settings handlers
  const handleSaveSettings = async () => {
    try {
      await fetchWithAuth('/api/notifications/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    }
  };

  // Utility functions
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />;
      case 'success':
        return <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />;
      default:
        return <InformationCircleIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      low: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[priority as keyof typeof colors] || colors.low}`}>
        {priority}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      upcoming: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || colors.upcoming}`}>
        {status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const formatDueDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter functions
  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = selectedFilter === 'all' || 
      (selectedFilter === 'unread' && !notification.is_read) ||
      notification.category === selectedFilter;
    
    const matchesSearch = !searchTerm || 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const filteredDeadlines = deadlines.filter(deadline => {
    return deadlineFilter === 'all' || deadline.status === deadlineFilter;
  });

  // Statistics
  const unreadCount = notifications.filter(n => !n.is_read).length;
  const urgentCount = notifications.filter(n => n.priority === 'urgent' && !n.is_read).length;
  const overdueDeadlines = deadlines.filter(d => d.status === 'overdue').length;
  const upcomingDeadlines = deadlines.filter(d => d.status === 'upcoming' && d.days_until_due <= 7).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header with Gradient */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl shadow-xl">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative p-8">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <BellIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-white">
                        Notifications Management
                      </h1>
                      <p className="text-blue-100 mt-1">
                        Manage notifications, alerts, and communication preferences
                      </p>
                    </div>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <div className="text-right">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                      <p className="text-sm text-blue-100 font-medium">
                        {unreadCount} Unread
                      </p>
                      <p className="text-xs text-blue-200 mt-1">
                        {urgentCount} Urgent
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl"></div>
          </div>

          {/* Tabs Navigation */}
          <div className="glass-card p-1">
            <nav className="flex space-x-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.name}
                    {tab.id === 'notifications' && unreadCount > 0 && (
                      <span className="ml-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                    {tab.id === 'deadlines' && overdueDeadlines > 0 && (
                      <span className="ml-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                        {overdueDeadlines}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="glass-card p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <BellIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{notifications.length}</p>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                      <BellIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unread</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{unreadCount}</p>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30">
                      <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Urgent</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{urgentCount}</p>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                      <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Read</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{notifications.length - unreadCount}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="glass-card p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notification Center</h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      Manage your notifications and alerts
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="btn-secondary text-sm"
                      >
                        Mark All Read
                      </button>
                    )}
                  </div>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Search notifications..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'all', label: 'All' },
                      { key: 'unread', label: 'Unread' },
                      { key: 'system', label: 'System' },
                      { key: 'project', label: 'Projects' },
                      { key: 'financial', label: 'Financial' },
                      { key: 'compliance', label: 'Compliance' },
                      { key: 'deadline', label: 'Deadlines' }
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setSelectedFilter(key)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedFilter === key
                            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        {label}
                        {key === 'unread' && unreadCount > 0 && (
                          <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                            {unreadCount}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notifications List */}
                <div className="space-y-4">
                  {filteredNotifications.length === 0 ? (
                    <div className="text-center py-12">
                      <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No notifications</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {selectedFilter === 'unread' 
                          ? 'All caught up! No unread notifications.'
                          : 'No notifications match your current filter.'
                        }
                      </p>
                    </div>
                  ) : (
                    filteredNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`border rounded-lg p-4 transition-colors ${
                          notification.is_read
                            ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50'
                            : 'border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/10'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className={`text-sm font-medium ${
                                    notification.is_read
                                      ? 'text-gray-700 dark:text-gray-300'
                                      : 'text-gray-900 dark:text-white'
                                  }`}>
                                    {notification.title}
                                  </h3>
                                  {getPriorityBadge(notification.priority)}
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                  {notification.message}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                  <span>{formatDate(notification.created_at)}</span>
                                  {notification.project_name && (
                                    <>
                                      <span>•</span>
                                      <span>{notification.project_name}</span>
                                    </>
                                  )}
                                  <span>•</span>
                                  <span className="capitalize">{notification.category}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {!notification.is_read && (
                                  <button
                                    onClick={() => handleMarkAsRead(notification.id)}
                                    className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    title="Mark as read"
                                  >
                                    <EyeIcon className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteNotification(notification.id)}
                                  className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                  title="Delete notification"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Notification Settings
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      Configure your notification preferences and delivery methods
                    </p>
                  </div>
                  <button
                    onClick={handleSaveSettings}
                    className="btn-primary"
                  >
                    Save Settings
                  </button>
                </div>
                
                <div className="space-y-8">
                  {/* Notification Types */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Notification Types
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        { key: 'email_notifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
                        { key: 'push_notifications', label: 'Push Notifications', desc: 'Browser push notifications' },
                        { key: 'system_alerts', label: 'System Alerts', desc: 'System maintenance and updates' },
                        { key: 'project_updates', label: 'Project Updates', desc: 'Project status changes' },
                        { key: 'financial_alerts', label: 'Financial Alerts', desc: 'Budget and disbursement alerts' },
                        { key: 'compliance_reminders', label: 'Compliance Reminders', desc: 'Compliance deadlines' },
                        { key: 'deadline_warnings', label: 'Deadline Warnings', desc: 'Project deadline reminders' }
                      ].map(({ key, label, desc }) => (
                        <div key={key} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {label}
                            </label>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {desc}
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings[key as keyof NotificationSettings] as boolean}
                              onChange={(e) => setSettings(prev => ({ ...prev, [key]: e.target.checked }))}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Frequency Settings */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Notification Frequency
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Delivery Frequency
                        </label>
                        <select
                          value={settings.notification_frequency}
                          onChange={(e) => setSettings(prev => ({ ...prev, notification_frequency: e.target.value as any }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="immediate">Immediate</option>
                          <option value="hourly">Hourly Digest</option>
                          <option value="daily">Daily Digest</option>
                          <option value="weekly">Weekly Digest</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Quiet Hours */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      Quiet Hours
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Enable Quiet Hours
                          </label>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Suppress non-urgent notifications during specified hours
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.quiet_hours_enabled}
                            onChange={(e) => setSettings(prev => ({ ...prev, quiet_hours_enabled: e.target.checked }))}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                        </label>
                      </div>

                      {settings.quiet_hours_enabled && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Start Time
                            </label>
                            <input
                              type="time"
                              value={settings.quiet_hours_start}
                              onChange={(e) => setSettings(prev => ({ ...prev, quiet_hours_start: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              End Time
                            </label>
                            <input
                              type="time"
                              value={settings.quiet_hours_end}
                              onChange={(e) => setSettings(prev => ({ ...prev, quiet_hours_end: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'deadlines' && (
            <div className="space-y-6">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <CalendarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Deadlines</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{deadlines.length}</p>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                      <ClockIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Due Soon</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{upcomingDeadlines}</p>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30">
                      <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{overdueDeadlines}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deadlines List */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Deadline Reminders
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      Track and manage project deadlines and reminders
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {['all', 'upcoming', 'overdue', 'completed'].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setDeadlineFilter(filter)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          deadlineFilter === filter
                            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        {filter.charAt(0).toUpperCase() + filter.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredDeadlines.map((deadline) => (
                    <div
                      key={deadline.id}
                      className={`border rounded-lg p-4 ${
                        deadline.status === 'overdue'
                          ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
                          : deadline.days_until_due <= 3
                          ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/10'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                              {deadline.title}
                            </h3>
                            {getPriorityBadge(deadline.priority)}
                            {getStatusBadge(deadline.status)}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {deadline.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <span>Due: {formatDueDate(deadline.due_date)}</span>
                            <span>•</span>
                            <span>{deadline.project_name}</span>
                            <span>•</span>
                            <span>
                              {deadline.days_until_due > 0 
                                ? `${deadline.days_until_due} days remaining`
                                : deadline.days_until_due === 0
                                ? 'Due today'
                                : `${Math.abs(deadline.days_until_due)} days overdue`
                              }
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {deadline.reminder_sent && (
                            <span className="text-xs text-green-600 dark:text-green-400">
                              Reminder sent
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'escalation' && (
            <div className="space-y-6">
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Escalation Rules
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      Configure automatic escalation rules for critical notifications
                    </p>
                  </div>
                  <button
                    onClick={() => setShowEscalationModal(true)}
                    className="btn-primary"
                  >
                    Add Rule
                  </button>
                </div>

                <div className="space-y-4">
                  {escalationRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900/50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                              {rule.name}
                            </h3>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              rule.is_active
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                            }`}>
                              {rule.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {rule.trigger_condition}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <span>Level {rule.escalation_level}</span>
                            <span>•</span>
                            <span>Delay: {rule.delay_hours}h</span>
                            <span>•</span>
                            <span>{rule.notify_users.length} recipients</span>
                            <span>•</span>
                            <span>Created: {formatDate(rule.created_at)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <AdjustmentsHorizontalIcon className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Notification Templates
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      Manage templates for automated notifications
                    </p>
                  </div>
                  <button
                    onClick={() => setShowTemplateModal(true)}
                    className="btn-primary"
                  >
                    Add Template
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900/50"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                              {template.name}
                            </h3>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              template.is_active
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                            }`}>
                              {template.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            {template.type.toUpperCase()} • {template.category}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <AdjustmentsHorizontalIcon className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Subject:</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{template.subject}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Content:</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{template.content}</p>
                        </div>
                        {template.variables.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Variables:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {template.variables.map((variable) => (
                                <span
                                  key={variable}
                                  className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                >
                                  {variable}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsManagementTabs;
