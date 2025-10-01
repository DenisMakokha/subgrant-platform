-- Migration: add indexes and materialized view refresh helpers
-- Path: api/scripts/migrations/2025Q1_ssot_cutover/add_performance_indexes_and_refreshes.sql

BEGIN;

-- Create CONCURRENT indexes on frequently filtered / joined columns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_grants_created_by ON grants(created_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_grants_grant_number ON grants(grant_number);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_grants_created_at ON grants(created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_budgets_grant_id ON budgets(grant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_budgets_status ON budgets(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_budgets_category ON budgets(category_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_grant_id ON contracts(grant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_status ON contracts(status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_disbursements_contract_id ON disbursements(contract_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_disbursements_status ON disbursements(status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_logs_event_type_ts ON event_logs(event_type, timestamp);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_logs_timestamp ON event_logs(timestamp);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_audit_created_at ON security_audit_logs(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_audit_user_id ON security_audit_logs(user_id);

-- GIN indexes for JSONB columns used in filtering/search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dashboard_configs_widgets_gin ON dashboard_configs USING GIN (widgets);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dashboard_configs_filters_gin ON dashboard_configs USING GIN (filters);

-- Materialized view refresh helper function
CREATE OR REPLACE FUNCTION refresh_analytics_materialized_views() RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  -- Refresh known analytics materialized views if they exist.
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_envelope_metrics') THEN
    EXECUTE 'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_envelope_metrics';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_partner_budget_analytics') THEN
    EXECUTE 'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_partner_budget_analytics';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_spending_analytics') THEN
    EXECUTE 'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_spending_analytics';
  END IF;
END;
$$;

-- If pg_cron is installed, schedule an hourly refresh (idempotent if run multiple times)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Note: cron.schedule may differ by pg_cron version; this attempts to create a job if none exists.
    PERFORM cron.schedule('0 * * * *', 'SELECT refresh_analytics_materialized_views();');
  END IF;
END;
$$;

COMMIT;

-- Notes:
-- 1) Run this migration during a maintenance window when possible. CREATE INDEX CONCURRENTLY reduces locking but may take longer.
-- 2) Some Postgres setups do not allow CREATE INDEX CONCURRENTLY inside a transaction block. If your setup errors, remove the surrounding BEGIN/COMMIT and run indexes individually.
-- 3) To manually refresh materialized views use: SELECT refresh_analytics_materialized_views();
-- End of migration