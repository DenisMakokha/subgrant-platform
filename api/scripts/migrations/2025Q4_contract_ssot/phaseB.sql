-- ============================================================================
-- Contract SSOT Schema - Phase B (Additional features)
-- ============================================================================

BEGIN;

-- 1. Contract milestones
CREATE TABLE IF NOT EXISTS contract_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  tenant_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  completion_date DATE,
  amount NUMERIC, -- Amount associated with this milestone
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending', -- pending|completed|cancelled
  notes TEXT,
  created_by UUID NOT NULL,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Contract deliverables
CREATE TABLE IF NOT EXISTS contract_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  tenant_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  submission_date DATE,
  acceptance_date DATE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending|submitted|accepted|rejected
  rejection_reason TEXT, -- Reason for rejection
  notes TEXT,
  created_by UUID NOT NULL,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Contract payments
CREATE TABLE IF NOT EXISTS contract_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  tenant_id UUID,
  milestone_id UUID REFERENCES contract_milestones(id), -- Optional link to milestone
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_date DATE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending|processed|failed
  payment_method TEXT, -- e.g., 'bank_transfer', 'check', 'paypal'
  reference_number TEXT, -- Payment reference number
  notes TEXT,
  created_by UUID NOT NULL,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Contract reporting requirements
CREATE TABLE IF NOT EXISTS contract_reporting_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  tenant_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL, -- e.g., 'monthly', 'quarterly', 'annually'
  due_date DATE, -- First due date
  next_due_date DATE, -- Next due date (automatically calculated)
  last_submitted_date DATE, -- Last submission date
  status TEXT NOT NULL DEFAULT 'active', -- active|inactive
  notes TEXT,
  created_by UUID NOT NULL,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Contract reporting submissions
CREATE TABLE IF NOT EXISTS contract_reporting_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id UUID NOT NULL REFERENCES contract_reporting_requirements(id) ON DELETE CASCADE,
  tenant_id UUID,
  submission_date DATE NOT NULL,
  document_key TEXT, -- S3 key for the submitted document
  status TEXT NOT NULL DEFAULT 'submitted', -- submitted|accepted|rejected
  reviewer_id UUID, -- Who reviewed the submission
  review_date DATE, -- When it was reviewed
  review_notes TEXT, -- Reviewer notes
  created_by UUID NOT NULL,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contract_milestones_contract ON contract_milestones(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_milestones_status ON contract_milestones(status);
CREATE INDEX IF NOT EXISTS idx_contract_deliverables_contract ON contract_deliverables(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_deliverables_status ON contract_deliverables(status);
CREATE INDEX IF NOT EXISTS idx_contract_payments_contract ON contract_payments(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_payments_status ON contract_payments(status);
CREATE INDEX IF NOT EXISTS idx_contract_reporting_requirements_contract ON contract_reporting_requirements(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_reporting_requirements_status ON contract_reporting_requirements(status);
CREATE INDEX IF NOT EXISTS idx_contract_reporting_submissions_requirement ON contract_reporting_submissions(requirement_id);
CREATE INDEX IF NOT EXISTS idx_contract_reporting_submissions_status ON contract_reporting_submissions(status);

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
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_contract_milestones_updated_at'
  ) THEN
    CREATE TRIGGER update_contract_milestones_updated_at
      BEFORE UPDATE ON contract_milestones
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_contract_deliverables_updated_at'
  ) THEN
    CREATE TRIGGER update_contract_deliverables_updated_at
      BEFORE UPDATE ON contract_deliverables
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_contract_payments_updated_at'
  ) THEN
    CREATE TRIGGER update_contract_payments_updated_at
      BEFORE UPDATE ON contract_payments
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_contract_reporting_requirements_updated_at'
  ) THEN
    CREATE TRIGGER update_contract_reporting_requirements_updated_at
      BEFORE UPDATE ON contract_reporting_requirements
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_contract_reporting_submissions_updated_at'
  ) THEN
    CREATE TRIGGER update_contract_reporting_submissions_updated_at
      BEFORE UPDATE ON contract_reporting_submissions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;

COMMIT;