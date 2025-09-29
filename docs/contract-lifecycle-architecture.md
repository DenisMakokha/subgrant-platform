# SSOT Contract Lifecycle – Implementation Guide (2025Q4)

This companion guide documents the newly implemented Single Source of Truth (SSOT) lifecycle for **contracts**. It covers schema, repository/service layer, API surfaces, audit/notification flows, and rollout considerations introduced in the `2025Q4_contract_ssot` migration set.

---

## 1. Scope

Contract SSOT introduces an end-to-end workflow tightly linked to approved partner budgets:

```
DRAFT → GENERATED → SUBMITTED_FOR_APPROVAL → APPROVED → SENT_FOR_SIGN → SIGNED → ACTIVE
(cancel allowed on any pre-sign state)
```

Each transition is handled by `ContractLifecycleService`, writing audit logs and partner notifications, while leveraging DocuSign and approval-webhook integration points.

---

## 2. Schema Overview

Defined in `api/scripts/migrations/2025Q4_contract_ssot/phaseA.sql` with template seeding in `phaseB.sql`.

| Object | Purpose | Notes |
| --- | --- | --- |
| `contract_state` enum | Canonical states | Enums enforce single source of truth. |
| `contract_templates` | Stores DOCX template metadata and placeholder schema | Seeded with the default Grant Agreement. |
| `contracts` | Main contract record | Links `project_id`, `partner_id`, `partner_budget_id`, template, doc keys. |
| `contract_parties` | Signer definitions | Roles: `ORG_SIGNER`, `PARTNER_SIGNER`, `WITNESS`; includes signing order. |
| `contract_artifacts` | Versioned DOCX/PDF artifacts | Immutable records with checksum and label (`generated`, `approved`, `sent_for_sign`, `signed`). |

Foreign keys tie contracts to projects, partners (via organizations), and SSOT partner budgets. `substatus_json` stores workflow metadata (e.g. DocuSign progress).

---

## 3. Repository Layer (`api/repositories`)

- `contractTemplateRepository.js` – Fetches active templates, including placeholder schema.
- `contractRepository.js` – Handles contract CRUD, state updates, substatus and external references.
- Existing `models/contractArtifact.js` continues to manage artifact queries/updates.

Each repository accepts an optional `client` for transactional operations.

---

## 4. Lifecycle Service (`api/services/contracts/contractLifecycleService.js`)

Central orchestration for all state transitions:

| Method | Description | Key Effects |
| --- | --- | --- |
| `createContract` | Validates partner budget (must be `APPROVED`/`LOCKED`), seeds `DRAFT` contract. | Audit: `CONTRACT_CREATED`. |
| `generate` | Stores generated DOCX key + merge preview, moves to `GENERATED`. | Audit: `CONTRACT_GENERATED`; notification `contract.generated`. |
| `submitForApproval` | Saves approval provider/ref, moves to `SUBMITTED_FOR_APPROVAL`. | Audit & notification `contract.submitted_for_approval`. |
| `markApproved` | Freezes approved DOCX key, moves to `APPROVED`. | Audit & notification `contract.approved`. |
| `sendForSign` | Records DocuSign envelope, moves to `SENT_FOR_SIGN`. | Audit & notification `contract.sent_for_sign`. |
| `markSigned` | Captures signed PDF key, moves to `SIGNED`. | Audit & notification `contract.signed`. |
| `activate` | Moves to `ACTIVE`, auto-locks partner budget, sends activation notification. | Audit `CONTRACT_ACTIVATED`. |
| `cancel` | Valid in pre-sign states, records cancel reason with timestamp. | Audit & notification `contract.cancelled`. |

Every method runs inside a transaction, checks state invariants, and writes to `audit_log` and `notifications`. Partner budgets are locked on activation to keep budgets/contract states aligned.

---

## 5. Controller & Routes

`api/controllers/contractController.js` exposes functions that wrap lifecycle service calls and shape HTTP responses. Updated routes in `api/routes/contracts.js` include:

| Endpoint | Action |
| --- | --- |
| `GET /api/contracts/templates` | List active contract templates. |
| `POST /api/contracts` | Create new contract (requires admin + SSOT budget approval). |
| `GET /api/contracts` | List contracts with optional filters (`project_id`, `partner_id`, `state`). |
| Lifecycle endpoints | `/api/contracts/:id/generate`, `/submit-for-approval`, `/mark-approved`, `/send-for-sign`, `/mark-signed`, `/activate`, `/cancel` |
| Artifact endpoints | `GET /api/contracts/:contractId/artifacts`, `GET /api/contracts/:contractId/artifacts/latest`, `GET /api/contracts/artifacts/:artifactId/download` (download currently returns a placeholder string until storage is integrated). |

All mutation routes require appropriate RBAC permissions and (for admin operations) `authorizeRole(['admin', 'admin'])`.

---

## 6. Notifications & Audit

- Notifications inserted into `notifications` table (`contract.generated`, `contract.submitted_for_approval`, `contract.approved`, `contract.sent_for_sign`, `contract.signed`, `contract.activated`, `contract.cancelled`).
- Audit log entries stored via `AuditLogRepository` using action keys `CONTRACT_*` and capturing before/after snapshots plus diff metadata.

---

## 7. Rollout Steps

1. Run `phaseA.sql` and `phaseB.sql` migrations for contracts.
2. Deploy new repositories, lifecycle service, controller, and routes.
3. Configure template storage (`storage_key`) to point at actual DOCX assets (currently a placeholder path).
4. Integrate DocuSign/ApprovalMax webhooks to call lifecycle endpoints (`markApproved`, `markSigned`).
5. Execute smoke tests: create contract → generate → submit → mark approved → send for sign → mark signed → activate.
6. Monitor audit/notification tables for accuracy.
7. Plan cleanup tasks to remove legacy `contracts` handling if applicable.

---

## 8. Outstanding Items

- Implement actual storage retrieval for artifact downloads.
- Integrate template storage service (object store) and DOCX/PDF rendering if needed (currently expects upstream service to supply keys).
- Add Jest unit/integration tests (repositories, lifecycle service).
- Update public API documentation (OpenAPI/Postman).
- Verify budget-lock behaviour on activation still satisfies downstream Fund Request logic.

With budget and contract SSOT lifecycles documented separately, the handbook now reflects the current state of backend orchestration.