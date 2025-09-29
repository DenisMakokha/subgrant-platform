# Contract SSOT (Single Source of Truth) System Design

## Overview

The Contract SSOT system is designed to provide a comprehensive, authoritative source for managing contracts within the sub-grant platform. It builds upon the existing structure while enhancing it with additional features for better governance, tracking, and reporting.

## Existing Structure Analysis

The current contract system consists of:
1. **Contracts** - Main contract entities with state management
2. **Contract Templates** - Document templates for contract generation
3. **Contract Parties** - Signatories and witnesses for contracts
4. **Contract Artifacts** - Document versions and related files

## Enhanced Contract SSOT Schema

### 1. Contract Templates
Enhanced templates with detailed placeholder schemas and versioning.

### 2. Contracts
Main contract entities with comprehensive state management and metadata.

### 3. Contract Parties
Detailed party information with roles, signing order, and status.

### 4. Contract Milestones
Key dates and milestones in the contract lifecycle.

### 5. Contract Amendments
Tracking of contract changes and amendments.

### 6. Contract Obligations
Tracking of deliverables and obligations under contracts.

### 7. Contract Payments
Tracking of payment schedules and actual payments.

### 8. Contract Risks
Risk assessment and tracking for contracts.

### 9. Contract Analytics
Aggregated data for reporting and insights.

## Key Features

1. **Multi-tenant Support** - Contracts organized by projects and partners
2. **Template Management** - Versioned contract templates with placeholder schemas
3. **State Management** - Comprehensive state tracking through the contract lifecycle
4. **Party Management** - Detailed tracking of signatories and witnesses
5. **Milestone Tracking** - Key dates and events in the contract lifecycle
6. **Amendment Tracking** - History of contract changes with versioning
7. **Obligation Management** - Tracking of deliverables and obligations
8. **Payment Tracking** - Payment schedules and actual payments
9. **Risk Assessment** - Risk identification and tracking
10. **Audit Trail** - Complete history of all contract changes
11. **Reporting** - Analytics and reporting capabilities

## Database Schema Design

### contract_templates
- id (UUID)
- name (TEXT)
- description (TEXT)
- storage_key (TEXT)
- placeholder_schema (JSONB)
- version (INT)
- is_default (BOOLEAN)
- active (BOOLEAN)
- created_by (UUID)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

### contracts
- id (UUID)
- project_id (UUID)
- partner_id (UUID)
- partner_budget_id (UUID)
- template_id (UUID)
- number (TEXT)
- title (TEXT)
- description (TEXT)
- state (TEXT)
- substatus_json (JSONB)
- start_date (DATE)
- end_date (DATE)
- currency (TEXT)
- total_amount (NUMERIC)
- approval_provider (TEXT)
- approval_ref (TEXT)
- docusign_envelope_id (TEXT)
- generated_docx_key (TEXT)
- approved_docx_key (TEXT)
- signed_pdf_key (TEXT)
- metadata_json (JSONB)
- created_by (UUID)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

### contract_parties
- id (UUID)
- contract_id (UUID)
- role (TEXT)
- party_type (TEXT) - 'ORGANIZATION' or 'INDIVIDUAL'
- party_id (UUID) - Reference to organization or user
- signer_name (TEXT)
- signer_email (TEXT)
- signer_title (TEXT)
- signing_order (INT)
- signed_at (TIMESTAMPTZ)
- signature_data (TEXT) - Base64 encoded signature or reference
- status (TEXT) - 'PENDING', 'SIGNED', 'DECLINED'
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

### contract_milestones
- id (UUID)
- contract_id (UUID)
- name (TEXT)
- description (TEXT)
- due_date (DATE)
- completed_date (DATE)
- status (TEXT) - 'PENDING', 'COMPLETED', 'OVERDUE'
- created_by (UUID)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

### contract_amendments
- id (UUID)
- contract_id (UUID)
- amendment_number (TEXT)
- title (TEXT)
- description (TEXT)
- reason (TEXT)
- approved_at (TIMESTAMPTZ)
- approved_by (UUID)
- effective_date (DATE)
- document_key (TEXT)
- created_by (UUID)
- created_at (TIMESTAMPTZ)

### contract_obligations
- id (UUID)
- contract_id (UUID)
- title (TEXT)
- description (TEXT)
- category (TEXT)
- due_date (DATE)
- completed_date (DATE)
- status (TEXT) - 'PENDING', 'COMPLETED', 'OVERDUE'
- priority (TEXT) - 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
- assigned_to (UUID) - User ID
- created_by (UUID)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

### contract_payments
- id (UUID)
- contract_id (UUID)
- schedule_id (UUID) - Reference to payment schedule
- amount (NUMERIC)
- currency (TEXT)
- due_date (DATE)
- paid_date (DATE)
- payment_reference (TEXT)
- status (TEXT) - 'SCHEDULED', 'PAID', 'OVERDUE'
- created_by (UUID)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

### contract_risks
- id (UUID)
- contract_id (UUID)
- title (TEXT)
- description (TEXT)
- category (TEXT)
- likelihood (TEXT) - 'LOW', 'MEDIUM', 'HIGH'
- impact (TEXT) - 'LOW', 'MEDIUM', 'HIGH'
- mitigation_plan (TEXT)
- owner_id (UUID) - User ID of risk owner
- status (TEXT) - 'IDENTIFIED', 'MONITORED', 'MITIGATED', 'REALIZED'
- created_by (UUID)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)

