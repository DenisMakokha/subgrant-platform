-- =====================================================
-- Approval Integration - Add Foreign Key Columns
-- =====================================================
-- This migration adds approval_request_id columns to
-- all tables that need approval workflow integration
-- =====================================================

-- 1. FUND REQUESTS TABLE
-- Add approval_request_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fund_requests' 
        AND column_name = 'approval_request_id'
    ) THEN
        ALTER TABLE fund_requests 
        ADD COLUMN approval_request_id UUID REFERENCES approval_requests(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_fund_requests_approval 
        ON fund_requests(approval_request_id);
        
        COMMENT ON COLUMN fund_requests.approval_request_id IS 'Links to approval_requests table for approval workflow tracking';
    END IF;
END $$;

-- 2. PARTNER BUDGETS TABLE
-- Add approval_request_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'partner_budgets' 
        AND column_name = 'approval_request_id'
    ) THEN
        ALTER TABLE partner_budgets 
        ADD COLUMN approval_request_id UUID REFERENCES approval_requests(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_partner_budgets_approval 
        ON partner_budgets(approval_request_id);
        
        COMMENT ON COLUMN partner_budgets.approval_request_id IS 'Links to approval_requests table for budget approval workflow';
    END IF;
END $$;

-- 3. CONTRACTS TABLE
-- Add approval_request_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name = 'approval_request_id'
    ) THEN
        ALTER TABLE contracts 
        ADD COLUMN approval_request_id UUID REFERENCES approval_requests(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_contracts_approval 
        ON contracts(approval_request_id);
        
        COMMENT ON COLUMN contracts.approval_request_id IS 'Links to approval_requests table for contract approval workflow';
    END IF;
END $$;

-- 4. GRANT REPORTING DATES TABLE (M&E Reports)
-- Add approval_request_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'grant_reporting_dates' 
        AND column_name = 'approval_request_id'
    ) THEN
        ALTER TABLE grant_reporting_dates 
        ADD COLUMN approval_request_id UUID REFERENCES approval_requests(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_grant_reporting_dates_approval 
        ON grant_reporting_dates(approval_request_id);
        
        COMMENT ON COLUMN grant_reporting_dates.approval_request_id IS 'Links to approval_requests table for report approval workflow';
    END IF;
END $$;

-- 5. GRANTS TABLE
-- Add approval_request_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'grants' 
        AND column_name = 'approval_request_id'
    ) THEN
        ALTER TABLE grants 
        ADD COLUMN approval_request_id UUID REFERENCES approval_requests(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_grants_approval 
        ON grants(approval_request_id);
        
        COMMENT ON COLUMN grants.approval_request_id IS 'Links to approval_requests table for grant approval workflow';
    END IF;
END $$;

-- =====================================================
-- CREATE GRANT WORKFLOW IF NOT EXISTS
-- =====================================================

INSERT INTO approval_workflows (id, name, description, entity_type, is_active)
VALUES 
  ('00000000-0000-0000-0000-000000000005', 'Grant Approval - Standard', '3-level approval for grants', 'grant', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO approval_steps (workflow_id, step_order, step_name, approver_type, approver_role_id, escalation_hours)
VALUES 
  ('00000000-0000-0000-0000-000000000005', 1, 'Program Officer Review', 'role', 'program_officer', 48),
  ('00000000-0000-0000-0000-000000000005', 2, 'Finance Manager Approval', 'role', 'finance_manager', 48),
  ('00000000-0000-0000-0000-000000000005', 3, 'Executive Sign-off', 'role', 'coo', 72)
ON CONFLICT (workflow_id, step_order) DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify columns were added
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('fund_requests', 'partner_budgets', 'contracts', 'grant_reporting_dates', 'grants')
  AND column_name = 'approval_request_id'
ORDER BY table_name;

-- Verify indexes were created
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE indexname LIKE '%approval%'
ORDER BY tablename;

-- Show approval workflow summary
SELECT 
  w.name as workflow_name,
  w.entity_type,
  COUNT(s.id) as step_count,
  w.is_active
FROM approval_workflows w
LEFT JOIN approval_steps s ON w.id = s.workflow_id
GROUP BY w.id, w.name, w.entity_type, w.is_active
ORDER BY w.entity_type;

-- Show summary
SELECT 
  'Approval Integration Migration Complete' as status,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE column_name = 'approval_request_id' 
   AND table_name IN ('fund_requests', 'partner_budgets', 'contracts', 'grant_reporting_dates', 'grants')
  ) as columns_added,
  (SELECT COUNT(*) FROM approval_workflows) as total_workflows;
