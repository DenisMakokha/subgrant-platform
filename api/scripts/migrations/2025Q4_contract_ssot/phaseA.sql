-- ============================================================================
-- Contract SSOT Schema - Phase A
-- ============================================================================

BEGIN;

-- 1. Contract templates
CREATE TABLE IF NOT EXISTS contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  docx_template_key TEXT NOT NULL, -- S3 key for the template
  merge_fields_json JSONB NOT NULL, -- Fields that can be merged into the template
  version INTEGER NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (tenant_id, name, version)
);

-- Add tenant_id column if it doesn't exist (for existing tables)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contract_templates' 
    AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE contract_templates ADD COLUMN tenant_id UUID;
  END IF;
END;
$$;

-- 2. Contracts
-- Add missing columns to existing contracts table
DO $$
BEGIN
  -- Add tenant_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE contracts ADD COLUMN tenant_id UUID;
  END IF;
  
  -- Add project_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'project_id'
  ) THEN
    ALTER TABLE contracts ADD COLUMN project_id UUID;
  END IF;
  
  -- Add partner_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'partner_id'
  ) THEN
    ALTER TABLE contracts ADD COLUMN partner_id UUID;
  END IF;
  
  -- Add state column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'state'
  ) THEN
    ALTER TABLE contracts ADD COLUMN state TEXT NOT NULL DEFAULT 'draft';
  END IF;
  
  -- Add substatus_json column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'substatus_json'
  ) THEN
    ALTER TABLE contracts ADD COLUMN substatus_json JSONB;
  END IF;
  
  -- Add currency column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'currency'
  ) THEN
    ALTER TABLE contracts ADD COLUMN currency TEXT NOT NULL DEFAULT 'USD';
  END IF;
  
  -- Add total_amount column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'total_amount'
  ) THEN
    ALTER TABLE contracts ADD COLUMN total_amount NUMERIC;
  END IF;
  
  -- Add start_date column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'start_date'
  ) THEN
    ALTER TABLE contracts ADD COLUMN start_date DATE;
  END IF;
  
  -- Add duration_months column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'duration_months'
  ) THEN
    ALTER TABLE contracts ADD COLUMN duration_months INTEGER;
  END IF;
  
  -- Add renewal_terms column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'renewal_terms'
  ) THEN
    ALTER TABLE contracts ADD COLUMN renewal_terms TEXT;
  END IF;
  
  -- Add termination_clauses column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'termination_clauses'
  ) THEN
    ALTER TABLE contracts ADD COLUMN termination_clauses TEXT;
  END IF;
  
  -- Add rendered_docx_key column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'rendered_docx_key'
  ) THEN
    ALTER TABLE contracts ADD COLUMN rendered_docx_key TEXT;
  END IF;
  
  -- Add approved_docx_key column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'approved_docx_key'
  ) THEN
    ALTER TABLE contracts ADD COLUMN approved_docx_key TEXT;
  END IF;
  
  -- Add signed_pdf_key column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'signed_pdf_key'
  ) THEN
    ALTER TABLE contracts ADD COLUMN signed_pdf_key TEXT;
  END IF;
  
  -- Add approval_provider column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'approval_provider'
  ) THEN
    ALTER TABLE contracts ADD COLUMN approval_provider TEXT;
  END IF;
  
  -- Add approval_ref column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'approval_ref'
  ) THEN
    ALTER TABLE contracts ADD COLUMN approval_ref TEXT;
  END IF;
  
  -- Add envelope_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'envelope_id'
  ) THEN
    ALTER TABLE contracts ADD COLUMN envelope_id TEXT;
  END IF;
  
  -- Add signed_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'signed_at'
  ) THEN
    ALTER TABLE contracts ADD COLUMN signed_at TIMESTAMPTZ;
  END IF;
  
  -- Add activated_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'activated_at'
  ) THEN
    ALTER TABLE contracts ADD COLUMN activated_at TIMESTAMPTZ;
  END IF;
  
  -- Add terminated_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'terminated_at'
  ) THEN
    ALTER TABLE contracts ADD COLUMN terminated_at TIMESTAMPTZ;
  END IF;
  
  -- Add termination_reason column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'termination_reason'
  ) THEN
    ALTER TABLE contracts ADD COLUMN termination_reason TEXT;
  END IF;
  
  -- Add version column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'version'
  ) THEN
    ALTER TABLE contracts ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
  END IF;
  
  -- Add updated_by column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE contracts ADD COLUMN updated_by UUID;
  END IF;
  
  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE contracts ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
  
  -- Add number column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contracts' 
    AND column_name = 'number'
  ) THEN
    ALTER TABLE contracts ADD COLUMN number TEXT;
  END IF;
