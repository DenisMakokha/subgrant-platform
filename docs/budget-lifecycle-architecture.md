# SSOT Budget Lifecycle – Implementation Guide (2025)

This guide documents the budget Single Source of Truth (SSOT) backend lifecycle that is now live in the API. It summarizes the schema, repositories, services, API surface, and rollout considerations introduced in the `2025Q1_ssot_cutover` migration set.

---

## 1. Scope

Budget SSOT covers:

- Partner budget creation and collaborative drafting on the new tables.
- Submission, validation, and revision workflow (final approval tiers are placeholders pending client confirmation).
- Review threads and comments on budgets for change requests.
- Budget notifications and audit logging backed by shared SSOT tables.
- Automatic contract/disbursement seeding hooks once budgets reach final approval.

**Traditional implementations have been removed.** The system now operates exclusively on SSOT tables. Legacy tables and traditional controllers/routes have been cleaned up.

---

## 2. Schema Overview

All tables are created in `api/scripts/migrations/2025Q1_ssot_cutover/phaseA.sql` (with backfill/compatibility in `phaseB.sql`).

| Table | Purpose | Notes |
| --- | --- | --- |
| `partner_budgets` | Authoritative envelope per partner | `status` is normalized to draft/submitted/revision-requested. |
| `partner_budget_templates` | Template rows copied per partner budget | Tracks `legacy_category_id` for compatibility. |
| `partner_budget_lines` | Budget lines with computed `total` | Enforces positive qty/unit_cost, stored total. |
| `review_threads`, `review_comments` | Budget review threads/comments | `kind` enum plus legacy metadata columns. |
| `recon_line_evidence` | Reconciliation evidence | Cascades on budget-line delete. |
| `audit_log`, `notifications`, `action_idempotency` | Shared SSOT tables | Budget workflow writes audit diff snapshots and partner notifications. |

**Cleanup completed.** All legacy tables, traditional controllers, and routes have been removed. The system now operates exclusively on SSOT architecture.

---

## 3. Repository Layer (`api/repositories`)

Repositories wrap SQL access and return plain objects:

- `partnerBudgetRepository.js`
- `partnerBudgetTemplateRepository.js`
- `partnerBudgetLineRepository.js`
- `reviewThreadRepository.js`
- `auditLogRepository.js`
- `notificationRepository.js`
- `actionIdempotencyRepository.js`

Each repository accepts an optional `client` argument to operate inside transactions.

---

## 4. Services (`api/services/budgets`)

| Service | Responsibilities |
| --- | --- |
| `budgetDraftService.js` | Creates/updates budgets and lines in transactions; validates partner/project ownership and status. |
| `budgetValidationService.js` | Applies project `rules_json` (ceilings, category caps, schedule checks). |
| `budgetWorkflowService.js` | Handles submission and revision requests. Final approval tiers currently return placeholder responses pending client sign-off. |
| `reviewThreadService.js` | Ensures single thread per budget; adds comments; resolves threads. |
| `budgetContractService.js` | Generates a contract summary artifact when budgets reach final approval. |
| `budgetDisbursementService.js` | Seeds planned disbursement tranches from approved budgets. |

Each service writes audit entries (with before/after snapshots) and partner notifications, and uses `ActionIdempotencyRepository` to guard POST/transition endpoints.

---

## 5. API Surface

Core endpoints:

- `POST /api/budgets` – create draft (uses `BudgetDraftService`).
- `PUT /api/budgets/:id` – update draft and lines.
- `POST /api/budgets/:id/submit` – submit for review.
- `POST /api/budgets/:id/request-revisions` – reviewer requests changes.
- `GET /api/budgets/:id` – returns budget with SSOT lines.
- `GET /api/budgets/:id/review-thread` – fetch thread + comments.
- `POST /api/budgets/:id/comments` – add review comment.

The workflow approval tiers (`/approve/...`) are wired but currently return placeholder responses until clients confirm role logic.

All mutation endpoints require an `Idempotency-Key` header and enforce role checks via `middleware/rbac`.

---

## 6. Notifications & Audit

Every transition emits:

- Audit log entries (`audit_log`) with `fromState`, `toState`, a `diff` payload, and metadata (`ceilingTotal`, `projectId`, `partnerId`).
- Partner notifications in `notifications` (templates `budget_submitted`, `budget_revision_requested`, etc.).

Email/SMS delivery hooks can be added later; the SSOT table is the source of truth.

---

## 7. Rollout Checklist

1. Run `phaseA.sql` and `phaseB.sql` migrations (lock-step with partner-facing release).
2. Deploy new repositories/services/controllers.
3. Enable feature flag (e.g., `SSOT_BUDGETS_ENABLED`) for staged rollout.
4. Smoke-test budget draft → submit → revision loop using new endpoints.
5. Monitor audit/notification tables for anomalies.
6. **Cleanup completed** - All traditional implementations removed, system running on pure SSOT architecture.

---

## 8. Current Status

✅ **SSOT Architecture Complete** - All traditional implementations removed
✅ **Cleanup Completed** - Legacy tables, controllers, and routes removed
✅ **Modern Services** - All budget operations use SSOT repositories and services
✅ **Reconciliation Complete** - Full SSOT reconciliation implementation

### Reconciliation Implementation Status

**✅ Backend Services:**
- [`ReconciliationRepository`](api/repositories/reconciliationRepository.js:1) - Evidence tracking and summary calculations
- [`ReconciliationService`](api/services/reconciliationService.js:1) - Evidence upload, validation, and audit logging
- SSOT Data Controller Integration - [`recon.summary`](api/controllers/dataController.js:80), [`recon.evidence`](api/controllers/dataController.js:83), [`budget.lines.approved`](api/controllers/dataController.js:90)
- SSOT Action Controller Integration - [`recon.upload`](api/controllers/actionController.js:85), [`recon.delete`](api/controllers/actionController.js:103)

**✅ Frontend Integration:**
- [`Reconciliation.tsx`](web/src/pages/partner/projects/Reconciliation.tsx:1) - Updated to use SSOT endpoints
- Evidence upload with file handling
- Real-time summary updates

**✅ Features Implemented:**
- Evidence upload with document storage
- Reconciliation summary with spent/remaining calculations
- Audit logging for all reconciliation actions
- Notifications for evidence uploads
- File type detection and validation
- Transaction safety for all operations

**✅ Testing:**
- [`test-reconciliation.js`](api/test-reconciliation.js:1) - Comprehensive test suite
- Repository function testing
- Service layer validation
- Integration testing

### API Endpoints

**Data Endpoints:**
- `GET /ssot/recon/summary?partnerBudgetId={id}` - Get reconciliation summary
- `GET /ssot/recon/evidence?partnerBudgetLineId={id}` - Get evidence for line
- `GET /ssot/budget/lines/approved?partnerBudgetId={id}` - Get approved lines

**Action Endpoints:**
- `POST /ssot/action` with `{ actionKey: "recon.upload", payload: {...} }` - Upload evidence
- `POST /ssot/action` with `{ actionKey: "recon.delete", payload: {evidenceId} }` - Delete evidence

### Database Schema

The reconciliation system uses the `recon_line_evidence` table with:
- Evidence tracking per budget line
- Document storage with checksums
- Audit trail with timestamps
- Support for multiple file types

**Next Steps:**
- Deploy and monitor reconciliation functionality
- Add advanced reporting features
- Implement bulk evidence upload
- Add reconciliation approval workflows

For contract lifecycle documentation see `docs/contract-lifecycle-architecture.md`.