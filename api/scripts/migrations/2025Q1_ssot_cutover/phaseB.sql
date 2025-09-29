-- ============================================================================
-- SSOT Budget Cutover · Phase B (Backfill, Compatibility, Legacy Freeze)
-- ----------------------------------------------------------------------------
-- Prerequisites:
--   • Phase A must complete successfully on the same database instance.
--   • Execute during controlled downtime; freeze all legacy writers beforehand.
-- Execution Order:
--   • Run Phase B immediately after Phase A. Defer cleanup until production sign-off.
-- Rollback Guidance:
--   • Use transaction rollback prior to COMMIT. After commit, restore from backups.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Step 1. Seed default project template sets/items from legacy budget metadata.
-- ---------------------------------------------------------------------------
WITH category_summary AS (
  SELECT
    bc.project_id,
    COALESCE(
      MIN(bc.created_by::text) FILTER (WHERE bc.created_by IS NOT NULL),
      '00000000-0000-0000-0000-000000000000'
    )::uuid                                   AS created_by,
    MIN(bc.created_at)                        AS created_at
  FROM budget_categories bc
  GROUP BY bc.project_id
)
INSERT INTO project_template_sets (id, project_id, name, status, created_by, created_at)
SELECT
  gen_random_uuid(),
  cs.project_id,
  'Legacy Default',
  'READY',
  cs.created_by,
  COALESCE(cs.created_at, now())
FROM category_summary cs
ON CONFLICT (project_id, name) DO NOTHING;

WITH resolved_sets AS (
  SELECT project_id, id
  FROM project_template_sets
  WHERE name = 'Legacy Default'
),
category_payload AS (
  SELECT
    bc.project_id,
    rs.id                                                        AS set_id,
    COALESCE(bc.name, 'Uncategorized')                           AS category_name,
    bc.description,
    ROW_NUMBER() OVER (
      PARTITION BY rs.id
      ORDER BY COALESCE(bc.name, 'Uncategorized'), bc.id::text
    ) - 1                                                        AS sort_index
  FROM budget_categories bc
  JOIN resolved_sets rs ON rs.project_id = bc.project_id
),
to_insert AS (
  SELECT cp.*
  FROM category_payload cp
  WHERE NOT EXISTS (
    SELECT 1
    FROM project_template_items pti
    WHERE pti.set_id = cp.set_id
      AND pti.category = cp.category_name
      AND pti.subcategory IS NULL
  )
)
INSERT INTO project_template_items (id, set_id, category, subcategory, guidance, required, min_lines, sort_index)
SELECT
  gen_random_uuid(),
  ti.set_id,
  ti.category_name,
  NULL,
  ti.description,
  FALSE,
  NULL,
  ti.sort_index
FROM to_insert ti;

