-- Dashboard Tables Migration
-- Creates tables for universal dashboard system

-- Dashboard Preferences Table
CREATE TABLE IF NOT EXISTS dashboard_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dashboard_id VARCHAR(100),
  layout VARCHAR(20) DEFAULT 'grid',
  widget_order JSONB DEFAULT '[]'::jsonb,
  hidden_widgets JSONB DEFAULT '[]'::jsonb,
  refresh_interval INTEGER DEFAULT 300000,
  theme VARCHAR(20) DEFAULT 'auto',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Dashboard Configurations Table
CREATE TABLE IF NOT EXISTS dashboard_configs (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  role VARCHAR(100),
  layout VARCHAR(20) DEFAULT 'grid',
  columns INTEGER DEFAULT 3,
  widgets JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_default BOOLEAN DEFAULT false,
  is_customizable BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dashboard_preferences_user_id 
  ON dashboard_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_dashboard_configs_role 
  ON dashboard_configs(role);

CREATE INDEX IF NOT EXISTS idx_dashboard_configs_is_default 
  ON dashboard_configs(is_default);

-- Comments
COMMENT ON TABLE dashboard_preferences IS 'User-specific dashboard preferences and customizations';
COMMENT ON TABLE dashboard_configs IS 'Dashboard configuration templates';

COMMENT ON COLUMN dashboard_preferences.dashboard_id IS 'Reference to dashboard_configs.id';
COMMENT ON COLUMN dashboard_preferences.layout IS 'Layout type: grid, flex, custom';
COMMENT ON COLUMN dashboard_preferences.widget_order IS 'Array of widget IDs in display order';
COMMENT ON COLUMN dashboard_preferences.hidden_widgets IS 'Array of hidden widget IDs';
COMMENT ON COLUMN dashboard_preferences.refresh_interval IS 'Auto-refresh interval in milliseconds';
COMMENT ON COLUMN dashboard_preferences.theme IS 'Theme preference: light, dark, auto';

COMMENT ON COLUMN dashboard_configs.widgets IS 'Array of widget configurations';
COMMENT ON COLUMN dashboard_configs.is_default IS 'Whether this is a default template';
COMMENT ON COLUMN dashboard_configs.is_customizable IS 'Whether users can customize this dashboard';
