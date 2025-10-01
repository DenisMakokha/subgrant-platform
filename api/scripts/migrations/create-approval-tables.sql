-- =====================================================
-- APPROVAL SYSTEM TABLES MIGRATION
-- =====================================================
-- Creates all tables required for the approval workflow system
-- Run this script to set up the approval infrastructure
-- =====================================================

-- Create approval_workflows table
CREATE TABLE IF NOT EXISTS approval_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  entity_type VARCHAR(100) NOT NULL, -- 'budget', 'contract', 'disbursement', 'report', etc.
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  parent_workflow_id UUID REFERENCES approval_workflows(id) ON DELETE SET NULL,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create approval_steps table
CREATE TABLE IF NOT EXISTS approval_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
  step_name VARCHAR(255) NOT NULL,
  step_order INTEGER NOT NULL,
  approver_type VARCHAR(50) NOT NULL DEFAULT 'role', -- 'role', 'user', 'group', 'dynamic'
  approver_role_id VARCHAR(255), -- Role ID from roles table
  approver_user_id UUID REFERENCES users(id),
  approval_type VARCHAR(50) DEFAULT 'sequential', -- 'sequential', 'parallel', 'any'
  required_approvers INTEGER DEFAULT 1,
  escalation_hours INTEGER DEFAULT 24,
  conditions JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(workflow_id, step_order)
);

-- Create approval_requests table
CREATE TABLE IF NOT EXISTS approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES approval_workflows(id),
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID NOT NULL,
  current_step INTEGER DEFAULT 1,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'cancelled'
  submitted_by UUID NOT NULL REFERENCES users(id),
  submitted_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create approval_actions table
CREATE TABLE IF NOT EXISTS approval_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES approval_steps(id),
  step_order INTEGER NOT NULL,
  approver_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(50) NOT NULL, -- 'approved', 'rejected', 'delegated', 'escalated', 'info_requested'
  comments TEXT,
  acted_at TIMESTAMP DEFAULT NOW(),
  delegated_to UUID REFERENCES users(id),
  escalation_to UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create approval_delegations table
CREATE TABLE IF NOT EXISTS approval_delegations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delegator_id UUID NOT NULL REFERENCES users(id),
  delegate_id UUID NOT NULL REFERENCES users(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_delegation_dates CHECK (end_date >= start_date)
);

-- Create approval_workflow_audit table
CREATE TABLE IF NOT EXISTS approval_workflow_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted', 'activated', 'deactivated'
  changed_by UUID NOT NULL REFERENCES users(id),
  changes JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Workflows indexes
CREATE INDEX IF NOT EXISTS idx_workflows_entity_type ON approval_workflows(entity_type);
CREATE INDEX IF NOT EXISTS idx_workflows_organization ON approval_workflows(organization_id);
CREATE INDEX IF NOT EXISTS idx_workflows_active ON approval_workflows(is_active);
CREATE INDEX IF NOT EXISTS idx_workflows_created_at ON approval_workflows(created_at DESC);

-- Steps indexes
CREATE INDEX IF NOT EXISTS idx_steps_workflow ON approval_steps(workflow_id);
CREATE INDEX IF NOT EXISTS idx_steps_order ON approval_steps(workflow_id, step_order);

-- Requests indexes
CREATE INDEX IF NOT EXISTS idx_requests_workflow ON approval_requests(workflow_id);
CREATE INDEX IF NOT EXISTS idx_requests_entity ON approval_requests(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_submitted_by ON approval_requests(submitted_by);
CREATE INDEX IF NOT EXISTS idx_requests_submitted_at ON approval_requests(submitted_at DESC);

-- Actions indexes
CREATE INDEX IF NOT EXISTS idx_actions_request ON approval_actions(request_id);
CREATE INDEX IF NOT EXISTS idx_actions_approver ON approval_actions(approver_id);
CREATE INDEX IF NOT EXISTS idx_actions_acted_at ON approval_actions(acted_at DESC);

-- Delegations indexes
CREATE INDEX IF NOT EXISTS idx_delegations_delegator ON approval_delegations(delegator_id);
CREATE INDEX IF NOT EXISTS idx_delegations_delegate ON approval_delegations(delegate_id);
CREATE INDEX IF NOT EXISTS idx_delegations_active ON approval_delegations(is_active);
CREATE INDEX IF NOT EXISTS idx_delegations_dates ON approval_delegations(start_date, end_date);

-- Audit indexes
CREATE INDEX IF NOT EXISTS idx_audit_workflow ON approval_workflow_audit(workflow_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON approval_workflow_audit(created_at DESC);

-- =====================================================
-- SEED DEFAULT WORKFLOWS (OPTIONAL)
-- =====================================================

-- Insert default budget approval workflow
INSERT INTO approval_workflows (name, description, entity_type, is_default, is_active)
VALUES (
  'Default Budget Approval',
  'Standard budget approval workflow with two levels',
  'budget',
  true,
  true
) ON CONFLICT DO NOTHING;

-- Insert default contract approval workflow
INSERT INTO approval_workflows (name, description, entity_type, is_default, is_active)
VALUES (
  'Default Contract Approval',
  'Standard contract approval workflow',
  'contract',
  true,
  true
) ON CONFLICT DO NOTHING;

-- Insert default disbursement approval workflow
INSERT INTO approval_workflows (name, description, entity_type, is_default, is_active)
VALUES (
  'Default Disbursement Approval',
  'Standard disbursement approval workflow',
  'disbursement',
  true,
  true
) ON CONFLICT DO NOTHING;

-- =====================================================
-- GRANT PERMISSIONS (if using specific database users)
-- =====================================================

-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

SELECT 'Approval system tables created successfully!' AS status;
