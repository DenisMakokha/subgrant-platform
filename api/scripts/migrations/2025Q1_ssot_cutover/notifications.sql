-- ============================================================================
-- SSOT Notifications Schema
-- ============================================================================

BEGIN;

-- 1.1 Event catalog (registry)
CREATE TABLE IF NOT EXISTS notif_event_catalog (
  key            TEXT PRIMARY KEY,         -- e.g., 'budget.line_approved'
  description    TEXT NOT NULL,
  payload_schema JSONB NOT NULL,           -- JSON schema validating payload
  default_channels JSONB NOT NULL,         -- e.g., ["inapp","email"]
  severity       TEXT NOT NULL DEFAULT 'info', -- info|warning|critical
  active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- 1.2 Template registry (per tenant/org, with i18n, per channel)
CREATE TABLE IF NOT EXISTS notif_templates (
  id             UUID PRIMARY KEY,
  tenant_id      UUID,                      -- NULL => global default
  event_key      TEXT NOT NULL REFERENCES notif_event_catalog(key) ON DELETE RESTRICT,
  channel        TEXT NOT NULL,             -- 'inapp'|'email'
  lang           TEXT NOT NULL DEFAULT 'en',
  subject_tpl    TEXT,                      -- for email
  body_tpl       TEXT NOT NULL,             -- mustache/handlebars compatible
  layout_tpl     TEXT,                      -- optional email layout wrapper
  version        INT  NOT NULL DEFAULT 1,
  active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE (tenant_id, event_key, channel, lang, version)
);

-- 1.3 User/channel preferences
CREATE TABLE IF NOT EXISTS notif_preferences (
  id             UUID PRIMARY KEY,
  tenant_id      UUID,
  user_id        UUID NOT NULL,
  event_key      TEXT NOT NULL,
  channel        TEXT NOT NULL,             -- 'inapp'|'email'
  enabled        BOOLEAN NOT NULL DEFAULT TRUE,
  frequency      TEXT NOT NULL DEFAULT 'immediate', -- immediate|daily|weekly|mute
  created_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, event_key, channel)
);

-- 1.4 Routing rules (roles, project scoping, dynamic audiences)
CREATE TABLE IF NOT EXISTS notif_routing_rules (
  id             UUID PRIMARY KEY,
  tenant_id      UUID,
  event_key      TEXT NOT NULL,
  audience_json  JSONB NOT NULL,            -- see §4 Targeting
  active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- 1.5 Outbox (transactional event queue; producer writes here)
CREATE TABLE IF NOT EXISTS notif_outbox (
  id             UUID PRIMARY KEY,
  tenant_id      UUID,
  event_key      TEXT NOT NULL,
  payload        JSONB NOT NULL,            -- validated against payload_schema
  created_by     UUID,                      -- actor user id (optional)
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at   TIMESTAMPTZ,
  status         TEXT NOT NULL DEFAULT 'PENDING', -- PENDING|PROCESSING|DONE|FAILED
  attempts       INT NOT NULL DEFAULT 0,
  last_error     TEXT
);

-- 1.6 Fanout "jobs" per recipient/channel (worker expands outbox->jobs)
CREATE TABLE IF NOT EXISTS notif_jobs (
  id             UUID PRIMARY KEY,
  outbox_id      UUID NOT NULL REFERENCES notif_outbox(id) ON DELETE CASCADE,
  tenant_id      UUID,
  event_key      TEXT NOT NULL,
  recipient_user UUID,                      -- null for external email
  email_to       TEXT,                      -- used when recipient is external
  channel        TEXT NOT NULL,             -- 'inapp'|'email'
  lang           TEXT NOT NULL DEFAULT 'en',
  subject        TEXT,                      -- resolved text for email
  body           TEXT,                      -- resolved text/html for both
  state          TEXT NOT NULL DEFAULT 'QUEUED', -- QUEUED|SENDING|SENT|FAILED|SUPPRESSED
  scheduled_for  TIMESTAMPTZ,               -- for digest/delay
  sent_at        TIMESTAMPTZ,
  error          TEXT,
  provider_resp  JSONB,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- 1.7 In-app inbox (user-visible messages)
CREATE TABLE IF NOT EXISTS notif_inbox (
  id             UUID PRIMARY KEY,
  user_id        UUID NOT NULL,
  tenant_id      UUID,
  event_key      TEXT NOT NULL,
  title          TEXT NOT NULL,
  body           TEXT NOT NULL,
  link_url       TEXT,
  unread         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- 1.8 Digest queue (aggregated deliveries)
CREATE TABLE IF NOT EXISTS notif_digest_cursor (
  id             UUID PRIMARY KEY,
  user_id        UUID NOT NULL,
  channel        TEXT NOT NULL,             -- 'email'
  frequency      TEXT NOT NULL,             -- daily|weekly
  next_run_at    TIMESTAMPTZ NOT NULL
);

-- 1.9 Global provider config (SMTP/ESP)
CREATE TABLE IF NOT EXISTS notif_providers (
  id             UUID PRIMARY KEY,
  tenant_id      UUID,
  channel        TEXT NOT NULL,             -- 'email'
  provider       TEXT NOT NULL,             -- 'smtp'|'sendgrid'|...
  config_json    JSONB NOT NULL,            -- creds, from, domains
  active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT now()
);

COMMIT;