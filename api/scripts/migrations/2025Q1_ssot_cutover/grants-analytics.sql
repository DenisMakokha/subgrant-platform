-- ============================================================================
-- Grants Analytics SSOT Migration
-- ============================================================================

-- 1.1 grants (core record)
CREATE TABLE IF NOT EXISTS grants (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID NOT NULL,
  grant_number     TEXT UNIQUE,
  name             TEXT NOT NULL,
  description      TEXT,
  open_date        DATE NOT NULL,
  close_date       DATE NOT NULL,
  currency         TEXT NOT NULL,
  budget_amount    NUMERIC(18,2) NOT NULL CHECK (budget_amount >= 0),
  program_manager  UUID,
  donor_name       TEXT,
  donor_contact_name  TEXT,
  donor_contact_email TEXT,
  donor_contact_phone TEXT,
  status           TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE|ARCHIVED|CANCELLED
  created_by       UUID NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.2 reporting dates (financial & narrative)
CREATE TABLE IF NOT EXISTS grant_reporting_dates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_id     UUID NOT NULL REFERENCES grants(id) ON DELETE CASCADE,
  kind             TEXT NOT NULL CHECK (kind IN ('financial','narrative')),
  due_date     DATE NOT NULL,
  description  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (grant_id, kind, due_date)
);

-- 1.3 internal grant budget: category allocations
CREATE TABLE IF NOT EXISTS grant_category_allocations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_id     UUID NOT NULL REFERENCES grants(id) ON DELETE CASCADE,
  category_id  TEXT NOT NULL,
  amount       NUMERIC(18,2) NOT NULL CHECK (amount >= 0),
  UNIQUE (grant_id, category_id)
);

-- 1.4 attachments
CREATE TABLE IF NOT EXISTS grant_attachments (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_id  UUID NOT NULL REFERENCES grants(id) ON DELETE CASCADE,
  name      TEXT NOT NULL,
  uri       TEXT NOT NULL,
  mime      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.5 partner envelope (optional at creation; single per project/grant)
CREATE TABLE IF NOT EXISTS allocation_envelopes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grant_id       UUID NOT NULL REFERENCES grants(id) ON DELETE CASCADE,
  project_id     UUID NOT NULL,
  currency       TEXT NOT NULL,
  ceiling_amount NUMERIC(18,2) NOT NULL CHECK (ceiling_amount >= 0),
  status         TEXT NOT NULL DEFAULT 'APPROVED', -- if created from form; or 'DRAFT'
  notes          TEXT,
  created_by     UUID NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_by     UUID,
  decided_at     TIMESTAMPTZ,
  UNIQUE (grant_id)
);

-- 1.6 envelope amendments
CREATE TABLE IF NOT EXISTS envelope_amendments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  envelope_id UUID NOT NULL REFERENCES allocation_envelopes(id) ON DELETE CASCADE,
  delta       NUMERIC(18,2) NOT NULL,
  reason      TEXT,
  created_by  UUID NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.1 Dimensions
CREATE TABLE IF NOT EXISTS dim_project (
  id UUID PRIMARY KEY,
  donor TEXT,
  name TEXT,
  start_date DATE,
  end_date DATE,
  currency TEXT
);

-- 2.2 Facts (events/snapshots)

-- Fact: envelope stance (denormalized for speed)
CREATE TABLE IF NOT EXISTS fact_envelope_daily (
  date_key DATE NOT NULL,
  project_id UUID NOT NULL,
  envelope_total NUMERIC(18,2) NOT NULL,
  approved_partner_sum NUMERIC(18,2) NOT NULL,
  headroom NUMERIC(18,2) NOT NULL,
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
  partner_id UUID,
  category TEXT NOT NULL,
  budgeted NUMERIC(18,2) NOT NULL,
  spent NUMERIC(18,2) NOT NULL,
  variance NUMERIC(18,2) NOT NULL,
  utilization_pct NUMERIC(9,2) NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('partner','grant_internal')),
  PRIMARY KEY (date_key, project_id, COALESCE(partner_id, '00000000-0000-0000-0000-000000000000'), category, scope)
);

-- Fact: approvals ops
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

-- 3.1 Real-time guard view (approval check)
CREATE OR REPLACE VIEW vw_envelope_headroom AS
SELECT
  e.project_id,
  e.currency,
  e.ceiling_amount AS envelope_total,
  COALESCE(SUM(pb.ceiling_amount),0) AS approved_partner_sum,
  e.ceiling_amount - COALESCE(SUM(pb.ceiling_amount),0) AS headroom
FROM allocation_envelopes e
LEFT JOIN partner_budgets pb
  ON pb.project_id = e.project_id AND pb.state='APPROVED'
WHERE e.status IN ('APPROVED','LOCKED')
GROUP BY e.project_id, e.currency, e.ceiling_amount;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_grants_project_id ON grants(project_id);
CREATE INDEX IF NOT EXISTS idx_grants_grant_number ON grants(grant_number);
CREATE INDEX IF NOT EXISTS idx_grant_reporting_dates_grant_id ON grant_reporting_dates(grant_id);
CREATE INDEX IF NOT EXISTS idx_grant_category_allocations_grant_id ON grant_category_allocations(grant_id);
CREATE INDEX IF NOT EXISTS idx_allocation_envelopes_grant_id ON allocation_envelopes(grant_id);
CREATE INDEX IF NOT EXISTS idx_fact_envelope_daily_date_key ON fact_envelope_daily(date_key);
CREATE INDEX IF NOT EXISTS idx_fact_partner_budget_daily_date_key ON fact_partner_budget_daily(date_key);
CREATE INDEX IF NOT EXISTS idx_fact_category_daily_date_key ON fact_category_daily(date_key);
CREATE INDEX IF NOT EXISTS idx_fact_approvals_entity_type ON fact_approvals(entity_type));
CREATE INDEX IF NOT EXISTS idx_fact_contracts_project_id ON fact_contracts(project_id));
CREATE INDEX IF NOT EXISTS idx_fact_fund_requests_project_id ON fact_fund_requests(project_id));
CREATE INDEX IF NOT EXISTS idx_fact_reports_project_id ON fact_reports(project_id));

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO subgrant_app;