-- ---------------------------------------------------------------------------
-- Step 2. Backfill partner budget envelopes from legacy budgets.
-- ---------------------------------------------------------------------------
INSERT INTO partner_budgets (
  id,
  project_id,
  partner_id,
  currency,
  ceiling_total,
  status,
  rules_json,
  created_by,
  created_at,
  updated_at
)
SELECT
  b.id,
  b.project_id,
  b.organization_id,
  b.currency,
  COALESCE(b.total_amount, 0),
  CASE UPPER(b.status)
    WHEN 'DRAFT' THEN 'DRAFT'
    WHEN 'SUBMITTED' THEN 'SUBMITTED'
    WHEN 'APPROVED' THEN 'APPROVED'
    WHEN 'OPEN_FOR_PARTNER' THEN 'OPEN_FOR_PARTNER'
    WHEN 'LOCKED' THEN 'LOCKED'
    ELSE 'DRAFT'
  END,
  '{}'::jsonb,
  COALESCE(b.created_by, '00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(b.created_at, now()),
  COALESCE(b.updated_at, b.created_at, now())
FROM budgets b
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Step 3. Backfill partner budget templates derived from legacy categories.
-- ---------------------------------------------------------------------------
WITH template_source AS (
  SELECT DISTINCT
    bl.budget_id,
    bl.category_id,
    COALESCE(bc.name, 'Uncategorized') AS category_name,
    bc.description
  FROM budget_lines bl
  LEFT JOIN budget_categories bc ON bc.id = bl.category_id
),
template_payload AS (
  SELECT
    ts.budget_id,
    ts.category_id,
    ts.category_name,
    ts.description,
    ROW_NUMBER() OVER (
      PARTITION BY ts.budget_id
      ORDER BY ts.category_name, COALESCE(ts.category_id::text, '')
    ) - 1                                 AS sort_index,
    COALESCE(b.created_by, '00000000-0000-0000-0000-000000000000'::uuid) AS created_by,
    COALESCE(b.created_at, now())         AS created_at
  FROM template_source ts
  JOIN budgets b ON b.id = ts.budget_id
)
INSERT INTO partner_budget_templates (
  id,
  partner_budget_id,
  category,
  subcategory,
  guidance,
  required,
  min_lines,
  sort_index,
  status,
  created_by,
  created_at,
  legacy_category_id
)
SELECT
  gen_random_uuid(),
  tp.budget_id,
  tp.category_name,
  NULL,
  tp.description,
  FALSE,
  NULL,
  tp.sort_index,
  'READY',
  tp.created_by,
  tp.created_at,
  tp.category_id
FROM template_payload tp
WHERE NOT EXISTS (
  SELECT 1
  FROM partner_budget_templates existing
  WHERE existing.partner_budget_id = tp.budget_id
    AND existing.legacy_category_id IS NOT DISTINCT FROM tp.category_id
);

-- ---------------------------------------------------------------------------
-- Step 4. Backfill partner budget lines from legacy budget lines.
-- ---------------------------------------------------------------------------
WITH line_payload AS (
  SELECT
    bl.id,
    bl.budget_id,
    bl.category_id,
    COALESCE(NULLIF(bl.description, ''), 'Legacy line') AS description,
    COALESCE(NULLIF(bl.unit, ''), 'UNIT')               AS unit,
    CASE
      WHEN bl.quantity IS NOT NULL AND bl.quantity > 0 THEN bl.quantity
      ELSE 1
    END                                                 AS qty,
    CASE
      WHEN bl.quantity IS NOT NULL AND bl.quantity > 0 AND bl.total_cost IS NOT NULL
        THEN bl.total_cost / NULLIF(bl.quantity, 0)
      ELSE COALESCE(bl.unit_cost, bl.total_cost, 0)
    END                                                 AS raw_unit_cost,
    NULLIF(bl.notes, '')                                AS notes,
    COALESCE(bl.created_at, b.created_at, now())        AS created_at,
    COALESCE(b.created_by, '00000000-0000-0000-0000-000000000000'::uuid) AS created_by,
    b.status                                            AS budget_status
  FROM budget_lines bl
  JOIN budgets b ON b.id = bl.budget_id
)
INSERT INTO partner_budget_lines (
  id,
  partner_budget_id,
  template_id,
  description,
  unit,
  qty,
  unit_cost,
  currency,
  period_from,
  period_to,
  notes,
  status,
  created_by,
  created_at
)
SELECT
  lp.id,
  lp.budget_id,
  pbt.id,
  lp.description,
  lp.unit,
  lp.qty,
  GREATEST(lp.raw_unit_cost, 0),
  pb.currency,
  NULL,
  NULL,
  lp.notes,
  CASE UPPER(lp.budget_status)
    WHEN 'SUBMITTED' THEN 'SUBMITTED'
    WHEN 'APPROVED' THEN 'APPROVED'
    WHEN 'NEEDS_CHANGES' THEN 'NEEDS_CHANGES'
    WHEN 'REJECTED' THEN 'REJECTED'
    ELSE 'DRAFT'
  END,
  lp.created_by,
  lp.created_at
FROM line_payload lp
JOIN partner_budgets pb ON pb.id = lp.budget_id
JOIN partner_budget_templates pbt
  ON pbt.partner_budget_id = lp.budget_id
 AND pbt.legacy_category_id IS NOT DISTINCT FROM lp.category_id
WHERE NOT EXISTS (
  SELECT 1
  FROM partner_budget_lines existing
  WHERE existing.id = lp.id
);

-- ---------------------------------------------------------------------------
-- Step 5. Rename legacy tables and ensure SSOT table shells exist where needed.
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS budgets RENAME TO budgets_legacy;
ALTER TABLE IF EXISTS budget_lines RENAME TO budget_lines_legacy;
ALTER TABLE IF EXISTS audit_logs RENAME TO audit_logs_legacy;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'review_comments'
      AND column_name = 'content'
  ) THEN
    EXECUTE 'ALTER TABLE review_comments RENAME TO review_comments_legacy';
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'notifications'
      AND column_name = 'type'
  ) THEN
    EXECUTE 'ALTER TABLE notifications RENAME TO notifications_legacy';
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS budgets_legacy (
  id UUID PRIMARY KEY,
  organization_id UUID,
  project_id UUID,
  title TEXT,
  description TEXT,
  total_amount NUMERIC(15,2),
  currency VARCHAR(3),
  status VARCHAR(50),
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  created_by UUID,
  updated_by UUID
);

