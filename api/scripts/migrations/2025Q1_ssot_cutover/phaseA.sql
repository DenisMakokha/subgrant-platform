-- ============================================================================
-- SSOT Budget Cutover · Phase A (Schema Bootstrap)
-- ----------------------------------------------------------------------------
-- Prerequisites:
--   • Run inside a maintenance window with exclusive DDL access.
--   • Ensure extensions providing gen_random_uuid() (pgcrypto) are available.
-- Execution Order:
--   • Phase A → Phase B → cleanup (only after cutover sign-off).
-- Rollback Guidance:
--   • Drop the created tables and auxiliary functions/triggers in reverse order.
--   • Always restore from verified backups before re-running legacy workloads.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Helper: shared updated_at trigger for mutable SSOT entities.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Project-level reusable template set definitions.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_template_sets (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('DRAFT','READY','ARCHIVED')),
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, name)
);

CREATE INDEX IF NOT EXISTS idx_project_template_sets_project
  ON project_template_sets(project_id);

CREATE INDEX IF NOT EXISTS idx_project_template_sets_status
  ON project_template_sets(status);

-- ---------------------------------------------------------------------------
-- Template line items reusable across partner budgets.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_template_items (
  id UUID PRIMARY KEY,
  set_id UUID NOT NULL REFERENCES project_template_sets(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  subcategory TEXT,
  guidance TEXT,
  required BOOLEAN NOT NULL DEFAULT FALSE,
  min_lines INT,
  sort_index INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_project_template_items_set
  ON project_template_items(set_id);

CREATE INDEX IF NOT EXISTS idx_project_template_items_set_sort
  ON project_template_items(set_id, sort_index);

CREATE INDEX IF NOT EXISTS idx_project_template_items_category
  ON project_template_items(category);

-- ---------------------------------------------------------------------------
-- Partner budget envelopes (SSOT authoritative).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS partner_budgets (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL,
  partner_id UUID NOT NULL,
  currency TEXT NOT NULL,
  ceiling_total NUMERIC(18,2) NOT NULL CHECK (ceiling_total >= 0),
  status TEXT NOT NULL CHECK (status IN ('DRAFT','SUBMITTED','APPROVED','OPEN_FOR_PARTNER','LOCKED')),
  rules_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_budgets_project
  ON partner_budgets(project_id);

CREATE INDEX IF NOT EXISTS idx_partner_budgets_partner
  ON partner_budgets(partner_id);

CREATE INDEX IF NOT EXISTS idx_partner_budgets_status
  ON partner_budgets(status);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_partner_budgets_updated_at'
  ) THEN
    CREATE TRIGGER trg_partner_budgets_updated_at
    BEFORE UPDATE ON partner_budgets
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- Partner-specific budget templates cloned from project baselines.
-- legacy_category_id keeps referential mapping for compatibility views.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS partner_budget_templates (
  id UUID PRIMARY KEY,
  partner_budget_id UUID NOT NULL REFERENCES partner_budgets(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  subcategory TEXT,
  guidance TEXT,
  required BOOLEAN NOT NULL DEFAULT FALSE,
  min_lines INT,
  sort_index INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('DRAFT','READY','CLOSED')),
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  legacy_category_id UUID
);

CREATE INDEX IF NOT EXISTS idx_partner_budget_templates_pb
  ON partner_budget_templates(partner_budget_id);

CREATE INDEX IF NOT EXISTS idx_partner_budget_templates_pb_status
  ON partner_budget_templates(partner_budget_id, status);

CREATE INDEX IF NOT EXISTS idx_partner_budget_templates_cat
  ON partner_budget_templates(partner_budget_id, category, subcategory);

-- ---------------------------------------------------------------------------
-- Partner budget detail lines containing financial figures.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS partner_budget_lines (
  id UUID PRIMARY KEY,
  partner_budget_id UUID NOT NULL REFERENCES partner_budgets(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES partner_budget_templates(id) ON DELETE RESTRICT,
  description TEXT NOT NULL,
  unit TEXT NOT NULL,
  qty NUMERIC(18,3) NOT NULL CHECK (qty > 0),
  unit_cost NUMERIC(18,2) NOT NULL CHECK (unit_cost >= 0),
  total NUMERIC(18,2) GENERATED ALWAYS AS (qty * unit_cost) STORED,
  currency TEXT NOT NULL,
  period_from DATE,
  period_to DATE,
  notes TEXT,
  status TEXT NOT NULL CHECK (status IN ('DRAFT','SUBMITTED','APPROVED','NEEDS_CHANGES','REJECTED')),
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_budget_lines_pb
  ON partner_budget_lines(partner_budget_id);

CREATE INDEX IF NOT EXISTS idx_partner_budget_lines_template
  ON partner_budget_lines(template_id);

CREATE INDEX IF NOT EXISTS idx_partner_budget_lines_status
  ON partner_budget_lines(status);

CREATE INDEX IF NOT EXISTS idx_partner_budget_lines_created_at
  ON partner_budget_lines(created_at);
-- ---------------------------------------------------------------------------
-- Fund requests for partner projects.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fund_requests (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL,
  partner_id UUID NOT NULL,
  amount NUMERIC(18,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL,
  purpose TEXT NOT NULL,
  period_from DATE,
  period_to DATE,
  status TEXT NOT NULL CHECK (status IN ('draft','submitted','approved','rejected','paid')) DEFAULT 'draft',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fund_requests_project
  ON fund_requests(project_id);

CREATE INDEX IF NOT EXISTS idx_fund_requests_partner
  ON fund_requests(partner_id);

CREATE INDEX IF NOT EXISTS idx_fund_requests_status
  ON fund_requests(status);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_fund_requests_updated_at'
  ) THEN
    CREATE TRIGGER trg_fund_requests_updated_at
    BEFORE UPDATE ON fund_requests
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- Review threading + comments (single source for workflow conversations).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS review_threads (
  id UUID PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_review_threads_entity
  ON review_threads(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS review_comments (
  id UUID PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES review_threads(id) ON DELETE CASCADE,
  author_user_id UUID NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('COMMENT','REQUEST_CHANGES','REJECTION','SYSTEM')),
  body TEXT NOT NULL,
  attachments JSONB,
  legacy_parent_id UUID,
  legacy_is_resolved BOOLEAN,
  legacy_resolved_at TIMESTAMPTZ,
  legacy_resolved_by UUID,
  legacy_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_review_comments_thread
  ON review_comments(thread_id);

CREATE INDEX IF NOT EXISTS idx_review_comments_created_at
  ON review_comments(created_at);

-- ---------------------------------------------------------------------------
-- Reconciliation evidence artefacts linked to budget lines.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recon_line_evidence (
  id UUID PRIMARY KEY,
  partner_budget_line_id UUID NOT NULL REFERENCES partner_budget_lines(id) ON DELETE CASCADE,
  amount NUMERIC(18,2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL,
  spent_at DATE NOT NULL,
  doc_id UUID,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recon_evidence_line
  ON recon_line_evidence(partner_budget_line_id);

CREATE INDEX IF NOT EXISTS idx_recon_evidence_spent_at
  ON recon_line_evidence(spent_at);

-- ---------------------------------------------------------------------------
-- Audit trail (renamed from legacy audit_logs with normalized columns).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY,
  actor_user_id UUID NOT NULL,
  action_key TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  from_state TEXT,
  to_state TEXT,
  payload_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_entity
  ON audit_log(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_audit_action
  ON audit_log(action_key);

CREATE INDEX IF NOT EXISTS idx_audit_created_at
  ON audit_log(created_at);

-- ---------------------------------------------------------------------------
-- Notifications (SSOT version with channel + templating metadata).
-- ---------------------------------------------------------------------------
-- Rename existing notifications table if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'notifications_legacy'
  ) THEN
    EXECUTE 'DROP TABLE notifications_legacy';
  END IF;
  
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_name = 'notifications'
  ) THEN
    EXECUTE 'ALTER TABLE notifications RENAME TO notifications_legacy';
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('IN_APP','EMAIL')),
  template_key TEXT NOT NULL,
  payload_json JSONB,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user
  ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON notifications(user_id) WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_created_at
  ON notifications(created_at);

-- ---------------------------------------------------------------------------
-- Action idempotency support for write-once commands.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS action_idempotency (
  id UUID PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  action_key TEXT NOT NULL,
  actor_user_id UUID NOT NULL,
  request_hash TEXT,
  response_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- ---------------------------------------------------------------------------
-- Notification inbox for user notifications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notif_inbox (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  tenant_id UUID,
  event_key TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link_url TEXT,
  unread BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_inbox_user
  ON notif_inbox(user_id);

CREATE INDEX IF NOT EXISTS idx_notif_inbox_user_unread
  ON notif_inbox(user_id) WHERE unread = true;

-- ---------------------------------------------------------------------------
-- Approval Registry + Runtime (MVP-ready, upgradable)
-- ---------------------------------------------------------------------------
-- registry: defines how each entity type is approved, by org/project
CREATE TABLE IF NOT EXISTS approval_policies (
  id         UUID PRIMARY KEY,
  scope      TEXT NOT NULL,                -- 'org'|'project'
  scope_ref  UUID,                         -- NULL for org-wide; project_id otherwise
  entity_type TEXT NOT NULL,               -- 'partner_budget'|'contract'|'fund_request'|'reconciliation'
  provider   TEXT NOT NULL,                -- 'internal'|'approvalmax'
  name       TEXT NOT NULL,
  description TEXT,
  config_json JSONB NOT NULL,              -- provider-specific config
  active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- runtime: one per submission
CREATE TABLE IF NOT EXISTS approvals (
  id            UUID PRIMARY KEY,
  policy_id     UUID NOT NULL REFERENCES approval_policies(id),
  entity_type   TEXT NOT NULL,
  entity_id     UUID NOT NULL,
  provider      TEXT NOT NULL,
  approval_ref  TEXT,                      -- external id or internal instance id
  status        TEXT NOT NULL DEFAULT 'PENDING',  -- PENDING|APPROVED|REJECTED|CANCELLED
  assignee_role TEXT,                      -- internal provider current step's role
  step          INT NOT NULL DEFAULT 1,
  total_steps   INT NOT NULL DEFAULT 1,
  amount        NUMERIC,                   -- optional field for rules
  requested_by  UUID NOT NULL,
  requested_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_by    UUID,
  decided_at    TIMESTAMPTZ,
  comment       TEXT,
  metadata_json JSONB NOT NULL DEFAULT '{}'
);

-- optional: comments thread
CREATE TABLE IF NOT EXISTS approval_comments (
  id           UUID PRIMARY KEY,
  approval_id  UUID NOT NULL REFERENCES approvals(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL,
  message      TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- optional: docs attached for review
CREATE TABLE IF NOT EXISTS approval_docs (
  id           UUID PRIMARY KEY,
  approval_id  UUID NOT NULL REFERENCES approvals(id) ON DELETE CASCADE,
  uri          TEXT NOT NULL,
  label        TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Role & Dashboard Registry
-- ---------------------------------------------------------------------------
-- roles (registry, not user assignments)
CREATE TABLE IF NOT EXISTS roles_registry (
  id               TEXT PRIMARY KEY,          -- e.g., 'partner', 'admin', 'finance_officer_v1'
  label            TEXT NOT NULL,
  inherits         JSONB NOT NULL DEFAULT '[]',-- array of role ids
  caps             JSONB NOT NULL,             -- array of strings
  scopes           JSONB NOT NULL,             -- { project: 'all'|'self', tenant: 'current'|'all' }
  visibility_rules JSONB NOT NULL DEFAULT '[]',-- see §4.4
  version          INT NOT NULL DEFAULT 1,
  active           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- dashboards (registry)
CREATE TABLE IF NOT EXISTS dashboards_registry (
  role_id          TEXT NOT NULL REFERENCES roles_registry(id) ON DELETE CASCADE,
  version          INT NOT NULL DEFAULT 1,
  menus_json       JSONB NOT NULL,            -- sidebar menus
  pages_json       JSONB NOT NULL,            -- list of page configs with widgets
  active           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (role_id, version)
);

-- current active dashboard pointer (quick lookup)
CREATE OR REPLACE VIEW dashboards_active AS
SELECT DISTINCT ON (role_id) role_id, version, menus_json, pages_json
FROM dashboards_registry
WHERE active = TRUE
ORDER BY role_id, version DESC;

-- user assignments (who has which role)
CREATE TABLE IF NOT EXISTS users_roles (
  user_id   UUID NOT NULL,
  role_id   TEXT NOT NULL REFERENCES roles_registry(id) ON DELETE RESTRICT,
  PRIMARY KEY (user_id, role_id)
);

COMMIT;

-- ============================================================================
-- End Phase A
-- ============================================================================