-- ============================================================================
-- SSOT Budget Cutover · Cleanup (Post-Signoff Decommission)
-- ----------------------------------------------------------------------------
-- Prerequisites:
--   • Cutover executed successfully (Phase A + Phase B).
--   • Stakeholder sign-off received; no legacy consumers remain.
-- Execution Order:
--   • Execute only after monitoring confirms zero dependency on compatibility views.
-- Rollback Guidance:
--   • Recreate dropped views/tables from backups if legacy workloads reappear.
--   • Consider re-running Phase B to restore views for short-term rollback.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Step 1. Drop compatibility views once downstream integrations migrate.
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS legacy_budget_lines_v;
DROP VIEW IF EXISTS legacy_budgets_v;
DROP VIEW IF EXISTS legacy_review_comments_v;

-- ---------------------------------------------------------------------------
-- Step 2. Remove write-blocking triggers then retire legacy tables.
--         (Comment/Uncomment blocks based on phased retirement schedule.)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'budgets_legacy_readonly') THEN
    DROP TRIGGER budgets_legacy_readonly ON budgets_legacy;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'budget_lines_legacy_readonly') THEN
    DROP TRIGGER budget_lines_legacy_readonly ON budget_lines_legacy;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'review_comments_legacy_readonly') THEN
    DROP TRIGGER review_comments_legacy_readonly ON review_comments_legacy;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_logs_legacy_readonly') THEN
    DROP TRIGGER audit_logs_legacy_readonly ON audit_logs_legacy;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'notifications_legacy_readonly') THEN
    DROP TRIGGER notifications_legacy_readonly ON notifications_legacy;
  END IF;
END;
$$;

DROP TABLE IF EXISTS budget_lines_legacy;
DROP TABLE IF EXISTS budgets_legacy;
DROP TABLE IF EXISTS review_comments_legacy;
DROP TABLE IF EXISTS audit_logs_legacy;
DROP TABLE IF EXISTS notifications_legacy;

COMMIT;

-- ============================================================================
-- End Cleanup
-- ============================================================================