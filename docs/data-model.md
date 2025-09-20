# Data Model

## 1. Overview

The Sub-Grant Management Platform data model is designed to support the complete sub-grant lifecycle from partner onboarding through project closure and archival. The model emphasizes data integrity, auditability, and compliance with financial regulations.

## 2. Core Entities

### 2.1 Organizations
Represents partner organizations that receive sub-grants.

**Fields:**
- id (UUID, PK)
- name (VARCHAR)
- legal_name (VARCHAR)
- registration_number (VARCHAR)
- tax_id (VARCHAR)
- address (TEXT)
- country (VARCHAR)
- phone (VARCHAR)
- email (VARCHAR)
- website (VARCHAR)
- description (TEXT)
- status (VARCHAR) - pending, active, inactive, suspended
- compliance_status (VARCHAR) - pending, approved, rejected
- due_diligence_completed (BOOLEAN)
- due_diligence_date (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- created_by (UUID, FK to users)
- updated_by (UUID, FK to users)

### 2.2 Users
Represents system users including administrators, approvers, and partner representatives.

**Fields:**
- id (UUID, PK)
- organization_id (UUID, FK to organizations)
- first_name (VARCHAR)
- last_name (VARCHAR)
- email (VARCHAR, unique)
- phone (VARCHAR)
- role (VARCHAR) - admin, partner_user, grants_manager, chief_operations_officer, donor
- status (VARCHAR) - active, inactive, suspended
- mfa_enabled (BOOLEAN)
- mfa_secret (VARCHAR)
- password_hash (VARCHAR)
- last_login (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### 2.3 Projects
Represents funding initiatives or calls for proposals.

**Fields:**
- id (UUID, PK)
- name (VARCHAR)
- description (TEXT)
- open_date (TIMESTAMP)
- close_date (TIMESTAMP)
- currency (VARCHAR)
- status (VARCHAR) - draft, open, closed, archived
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- created_by (UUID, FK to users)
- updated_by (UUID, FK to users)

### 2.4 Budget Categories
Defines spending categories for project budgets.

**Fields:**
- id (UUID, PK)
- project_id (UUID, FK to projects)
- name (VARCHAR)
- description (TEXT)
- cap_amount (DECIMAL)
- cap_percentage (DECIMAL)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- created_by (UUID, FK to users)
- updated_by (UUID, FK to users)

### 2.5 Budgets
Represents financial plans submitted by partner organizations.

**Fields:**
- id (UUID, PK)
- organization_id (UUID, FK to organizations)
- project_id (UUID, FK to projects)
- title (VARCHAR)
- description (TEXT)
- total_amount (DECIMAL)
- currency (VARCHAR)
- status (VARCHAR) - draft, submitted, approved, rejected, revised
- submitted_at (TIMESTAMP)
- approved_at (TIMESTAMP)
- approved_by (UUID, FK to users)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- created_by (UUID, FK to users)
- updated_by (UUID, FK to users)

### 2.6 Budget Lines
Represents individual line items within a budget.

**Fields:**
- id (UUID, PK)
- budget_id (UUID, FK to budgets)
- category_id (UUID, FK to budget_categories)
- description (VARCHAR)
- unit (VARCHAR)
- quantity (DECIMAL)
- unit_cost (DECIMAL)
- total_cost (DECIMAL)
- notes (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### 2.7 Contracts
Represents legal agreements between the organization and partners.

**Fields:**
- id (UUID, PK)
- budget_id (UUID, FK to budgets)
- template_id (VARCHAR)
- title (VARCHAR)
- description (TEXT)
- envelope_id (VARCHAR)
- status (VARCHAR) - ready, sent, partially_signed, completed, filed, declined, voided
- sent_at (TIMESTAMP)
- completed_at (TIMESTAMP)
- filed_at (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- created_by (UUID, FK to users)
- updated_by (UUID, FK to users)

### 2.8 Contract Artifacts
Stores contract documents and their versions.

**Fields:**
- id (UUID, PK)
- contract_id (UUID, FK to contracts)
- document_uri (VARCHAR)
- document_name (VARCHAR)
- mime_type (VARCHAR)
- version (INTEGER)
- checksum (VARCHAR)
- created_at (TIMESTAMP)

### 2.9 Disbursements
Represents fund transfers to partner organizations.

**Fields:**
- id (UUID, PK)
- budget_id (UUID, FK to budgets)
- title (VARCHAR)
- description (TEXT)
- tranche_number (INTEGER)
- amount (DECIMAL)
- currency (VARCHAR)
- planned_date (DATE)
- status (VARCHAR) - planned, processing, paid, reconciled, cancelled
- invoice_id (VARCHAR)
- bill_id (VARCHAR)
- paid_at (TIMESTAMP)
- reconciled_at (TIMESTAMP)
- reconciled_by (UUID, FK to users)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- created_by (UUID, FK to users)
- updated_by (UUID, FK to users)

### 2.10 ME Reports
Represents monitoring and evaluation reports submitted by partners.

**Fields:**
- id (UUID, PK)
- budget_id (UUID, FK to budgets)
- title (VARCHAR)
- description (TEXT)
- report_date (DATE)
- indicators (JSONB)
- status (VARCHAR) - draft, submitted, approved, rejected
- submitted_at (TIMESTAMP)
- approved_at (TIMESTAMP)
- approved_by (UUID, FK to users)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- created_by (UUID, FK to users)
- updated_by (UUID, FK to users)

### 2.11 Financial Reports
Represents financial reporting submissions.

**Fields:**
- id (UUID, PK)
- budget_id (UUID, FK to budgets)
- title (VARCHAR)
- description (TEXT)
- report_date (DATE)
- total_spent (DECIMAL)
- variance (DECIMAL)
- status (VARCHAR) - draft, submitted, approved, rejected
- submitted_at (TIMESTAMP)
- approved_at (TIMESTAMP)
- approved_by (UUID, FK to users)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- created_by (UUID, FK to users)
- updated_by (UUID, FK to users)

### 2.12 Receipts
Represents proof of expenditure documents.

**Fields:**
- id (UUID, PK)
- financial_report_id (UUID, FK to financial_reports)
- budget_line_id (UUID, FK to budget_lines)
- amount (DECIMAL)
- currency (VARCHAR)
- description (VARCHAR)
- document_uri (VARCHAR)
- document_name (VARCHAR)
- mime_type (VARCHAR)
- checksum (VARCHAR)
- created_at (TIMESTAMP)
- created_by (UUID, FK to users)

### 2.13 Audit Logs
Records all system activities for compliance and security purposes.

**Fields:**
- id (UUID, PK)
- actor_id (UUID, FK to users)
- action (VARCHAR)
- entity_type (VARCHAR)
- entity_id (UUID)
- before_state (JSONB)
- after_state (JSONB)
- ip_address (VARCHAR)
- user_agent (TEXT)
- created_at (TIMESTAMP)

### 2.14 Documents
Stores all documents with version control capabilities.

**Fields:**
- id (UUID, PK)
- entity_type (VARCHAR) - budget, contract, disbursement, project, report
- entity_id (UUID)
- title (VARCHAR)
- description (TEXT)
- document_uri (VARCHAR)
- document_name (VARCHAR)
- mime_type (VARCHAR)
- version (INTEGER)
- checksum (VARCHAR)
- uploaded_by (UUID, FK to users)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### 2.15 Review Comments
Stores comments and feedback during review processes.

**Fields:**
- id (UUID, PK)
- entity_type (VARCHAR) - budget, contract, report
- entity_id (UUID)
- parent_id (UUID, FK to review_comments)
- author_id (UUID, FK to users)
- content (TEXT)
- is_resolved (BOOLEAN)
- resolved_at (TIMESTAMP)
- resolved_by (UUID, FK to users)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

## 3. Relationships

### 3.1 Organization-User Relationship
- One-to-many relationship between Organizations and Users
- Each user belongs to exactly one organization
- Organizations can have multiple users

### 3.2 Project-Budget Relationship
- One-to-many relationship between Projects and Budgets
- Each budget belongs to exactly one project
- Projects can have multiple budgets

### 3.3 Budget-Budget Line Relationship
- One-to-many relationship between Budgets and Budget Lines
- Each budget line belongs to exactly one budget
- Budgets can have multiple budget lines

### 3.4 Budget-Contract Relationship
- One-to-one relationship between Budgets and Contracts
- Each contract is associated with exactly one budget
- Each budget can have at most one contract

### 3.5 Budget-Disbursement Relationship
- One-to-many relationship between Budgets and Disbursements
- Each disbursement belongs to exactly one budget
- Budgets can have multiple disbursements

### 3.6 Budget-ME Report Relationship
- One-to-many relationship between Budgets and ME Reports
- Each ME report belongs to exactly one budget
- Budgets can have multiple ME reports

### 3.7 Budget-Financial Report Relationship
- One-to-many relationship between Budgets and Financial Reports
- Each financial report belongs to exactly one budget
- Budgets can have multiple financial reports

### 3.8 Financial Report-Receipt Relationship
- One-to-many relationship between Financial Reports and Receipts
- Each receipt belongs to exactly one financial report
- Financial reports can have multiple receipts

### 3.9 Document Versioning
- Documents are versioned by entity_type and entity_id
- Each new version increments the version number
- All versions of a document are stored with their checksums
- The latest version can be retrieved by entity_type and entity_id

## 4. Indexes

### 4.1 Performance Indexes
- organizations_status_idx ON organizations(status)
- organizations_compliance_idx ON organizations(compliance_status)
- users_organization_idx ON users(organization_id)
- users_role_idx ON users(role)
- users_status_idx ON users(status)
- users_email_idx ON users(email)
- projects_status_idx ON projects(status)
- projects_dates_idx ON projects(open_date, close_date)
- budget_categories_project_idx ON budget_categories(project_id)
- budget_categories_active_idx ON budget_categories(is_active)
- budgets_organization_idx ON budgets(organization_id)
- budgets_project_idx ON budgets(project_id)
- budgets_status_idx ON budgets(status)
- budget_lines_budget_idx ON budget_lines(budget_id)
- budget_lines_category_idx ON budget_lines(category_id)
- contracts_budget_idx ON contracts(budget_id)
- contracts_status_idx ON contracts(status)
- contracts_envelope_idx ON contracts(envelope_id)
- contract_artifacts_contract_idx ON contract_artifacts(contract_id)
- disbursements_budget_idx ON disbursements(budget_id)
- disbursements_status_idx ON disbursements(status)
- disbursements_dates_idx ON disbursements(planned_date)
- me_reports_budget_idx ON me_reports(budget_id)
- me_reports_status_idx ON me_reports(status)
- me_reports_date_idx ON me_reports(report_date)
- financial_reports_budget_idx ON financial_reports(budget_id)
- financial_reports_status_idx ON financial_reports(status)
- receipts_financial_report_idx ON receipts(financial_report_id)
- receipts_budget_line_idx ON receipts(budget_line_id)
- audit_logs_actor_idx ON audit_logs(actor_id)
- audit_logs_entity_idx ON audit_logs(entity_type, entity_id)
- audit_logs_action_idx ON audit_logs(action)
- audit_logs_created_at_idx ON audit_logs(created_at)
- documents_entity_idx ON documents(entity_type, entity_id)
- documents_uploaded_by_idx ON documents(uploaded_by)

### 4.2 Document Versioning Indexes
- documents_version_idx ON documents(entity_type, entity_id, version)
- documents_checksum_idx ON documents(checksum)

## 5. Constraints

### 5.1 Primary Keys
All tables have UUID primary keys generated using gen_random_uuid()

### 5.2 Foreign Keys
All foreign key relationships are enforced with ON DELETE RESTRICT

### 5.3 Unique Constraints
- users.email (unique)
- contracts.envelope_id (unique)

### 5.4 Check Constraints
- budget_lines.total_cost = budget_lines.quantity * budget_lines.unit_cost
- disbursements.amount >= 0
- budgets.total_amount >= 0

## 6. Data Integrity

### 6.1 Document Version Control
- Automatic version incrementing when creating new versions of documents
- Checksum verification for document integrity
- Immutable storage of all document versions
- Version history tracking

### 6.2 Audit Trail
- Comprehensive logging of all system activities
- Before and after state recording for data changes
- User identification and IP tracking
- Immutable audit log storage

### 6.3 Data Validation
- Input validation at the application level
- Database constraints for critical data integrity
- Regular data consistency checks
- Backup and recovery procedures