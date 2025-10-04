-- Role & Dashboard Wizard Schema Migration
-- Ensures all required tables and columns exist for the wizard

-- ============================================
-- 1. ROLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
  id VARCHAR(100) PRIMARY KEY,
  label VARCHAR(255) NOT NULL,
  description TEXT,
  caps JSONB DEFAULT '[]'::jsonb,
  scopes JSONB DEFAULT '{}'::jsonb,
  visibility_rules JSONB DEFAULT '[]'::jsonb,
  inherits JSONB DEFAULT '[]'::jsonb,
  version INTEGER DEFAULT 1,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(100),
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by VARCHAR(100)
);

-- Add missing columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='roles' AND column_name='description') THEN
    ALTER TABLE roles ADD COLUMN description TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='roles' AND column_name='created_by') THEN
    ALTER TABLE roles ADD COLUMN created_by VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='roles' AND column_name='updated_by') THEN
    ALTER TABLE roles ADD COLUMN updated_by VARCHAR(100);
  END IF;
END $$;

-- Indexes for roles
CREATE INDEX IF NOT EXISTS idx_roles_active ON roles(active);
CREATE INDEX IF NOT EXISTS idx_roles_created_at ON roles(created_at);

-- Comments
COMMENT ON TABLE roles IS 'System roles with capabilities and scopes';
COMMENT ON COLUMN roles.caps IS 'Array of capability keys (JSONB)';
COMMENT ON COLUMN roles.scopes IS 'Scope configuration object (JSONB)';
COMMENT ON COLUMN roles.visibility_rules IS 'UI visibility rules (JSONB)';
COMMENT ON COLUMN roles.inherits IS 'Array of parent role IDs (JSONB)';

-- ============================================
-- 2. DASHBOARDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS dashboards (
  id SERIAL PRIMARY KEY,
  role_id VARCHAR(100) UNIQUE NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  menus_json JSONB DEFAULT '[]'::jsonb,
  pages_json JSONB DEFAULT '[]'::jsonb,
  widgets JSONB DEFAULT '[]'::jsonb,
  version INTEGER DEFAULT 1,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(100),
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by VARCHAR(100)
);

-- Add missing columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='dashboards' AND column_name='widgets') THEN
    ALTER TABLE dashboards ADD COLUMN widgets JSONB DEFAULT '[]'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='dashboards' AND column_name='created_by') THEN
    ALTER TABLE dashboards ADD COLUMN created_by VARCHAR(100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='dashboards' AND column_name='updated_by') THEN
    ALTER TABLE dashboards ADD COLUMN updated_by VARCHAR(100);
  END IF;
END $$;

-- Indexes for dashboards
CREATE INDEX IF NOT EXISTS idx_dashboards_role_id ON dashboards(role_id);
CREATE INDEX IF NOT EXISTS idx_dashboards_active ON dashboards(active);

-- Comments
COMMENT ON TABLE dashboards IS 'Dashboard configurations per role';
COMMENT ON COLUMN dashboards.menus_json IS 'Menu structure configuration (JSONB)';
COMMENT ON COLUMN dashboards.pages_json IS 'Page templates configuration (JSONB)';
COMMENT ON COLUMN dashboards.widgets IS 'Dashboard widgets configuration (JSONB)';

-- ============================================
-- 3. DASHBOARD_TEMPLATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS dashboard_templates (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  target_role VARCHAR(100),
  default_widgets JSONB DEFAULT '[]'::jsonb,
  default_menus JSONB DEFAULT '[]'::jsonb,
  default_pages JSONB DEFAULT '[]'::jsonb,
  default_layout_columns INTEGER DEFAULT 3,
  is_system_template BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(100),
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by VARCHAR(100)
);

-- Add missing columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='dashboard_templates' AND column_name='default_menus') THEN
    ALTER TABLE dashboard_templates ADD COLUMN default_menus JSONB DEFAULT '[]'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='dashboard_templates' AND column_name='default_pages') THEN
    ALTER TABLE dashboard_templates ADD COLUMN default_pages JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Indexes for dashboard_templates
CREATE INDEX IF NOT EXISTS idx_dashboard_templates_target_role ON dashboard_templates(target_role);
CREATE INDEX IF NOT EXISTS idx_dashboard_templates_system ON dashboard_templates(is_system_template);

-- Comments
COMMENT ON TABLE dashboard_templates IS 'Reusable dashboard templates';
COMMENT ON COLUMN dashboard_templates.is_system_template IS 'True for built-in templates, false for custom';

