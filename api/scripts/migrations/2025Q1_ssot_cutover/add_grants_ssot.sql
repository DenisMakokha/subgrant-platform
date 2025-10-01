-- ============================================================================
-- SSOT: Add grants_ssot table and supporting indexes/triggers
-- Path: api/scripts/migrations/2025Q1_ssot_cutover/add_grants_ssot.sql
-- Note: Safe to run idempotently.
-- ============================================================================

BEGIN;

-- Create grants_ssot authoritative table for grants SSOT
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

-- Indexes to support common lookups
CREATE INDEX IF NOT EXISTS idx_grants_ssot_project_id ON grants_ssot(project_id);
CREATE INDEX IF NOT EXISTS idx_grants_ssot_status ON grants_ssot(status);
CREATE INDEX IF NOT EXISTS idx_grants_ssot_created_at ON grants_ssot(created_at);
CREATE INDEX IF NOT EXISTS idx_grants_ssot_updated_at ON grants_ssot(updated_at);

-- Trigger function to keep updated_at fresh
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

COMMIT;

-- ============================================================================
-- End add_grants_ssot.sql
-- ============================================================================