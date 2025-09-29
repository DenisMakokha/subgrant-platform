# Database Migration Scripts

This directory contains scripts for managing database migrations and setup.

## Available Scripts

### 1. SSOT Migrations
Run the SSOT (Single Source of Truth) database migrations:
```bash
npm run migrate-ssot
```

This script runs the 2025Q1 SSOT cutover migrations:
- Phase A: Schema Bootstrap (creates tables including fund_requests)
- Phase B: Backfill and Compatibility

### 2. Database Connection Test
Test the database connection:
```bash
npm run test-db
```

### 3. API Tests
Run API tests:
```bash
npm run test-api
```

## Migration Files

### 2025Q1 SSOT Cutover
- `migrations/2025Q1_ssot_cutover/phaseA.sql` - Schema bootstrap
- `migrations/2025Q1_ssot_cutover/phaseB.sql` - Backfill and compatibility
- `migrations/2025Q1_ssot_cutover/cleanup.sql` - Cleanup (run after cutover sign-off)

### 2025Q4 Contract SSOT
- `migrations/2025Q4_contract_ssot/phaseA.sql` - Contract schema enhancements
- `migrations/2025Q4_contract_ssot/phaseB.sql` - Contract data migration

## Running Migrations

To run the SSOT migrations:
```bash
cd api
npm run migrate-ssot
```

The script will:
1. Execute Phase A migration (schema creation)
2. Execute Phase B migration (data backfill)
3. Verify that the fund_requests table exists
4. Show the structure of the fund_requests table

## Manual Migration Execution

If you need to run migrations manually, you can use psql:
```bash
psql -h localhost -p 5432 -U subgrant_user -d subgrant_platform -f scripts/migrations/2025Q1_ssot_cutover/phaseA.sql
psql -h localhost -p 5432 -U subgrant_user -d subgrant_platform -f scripts/migrations/2025Q1_ssot_cutover/phaseB.sql
```

## Migration Order

Migrations should be run in the following order:
1. 2025Q1_ssot_cutover/phaseA.sql
2. 2025Q1_ssot_cutover/phaseB.sql
3. 2025Q4_contract_ssot/phaseA.sql
4. 2025Q4_contract_ssot/phaseB.sql

The cleanup.sql file should only be run after cutover sign-off.