-- ============================================
-- 4. ENSURE USERS TABLE HAS ROLE COLUMN
-- ============================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='role') THEN
    ALTER TABLE users ADD COLUMN role VARCHAR(100) DEFAULT 'partner_user';
  END IF;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_users_role' 
    AND table_name = 'users'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT fk_users_role 
    FOREIGN KEY (role) REFERENCES roles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Index for users.role
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================
-- 5. SEED DEFAULT ROLES IF EMPTY
-- ============================================
INSERT INTO roles (id, label, description, caps, scopes, visibility_rules, inherits, version, active)
VALUES 
  ('admin', 'Administrator', 'System administrator with full access', 
   '["wizard.admin", "users.create", "users.read", "users.update", "users.delete"]'::jsonb,
   '{"project": "all", "tenant": "all", "organization": "all"}'::jsonb,
   '[]'::jsonb, '[]'::jsonb, 1, true),
  
  ('partner_user', 'Partner User', 'Partner organization user', 
   '["projects.view", "budgets.view", "reports.view"]'::jsonb,
   '{"project": "assigned", "tenant": "current", "organization": "own"}'::jsonb,
   '[]'::jsonb, '[]'::jsonb, 1, true),
  
  ('grants_manager', 'Grants Manager', 'Manages grant applications and approvals', 
   '["applications.view", "applications.approve", "projects.view", "budgets.view", "compliance.view"]'::jsonb,
   '{"project": "all", "tenant": "current", "organization": "all"}'::jsonb,
   '[]'::jsonb, '[]'::jsonb, 1, true),
  
  ('finance_manager', 'Finance Manager', 'Manages financial operations', 
   '["disbursements.view", "disbursements.approve", "payments.view", "budgets.view", "reconciliation.view"]'::jsonb,
   '{"project": "all", "tenant": "current", "organization": "all"}'::jsonb,
   '[]'::jsonb, '[]'::jsonb, 1, true),
  
  ('coo', 'Chief Operating Officer', 'Executive oversight of operations', 
   '["projects.view", "budgets.view", "reports.view", "compliance.view", "organizations.view"]'::jsonb,
   '{"project": "all", "tenant": "all", "organization": "all"}'::jsonb,
   '[]'::jsonb, '[]'::jsonb, 1, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 6. SEED DEFAULT DASHBOARDS IF EMPTY
-- ============================================
INSERT INTO dashboards (role_id, menus_json, pages_json, widgets, version, active)
VALUES 
  ('admin', 
   '[{"key": "admin", "label": "Admin", "icon": "admin", "items": [{"key": "wizard", "label": "Role & Dashboard Wizard", "route": "/admin/wizard"}]}]'::jsonb,
   '[{"id": "dashboard", "route": "/admin/dashboard", "layout": "full"}]'::jsonb,
   '[]'::jsonb, 1, true),
  
  ('partner_user', 
   '[{"key": "partner", "label": "Partner", "icon": "partner", "items": [{"key": "dashboard", "label": "Dashboard", "route": "/partner/dashboard"}]}]'::jsonb,
   '[{"id": "dashboard", "route": "/partner/dashboard", "layout": "full"}]'::jsonb,
   '[]'::jsonb, 1, true),
  
  ('grants_manager', 
   '[{"key": "grants", "label": "Grants", "icon": "grants", "items": [{"key": "applications", "label": "Applications", "route": "/gm/applications"}]}]'::jsonb,
   '[{"id": "dashboard", "route": "/gm/dashboard", "layout": "full"}]'::jsonb,
   '[]'::jsonb, 1, true),
  
  ('finance_manager', 
   '[{"key": "finance", "label": "Finance", "icon": "finance", "items": [{"key": "disbursements", "label": "Disbursements", "route": "/finance/disbursements"}]}]'::jsonb,
   '[{"id": "dashboard", "route": "/finance/dashboard", "layout": "full"}]'::jsonb,
   '[]'::jsonb, 1, true),
  
  ('coo', 
   '[{"key": "executive", "label": "Executive", "icon": "executive", "items": [{"key": "dashboard", "label": "Dashboard", "route": "/coo/dashboard"}]}]'::jsonb,
   '[{"id": "dashboard", "route": "/coo/dashboard", "layout": "full"}]'::jsonb,
   '[]'::jsonb, 1, true)
ON CONFLICT (role_id) DO NOTHING;

-- ============================================
-- 7. VERIFICATION QUERIES
-- ============================================
-- Check roles table
SELECT 'Roles table' as table_name, COUNT(*) as row_count FROM roles;

-- Check dashboards table
SELECT 'Dashboards table' as table_name, COUNT(*) as row_count FROM dashboards;

-- Check dashboard_templates table
SELECT 'Dashboard templates table' as table_name, COUNT(*) as row_count FROM dashboard_templates;

-- Show all roles
SELECT id, label, active, version FROM roles ORDER BY id;

-- Show all dashboards
SELECT role_id, version, active FROM dashboards ORDER BY role_id;

COMMENT ON SCHEMA public IS 'Role & Dashboard Wizard schema migration completed successfully';
