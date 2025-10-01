-- =====================================================
-- Approval Chain System - Database Schema
-- =====================================================
-- This migration creates a comprehensive approval system
-- that supports multi-level approvals across all modules
-- =====================================================

-- 1. APPROVAL WORKFLOWS TABLE
-- Defines approval workflow templates
CREATE TABLE IF NOT EXISTS approval_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  entity_type VARCHAR(50) NOT NULL, -- 'budget', 'fund_request', 'contract', 'report', etc.
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approval_workflows_entity_type ON approval_workflows(entity_type);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_active ON approval_workflows(is_active);

COMMENT ON TABLE approval_workflows IS 'Defines approval workflow templates for different entity types';
COMMENT ON COLUMN approval_workflows.entity_type IS 'Type of entity: budget, fund_request, contract, report, etc.';

-- 2. APPROVAL STEPS TABLE
-- Individual steps in an approval workflow
CREATE TABLE IF NOT EXISTS approval_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES approval_workflows(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  step_name VARCHAR(255) NOT NULL,
  approver_type VARCHAR(20) NOT NULL, -- 'role', 'user', 'dynamic'
  approver_role_id VARCHAR(50), -- Reference to role
  approver_user_id UUID REFERENCES users(id),
  approval_type VARCHAR(20) DEFAULT 'sequential', -- 'sequential', 'parallel', 'any_one'
  required_approvers INTEGER DEFAULT 1, -- For parallel approvals
  conditions JSONB, -- Conditional routing rules
  escalation_hours INTEGER, -- Auto-escalate after X hours
  escalation_to UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(workflow_id, step_order)
);

CREATE INDEX IF NOT EXISTS idx_approval_steps_workflow ON approval_steps(workflow_id);
CREATE INDEX IF NOT EXISTS idx_approval_steps_order ON approval_steps(workflow_id, step_order);

COMMENT ON TABLE approval_steps IS 'Individual steps in an approval workflow';
COMMENT ON COLUMN approval_steps.approver_type IS 'Type of approver: role (any user with role), user (specific user), dynamic (determined at runtime)';
COMMENT ON COLUMN approval_steps.approval_type IS 'Sequential (one after another), parallel (all at once), any_one (first to approve)';
COMMENT ON COLUMN approval_steps.conditions IS 'JSON conditions for conditional routing (e.g., amount thresholds)';

