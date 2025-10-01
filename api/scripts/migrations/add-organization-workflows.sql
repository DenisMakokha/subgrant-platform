-- Migration: Add Organization-Specific Workflow Support
-- Description: Allows organizations to override default workflows with custom approval chains
-- Date: 2025-10-01

-- Add organization_id to workflows for overrides
ALTER TABLE approval_workflows 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS parent_workflow_id UUID REFERENCES approval_workflows(id) ON DELETE SET NULL;

-- Add comments
COMMENT ON COLUMN approval_workflows.organization_id IS 'If set, this workflow is specific to an organization (overrides default)';
COMMENT ON COLUMN approval_workflows.is_default IS 'True if this is a system default workflow';
COMMENT ON COLUMN approval_workflows.parent_workflow_id IS 'Reference to the default workflow this overrides';

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_approval_workflows_organization 
ON approval_workflows(organization_id);

CREATE INDEX IF NOT EXISTS idx_approval_workflows_default 
ON approval_workflows(is_default) WHERE is_default = true;

-- Unique constraint: one workflow per entity type per organization
CREATE UNIQUE INDEX IF NOT EXISTS idx_approval_workflows_org_entity 
ON approval_workflows(organization_id, entity_type) 
WHERE organization_id IS NOT NULL;

-- Update existing workflows to be defaults
UPDATE approval_workflows 
SET is_default = true, organization_id = NULL
WHERE organization_id IS NULL;

-- Add conditions column to approval_steps for advanced routing
ALTER TABLE approval_steps
ADD COLUMN IF NOT EXISTS conditions JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN approval_steps.conditions IS 'Array of conditions for smart routing (amount, project_type, time, etc.)';

-- Add metadata column to workflows for additional configuration
ALTER TABLE approval_workflows
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN approval_workflows.metadata IS 'Additional workflow configuration (notifications, escalation rules, etc.)';

-- Create view for easy workflow lookup with organization fallback
CREATE OR REPLACE VIEW v_active_workflows AS
SELECT 
  w.*,
  CASE 
    WHEN w.organization_id IS NOT NULL THEN 'organization'
    WHEN w.is_default = true THEN 'default'
    ELSE 'custom'
  END as workflow_type,
  o.name as organization_name,
  pw.name as parent_workflow_name,
  (SELECT COUNT(*) FROM approval_steps WHERE workflow_id = w.id) as step_count
FROM approval_workflows w
LEFT JOIN organizations o ON w.organization_id = o.id
LEFT JOIN approval_workflows pw ON w.parent_workflow_id = pw.id
WHERE w.is_active = true
ORDER BY 
  w.organization_id NULLS LAST,
  w.entity_type,
  w.created_at DESC;

COMMENT ON VIEW v_active_workflows IS 'Active workflows with organization and parent workflow details';

-- Function to get workflow for entity with organization fallback
CREATE OR REPLACE FUNCTION get_workflow_for_entity(
  p_entity_type VARCHAR(50),
  p_organization_id UUID DEFAULT NULL
) RETURNS TABLE (
  workflow_id UUID,
  workflow_name VARCHAR(255),
  workflow_type VARCHAR(20),
  step_count BIGINT
) AS $$
BEGIN
  -- Try organization-specific workflow first
  IF p_organization_id IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      w.id,
      w.name,
      'organization'::VARCHAR(20),
      (SELECT COUNT(*) FROM approval_steps WHERE workflow_id = w.id)
    FROM approval_workflows w
    WHERE w.entity_type = p_entity_type
      AND w.organization_id = p_organization_id
      AND w.is_active = true
    LIMIT 1;
    
    -- If found, return
    IF FOUND THEN
      RETURN;
    END IF;
  END IF;
  
  -- Fall back to default workflow
  RETURN QUERY
  SELECT 
    w.id,
    w.name,
    'default'::VARCHAR(20),
    (SELECT COUNT(*) FROM approval_steps WHERE workflow_id = w.id)
  FROM approval_workflows w
  WHERE w.entity_type = p_entity_type
    AND w.organization_id IS NULL
    AND w.is_default = true
    AND w.is_active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_workflow_for_entity IS 'Get workflow for entity type with organization fallback to default';

-- Create audit table for workflow changes
CREATE TABLE IF NOT EXISTS approval_workflow_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'activated', 'deactivated', 'deleted'
  changed_by UUID NOT NULL REFERENCES users(id),
  changes JSONB, -- What changed
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approval_workflow_audit_workflow 
ON approval_workflow_audit(workflow_id);

CREATE INDEX IF NOT EXISTS idx_approval_workflow_audit_created 
ON approval_workflow_audit(created_at DESC);

COMMENT ON TABLE approval_workflow_audit IS 'Audit trail for workflow configuration changes';

-- Verification queries
DO $$
BEGIN
  RAISE NOTICE 'Organization workflow migration completed successfully!';
  RAISE NOTICE 'Total workflows: %', (SELECT COUNT(*) FROM approval_workflows);
  RAISE NOTICE 'Default workflows: %', (SELECT COUNT(*) FROM approval_workflows WHERE is_default = true);
  RAISE NOTICE 'Organization workflows: %', (SELECT COUNT(*) FROM approval_workflows WHERE organization_id IS NOT NULL);
  RAISE NOTICE 'Active workflows view: %', (SELECT COUNT(*) FROM v_active_workflows);
END $$;
