-- ============================================================================
-- Budget SSOT Schema - Phase A
-- ============================================================================

BEGIN;

-- 1. Budget templates
CREATE TABLE IF NOT EXISTS budget_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  rules_json JSONB NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (tenant_id, name, version)
);

-- Add created_by column if it doesn't exist (for existing tables)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'budget_templates' 
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE budget_templates ADD COLUMN created_by UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
  END IF;
END;
$$;

-- 2. Budgets
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  project_id UUID NOT NULL,
  partner_id UUID NOT NULL,
  template_id UUID REFERENCES budget_templates(id),
  currency TEXT NOT NULL DEFAULT 'USD',
  state TEXT NOT NULL DEFAULT 'draft', -- draft|submitted|approved|rejected|active|archived
  rules_json JSONB,
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID NOT NULL,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Budget line categories
CREATE TABLE IF NOT EXISTS budget_line_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (tenant_id, name)
);

-- 4. Budget lines
CREATE TABLE IF NOT EXISTS budget_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  tenant_id UUID,
  category_id UUID REFERENCES budget_line_categories(id),
  name TEXT NOT NULL,
  description TEXT,
  quantity NUMERIC,
  unit_cost NUMERIC,
  total_cost NUMERIC GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  currency TEXT NOT NULL DEFAULT 'USD',
  notes TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID NOT NULL,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Budget review threads
CREATE TABLE IF NOT EXISTS budget_review_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  tenant_id UUID,
  line_id UUID REFERENCES budget_lines(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open', -- open|resolved|closed
  created_by UUID NOT NULL,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Budget review comments
CREATE TABLE IF NOT EXISTS budget_review_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES budget_review_threads(id) ON DELETE CASCADE,
  tenant_id UUID,
  content TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Budget workflow transitions
CREATE TABLE IF NOT EXISTS budget_workflow_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  tenant_id UUID,
  from_state TEXT NOT NULL,
  to_state TEXT NOT NULL,
  actor_id UUID NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_budget_templates_tenant_name ON budget_templates(tenant_id, name);
CREATE INDEX IF NOT EXISTS idx_budget_templates_active ON budget_templates(active);
CREATE INDEX IF NOT EXISTS idx_budgets_tenant_project ON budgets(tenant_id, project_id);
CREATE INDEX IF NOT EXISTS idx_budgets_tenant_partner ON budgets(tenant_id, partner_id);
CREATE INDEX IF NOT EXISTS idx_budgets_state ON budgets(state);
CREATE INDEX IF NOT EXISTS idx_budget_lines_budget ON budget_lines(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_lines_category ON budget_lines(category_id);
CREATE INDEX IF NOT EXISTS idx_budget_review_threads_budget ON budget_review_threads(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_review_threads_line ON budget_review_threads(line_id);
CREATE INDEX IF NOT EXISTS idx_budget_review_threads_status ON budget_review_threads(status);
CREATE INDEX IF NOT EXISTS idx_budget_review_comments_thread ON budget_review_comments(thread_id);
CREATE INDEX IF NOT EXISTS idx_budget_workflow_transitions_budget ON budget_workflow_transitions(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_workflow_transitions_actor ON budget_workflow_transitions(actor_id);

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
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_budget_templates_updated_at'
  ) THEN
    CREATE TRIGGER update_budget_templates_updated_at
      BEFORE UPDATE ON budget_templates
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_budgets_updated_at'
  ) THEN
    CREATE TRIGGER update_budgets_updated_at
      BEFORE UPDATE ON budgets
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_budget_line_categories_updated_at'
  ) THEN
    CREATE TRIGGER update_budget_line_categories_updated_at
      BEFORE UPDATE ON budget_line_categories
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_budget_lines_updated_at'
  ) THEN
    CREATE TRIGGER update_budget_lines_updated_at
      BEFORE UPDATE ON budget_lines
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_budget_review_threads_updated_at'
  ) THEN
    CREATE TRIGGER update_budget_review_threads_updated_at
      BEFORE UPDATE ON budget_review_threads
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_budget_review_comments_updated_at'
  ) THEN
    CREATE TRIGGER update_budget_review_comments_updated_at
      BEFORE UPDATE ON budget_review_comments
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;

COMMIT;