-- 3. APPROVAL REQUESTS TABLE
-- Tracks approval requests through workflows
CREATE TABLE IF NOT EXISTS approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES approval_workflows(id),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL, -- ID of budget, fund_request, etc.
  current_step INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'cancelled'
  submitted_by UUID REFERENCES users(id),
  submitted_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  metadata JSONB, -- Additional context (amount, project, etc.)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approval_requests_entity ON approval_requests(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_submitted_by ON approval_requests(submitted_by);
CREATE INDEX IF NOT EXISTS idx_approval_requests_workflow ON approval_requests(workflow_id);

COMMENT ON TABLE approval_requests IS 'Tracks approval requests through workflows';
COMMENT ON COLUMN approval_requests.metadata IS 'Additional context like amount, project name, priority, etc.';

-- 4. APPROVAL ACTIONS TABLE
-- Records all approval actions taken
CREATE TABLE IF NOT EXISTS approval_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES approval_requests(id) ON DELETE CASCADE,
  step_id UUID REFERENCES approval_steps(id),
  step_order INTEGER NOT NULL,
  approver_id UUID REFERENCES users(id),
  action VARCHAR(20) NOT NULL, -- 'approved', 'rejected', 'delegated', 'escalated', 'info_requested'
  comments TEXT,
  acted_at TIMESTAMP DEFAULT NOW(),
  delegated_to UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approval_actions_request ON approval_actions(request_id);
CREATE INDEX IF NOT EXISTS idx_approval_actions_approver ON approval_actions(approver_id);
CREATE INDEX IF NOT EXISTS idx_approval_actions_action ON approval_actions(action);

COMMENT ON TABLE approval_actions IS 'Records all approval actions taken (approved, rejected, delegated, etc.)';
COMMENT ON COLUMN approval_actions.action IS 'Action taken: approved, rejected, delegated, escalated, info_requested';

-- 5. APPROVAL DELEGATES TABLE
-- Temporary delegation of approval authority
CREATE TABLE IF NOT EXISTS approval_delegates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delegator_id UUID REFERENCES users(id),
  delegate_id UUID REFERENCES users(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(delegator_id, delegate_id, start_date)
);

CREATE INDEX IF NOT EXISTS idx_approval_delegates_delegator ON approval_delegates(delegator_id);
CREATE INDEX IF NOT EXISTS idx_approval_delegates_delegate ON approval_delegates(delegate_id);
CREATE INDEX IF NOT EXISTS idx_approval_delegates_active ON approval_delegates(is_active);
CREATE INDEX IF NOT EXISTS idx_approval_delegates_dates ON approval_delegates(start_date, end_date);

COMMENT ON TABLE approval_delegates IS 'Temporary delegation of approval authority (e.g., during leave)';

-- 6. APPROVAL NOTIFICATIONS TABLE
-- Tracks notification delivery for approvals
CREATE TABLE IF NOT EXISTS approval_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES approval_requests(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES users(id),
  notification_type VARCHAR(50) NOT NULL, -- 'new_request', 'approved', 'rejected', 'reminder', 'escalated'
  channel VARCHAR(20) NOT NULL, -- 'email', 'sms', 'in_app'
  sent_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approval_notifications_request ON approval_notifications(request_id);
CREATE INDEX IF NOT EXISTS idx_approval_notifications_recipient ON approval_notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_approval_notifications_read ON approval_notifications(read_at);

COMMENT ON TABLE approval_notifications IS 'Tracks notification delivery for approval requests';

-- =====================================================
-- SEED DATA: Default Approval Workflows
-- =====================================================

-- Budget Approval Workflow (3-Level)
INSERT INTO approval_workflows (id, name, description, entity_type, is_active)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Budget Approval - Standard', '3-level approval for budgets', 'budget', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO approval_steps (workflow_id, step_order, step_name, approver_type, approver_role_id, escalation_hours)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 1, 'Accountant Review', 'role', 'accountant', 24),
  ('00000000-0000-0000-0000-000000000001', 2, 'Budget Holder Approval', 'role', 'budget_holder', 48),
  ('00000000-0000-0000-0000-000000000001', 3, 'Finance Manager Final', 'role', 'finance_manager', 48)
ON CONFLICT (workflow_id, step_order) DO NOTHING;

-- Fund Request Approval Workflow (2-Level)
INSERT INTO approval_workflows (id, name, description, entity_type, is_active)
VALUES 
  ('00000000-0000-0000-0000-000000000002', 'Fund Request Approval - Standard', '2-level approval for fund requests', 'fund_request', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO approval_steps (workflow_id, step_order, step_name, approver_type, approver_role_id, escalation_hours)
VALUES 
  ('00000000-0000-0000-0000-000000000002', 1, 'Project Manager Review', 'role', 'project_manager', 24),
  ('00000000-0000-0000-0000-000000000002', 2, 'Finance Manager Approval', 'role', 'finance_manager', 48)
ON CONFLICT (workflow_id, step_order) DO NOTHING;

-- Contract Approval Workflow (4-Level)
INSERT INTO approval_workflows (id, name, description, entity_type, is_active)
VALUES 
  ('00000000-0000-0000-0000-000000000003', 'Contract Approval - Standard', '4-level approval for contracts', 'contract', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO approval_steps (workflow_id, step_order, step_name, approver_type, approver_role_id, escalation_hours)
VALUES 
  ('00000000-0000-0000-0000-000000000003', 1, 'Legal Review', 'role', 'legal_officer', 72),
  ('00000000-0000-0000-0000-000000000003', 2, 'Program Officer Approval', 'role', 'program_officer', 48),
  ('00000000-0000-0000-0000-000000000003', 3, 'Finance Manager Approval', 'role', 'finance_manager', 48),
  ('00000000-0000-0000-0000-000000000003', 4, 'Executive Sign-off', 'role', 'coo', 72)
ON CONFLICT (workflow_id, step_order) DO NOTHING;

-- Report Approval Workflow (2-Level)
INSERT INTO approval_workflows (id, name, description, entity_type, is_active)
VALUES 
  ('00000000-0000-0000-0000-000000000004', 'Report Approval - Standard', '2-level approval for M&E reports', 'report', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO approval_steps (workflow_id, step_order, step_name, approver_type, approver_role_id, escalation_hours)
VALUES 
  ('00000000-0000-0000-0000-000000000004', 1, 'M&E Officer Review', 'role', 'me_officer', 48),
  ('00000000-0000-0000-0000-000000000004', 2, 'Program Manager Approval', 'role', 'program_manager', 48)
ON CONFLICT (workflow_id, step_order) DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify tables created
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name LIKE 'approval_%'
ORDER BY table_name;

-- Verify workflows created
SELECT 
  w.name,
  w.entity_type,
  COUNT(s.id) as step_count
FROM approval_workflows w
LEFT JOIN approval_steps s ON w.id = s.workflow_id
GROUP BY w.id, w.name, w.entity_type
ORDER BY w.name;

-- Show approval workflow summary
SELECT 
  'Approval System Schema Created Successfully' as status,
  (SELECT COUNT(*) FROM approval_workflows) as workflows_created,
  (SELECT COUNT(*) FROM approval_steps) as steps_created;