END;
$$;

-- Add unique constraint for tenant_id and number if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE table_name = 'contracts' 
    AND constraint_name = 'contracts_tenant_id_number_key'
  ) THEN
    ALTER TABLE contracts ADD CONSTRAINT contracts_tenant_id_number_key UNIQUE (tenant_id, number);
  END IF;
END;
$$;

-- 3. Contract amendments
CREATE TABLE IF NOT EXISTS contract_amendments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  tenant_id UUID,
  amendment_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  state TEXT NOT NULL DEFAULT 'draft', -- draft|generated|submitted|approved|signed|active
  rendered_docx_key TEXT, -- S3 key for the rendered amendment document
  approved_docx_key TEXT, -- S3 key for the approved amendment document
  signed_pdf_key TEXT, -- S3 key for the signed amendment PDF
  approval_provider TEXT, -- Approval provider (e.g., 'internal', 'docusign')
  approval_ref TEXT, -- Reference to the approval (e.g., Docusign envelope ID)
  envelope_id TEXT, -- Docusign envelope ID
  signed_at TIMESTAMPTZ, -- When the amendment was signed
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID NOT NULL,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (contract_id, amendment_number)
);

-- Add tenant_id column if it doesn't exist (for existing tables)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contract_amendments' 
    AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE contract_amendments ADD COLUMN tenant_id UUID;
  END IF;
END;
$$;

-- 4. Contract workflow transitions
CREATE TABLE IF NOT EXISTS contract_workflow_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  tenant_id UUID,
  from_state TEXT NOT NULL,
  to_state TEXT NOT NULL,
  actor_id UUID NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add tenant_id column if it doesn't exist (for existing tables)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'contract_workflow_transitions' 
    AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE contract_workflow_transitions ADD COLUMN tenant_id UUID;
  END IF;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contract_templates_tenant_name ON contract_templates(tenant_id, name);
CREATE INDEX IF NOT EXISTS idx_contract_templates_active ON contract_templates(active);
CREATE INDEX IF NOT EXISTS idx_contracts_tenant_project ON contracts(tenant_id, project_id);
CREATE INDEX IF NOT EXISTS idx_contracts_tenant_partner ON contracts(tenant_id, partner_id);
CREATE INDEX IF NOT EXISTS idx_contracts_tenant_budget ON contracts(tenant_id, budget_id);
CREATE INDEX IF NOT EXISTS idx_contracts_state ON contracts(state);
CREATE INDEX IF NOT EXISTS idx_contracts_number ON contracts(number);
CREATE INDEX IF NOT EXISTS idx_contract_amendments_contract ON contract_amendments(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_amendments_state ON contract_amendments(state);
CREATE INDEX IF NOT EXISTS idx_contract_workflow_transitions_contract ON contract_workflow_transitions(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_workflow_transitions_actor ON contract_workflow_transitions(actor_id);

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
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_contract_templates_updated_at'
  ) THEN
    CREATE TRIGGER update_contract_templates_updated_at
      BEFORE UPDATE ON contract_templates
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_contracts_updated_at'
  ) THEN
    CREATE TRIGGER update_contracts_updated_at
      BEFORE UPDATE ON contracts
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_contract_amendments_updated_at'
  ) THEN
    CREATE TRIGGER update_contract_amendments_updated_at
      BEFORE UPDATE ON contract_amendments
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  -- Check if triggers exist for other contract tables and create them if they don't
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_contract_milestones_updated_at'
  ) THEN
    -- Only create the trigger if the function exists
    IF EXISTS (
      SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
    ) THEN
      CREATE TRIGGER update_contract_milestones_updated_at
        BEFORE UPDATE ON contract_milestones
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_contract_deliverables_updated_at'
  ) THEN
    -- Only create the trigger if the function exists
    IF EXISTS (
      SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
    ) THEN
      CREATE TRIGGER update_contract_deliverables_updated_at
        BEFORE UPDATE ON contract_deliverables
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_contract_payments_updated_at'
  ) THEN
    -- Only create the trigger if the function exists
    IF EXISTS (
      SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
    ) THEN
      CREATE TRIGGER update_contract_payments_updated_at
        BEFORE UPDATE ON contract_payments
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
  END IF;
END;
$$;

COMMIT;
