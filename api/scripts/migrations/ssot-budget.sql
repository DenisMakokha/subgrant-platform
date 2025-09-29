-- ============================================================================
-- SSOT Budget Migration (Deprecated Stub)
-- ----------------------------------------------------------------------------
-- This legacy migration file has been superseded by the phased SSOT cutover
-- suite located at:
--   api/scripts/migrations/2025Q1_ssot_cutover/phaseA.sql
--   api/scripts/migrations/2025Q1_ssot_cutover/phaseB.sql
--   api/scripts/migrations/2025Q1_ssot_cutover/cleanup.sql
--
-- Execute the scripts above in order. This file is retained to prevent duplicate
-- schema creation and now only emits an informational notice.
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Legacy ssot-budget.sql stub. Use 2025Q1_ssot_cutover phased scripts (PhaseA -> PhaseB -> cleanup).';
END;
$$;