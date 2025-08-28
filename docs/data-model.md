# Data Model Specification

## 1. Core Entities

### 1.1 Organization (Partner)

```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    registration_number VARCHAR(100),
    tax_id VARCHAR(100),
    address TEXT,
    country VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    compliance_status VARCHAR(50) DEFAULT 'pending',
    due_diligence_completed BOOLEAN DEFAULT FALSE,
    due_diligence_date TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_organizations_status ON organizations(status);
CREATE INDEX idx_organizations_compliance ON organizations(compliance_status);
```

**Fields:**
- `id`: Unique identifier
- `name`: Organization display name
- `legal_name`: Legal entity name
- `registration_number`: Business registration number
- `tax_id`: Tax identification number
- `address`: Physical address
- `country`: Country of operation
- `phone`: Contact phone number
- `email`: Contact email
- `website`: Organization website
- `description`: Brief description of the organization
- `status`: Current status (pending, active, inactive, suspended)
- `compliance_status`: Compliance verification status
- `due_diligence_completed`: Flag indicating if due diligence is complete
- `due_diligence_date`: Date when due diligence was completed
- `created_at`: Record creation timestamp
- `updated_at`: Record last update timestamp
- `created_by`: User who created the record
- `updated_by`: User who last updated the record

### 1.2 User

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    last_login TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_email ON users(email);
```

**Fields:**
- `id`: Unique identifier
- `organization_id`: Link to organization (NULL for HQ users)
- `first_name`: User's first name
- `last_name`: User's last name
- `email`: Unique email address
- `phone`: Contact phone number
- `role`: User role (admin, accountant, budget_holder, finance_manager, partner_user, auditor)
- `status`: Account status (active, inactive, suspended)
- `mfa_enabled`: Multi-factor authentication enabled
- `mfa_secret`: Secret key for MFA
- `password_hash`: Hashed password
- `last_login`: Timestamp of last login
- `created_at`: Record creation timestamp
- `updated_at`: Record last update timestamp

### 1.3 Project/Call

```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    open_date TIMESTAMP NOT NULL,
    close_date TIMESTAMP NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) NOT NULL,
    updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_dates ON projects(open_date, close_date);
```

**Fields:**
- `id`: Unique identifier
- `name`: Project/call name
- `description`: Detailed description
- `open_date`: Submission window open date
- `close_date`: Submission window close date
- `currency`: Default currency for the project
- `status`: Project status (draft, open, closed, archived)
- `created_at`: Record creation timestamp
- `updated_at`: Record last update timestamp
- `created_by`: User who created the project
- `updated_by`: User who last updated the project

### 1.4 Budget Category

```sql
CREATE TABLE budget_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    cap_amount DECIMAL(15, 2),
    cap_percentage DECIMAL(5, 2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) NOT NULL,
    updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_budget_categories_project ON budget_categories(project_id);
CREATE INDEX idx_budget_categories_active ON budget_categories(is_active);
```

**Fields:**
- `id`: Unique identifier
- `project_id`: Link to project
- `name`: Category name
- `description`: Category description
- `cap_amount`: Maximum amount allowed for this category
- `cap_percentage`: Maximum percentage of total budget
- `is_active`: Whether category is currently available
- `created_at`: Record creation timestamp
- `updated_at`: Record last update timestamp
- `created_by`: User who created the category
- `updated_by`: User who last updated the category

### 1.5 Budget

```sql
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    project_id UUID REFERENCES projects(id) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    total_amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    submitted_at TIMESTAMP,
    approved_at TIMESTAMP,
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) NOT NULL,
    updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_budgets_organization ON budgets(organization_id);
