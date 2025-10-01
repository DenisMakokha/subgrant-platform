// Admin Dashboard Type Definitions

export interface ServiceStatus {
  name: string;
  status: 'healthy' | 'warning' | 'error' | 'unknown';
  responseTime?: number;
  lastCheck: Date;
  message?: string;
}

export interface SystemHealth {
  services: {
    database: ServiceStatus;
    api: ServiceStatus;
    cache: ServiceStatus;
    notifications: ServiceStatus;
    email?: ServiceStatus;
  };
  metrics: {
    totalUsers: number;
    activeUsers: number;
    totalOrganizations: number;
    totalProjects: number;
    apiResponseTime: number;
    errorRate: number;
    systemLoad: number;
  };
  alerts: Alert[];
  lastUpdated: Date;
}

export interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  resolved?: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  organizationId?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  legalName?: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  type: 'ngo' | 'company' | 'government' | 'individual';
  createdAt: Date;
  updatedAt: Date;
  userCount: number;
  projectCount: number;
}

export interface ActivityEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface SecurityEvent {
  id: string;
  timestamp: Date;
  type: 'login_failure' | 'suspicious_activity' | 'permission_denied' | 'data_export';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ipAddress: string;
  description: string;
  details: Record<string, any>;
}

export interface ComplianceReport {
  id: string;
  name: string;
  type: 'audit' | 'security' | 'data_protection' | 'financial';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  generatedBy: string;
  downloadUrl?: string;
}

export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  userScopes?: string[];
  organizationScopes?: string[];
  percentage?: number;
}

export interface SystemSetting {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'json';
  category: string;
  description: string;
  updatedBy: string;
  updatedAt: Date;
}

