-- Partner Activity Log Table
-- Tracks all partner actions for dashboard activity feed

CREATE TABLE IF NOT EXISTS partner_activity_log (
  id SERIAL PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  activity_type VARCHAR(50) NOT NULL,
  activity_category VARCHAR(50) NOT NULL, -- 'budget', 'report', 'document', 'project', 'contract', 'system'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}', -- Additional context data
  entity_type VARCHAR(50), -- e.g., 'project', 'budget', 'report'
  entity_id INTEGER, -- Reference to related entity
  severity VARCHAR(20) DEFAULT 'info', -- 'info', 'warning', 'error', 'success'
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_organization ON partner_activity_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_user ON partner_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_type ON partner_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_category ON partner_activity_log(activity_category);
CREATE INDEX IF NOT EXISTS idx_activity_created ON partner_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_entity ON partner_activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_unread ON partner_activity_log(organization_id, is_read) WHERE is_read = FALSE;

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_activity_org_created ON partner_activity_log(organization_id, created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_partner_activity_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic updated_at
DROP TRIGGER IF EXISTS trigger_update_partner_activity_updated_at ON partner_activity_log;
CREATE TRIGGER trigger_update_partner_activity_updated_at
  BEFORE UPDATE ON partner_activity_log
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_activity_updated_at();

-- Helper function to log activity
CREATE OR REPLACE FUNCTION log_partner_activity(
  p_organization_id UUID,
  p_user_id UUID,
  p_activity_type VARCHAR,
  p_activity_category VARCHAR,
  p_title VARCHAR,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_entity_type VARCHAR DEFAULT NULL,
  p_entity_id INTEGER DEFAULT NULL,
  p_severity VARCHAR DEFAULT 'info'
)
RETURNS INTEGER AS $$
DECLARE
  v_activity_id INTEGER;
BEGIN
  INSERT INTO partner_activity_log (
    organization_id,
    user_id,
    activity_type,
    activity_category,
    title,
    description,
    metadata,
    entity_type,
    entity_id,
    severity
  ) VALUES (
    p_organization_id,
    p_user_id,
    p_activity_type,
    p_activity_category,
    p_title,
    p_description,
    p_metadata,
    p_entity_type,
    p_entity_id,
    p_severity
  ) RETURNING id INTO v_activity_id;
  
  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql;

-- Create view for recent activities with user info
CREATE OR REPLACE VIEW partner_activity_feed AS
SELECT 
  pal.*,
  u.email as user_email,
  o.name as organization_name
FROM partner_activity_log pal
LEFT JOIN users u ON pal.user_id = u.id
LEFT JOIN organizations o ON pal.organization_id = o.id
ORDER BY pal.created_at DESC;

COMMENT ON TABLE partner_activity_log IS 'Tracks all partner activities for dashboard activity feed';
COMMENT ON COLUMN partner_activity_log.activity_type IS 'Specific action taken (e.g., report_submitted, budget_updated)';
COMMENT ON COLUMN partner_activity_log.activity_category IS 'High-level category for filtering';
COMMENT ON COLUMN partner_activity_log.metadata IS 'Additional context as JSON';
COMMENT ON COLUMN partner_activity_log.severity IS 'Activity importance: info, warning, error, success';
