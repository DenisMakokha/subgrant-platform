-- ============================================================================
-- Email SSOT Schema - Phase A
-- ============================================================================

BEGIN;

-- 1. Email Templates (with multi-tenant branding and i18n support)
CREATE TABLE IF NOT EXISTS email_templates (
  id             UUID PRIMARY KEY,
  tenant_id      UUID,                      -- NULL => global default
  name           TEXT NOT NULL,             -- Human-readable name
  key            TEXT NOT NULL,             -- Unique identifier for the template
  subject_tpl    TEXT NOT NULL,             -- Subject template (mustache/handlebars compatible)
  body_html_tpl  TEXT NOT NULL,             -- HTML body template
  body_text_tpl  TEXT,                      -- Plain text body template (optional)
  layout_html    TEXT,                      -- Optional HTML layout wrapper
  version        INT  NOT NULL DEFAULT 1,
  active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE (tenant_id, key, version)
);

-- 2. Email Senders (sender identities)
CREATE TABLE IF NOT EXISTS email_senders (
  id             UUID PRIMARY KEY,
  tenant_id      UUID,                      -- NULL => global default
  name           TEXT NOT NULL,             -- Human-readable name
  email          TEXT NOT NULL,             -- Sender email address
  reply_to       TEXT,                      -- Reply-to address (optional)
  display_name   TEXT,                      -- Display name for sender
  verified       BOOLEAN NOT NULL DEFAULT FALSE, -- Whether sender is verified
  active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE (tenant_id, email)
);

