# Migration Improvements Summary

This document summarizes the improvements made to the database migration system for the Sub-Grant Management Platform.

## 1. New Migration Script

### Created: `api/scripts/run-ssot-migrations.js`

A new script that runs the SSOT (Single Source of Truth) database migrations:
- Executes Phase A migration (schema bootstrap) which includes the fund_requests table
- Executes Phase B migration (backfill and compatibility)
- Verifies that the fund_requests table exists and shows its structure
- Provides detailed logging of the migration process

## 2. Package.json Update

### Updated: `api/package.json`

Added a new npm script:
```json
"migrate-ssot": "node scripts/run-ssot-migrations.js"
```

This allows developers to run the SSOT migrations with a simple command:
```bash
npm run migrate-ssot
```

## 3. Documentation

### Created: `api/scripts/README.md`

Comprehensive documentation for all migration scripts including:
- Available scripts and how to run them
- Description of migration files
- Instructions for running migrations
- Migration order guidelines
- Manual execution instructions

### Updated: `README.md`

Added information about running SSOT migrations to the main README:
- Updated the "Database Setup" section to include the SSOT migration step
- Provided clear instructions for running the migrations

## 4. Fund Requests Table

### Updated: `api/scripts/migrations/2025Q1_ssot_cutover/phaseA.sql`

Added the fund_requests table to the Phase A migration:
```sql
-- Fund requests for partner projects
CREATE TABLE IF NOT EXISTS fund_requests (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL,
  partner_id UUID NOT NULL,
  amount NUMERIC(18,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL,
  purpose TEXT NOT NULL,
  period_from DATE,
  period_to DATE,
  status TEXT NOT NULL CHECK (status IN ('draft','submitted','approved','rejected','paid')) DEFAULT 'draft',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fund_requests_project
  ON fund_requests(project_id);

CREATE INDEX IF NOT EXISTS idx_fund_requests_partner
  ON fund_requests(partner_id);

CREATE INDEX IF NOT EXISTS idx_fund_requests_status
  ON fund_requests(status);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_fund_requests_updated_at'
  ) THEN
    CREATE TRIGGER trg_fund_requests_updated_at
    BEFORE UPDATE ON fund_requests
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at_timestamp();
  END IF;
END;
$$;
```

## Benefits

1. **Simplified Migration Process**: Developers can now run all SSOT migrations with a single command
2. **Better Documentation**: Clear instructions for running and understanding migrations
3. **Verification**: The script verifies that the fund_requests table exists and shows its structure
4. **Consistency**: All migration-related information is centralized and easy to find
5. **Extensibility**: The script can be easily extended to run additional migrations in the future

## How to Run Migrations

To run the SSOT migrations:

```bash
cd api
npm run migrate-ssot
```

This will:
1. Execute Phase A migration (schema creation including fund_requests table)
2. Execute Phase B migration (data backfill)
3. Verify that the fund_requests table exists
4. Show the structure of the fund_requests table

## Migration Order

Migrations should be run in the following order:
1. 2025Q1_ssot_cutover/phaseA.sql (included in migrate-ssot)
2. 2025Q1_ssot_cutover/phaseB.sql (included in migrate-ssot)
3. 2025Q4_contract_ssot/phaseA.sql (future migration)
4. 2025Q4_contract_ssot/phaseB.sql (future migration)

The cleanup.sql file should only be run after cutover sign-off.