-- Admin Activity Log Table
-- Tracks all administrative actions for audit and monitoring

CREATE TABLE IF NOT EXISTS admin_activity_log (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INTEGER,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Metadata for better tracking
  request_id VARCHAR(50),
  session_id VARCHAR(100),
  result VARCHAR(20) DEFAULT 'success', -- success, failure, error
  error_message TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_activity_admin_id ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_created_at ON admin_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_entity ON admin_activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_action ON admin_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_activity_result ON admin_activity_log(result);
CREATE INDEX IF NOT EXISTS idx_admin_activity_request_id ON admin_activity_log(request_id);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_admin_activity_admin_created ON admin_activity_log(admin_id, created_at DESC);

COMMENT ON TABLE admin_activity_log IS 'Tracks all administrative actions for audit trail';
COMMENT ON COLUMN admin_activity_log.action IS 'Action performed (e.g., create_user, delete_org, update_role)';
COMMENT ON COLUMN admin_activity_log.entity_type IS 'Type of entity affected (e.g., user, organization, role)';
COMMENT ON COLUMN admin_activity_log.entity_id IS 'ID of the affected entity';
COMMENT ON COLUMN admin_activity_log.changes IS 'JSON object containing before/after states';
COMMENT ON COLUMN admin_activity_log.result IS 'Result of the action: success, failure, or error';
