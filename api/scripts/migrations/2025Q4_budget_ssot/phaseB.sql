-- ============================================================================
-- Budget SSOT · Phase B (Seed Initial Data)
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Seed default budget line categories (using the correct table name from Phase A)
-- ---------------------------------------------------------------------------
INSERT INTO budget_line_categories (
  id,
  name,
  description,
  active,
  created_at
) VALUES 
  ('10000000-0000-0000-0000-000000000001', 'Personnel', 'Personnel costs including salaries and benefits', TRUE, now()),
  ('10000000-0000-0000-0000-000000000002', 'Travel', 'Travel and transportation costs', TRUE, now()),
  ('10000000-0000-0000-0000-000000000003', 'Equipment', 'Equipment and technology purchases', TRUE, now()),
  ('10000000-0000-0000-0000-000000000004', 'Supplies', 'Office supplies and materials', TRUE, now()),
  ('10000000-0000-0000-0000-000000000005', 'Contractor', 'Contractor and consultant fees', TRUE, now()),
  ('10000000-0000-0000-0000-000000000006', 'Communications', 'Communications and marketing costs', TRUE, now()),
  ('10000000-0000-0000-0000-000000000007', 'Training', 'Training and capacity building costs', TRUE, now()),
  ('10000000-0000-0000-0000-000000000008', 'Monitoring', 'Monitoring and evaluation costs', TRUE, now()),
  ('10000000-0000-0000-0000-000000000009', 'Administrative', 'Administrative and overhead costs', TRUE, now())
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Seed default budget template
-- ---------------------------------------------------------------------------
INSERT INTO budget_templates (
  id,
  name,
  description,
  rules_json,
  version,
  active,
  created_by,
  created_at
) VALUES (
  '20000000-0000-0000-0000-000000000001',
  'Standard Grant Budget Template',
  'Default template for standard grant budgets with common categories',
  '{}'::JSONB,
  1,
  TRUE,
  '00000000-0000-0000-0000-000000000000',
  now()
)
ON CONFLICT (id) DO NOTHING;

COMMIT;