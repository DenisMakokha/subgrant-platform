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

Legacy tables (`budgets`, `budget_lines`, etc.) remain read-only behind compatibility views until the cleanup phase executes.

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

Compatibility views (`legacy_budgets_v`, `legacy_budget_lines_v`, etc.) and write-blocking triggers are established in `phaseB.sql`. Cleanup scripts will drop legacy tables post-cutover.

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
6. Execute cleanup migration to drop legacy tables/views once the new flow is stabilized.

---

## 8. Outstanding Work

- Reinstate multi-tier approval logic once roles are confirmed by the client.
- Add Jest unit/integration tests for repositories and services.
- Document API request/response payloads (OpenAPI/Postman).

For contract lifecycle documentation see `docs/contract-lifecycle-architecture.md`.