CREATE INDEX idx_budgets_project ON budgets(project_id);
CREATE INDEX idx_budgets_status ON budgets(status);
```

**Fields:**
- `id`: Unique identifier
- `organization_id`: Link to organization submitting budget
- `project_id`: Link to project/call
- `title`: Budget title
- `description`: Budget description
- `total_amount`: Total budget amount
- `currency`: Currency of the budget
- `status`: Budget status (draft, submitted, revise_requested, approved)
- `submitted_at`: Timestamp when submitted
- `approved_at`: Timestamp when approved
- `approved_by`: User who approved the budget
- `created_at`: Record creation timestamp
- `updated_at`: Record last update timestamp
- `created_by`: User who created the budget
- `updated_by`: User who last updated the budget

### 1.6 Budget Line

```sql
CREATE TABLE budget_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID REFERENCES budgets(id) NOT NULL,
    category_id UUID REFERENCES budget_categories(id) NOT NULL,
    description VARCHAR(255) NOT NULL,
    unit VARCHAR(50),
    quantity DECIMAL(10, 2),
    unit_cost DECIMAL(15, 2),
    total_cost DECIMAL(15, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_budget_lines_budget ON budget_lines(budget_id);
CREATE INDEX idx_budget_lines_category ON budget_lines(category_id);
```

**Fields:**
- `id`: Unique identifier
- `budget_id`: Link to budget
- `category_id`: Link to budget category
- `description`: Line item description
- `unit`: Unit of measurement
- `quantity`: Quantity of units
- `unit_cost`: Cost per unit
- `total_cost`: Total cost for this line (quantity × unit_cost)
- `notes`: Additional notes
- `created_at`: Record creation timestamp
- `updated_at`: Record last update timestamp

### 1.7 Contract

```sql
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID REFERENCES budgets(id) NOT NULL,
    template_id VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    envelope_id VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'ready',
    sent_at TIMESTAMP,
    completed_at TIMESTAMP,
    filed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) NOT NULL,
    updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_contracts_budget ON contracts(budget_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_envelope ON contracts(envelope_id);
```

**Fields:**
- `id`: Unique identifier
- `budget_id`: Link to approved budget
- `template_id`: DocuSign template identifier
- `title`: Contract title
- `description`: Contract description
- `envelope_id`: DocuSign envelope identifier
- `status`: Contract status (ready, sent, partially_signed, completed, filed)
- `sent_at`: Timestamp when sent for signing
- `completed_at`: Timestamp when fully signed
- `filed_at`: Timestamp when filed/archived
- `created_at`: Record creation timestamp
- `updated_at`: Record last update timestamp
- `created_by`: User who created the contract
- `updated_by`: User who last updated the contract

### 1.8 Contract Artifact

```sql
CREATE TABLE contract_artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id) NOT NULL,
    document_uri VARCHAR(500) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    checksum VARCHAR(64),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_contract_artifacts_contract ON contract_artifacts(contract_id);
```

**Fields:**
- `id`: Unique identifier
- `contract_id`: Link to contract
- `document_uri`: URI to document storage
- `document_name`: Name of the document
- `mime_type`: MIME type of the document
- `version`: Document version number
- `checksum`: Document checksum for integrity verification
- `created_at`: Record creation timestamp

### 1.9 Disbursement

```sql
CREATE TABLE disbursements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID REFERENCES budgets(id) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    tranche_number INTEGER NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    planned_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'planned',
    invoice_id VARCHAR(100),
    bill_id VARCHAR(100),
    paid_at TIMESTAMP,
    reconciled_at TIMESTAMP,
    reconciled_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) NOT NULL,
    updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_disbursements_budget ON disbursements(budget_id);
CREATE INDEX idx_disbursements_status ON disbursements(status);
CREATE INDEX idx_disbursements_dates ON disbursements(planned_date);
```

**Fields:**
- `id`: Unique identifier
- `budget_id`: Link to budget
- `title`: Disbursement title
- `description`: Disbursement description
- `tranche_number`: Tranche sequence number
- `amount`: Disbursement amount
- `currency`: Currency of disbursement
- `planned_date`: Planned disbursement date
- `status`: Disbursement status (planned, invoiced, paid, reconciled)
- `invoice_id`: Xero invoice identifier
- `bill_id`: Xero bill identifier
- `paid_at`: Timestamp when paid
- `reconciled_at`: Timestamp when reconciled
- `reconciled_by`: User who reconciled
- `created_at`: Record creation timestamp
- `updated_at`: Record last update timestamp
- `created_by`: User who created the disbursement
- `updated_by`: User who last updated the disbursement

### 1.10 M&E Report

```sql
CREATE TABLE me_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID REFERENCES budgets(id) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    report_date DATE NOT NULL,
    indicators JSONB,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    submitted_at TIMESTAMP,
    approved_at TIMESTAMP,
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) NOT NULL,
    updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_me_reports_budget ON me_reports(budget_id);
