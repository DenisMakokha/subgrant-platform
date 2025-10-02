/**
 * Dashboard Configuration Types
 * 
 * Defines the structure for dashboard configurations,
 * widgets, and templates
 */

export interface WidgetConfig {
  id: string;
  type: 'kpi' | 'chart' | 'list' | 'status' | 'action' | 'custom';
  component?: string;
  position: {
    row: number;
    col: number;
    span: number;
  };
  capability?: string;
  props?: Record<string, any>;
}

export interface DashboardConfig {
  id: string;
  name: string;
  description?: string;
  role?: string;
  layout: 'grid' | 'flex' | 'custom';
  columns?: number;
  widgets: WidgetConfig[];
  isDefault?: boolean;
  isCustomizable?: boolean;
}

export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  category: 'executive' | 'operations' | 'finance' | 'custom';
  config: DashboardConfig;
  previewImage?: string;
  requiredCapabilities?: string[];
}

export interface UserDashboardPreferences {
  userId: string;
  dashboardId: string;
  layout: 'grid' | 'list';
  widgetOrder: string[];
  hiddenWidgets: string[];
  customWidgets: WidgetConfig[];
  refreshInterval: number;
  theme: 'light' | 'dark' | 'auto';
  updatedAt: string;
}