export interface RoleDefinition {
  id: string;
  label: string;
  description?: string;
  capabilities: string[];
  scopes: Record<string, string>;
  visibility_rules?: any[];
  version: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardDefinition {
  role_id: string;
  version: number;
  menus_json: any[];
  pages_json: any[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  userId?: string;
  action?: string;
  entityType?: string;
  severity?: string;
  limit?: number;
  offset?: number;
}

export interface UserFilters {
  search?: string;
  role?: string;
  organization?: string;
  status?: 'active' | 'inactive';
  limit?: number;
  offset?: number;
}

export interface OrganizationFilters {
  search?: string;
  status?: string;
  type?: string;
  limit?: number;
  offset?: number;
}

export interface MetricsData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
}

export interface DashboardStats {
  totalUsers: number;
  totalOrganizations: number;
  totalProjects: number;
  activeUsers: number;
  pendingApprovals: number;
  systemAlerts: number;
  recentActivity: ActivityEntry[];
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
  width?: string;
}

export interface FilterOption {
  value: string;
  label: string;
}

export interface ExportFormat {
  key: 'pdf' | 'excel' | 'csv' | 'json';
  label: string;
  extension: string;
  mimeType: string;
}

export interface BulkAction<T> {
  key: string;
  label: string;
  action: (selectedItems: T[]) => Promise<void>;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

// Advanced Reporting Types
export interface ReportTemplate {
  id: string;
  name: string;
  type: 'financial' | 'operational' | 'compliance' | 'analytical';
  category?: string;
  description?: string;
  dataSources: string[];
  filters: Record<string, any>;
  groupBy: string[];
  aggregations: Record<string, any>;
  visualizations: any[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastGenerated?: Date;
  generationCount: number;
}

export interface ReportConfig {
  templateId: string;
  parameters: Record<string, any>;
  filters: Record<string, any>;
  format: 'pdf' | 'excel' | 'csv' | 'json';
  includeCharts: boolean;
  includeRawData: boolean;
}

export interface ScheduledReport {
  id: string;
  templateId: string;
  templateName: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  nextRun: Date;
  lastRun?: Date;
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv';
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  config: ReportConfig;
}

export interface ReportData {
  id: string;
  templateId: string;
  templateName: string;
  generatedAt: Date;
  generatedBy: string;
  format: string;
  fileSize: number;
  recordCount: number;
  downloadUrl: string;
  status: 'generating' | 'completed' | 'failed';
  error?: string;
}

// Security Center Types
export interface SecurityPolicy {
  id: string;
  name: string;
  category: 'access_control' | 'password_policy' | 'data_protection' | 'network_security' | 'audit_logging';
  description?: string;
  enforcement: 'strict' | 'moderate' | 'lenient';
  rules: any[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastUpdated: Date;
}

export interface AccessPattern {
  id: string;
  userId: string;
  userEmail: string;
  pattern: string;
  riskScore: number;
  lastSeen: Date;
  status: 'normal' | 'suspicious' | 'blocked';
  details: Record<string, any>;
}

export interface ThreatIndicator {
  id: string;
  timestamp: Date;
  type: 'suspicious_login' | 'unusual_activity' | 'data_exfiltration' | 'policy_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedUsers: number;
  status: 'active' | 'investigating' | 'resolved' | 'false_positive';
  indicators: string[];
  metadata: Record<string, any>;
}

// System Administration Types
export interface SystemMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  threshold: number;
  lastUpdated: Date;
  category: string;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'error' | 'warning' | 'info' | 'debug';
  source: string;
  message: string;
  userId?: string;
  metadata?: Record<string, any>;
  stackTrace?: string;
}

export interface ServerStatus {
  id: string;
  name: string;
  type: 'web' | 'database' | 'cache' | 'queue';
  status: 'online' | 'offline' | 'maintenance';
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  uptime: number;
  lastRestart?: Date;
  version: string;
}

export interface MaintenanceWindow {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  affectedServices: string[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Executive Dashboard Types
export interface ExecutiveKPIs {
  totalBudget: number;
  totalDisbursed: number;
  activeProjects: number;
  completedProjects: number;
  partnerOrganizations: number;
  programEfficiency: number;
  riskScore: number;
  complianceRate: number;
}

export interface FinancialSummary {
  totalBudget: number;
  totalSpent: number;
  remainingBudget: number;
  quarterlySpending: Array<{
    quarter: string;
    amount: number;
    budget: number;
  }>;
  topExpenseCategories: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
}

export interface ProgramPerformance {
  programs: Array<{
    id: string;
    name: string;
    status: 'on_track' | 'at_risk' | 'behind' | 'completed';
    progress: number;
    budgetUtilization: number;
    keyMilestones: Array<{
      name: string;
      dueDate: Date;
      status: 'completed' | 'on_track' | 'delayed' | 'at_risk';
    }>;
  }>;
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface StrategicInitiative {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  progress: number;
  startDate: Date;
  targetDate: Date;
  actualDate?: Date;
  owner: string;
  budget: number;
  spent: number;
  risks: Array<{
    description: string;
    impact: 'low' | 'medium' | 'high';
    probability: 'low' | 'medium' | 'high';
    mitigation?: string;
  }>;
}

export interface ExecutiveDashboardData {
  kpis: ExecutiveKPIs;
  financialSummary: FinancialSummary;
  programPerformance: ProgramPerformance;
  strategicInitiatives: StrategicInitiative[];
  alerts: Array<{
    id: string;
    type: 'risk' | 'opportunity' | 'milestone' | 'budget';
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    date: Date;
  }>;
  trends: {
    budgetUtilization: Array<{ month: string; value: number }>;
    projectSuccess: Array<{ month: string; value: number }>;
    partnerPerformance: Array<{ month: string; value: number }>;
  };
}

// Knowledge Management Types
export interface KnowledgeDocument {
  id: string;
  title: string;
  description?: string;
  content: string;
  type: 'policy' | 'procedure' | 'guideline' | 'template' | 'training' | 'reference';
  category: string;
  tags: string[];
  version: string;
  status: 'draft' | 'review' | 'published' | 'archived';
  author: string;
  createdAt: Date;
  updatedAt: Date;
  lastReviewed?: Date;
  nextReview?: Date;
  downloadCount: number;
  viewCount: number;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
}

export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  type: 'course' | 'workshop' | 'webinar' | 'documentation' | 'video' | 'quiz';
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  status: 'draft' | 'published' | 'archived';
  content: Array<{
    id: string;
    type: 'text' | 'video' | 'quiz' | 'assignment' | 'resource';
    title: string;
    content: string;
    order: number;
    duration?: number;
  }>;
  prerequisites: string[];
  learningObjectives: string[];
  author: string;
  createdAt: Date;
  updatedAt: Date;
  enrollmentCount: number;
  completionRate: number;
  averageRating: number;
  tags: string[];
}

export interface KnowledgeCategory {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  order: number;
  icon?: string;
  color?: string;
  documentCount: number;
  moduleCount: number;
}

export interface TrainingEnrollment {
  id: string;
  userId: string;
  moduleId: string;
  status: 'enrolled' | 'in_progress' | 'completed' | 'dropped';
  enrolledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  progress: number;
  score?: number;
  certificateUrl?: string;
  notes?: string;
}

export interface KnowledgeSearchFilters {
  query?: string;
  type?: string;
  category?: string;
  tags?: string[];
  status?: string;
  author?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface KnowledgeSearchResult {
  documents: KnowledgeDocument[];
  modules: TrainingModule[];
  total: number;
  facets: {
    categories: Array<{ key: string; count: number }>;
    types: Array<{ key: string; count: number }>;
    tags: Array<{ key: string; count: number }>;
  };
}