CREATE INDEX idx_me_reports_status ON me_reports(status);
CREATE INDEX idx_me_reports_date ON me_reports(report_date);
```

**Fields:**
- `id`: Unique identifier
- `budget_id`: Link to budget
- `title`: Report title
- `description`: Report description
- `report_date`: Date of the reporting period
- `indicators`: JSONB field containing KPI indicators
- `status`: Report status (draft, submitted, corrections, approved)
- `submitted_at`: Timestamp when submitted
- `approved_at`: Timestamp when approved
- `approved_by`: User who approved the report
- `created_at`: Record creation timestamp
- `updated_at`: Record last update timestamp
- `created_by`: User who created the report
- `updated_by`: User who last updated the report

### 1.11 Financial Report

```sql
CREATE TABLE financial_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID REFERENCES budgets(id) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    report_date DATE NOT NULL,
    total_spent DECIMAL(15, 2) NOT NULL DEFAULT 0,
    variance DECIMAL(15, 2) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    submitted_at TIMESTAMP,
    approved_at TIMESTAMP,
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) NOT NULL,
    updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_financial_reports_budget ON financial_reports(budget_id);
CREATE INDEX idx_financial_reports_status ON financial_reports(status);
```

**Fields:**
- `id`: Unique identifier
- `budget_id`: Link to budget
- `title`: Report title
- `description`: Report description
- `report_date`: Date of the reporting period
- `total_spent`: Total amount spent
- `variance`: Variance from budget
- `status`: Report status (draft, submitted, corrections, approved)
- `submitted_at`: Timestamp when submitted
- `approved_at`: Timestamp when approved
- `approved_by`: User who approved the report
- `created_at`: Record creation timestamp
- `updated_at`: Record last update timestamp
- `created_by`: User who created the report
- `updated_by`: User who last updated the report

### 1.12 Receipt

```sql
CREATE TABLE receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    financial_report_id UUID REFERENCES financial_reports(id) NOT NULL,
    budget_line_id UUID REFERENCES budget_lines(id),
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    description VARCHAR(255),
    document_uri VARCHAR(500) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    checksum VARCHAR(64),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) NOT NULL
);

-- Indexes
CREATE INDEX idx_receipts_financial_report ON receipts(financial_report_id);
CREATE INDEX idx_receipts_budget_line ON receipts(budget_line_id);
```

**Fields:**
- `id`: Unique identifier
- `financial_report_id`: Link to financial report
- `budget_line_id`: Link to budget line (optional)
- `amount`: Receipt amount
- `currency`: Currency of receipt
- `description`: Description of expense
- `document_uri`: URI to document storage
- `document_name`: Name of the document
- `mime_type`: MIME type of the document
- `checksum`: Document checksum for integrity verification
- `created_at`: Record creation timestamp
- `created_by`: User who created the receipt

### 1.13 Document

```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    document_uri VARCHAR(500) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    checksum VARCHAR(64),
    uploaded_by UUID REFERENCES users(id) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
```

**Fields:**
- `id`: Unique identifier
- `entity_type`: Type of entity the document is attached to
- `entity_id`: ID of the entity the document is attached to
- `title`: Document title
- `description`: Document description
- `document_uri`: URI to document storage
- `document_name`: Name of the document
- `mime_type`: MIME type of the document
- `version`: Document version number
- `checksum`: Document checksum for integrity verification
- `uploaded_by`: User who uploaded the document
- `created_at`: Record creation timestamp
- `updated_at`: Record last update timestamp

### 1.14 Notification

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal',
    audience_type VARCHAR(50) NOT NULL, -- user, role, organization, all
    audience_id UUID, -- specific user/organization ID or NULL for all
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    scheduled_at TIMESTAMP,
    sent_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_notifications_audience ON notifications(audience_type, audience_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_at);
```

**Fields:**
- `id`: Unique identifier
- `type`: Notification type (deadline, approval, contract, payment, etc.)
- `title`: Notification title
- `message`: Notification message content
- `priority`: Priority level (low, normal, high, urgent)
- `audience_type`: Audience type (user, role, organization, all)
- `audience_id`: Specific audience identifier
- `related_entity_type`: Type of related entity
- `related_entity_id`: ID of related entity
- `scheduled_at`: Scheduled send time
- `sent_at`: Actual send time
- `created_at`: Record creation timestamp
- `created_by`: User who created the notification

### 1.15 Notification Delivery

```sql
CREATE TABLE notification_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID REFERENCES notifications(id) NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    channel VARCHAR(20) NOT NULL, -- email, in_app
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, sent, failed
    delivered_at TIMESTAMP,
    failure_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_notification_deliveries_notification ON notification_deliveries(notification_id);
CREATE INDEX idx_notification_deliveries_user ON notification_deliveries(user_id);
CREATE INDEX idx_notification_deliveries_status ON notification_deliveries(status);
```

