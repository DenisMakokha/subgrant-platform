-- ============================================================================
-- Event Hooks and Notification Scheduling Tables
-- Path: api/scripts/migrations/2025Q1_ssot_cutover/add_event_notification_tables.sql
-- Creates supporting tables for grants SSOT event hooks and notifications
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Event logs table (if not exists from other migrations)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_logs (
  id UUID PRIMARY KEY,
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  actor_user_id UUID NOT NULL,
  payload_json JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_logs_event_type ON event_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_event_logs_entity ON event_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_event_logs_timestamp ON event_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_event_logs_actor ON event_logs(actor_user_id);

-- ---------------------------------------------------------------------------
-- Notification schedule table for delayed notifications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notification_schedule (
  id UUID PRIMARY KEY,
  scheduled_at TIMESTAMPTZ NOT NULL,
  template_key TEXT NOT NULL,
  user_id UUID NOT NULL,
  payload_json JSONB,
  status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED','SENT','FAILED','CANCELLED')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_schedule_scheduled_at ON notification_schedule(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_notification_schedule_user_id ON notification_schedule(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_schedule_status ON notification_schedule(status);
CREATE INDEX IF NOT EXISTS idx_notification_schedule_template ON notification_schedule(template_key);

-- ---------------------------------------------------------------------------
-- Analytics refresh queue for background processing
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS analytics_refresh_queue (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL,
  refresh_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PROCESSING','COMPLETED','FAILED')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, refresh_type)
);

CREATE INDEX IF NOT EXISTS idx_analytics_refresh_queue_status ON analytics_refresh_queue(status);
CREATE INDEX IF NOT EXISTS idx_analytics_refresh_queue_project ON analytics_refresh_queue(project_id);
CREATE INDEX IF NOT EXISTS idx_analytics_refresh_queue_created_at ON analytics_refresh_queue(created_at);

-- ---------------------------------------------------------------------------
-- Notification templates for grants events
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notification_templates (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  subject_template TEXT,
  body_template TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('IN_APP','EMAIL','SMS')),
  variables JSONB, -- Expected template variables
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default grant notification templates
INSERT INTO notification_templates (key, name, description, subject_template, body_template, channel, variables) VALUES
('grant_created', 'Grant Created', 'Notification when a new grant is created', 
 'New Grant Created: {{grant_name}}',
 'A new grant "{{grant_name}}" ({{grant_number}}) has been created with a budget of {{budget_amount}} {{currency}}. Project ID: {{project_id}}',
 'IN_APP',
 '["grant_name","grant_number","budget_amount","currency","project_id","created_by"]'::jsonb),

('grant_assigned', 'Grant Assigned', 'Notification when assigned as program manager',
 'You have been assigned to manage grant: {{grant_name}}',
 'You have been assigned as the program manager for grant "{{grant_name}}" ({{grant_number}}) with a budget of {{budget_amount}} {{currency}}.',
 'IN_APP',
 '["grant_name","grant_number","budget_amount","currency","assigned_by"]'::jsonb),

('grant_reporting_reminder', 'Grant Reporting Reminder', 'Reminder for upcoming reporting deadlines',
 'Reminder: {{report_type}} report due in {{days_until_due}} days',
 'This is a reminder that the {{report_type}} report for grant "{{grant_name}}" ({{grant_number}}) is due on {{due_date}} ({{days_until_due}} days from now). {{description}}',
 'EMAIL',
 '["grant_name","grant_number","report_type","due_date","days_until_due","description"]'::jsonb),

('envelope_overrun_alert', 'Envelope Overrun Alert', 'Critical alert when envelope is exceeded',
 'URGENT: Envelope Overrun Alert - {{project_id}}',
 'URGENT: The partner budget approvals have exceeded the envelope ceiling by {{overrun_amount}}. Immediate action required. Project: {{project_id}}, Triggered by: {{triggered_by}}',
 'EMAIL',
 '["project_id","overrun_amount","triggered_by","severity"]'::jsonb)

ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  subject_template = EXCLUDED.subject_template,
  body_template = EXCLUDED.body_template,
  variables = EXCLUDED.variables,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- Triggers for updated_at timestamps
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at_timestamp_generic()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_notification_schedule_updated_at') THEN
    CREATE TRIGGER trg_notification_schedule_updated_at
    BEFORE UPDATE ON notification_schedule
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp_generic();
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_analytics_refresh_queue_updated_at') THEN
    CREATE TRIGGER trg_analytics_refresh_queue_updated_at
    BEFORE UPDATE ON analytics_refresh_queue
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp_generic();
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_notification_templates_updated_at') THEN
    CREATE TRIGGER trg_notification_templates_updated_at
    BEFORE UPDATE ON notification_templates
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp_generic();
  END IF;
END;
$$;

COMMIT;

-- ============================================================================
-- End add_event_notification_tables.sql
-- ============================================================================