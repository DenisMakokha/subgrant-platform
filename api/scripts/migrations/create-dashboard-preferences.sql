-- Dashboard Preferences Schema
-- Stores user dashboard layout preferences and widget configurations

-- Dashboard Preferences Table
CREATE TABLE IF NOT EXISTS dashboard_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dashboard_template VARCHAR(50) NOT NULL DEFAULT 'default', -- admin, partner, finance, grants, executive, custom
    widget_order JSONB DEFAULT '[]'::jsonb, -- Array of widget IDs in order
    widget_config JSONB DEFAULT '{}'::jsonb, -- Widget-specific configurations
    layout_columns INTEGER DEFAULT 3 CHECK (layout_columns BETWEEN 1 AND 4),
    theme VARCHAR(20) DEFAULT 'light', -- light, dark, auto
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, dashboard_template)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_dashboard_preferences_user_id 
    ON dashboard_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_preferences_template 
    ON dashboard_preferences(dashboard_template);

-- Dashboard Widgets Table (predefined widgets)
CREATE TABLE IF NOT EXISTS dashboard_widgets (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    widget_type VARCHAR(50) NOT NULL, -- kpi, chart, list, table, custom
    category VARCHAR(50), -- financial, operational, compliance, analytics
    default_config JSONB DEFAULT '{}'::jsonb,
    required_capability VARCHAR(100), -- Capability needed to view widget
    available_for_roles TEXT[], -- Array of roles that can use this widget
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_type 
    ON dashboard_widgets(widget_type);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_category 
    ON dashboard_widgets(category);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_capability 
    ON dashboard_widgets(required_capability);

-- Dashboard Templates Table
CREATE TABLE IF NOT EXISTS dashboard_templates (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    target_role VARCHAR(50), -- admin, partner, finance_manager, grants_manager, coo
    default_widgets JSONB DEFAULT '[]'::jsonb, -- Array of widget IDs
    default_layout_columns INTEGER DEFAULT 3,
    is_system_template BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert predefined widgets
INSERT INTO dashboard_widgets (id, name, description, widget_type, category, required_capability, available_for_roles) VALUES
-- Admin Widgets
('admin_users_count', 'Total Users', 'Total number of users in the system', 'kpi', 'operational', 'users.view', ARRAY['admin']),
('admin_orgs_count', 'Total Organizations', 'Total number of partner organizations', 'kpi', 'operational', 'organizations.view', ARRAY['admin']),
('admin_projects_count', 'Active Projects', 'Number of active projects', 'kpi', 'operational', 'projects.view', ARRAY['admin', 'grants_manager']),
('admin_budget_total', 'Total Budget', 'Total budget across all projects', 'kpi', 'financial', 'budgets.view', ARRAY['admin', 'finance_manager']),
('admin_recent_activities', 'Recent Activities', 'Latest system activities', 'list', 'operational', 'audit_logs.view', ARRAY['admin']),
('admin_pending_approvals', 'Pending Approvals', 'Items awaiting approval', 'list', 'operational', 'approvals.view', ARRAY['admin', 'grants_manager', 'coo']),
('admin_system_health', 'System Health', 'System performance metrics', 'chart', 'analytics', 'system.read', ARRAY['admin']),
('admin_user_growth', 'User Growth', 'User registration trends', 'chart', 'analytics', 'users.view', ARRAY['admin']),

-- Partner Widgets
('partner_active_projects', 'My Active Projects', 'Number of active projects', 'kpi', 'operational', 'projects.view', ARRAY['partner', 'partner_user']),
('partner_budget_ceiling', 'Budget Ceiling', 'Total allocated budget', 'kpi', 'financial', 'budgets.view', ARRAY['partner', 'partner_user']),
('partner_budget_spent', 'Budget Spent', 'Total budget utilized', 'kpi', 'financial', 'budgets.view', ARRAY['partner', 'partner_user']),
('partner_reports_due', 'Reports Due', 'Number of pending reports', 'kpi', 'compliance', 'me_reports.view', ARRAY['partner', 'partner_user']),
('partner_recent_disbursements', 'Recent Disbursements', 'Latest payment disbursements', 'list', 'financial', 'disbursements.view', ARRAY['partner', 'partner_user']),
('partner_upcoming_reports', 'Upcoming Reports', 'Reports due soon', 'list', 'compliance', 'me_reports.view', ARRAY['partner', 'partner_user']),
('partner_budget_utilization', 'Budget Utilization', 'Budget usage over time', 'chart', 'financial', 'budgets.view', ARRAY['partner', 'partner_user']),
('partner_compliance_status', 'Compliance Status', 'Document compliance overview', 'chart', 'compliance', 'compliance.view', ARRAY['partner', 'partner_user']),

-- Finance Manager Widgets
('finance_total_disbursements', 'Total Disbursements', 'Total amount disbursed', 'kpi', 'financial', 'disbursements.view', ARRAY['finance_manager', 'admin']),
('finance_pending_payments', 'Pending Payments', 'Payments awaiting processing', 'kpi', 'financial', 'disbursements.approve', ARRAY['finance_manager', 'admin']),
('finance_budget_variance', 'Budget Variance', 'Budget vs actual spending', 'chart', 'financial', 'budgets.view', ARRAY['finance_manager', 'admin']),
('finance_payment_schedule', 'Payment Schedule', 'Upcoming scheduled payments', 'list', 'financial', 'disbursements.view', ARRAY['finance_manager', 'admin']),
('finance_reconciliation_status', 'Reconciliation Status', 'Financial reconciliation overview', 'chart', 'financial', 'reconciliation.view', ARRAY['finance_manager', 'admin']),

-- Grants Manager Widgets
('grants_applications_pending', 'Pending Applications', 'Applications awaiting review', 'kpi', 'operational', 'applications.view', ARRAY['grants_manager', 'admin']),
('grants_projects_active', 'Active Grants', 'Number of active grant projects', 'kpi', 'operational', 'projects.view', ARRAY['grants_manager', 'admin']),
('grants_compliance_rate', 'Compliance Rate', 'Partner compliance percentage', 'kpi', 'compliance', 'compliance.view', ARRAY['grants_manager', 'admin']),
('grants_approval_queue', 'Approval Queue', 'Items requiring approval', 'list', 'operational', 'approvals.approve', ARRAY['grants_manager', 'coo', 'admin']),
('grants_partner_performance', 'Partner Performance', 'Partner performance metrics', 'chart', 'analytics', 'organizations.view', ARRAY['grants_manager', 'admin']),

-- Executive/COO Widgets
('exec_portfolio_overview', 'Portfolio Overview', 'High-level portfolio metrics', 'kpi', 'analytics', 'reports.view', ARRAY['coo', 'admin']),
('exec_budget_overview', 'Budget Overview', 'Total budget allocation', 'kpi', 'financial', 'budgets.view', ARRAY['coo', 'admin']),
('exec_partner_count', 'Active Partners', 'Number of active partners', 'kpi', 'operational', 'organizations.view', ARRAY['coo', 'admin']),
('exec_compliance_overview', 'Compliance Overview', 'System-wide compliance status', 'chart', 'compliance', 'compliance.view', ARRAY['coo', 'admin']),
('exec_financial_trends', 'Financial Trends', 'Financial performance trends', 'chart', 'financial', 'reports.view', ARRAY['coo', 'admin']),
('exec_project_status', 'Project Status', 'Project status distribution', 'chart', 'operational', 'projects.view', ARRAY['coo', 'admin'])

ON CONFLICT (id) DO NOTHING;

-- Insert dashboard templates
INSERT INTO dashboard_templates (id, name, description, target_role, default_widgets, default_layout_columns, is_system_template) VALUES
('admin', 'Admin Dashboard', 'Comprehensive admin dashboard', 'admin', 
 '["admin_users_count", "admin_orgs_count", "admin_projects_count", "admin_budget_total", "admin_pending_approvals", "admin_recent_activities", "admin_system_health", "admin_user_growth"]'::jsonb, 
 3, true),
 
('partner', 'Partner Dashboard', 'Partner organization dashboard', 'partner', 
 '["partner_active_projects", "partner_budget_ceiling", "partner_budget_spent", "partner_reports_due", "partner_budget_utilization", "partner_recent_disbursements", "partner_upcoming_reports", "partner_compliance_status"]'::jsonb, 
 3, true),
 
('finance', 'Finance Manager Dashboard', 'Financial management dashboard', 'finance_manager', 
 '["finance_total_disbursements", "finance_pending_payments", "admin_budget_total", "finance_budget_variance", "finance_payment_schedule", "finance_reconciliation_status"]'::jsonb, 
 3, true),
 
('grants', 'Grants Manager Dashboard', 'Grants management dashboard', 'grants_manager', 
 '["grants_applications_pending", "grants_projects_active", "grants_compliance_rate", "admin_budget_total", "grants_approval_queue", "grants_partner_performance"]'::jsonb, 
 3, true),
 
('executive', 'Executive Dashboard', 'Executive overview dashboard', 'coo', 
 '["exec_portfolio_overview", "exec_budget_overview", "exec_partner_count", "exec_compliance_overview", "exec_financial_trends", "exec_project_status"]'::jsonb, 
 2, true)

ON CONFLICT (id) DO NOTHING;

-- Add comments
COMMENT ON TABLE dashboard_preferences IS 'User dashboard layout preferences and widget configurations';
COMMENT ON TABLE dashboard_widgets IS 'Predefined dashboard widgets available in the system';
COMMENT ON TABLE dashboard_templates IS 'Dashboard templates for different user roles';

-- Grant permissions (adjust as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON dashboard_preferences TO your_app_user;
-- GRANT SELECT ON dashboard_widgets TO your_app_user;
-- GRANT SELECT ON dashboard_templates TO your_app_user;