**Fields:**
- `id`: Unique identifier
- `notification_id`: Link to notification
- `user_id`: Target user
- `channel`: Delivery channel (email, in_app)
- `status`: Delivery status (pending, sent, failed)
- `delivered_at`: Timestamp when delivered
- `failure_reason`: Reason for delivery failure
- `created_at`: Record creation timestamp

### 1.16 Audit Log

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    before_state JSONB,
    after_state JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

**Fields:**
- `id`: Unique identifier
- `actor_id`: User who performed the action
- `action`: Action performed (create, update, delete, approve, etc.)
- `entity_type`: Type of entity affected
- `entity_id`: ID of entity affected
- `before_state`: JSON representation of entity before change
- `after_state`: JSON representation of entity after change
- `ip_address`: IP address of the request
- `user_agent`: User agent string
- `created_at`: Timestamp of the action

### 1.17 Review Comment

```sql
CREATE TABLE review_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL, -- budget, contract, report, etc.
    entity_id UUID NOT NULL,
    parent_id UUID REFERENCES review_comments(id), -- for threaded comments
    author_id UUID REFERENCES users(id) NOT NULL,
    content TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,
    resolved_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_review_comments_entity ON review_comments(entity_type, entity_id);
CREATE INDEX idx_review_comments_author ON review_comments(author_id);
CREATE INDEX idx_review_comments_parent ON review_comments(parent_id);
```

**Fields:**
- `id`: Unique identifier
- `entity_type`: Type of entity being commented on
- `entity_id`: ID of entity being commented on
- `parent_id`: Parent comment ID for threaded discussions
- `author_id`: User who created the comment
- `content`: Comment content
- `is_resolved`: Whether the comment has been addressed
- `resolved_at`: Timestamp when resolved
- `resolved_by`: User who resolved the comment
- `created_at`: Record creation timestamp
- `updated_at`: Record last update timestamp

## 2. Relationships

### 2.1 Organization Relationships
- An organization can have multiple users
- An organization can submit multiple budgets
- An organization can sign multiple contracts
- An organization can receive multiple disbursements
- An organization can submit multiple reports

### 2.2 User Relationships
- A user belongs to one organization (or HQ for admin users)
- A user can create multiple budgets, contracts, disbursements, reports
- A user can approve budgets, contracts, disbursements, reports
- A user can generate audit logs
- A user can receive notifications

### 2.3 Project Relationships
- A project can have multiple budget categories
- A project can have multiple budgets submitted by different organizations

### 2.4 Budget Relationships
- A budget belongs to one organization and one project
- A budget can have multiple budget lines
- A budget can have one contract (after approval)
- A budget can have multiple disbursements
- A budget can have multiple M&E reports
- A budget can have multiple financial reports

### 2.5 Contract Relationships
- A contract belongs to one budget
- A contract can have multiple artifacts (versions)

### 2.6 Disbursement Relationships
- A disbursement belongs to one budget
- A disbursement can be linked to Xero invoices/bills

### 2.7 Report Relationships
- Both M&E and financial reports belong to one budget
- Financial reports can have multiple receipts

## 3. Constraints and Validation Rules

### 3.1 Budget Validation
- Total budget amount must equal sum of budget lines
- Each budget line must belong to a valid category for the project
- Budget line amounts must not exceed category caps
- Budget line amounts must not exceed percentage caps

### 3.2 Date Validation
- Project close date must be after open date
- Disbursement planned date must be within project dates
- Report dates must be within project dates

### 3.3 Status Transitions
- Budget: draft → submitted → revise_requested → approved
- Contract: ready → sent → partially_signed → completed → filed
- Disbursement: planned → invoiced → paid → reconciled
- Reports: draft → submitted → corrections → approved

### 3.4 Financial Validation
- Total disbursements cannot exceed approved budget
- Receipt amounts in financial reports must match uploaded documents
- Financial report variance must equal budget minus actual spend

## 4. Indexing Strategy

### 4.1 Primary Indexes
- All primary keys (id fields) are indexed by default

### 4.2 Foreign Key Indexes
- All foreign key relationships have supporting indexes

### 4.3 Query Performance Indexes
- Status fields for filtering active/inactive records
- Date fields for time-based queries
- Type fields for entity-specific queries
- User fields for access control queries

## 5. Data Integrity

### 5.1 Referential Integrity
- All foreign key relationships enforce referential integrity
- Cascading deletes are used sparingly and only where appropriate

### 5.2 Business Rule Enforcement
- Database constraints enforce critical business rules
- Application-level validation handles complex business logic

### 5.3 Audit Trail
- All significant changes are logged in audit_logs table
- Before/after states are captured for all changes
- Immutable audit records with no update capability