-- 3. Email Providers (configuration for different email services)
CREATE TABLE IF NOT EXISTS email_providers (
  id             UUID PRIMARY KEY,
  tenant_id      UUID,                      -- NULL => global default
  name           TEXT NOT NULL,             -- Human-readable name
  provider_type  TEXT NOT NULL,             -- 'smtp'|'sendgrid'|'ses'|'mailgun'|...
  config_json    JSONB NOT NULL,            -- Provider configuration (creds, endpoints, etc.)
  active         BOOLEAN NOT NULL DEFAULT TRUE,
  default_sender UUID REFERENCES email_senders(id), -- Default sender for this provider
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- 4. Email Outbox (transactional email queue)
CREATE TABLE IF NOT EXISTS email_outbox (
  id             UUID PRIMARY KEY,
  tenant_id      UUID,
  template_id    UUID REFERENCES email_templates(id), -- Template used (if any)
  sender_id      UUID REFERENCES email_senders(id),   -- Sender identity
  provider_id    UUID REFERENCES email_providers(id), -- Provider to use
  to_addresses   TEXT[] NOT NULL,           -- Recipient email addresses
  cc_addresses   TEXT[],                    -- CC email addresses
  bcc_addresses  TEXT[],                    -- BCC email addresses
  subject        TEXT NOT NULL,             -- Email subject
  body_html      TEXT,                      -- HTML body content
  body_text      TEXT,                      -- Plain text body content
  attachments    JSONB,                     -- Attachment metadata
  metadata       JSONB,                     -- Additional metadata
  priority       TEXT NOT NULL DEFAULT 'normal', -- 'low'|'normal'|'high'|'urgent'
  scheduled_for  TIMESTAMPTZ,               -- Scheduled send time (null = immediate)
  created_by     UUID,                      -- Actor user id (optional)
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at   TIMESTAMPTZ,
  status         TEXT NOT NULL DEFAULT 'PENDING', -- PENDING|PROCESSING|SENT|FAILED
  attempts       INT NOT NULL DEFAULT 0,
  last_error     TEXT
);

-- 5. Email Deliveries (delivery tracking)
CREATE TABLE IF NOT EXISTS email_deliveries (
  id             UUID PRIMARY KEY,
  outbox_id      UUID NOT NULL REFERENCES email_outbox(id) ON DELETE CASCADE,
  tenant_id      UUID,
  provider_id    UUID REFERENCES email_providers(id),
  message_id     TEXT,                      -- Provider's message ID
  to_address     TEXT NOT NULL,             -- Recipient email address
  status         TEXT NOT NULL DEFAULT 'QUEUED', -- QUEUED|SENT|DELIVERED|BOUNCED|OPENED|CLICKED|SPAM|FAILED
  sent_at        TIMESTAMPTZ,
  delivered_at   TIMESTAMPTZ,
  opened_at      TIMESTAMPTZ,
  clicked_at     TIMESTAMPTZ,
  bounced_at     TIMESTAMPTZ,
  bounce_reason  TEXT,
  spam_reported_at TIMESTAMPTZ,
  error_message  TEXT,
  provider_data  JSONB,                     -- Provider-specific delivery data
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- 6. Email Suppressions (suppression lists)
CREATE TABLE IF NOT EXISTS email_suppressions (
  id             UUID PRIMARY KEY,
  tenant_id      UUID,
  email          TEXT NOT NULL,             -- Suppressed email address
  reason         TEXT NOT NULL,             -- 'bounce'|'spam'|'unsubscribe'|'manual'
  category       TEXT,                      -- Bounce category (for bounce suppressions)
  suppressed_at  TIMESTAMPTZ DEFAULT now(), -- When suppression was added
  expires_at     TIMESTAMPTZ,               -- When suppression expires (null = permanent)
  created_by     UUID,                      -- User who added suppression (optional)
  notes          TEXT,                      -- Additional notes
  active         BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (tenant_id, email, reason)
);

-- 7. Email Preferences (user preferences for email frequency)
CREATE TABLE IF NOT EXISTS email_preferences (
  id             UUID PRIMARY KEY,
  tenant_id      UUID,
  user_id        UUID NOT NULL,
  email_type     TEXT NOT NULL,             -- Type of email (e.g., 'notifications', 'reports')
  enabled        BOOLEAN NOT NULL DEFAULT TRUE,
  frequency      TEXT NOT NULL DEFAULT 'immediate', -- 'immediate'|'daily'|'weekly'|'monthly'|'mute'
  preferred_time TIME,                      -- Preferred time for digest emails
  preferred_tz   TEXT,                      -- Preferred timezone
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, email_type)
);

-- 8. Email Digests (aggregated email deliveries)
CREATE TABLE IF NOT EXISTS email_digests (
  id             UUID PRIMARY KEY,
  tenant_id      UUID,
  user_id        UUID NOT NULL,
  email_type     TEXT NOT NULL,             -- Type of email being digested
  frequency      TEXT NOT NULL,             -- 'daily'|'weekly'|'monthly'
  next_run_at    TIMESTAMPTZ NOT NULL,      -- When the next digest should be sent
  last_run_at    TIMESTAMPTZ,               -- When the last digest was sent
  items_json     JSONB,                     -- Items included in the digest
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_templates_tenant_key ON email_templates(tenant_id, key);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(active);
CREATE INDEX IF NOT EXISTS idx_email_senders_tenant_email ON email_senders(tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_email_senders_active ON email_senders(active);
CREATE INDEX IF NOT EXISTS idx_email_providers_tenant_type ON email_providers(tenant_id, provider_type);
CREATE INDEX IF NOT EXISTS idx_email_providers_active ON email_providers(active);
CREATE INDEX IF NOT EXISTS idx_email_outbox_status ON email_outbox(status);
CREATE INDEX IF NOT EXISTS idx_email_outbox_scheduled ON email_outbox(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_email_outbox_tenant ON email_outbox(tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_deliveries_outbox ON email_deliveries(outbox_id);
CREATE INDEX IF NOT EXISTS idx_email_deliveries_status ON email_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_email_deliveries_email ON email_deliveries(to_address);
CREATE INDEX IF NOT EXISTS idx_email_suppressions_email ON email_suppressions(email);
CREATE INDEX IF NOT EXISTS idx_email_suppressions_tenant ON email_suppressions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_suppressions_active ON email_suppressions(active);
CREATE INDEX IF NOT EXISTS idx_email_preferences_user ON email_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_email_preferences_tenant ON email_preferences(tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_digests_user_frequency ON email_digests(user_id, frequency);
CREATE INDEX IF NOT EXISTS idx_email_digests_next_run ON email_digests(next_run_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_email_templates_updated_at'
  ) THEN
    CREATE TRIGGER update_email_templates_updated_at
      BEFORE UPDATE ON email_templates
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_email_senders_updated_at'
  ) THEN
    CREATE TRIGGER update_email_senders_updated_at
      BEFORE UPDATE ON email_senders
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_email_providers_updated_at'
  ) THEN
    CREATE TRIGGER update_email_providers_updated_at
      BEFORE UPDATE ON email_providers
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_email_preferences_updated_at'
  ) THEN
    CREATE TRIGGER update_email_preferences_updated_at
      BEFORE UPDATE ON email_preferences
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_email_digests_updated_at'
  ) THEN
    CREATE TRIGGER update_email_digests_updated_at
      BEFORE UPDATE ON email_digests
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_email_deliveries_updated_at'
  ) THEN
    CREATE TRIGGER update_email_deliveries_updated_at
      BEFORE UPDATE ON email_deliveries
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;

COMMIT;