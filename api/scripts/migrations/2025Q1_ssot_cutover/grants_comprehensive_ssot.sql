-- ============================================================================
-- Comprehensive Grants SSOT Migration
-- Path: api/scripts/migrations/2025Q1_ssot_cutover/grants_comprehensive_ssot.sql
-- Creates all grants-related tables for full SSOT implementation
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Core grants table (canonical source)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS grants (
  id               UUID PRIMARY KEY,
  project_id       UUID NOT NULL,              -- the canonical id other modules use
  grant_number     TEXT UNIQUE,                -- e.g., GRN-202509-3009
  name             TEXT NOT NULL,
  description      TEXT,
  open_date        DATE NOT NULL,
  close_date       DATE NOT NULL,
  currency         TEXT NOT NULL,              -- ISO 4217
  budget_amount    NUMERIC(18,2) NOT NULL CHECK (budget_amount >= 0),
  program_manager  UUID,                       -- users table FK
  donor_name       TEXT,
  donor_contact_name  TEXT,
  donor_contact_email TEXT,
  donor_contact_phone TEXT,
  status           TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','ARCHIVED','CANCELLED')),
  created_by       UUID NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Grants SSOT table (authoritative for analytics)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS grants_ssot (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL,
  grant_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  open_date DATE,
  close_date DATE,
  currency TEXT,
  budget_amount NUMERIC(18,2),
  program_manager UUID,
  donor_name TEXT,
  donor_contact_name TEXT,
  donor_contact_email TEXT,
  donor_contact_phone TEXT,
  status TEXT NOT NULL CHECK (status IN ('DRAFT','ACTIVE','CLOSED')) DEFAULT 'DRAFT',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Grant reporting dates (financial & narrative)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS grant_reporting_dates (
  id           UUID PRIMARY KEY,
  grant_id     UUID NOT NULL REFERENCES grants(id) ON DELETE CASCADE,
  kind         TEXT NOT NULL CHECK (kind IN ('financial','narrative')),
  due_date     DATE NOT NULL,
  description  TEXT,
  status       TEXT NOT NULL DEFAULT 'due' CHECK (status IN ('due','submitted','approved','overdue')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (grant_id, kind, due_date)
);

-- ---------------------------------------------------------------------------
-- Internal grant budget: category allocations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS grant_category_allocations (
  id           UUID PRIMARY KEY,
  grant_id     UUID NOT NULL REFERENCES grants(id) ON DELETE CASCADE,
  category_id  TEXT NOT NULL,                   -- your catalog id or name
  amount       NUMERIC(18,2) NOT NULL CHECK (amount >= 0),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (grant_id, category_id)
);

-- ---------------------------------------------------------------------------
-- Grant attachments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS grant_attachments (
  id        UUID PRIMARY KEY,
  grant_id  UUID NOT NULL REFERENCES grants(id) ON DELETE CASCADE,
  name      TEXT NOT NULL,
  uri       TEXT NOT NULL,
  mime      TEXT NOT NULL,
  size_bytes BIGINT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Partner allocation envelopes (single per project/grant)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS allocation_envelopes (
  id             UUID PRIMARY KEY,
  grant_id       UUID NOT NULL REFERENCES grants(id) ON DELETE CASCADE,
  project_id     UUID NOT NULL,
  currency       TEXT NOT NULL,
  ceiling_amount NUMERIC(18,2) NOT NULL CHECK (ceiling_amount >= 0),
  status         TEXT NOT NULL DEFAULT 'APPROVED' CHECK (status IN ('DRAFT','APPROVED','LOCKED','CANCELLED')),
  notes          TEXT,
  created_by     UUID NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_by     UUID,
  decided_at     TIMESTAMPTZ,
  UNIQUE (grant_id, project_id)
);

-- ---------------------------------------------------------------------------
-- Envelope amendments (track changes over time)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS envelope_amendments (
  id          UUID PRIMARY KEY,
  envelope_id UUID NOT NULL REFERENCES allocation_envelopes(id) ON DELETE CASCADE,
  delta       NUMERIC(18,2) NOT NULL,
  reason      TEXT,
  created_by  UUID NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Analytics fact tables for grants metrics
-- ---------------------------------------------------------------------------

-- Fact: envelope stance (daily snapshot)
CREATE TABLE IF NOT EXISTS fact_envelope_daily (
  date_key DATE NOT NULL,
  project_id UUID NOT NULL,
  envelope_total NUMERIC(18,2) NOT NULL,
  approved_partner_sum NUMERIC(18,2) NOT NULL,
  headroom NUMERIC(18,2) NOT NULL,
  amendments_cum NUMERIC(18,2) NOT NULL,
  PRIMARY KEY (date_key, project_id)
);

-- Fact: partner budget stance (daily snapshot)
CREATE TABLE IF NOT EXISTS fact_partner_budget_daily (
  date_key DATE NOT NULL,
  project_id UUID NOT NULL,
  partner_id UUID NOT NULL,
  ceiling NUMERIC(18,2) NOT NULL,
  budgeted NUMERIC(18,2) NOT NULL,
  spent NUMERIC(18,2) NOT NULL,
  remaining NUMERIC(18,2) NOT NULL,
  utilization_pct NUMERIC(9,2) NOT NULL,
  PRIMARY KEY (date_key, project_id, partner_id)
);

-- Fact: category stance (per partner/project/category)
CREATE TABLE IF NOT EXISTS fact_category_daily (
  date_key DATE NOT NULL,
  project_id UUID NOT NULL,
  partner_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',  -- Use default for internal grant totals
  category TEXT NOT NULL,
  budgeted NUMERIC(18,2) NOT NULL,
  spent NUMERIC(18,2) NOT NULL,
  variance NUMERIC(18,2) NOT NULL,
  utilization_pct NUMERIC(9,2) NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('partner','grant_internal')),
  PRIMARY KEY (date_key, project_id, partner_id, category, scope)
);

-- Fact: approvals operations
CREATE TABLE IF NOT EXISTS fact_approvals (
  entity_type TEXT NOT NULL,  -- budget_line|partner_budget|contract|fund_request
  entity_id UUID NOT NULL,
  project_id UUID,
  partner_id UUID,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  step_count INT,
  total_duration_sec INT,
  result TEXT CHECK (result IN ('APPROVED','REJECTED')),
  PRIMARY KEY (entity_type, entity_id)
);

-- Fact: contracts
CREATE TABLE IF NOT EXISTS fact_contracts (
  contract_id UUID PRIMARY KEY,
  project_id UUID NOT NULL,
  partner_id UUID NOT NULL,
  number TEXT,
  generated_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  cycle_days INT
);

-- Fact: fund requests
CREATE TABLE IF NOT EXISTS fact_fund_requests (
  fund_request_id UUID PRIMARY KEY,
  project_id UUID NOT NULL,
  partner_id UUID NOT NULL,
  amount NUMERIC(18,2) NOT NULL,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  posted_to_erp_at TIMESTAMPTZ,
  state TEXT
);

-- Fact: reporting SLA
CREATE TABLE IF NOT EXISTS fact_reports (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL,
  partner_id UUID NOT NULL,
  type TEXT CHECK (type IN ('financial','narrative')),
  period_start DATE,
  period_end DATE,
  due_date DATE,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  on_time BOOLEAN,
  days_to_submit INT,
  days_to_approve INT
);

-- ---------------------------------------------------------------------------
-- Indexes for performance
-- ---------------------------------------------------------------------------

-- Grants indexes
CREATE INDEX IF NOT EXISTS idx_grants_project_id ON grants(project_id);
CREATE INDEX IF NOT EXISTS idx_grants_status ON grants(status);
CREATE INDEX IF NOT EXISTS idx_grants_created_at ON grants(created_at);
CREATE INDEX IF NOT EXISTS idx_grants_program_manager ON grants(program_manager);

-- Grants SSOT indexes
CREATE INDEX IF NOT EXISTS idx_grants_ssot_project_id ON grants_ssot(project_id);
CREATE INDEX IF NOT EXISTS idx_grants_ssot_status ON grants_ssot(status);
CREATE INDEX IF NOT EXISTS idx_grants_ssot_created_at ON grants_ssot(created_at);
CREATE INDEX IF NOT EXISTS idx_grants_ssot_updated_at ON grants_ssot(updated_at);

-- Reporting dates indexes
CREATE INDEX IF NOT EXISTS idx_grant_reporting_dates_grant_id ON grant_reporting_dates(grant_id);
CREATE INDEX IF NOT EXISTS idx_grant_reporting_dates_due_date ON grant_reporting_dates(due_date);
CREATE INDEX IF NOT EXISTS idx_grant_reporting_dates_status ON grant_reporting_dates(status);

-- Category allocations indexes
CREATE INDEX IF NOT EXISTS idx_grant_category_allocations_grant_id ON grant_category_allocations(grant_id);
CREATE INDEX IF NOT EXISTS idx_grant_category_allocations_category ON grant_category_allocations(category_id);

-- Attachments indexes
CREATE INDEX IF NOT EXISTS idx_grant_attachments_grant_id ON grant_attachments(grant_id);

-- Envelope indexes
CREATE INDEX IF NOT EXISTS idx_allocation_envelopes_grant_id ON allocation_envelopes(grant_id);
CREATE INDEX IF NOT EXISTS idx_allocation_envelopes_project_id ON allocation_envelopes(project_id);
CREATE INDEX IF NOT EXISTS idx_allocation_envelopes_status ON allocation_envelopes(status);

-- Amendment indexes
CREATE INDEX IF NOT EXISTS idx_envelope_amendments_envelope_id ON envelope_amendments(envelope_id);
CREATE INDEX IF NOT EXISTS idx_envelope_amendments_created_at ON envelope_amendments(created_at);

-- Fact table indexes
CREATE INDEX IF NOT EXISTS idx_fact_envelope_daily_project ON fact_envelope_daily(project_id);
CREATE INDEX IF NOT EXISTS idx_fact_partner_budget_daily_project ON fact_partner_budget_daily(project_id);
CREATE INDEX IF NOT EXISTS idx_fact_partner_budget_daily_partner ON fact_partner_budget_daily(partner_id);
CREATE INDEX IF NOT EXISTS idx_fact_category_daily_project ON fact_category_daily(project_id);
CREATE INDEX IF NOT EXISTS idx_fact_approvals_project ON fact_approvals(project_id);
CREATE INDEX IF NOT EXISTS idx_fact_contracts_project ON fact_contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_fact_fund_requests_project ON fact_fund_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_fact_reports_project ON fact_reports(project_id);

-- ---------------------------------------------------------------------------
-- Triggers for updated_at timestamps
-- ---------------------------------------------------------------------------

-- Grants updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at_timestamp_grants()
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
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_grants_updated_at') THEN
    CREATE TRIGGER trg_grants_updated_at
    BEFORE UPDATE ON grants
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp_grants();
  END IF;
END;
$$;

-- Grants SSOT updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at_timestamp_grants_ssot()
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
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_grants_ssot_updated_at') THEN
    CREATE TRIGGER trg_grants_ssot_updated_at
    BEFORE UPDATE ON grants_ssot
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp_grants_ssot();
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- Real-time guard view for envelope headroom (approval check)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_envelope_headroom AS
SELECT
  e.project_id,
  e.currency,
  e.ceiling_amount AS envelope_total,
  COALESCE(SUM(pb.ceiling_total),0) AS approved_partner_sum,
  e.ceiling_amount - COALESCE(SUM(pb.ceiling_total),0) AS headroom
FROM allocation_envelopes e
LEFT JOIN partner_budgets pb
  ON pb.project_id = e.project_id AND pb.status='APPROVED'
WHERE e.status IN ('APPROVED','LOCKED')
GROUP BY e.project_id, e.currency, e.ceiling_amount;

-- ---------------------------------------------------------------------------
-- Materialized view for grants analytics overview
-- ---------------------------------------------------------------------------
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_grants_overview AS
SELECT
  g.id,
  g.project_id,
  g.grant_number,
  g.name,
  g.currency,
  g.budget_amount,
  g.status,
  g.open_date,
  g.close_date,
  COALESCE(e.ceiling_amount, 0) AS envelope_total,
  COALESCE(pb_sum.approved_total, 0) AS approved_partner_sum,
  COALESCE(e.ceiling_amount, 0) - COALESCE(pb_sum.approved_total, 0) AS headroom,
  CASE 
    WHEN g.close_date < CURRENT_DATE THEN 'CLOSED'
    WHEN g.open_date > CURRENT_DATE THEN 'PENDING'
    ELSE 'ACTIVE'
  END AS timeline_status
FROM grants g
LEFT JOIN allocation_envelopes e ON e.grant_id = g.id AND e.status IN ('APPROVED','LOCKED')
LEFT JOIN (
  SELECT 
    project_id,
    SUM(ceiling_total) AS approved_total
  FROM partner_budgets 
  WHERE status = 'APPROVED'
  GROUP BY project_id
) pb_sum ON pb_sum.project_id = g.project_id
WHERE g.status != 'CANCELLED';

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_grants_overview_id ON mv_grants_overview(id);
CREATE INDEX IF NOT EXISTS idx_mv_grants_overview_project ON mv_grants_overview(project_id);
CREATE INDEX IF NOT EXISTS idx_mv_grants_overview_status ON mv_grants_overview(status);

COMMIT;

-- ============================================================================
-- End grants_comprehensive_ssot.sql
-- ============================================================================