CREATE TABLE IF NOT EXISTS budget_lines_legacy (
  id UUID PRIMARY KEY,
  budget_id UUID,
  category_id UUID,
  description TEXT,
  unit VARCHAR(50),
  quantity NUMERIC(10,2),
  unit_cost NUMERIC(15,2),
  total_cost NUMERIC(15,2),
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS review_comments_legacy (
  id UUID PRIMARY KEY,
  entity_type VARCHAR(50),
  entity_id UUID,
  parent_id UUID,
  author_id UUID,
  content TEXT,
  is_resolved BOOLEAN,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS notifications_legacy (
  id UUID PRIMARY KEY,
  type VARCHAR(50),
  title TEXT,
  message TEXT NOT NULL,
  priority VARCHAR(20),
  audience_type VARCHAR(50),
  audience_id UUID,
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  created_by UUID
);

CREATE TABLE IF NOT EXISTS audit_logs_legacy (
  id UUID PRIMARY KEY,
  actor_id UUID,
  action VARCHAR(100),
  entity_type VARCHAR(50),
  entity_id UUID,
  before_state JSONB,
  after_state JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ
);

-- Ensure SSOT review_comments/notifications tables exist post-rename (idempotent).
CREATE TABLE IF NOT EXISTS review_comments (
  id UUID PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES review_threads(id) ON DELETE CASCADE,
  author_user_id UUID NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('COMMENT','REQUEST_CHANGES','REJECTION','SYSTEM')),
  body TEXT NOT NULL,
  attachments JSONB,
  legacy_parent_id UUID,
  legacy_is_resolved BOOLEAN,
  legacy_resolved_at TIMESTAMPTZ,
  legacy_resolved_by UUID,
  legacy_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_review_comments_thread
  ON review_comments(thread_id);

CREATE INDEX IF NOT EXISTS idx_review_comments_created_at
  ON review_comments(created_at);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('IN_APP','EMAIL')),
  template_key TEXT NOT NULL,
  payload_json JSONB,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user
  ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON notifications(user_id) WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_created_at
  ON notifications(created_at);

-- ---------------------------------------------------------------------------
-- Step 6. Backfill review threads/comments into SSOT structures.
-- ---------------------------------------------------------------------------
WITH thread_payload AS (
  SELECT
    rc.entity_type,
    rc.entity_id,
    (ARRAY_AGG(rc.author_id ORDER BY rc.created_at, rc.id))[1] AS created_by,
    MIN(rc.created_at)                                        AS created_at
  FROM review_comments_legacy rc
  GROUP BY rc.entity_type, rc.entity_id
)
INSERT INTO review_threads (id, entity_type, entity_id, created_by, created_at)
SELECT
  gen_random_uuid(),
  tp.entity_type,
  tp.entity_id,
  COALESCE(tp.created_by, '00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(tp.created_at, now())
FROM thread_payload tp
ON CONFLICT (entity_type, entity_id) DO NOTHING;

INSERT INTO review_comments (
  id,
  thread_id,
  author_user_id,
  kind,
  body,
  attachments,
  legacy_parent_id,
  legacy_is_resolved,
  legacy_resolved_at,
  legacy_resolved_by,
  legacy_updated_at,
  created_at
)
SELECT
  rc.id,
  rt.id,
  rc.author_id,
  'COMMENT',
  rc.content,
  NULL,
  rc.parent_id,
  rc.is_resolved,
  rc.resolved_at,
  rc.resolved_by,
  rc.updated_at,
  rc.created_at
FROM review_comments_legacy rc
JOIN review_threads rt
  ON rt.entity_type = rc.entity_type
 AND rt.entity_id = rc.entity_id
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Step 7. Backfill audit log + notifications into SSOT tables.
-- ---------------------------------------------------------------------------
INSERT INTO audit_log (
  id,
  actor_user_id,
  action_key,
  entity_type,
  entity_id,
  from_state,
  to_state,
  payload_json,
  created_at
)
SELECT
  al.id,
  al.actor_id,
  al.action,
  al.entity_type,
  al.entity_id,
  al.before_state::text,
  al.after_state::text,
  jsonb_build_object(
    'ip_address', al.ip_address,
    'user_agent', al.user_agent
  ),
  al.created_at
FROM audit_logs_legacy al
ON CONFLICT (id) DO NOTHING;

INSERT INTO notifications (
  id,
  user_id,
  channel,
  template_key,
  payload_json,
  read_at,
  created_at
)
SELECT
  n.id,
  COALESCE(n.user_id, '00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(n.channel, 'IN_APP'),
  COALESCE(n.template_key, 'legacy_notification'),
  COALESCE(n.payload_json, '{}'::jsonb),
  n.read_at,
  n.created_at
FROM notifications_legacy n
WHERE n.user_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Step 8. Create compatibility views exposing SSOT data to legacy consumers.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW legacy_budgets_v AS
SELECT
  pb.id,
  COALESCE(bl.organization_id, pb.partner_id) AS organization_id,
  pb.project_id,
  bl.title,
  bl.description,
  pb.ceiling_total                           AS total_amount,
  pb.currency,
  LOWER(pb.status)                           AS status,
  bl.submitted_at,
  bl.approved_at,
  bl.approved_by,
  pb.created_at,
  pb.updated_at,
  pb.created_by,
  bl.updated_by
FROM partner_budgets pb
LEFT JOIN budgets_legacy bl ON bl.id = pb.id;

CREATE OR REPLACE VIEW legacy_budget_lines_v AS
SELECT
  pbl.id,
  pbl.partner_budget_id                      AS budget_id,
  pbt.legacy_category_id                     AS category_id,
  pbl.description,
  pbl.unit,
  pbl.qty                                    AS quantity,
  pbl.unit_cost,
  pbl.total                                  AS total_cost,
  COALESCE(pbl.notes, bl.notes)              AS notes,
  pbl.created_at,
  COALESCE(bl.updated_at, pbl.created_at)    AS updated_at
FROM partner_budget_lines pbl
LEFT JOIN partner_budget_templates pbt ON pbt.id = pbl.template_id
LEFT JOIN budget_lines_legacy bl ON bl.id = pbl.id;

CREATE OR REPLACE VIEW legacy_review_comments_v AS
SELECT
  rc.id,
  rt.entity_type,
  rt.entity_id,
  rc.legacy_parent_id                        AS parent_id,
  rc.author_user_id                          AS author_id,
  rc.body                                    AS content,
  COALESCE(rc.legacy_is_resolved, false)     AS is_resolved,
  rc.legacy_resolved_at                      AS resolved_at,
  rc.legacy_resolved_by                      AS resolved_by,
  rc.created_at,
  COALESCE(rc.legacy_updated_at, rc.created_at) AS updated_at
FROM review_comments rc
JOIN review_threads rt ON rt.id = rc.thread_id;

-- ---------------------------------------------------------------------------
-- Step 9. Lock down renamed legacy tables with write-blocking triggers.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION prevent_legacy_writes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Legacy table % is read-only post SSOT migration', TG_TABLE_NAME;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'budgets_legacy')
     AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'budgets_legacy_readonly') THEN
    CREATE TRIGGER budgets_legacy_readonly
    BEFORE INSERT OR UPDATE OR DELETE ON budgets_legacy
    FOR EACH STATEMENT EXECUTE FUNCTION prevent_legacy_writes();
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'budget_lines_legacy')
     AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'budget_lines_legacy_readonly') THEN
    CREATE TRIGGER budget_lines_legacy_readonly
    BEFORE INSERT OR UPDATE OR DELETE ON budget_lines_legacy
    FOR EACH STATEMENT EXECUTE FUNCTION prevent_legacy_writes();
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'review_comments_legacy')
     AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'review_comments_legacy_readonly') THEN
    CREATE TRIGGER review_comments_legacy_readonly
    BEFORE INSERT OR UPDATE OR DELETE ON review_comments_legacy
    FOR EACH STATEMENT EXECUTE FUNCTION prevent_legacy_writes();
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs_legacy')
     AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_logs_legacy_readonly') THEN
    CREATE TRIGGER audit_logs_legacy_readonly
    BEFORE INSERT OR UPDATE OR DELETE ON audit_logs_legacy
    FOR EACH STATEMENT EXECUTE FUNCTION prevent_legacy_writes();
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications_legacy')
     AND NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'notifications_legacy_readonly') THEN
    CREATE TRIGGER notifications_legacy_readonly
    BEFORE INSERT OR UPDATE OR DELETE ON notifications_legacy
    FOR EACH STATEMENT EXECUTE FUNCTION prevent_legacy_writes();
  END IF;
END;
$$;

COMMIT;

-- ============================================================================
-- End Phase B
-- ============================================================================