### contract_analytics
- id (UUID)
- contract_id (UUID)
- metric_name (TEXT)
- metric_value (NUMERIC)
- period_start (DATE)
- period_end (DATE)
- calculated_at (TIMESTAMPTZ)

## API Endpoints

### Contract Templates
- GET /api/contracts/templates - List all contract templates
- GET /api/contracts/templates/:id - Get a specific contract template
- POST /api/contracts/templates - Create a new contract template
- PUT /api/contracts/templates/:id - Update a contract template
- DELETE /api/contracts/templates/:id - Delete a contract template

### Contracts
- GET /api/contracts - List contracts
- GET /api/contracts/:id - Get a specific contract
- POST /api/contracts - Create a new contract
- PUT /api/contracts/:id - Update a contract
- DELETE /api/contracts/:id - Delete a contract
- POST /api/contracts/:id/generate - Generate contract document
- POST /api/contracts/:id/submit - Submit contract for approval
- POST /api/contracts/:id/approve - Approve a contract
- POST /api/contracts/:id/reject - Reject a contract
- POST /api/contracts/:id/send-for-sign - Send contract for signing
- POST /api/contracts/:id/activate - Activate a contract
- POST /api/contracts/:id/cancel - Cancel a contract

### Contract Parties
- GET /api/contracts/:contractId/parties - List parties for a contract
- GET /api/contracts/:contractId/parties/:id - Get a specific party
- POST /api/contracts/:contractId/parties - Add a party to a contract
- PUT /api/contracts/:contractId/parties/:id - Update a party
- DELETE /api/contracts/:contractId/parties/:id - Remove a party
- POST /api/contracts/:contractId/parties/:id/sign - Record party signature

### Contract Milestones
- GET /api/contracts/:contractId/milestones - List milestones for a contract
- GET /api/contracts/:contractId/milestones/:id - Get a specific milestone
- POST /api/contracts/:contractId/milestones - Create a new milestone
- PUT /api/contracts/:contractId/milestones/:id - Update a milestone
- DELETE /api/contracts/:contractId/milestones/:id - Delete a milestone
- POST /api/contracts/:contractId/milestones/:id/complete - Mark milestone as completed

### Contract Amendments
- GET /api/contracts/:contractId/amendments - List amendments for a contract
- GET /api/contracts/:contractId/amendments/:id - Get a specific amendment
- POST /api/contracts/:contractId/amendments - Create a new amendment
- PUT /api/contracts/:contractId/amendments/:id - Update an amendment
- DELETE /api/contracts/:contractId/amendments/:id - Delete an amendment
- POST /api/contracts/:contractId/amendments/:id/approve - Approve an amendment

### Contract Obligations
- GET /api/contracts/:contractId/obligations - List obligations for a contract
- GET /api/contracts/:contractId/obligations/:id - Get a specific obligation
- POST /api/contracts/:contractId/obligations - Create a new obligation
- PUT /api/contracts/:contractId/obligations/:id - Update an obligation
- DELETE /api/contracts/:contractId/obligations/:id - Delete an obligation
- POST /api/contracts/:contractId/obligations/:id/complete - Mark obligation as completed

### Contract Payments
- GET /api/contracts/:contractId/payments - List payments for a contract
- GET /api/contracts/:contractId/payments/:id - Get a specific payment
- POST /api/contracts/:contractId/payments - Create a new payment
- PUT /api/contracts/:contractId/payments/:id - Update a payment
- DELETE /api/contracts/:contractId/payments/:id - Delete a payment
- POST /api/contracts/:contractId/payments/:id/pay - Record payment

### Contract Risks
- GET /api/contracts/:contractId/risks - List risks for a contract
- GET /api/contracts/:contractId/risks/:id - Get a specific risk
- POST /api/contracts/:contractId/risks - Create a new risk
- PUT /api/contracts/:contractId/risks/:id - Update a risk
- DELETE /api/contracts/:contractId/risks/:id - Delete a risk

### Contract Analytics
- GET /api/contracts/:contractId/analytics - Get analytics for a contract
- GET /api/contracts/analytics - Get aggregated analytics

## Integration Points

1. **Notification System** - Integration with the existing notification system for contract events
2. **Approval System** - Integration with the approval workflow system
3. **Project Management** - Linking to project entities
4. **Partner Management** - Linking to partner organizations
5. **Budget System** - Linking to partner budgets
6. **Document Management** - Integration with document storage systems
7. **Audit System** - Integration with the audit trail system
8. **Financial Reporting** - Integration with financial reporting systems

## Security Considerations

1. **Role-Based Access Control** - Different permissions for partners, project managers, and admins
2. **Document Security** - Secure storage and access control for contract documents
3. **Signature Security** - Secure handling of electronic signatures
4. **Audit Trail** - Comprehensive logging of all contract-related activities
5. **Validation** - Server-side validation of all contract data
6. **Rate Limiting** - Protection against abuse of contract APIs

## Performance Considerations

1. **Indexing** - Proper indexing of frequently queried fields
2. **Caching** - Caching of frequently accessed contract data
3. **Pagination** - Pagination of large result sets
4. **Batch Operations** - Support for batch creation and updates
5. **Asynchronous Processing** - Background processing for complex operations
6. **Document Storage** - Efficient storage and retrieval of contract documents