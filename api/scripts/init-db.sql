-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
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
    created_by UUID,
    updated_by UUID
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID,
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);
CREATE INDEX IF NOT EXISTS idx_organizations_compliance ON organizations(compliance_status);
CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Insert default admin user
INSERT INTO users (first_name, last_name, email, role, password_hash)
VALUES ('Admin', 'User', 'admin@example.com', 'admin', '$2b$10$example_hash_here');

-- Insert default organization
INSERT INTO organizations (name, legal_name, status, compliance_status)
VALUES ('Default Organization', 'Default Organization Ltd', 'active', 'approved');

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    open_date TIMESTAMP NOT NULL,
    close_date TIMESTAMP NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- Create budget_categories table
CREATE TABLE IF NOT EXISTS budget_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    cap_amount DECIMAL(15, 2),
    cap_percentage DECIMAL(5, 2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_by UUID
);

-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    project_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    total_amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    submitted_at TIMESTAMP,
    approved_at TIMESTAMP,
    approved_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_by UUID
);

-- Create budget_lines table
CREATE TABLE IF NOT EXISTS budget_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL,
    category_id UUID NOT NULL,
    description VARCHAR(255) NOT NULL,
    unit VARCHAR(50),
    quantity DECIMAL(10, 2),
    unit_cost DECIMAL(15, 2),
    total_cost DECIMAL(15, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create contracts table
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL,
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
    created_by UUID NOT NULL,
    updated_by UUID
);

-- Create contract_artifacts table
CREATE TABLE IF NOT EXISTS contract_artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL,
    document_uri VARCHAR(500) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    checksum VARCHAR(64),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_dates ON projects(open_date, close_date);
CREATE INDEX IF NOT EXISTS idx_budget_categories_project ON budget_categories(project_id);
CREATE INDEX IF NOT EXISTS idx_budget_categories_active ON budget_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_budgets_organization ON budgets(organization_id);
CREATE INDEX IF NOT EXISTS idx_budgets_project ON budgets(project_id);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON budgets(status);
CREATE INDEX IF NOT EXISTS idx_budget_lines_budget ON budget_lines(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_lines_category ON budget_lines(category_id);
CREATE INDEX IF NOT EXISTS idx_contracts_budget ON contracts(budget_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_envelope ON contracts(envelope_id);
CREATE INDEX IF NOT EXISTS idx_contract_artifacts_contract ON contract_artifacts(contract_id);

-- Create disbursements table
CREATE TABLE IF NOT EXISTS disbursements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL,
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
    reconciled_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_by UUID
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_disbursements_budget ON disbursements(budget_id);
CREATE INDEX IF NOT EXISTS idx_disbursements_status ON disbursements(status);
CREATE INDEX IF NOT EXISTS idx_disbursements_dates ON disbursements(planned_date);

-- Create me_reports table
CREATE TABLE IF NOT EXISTS me_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    report_date DATE NOT NULL,
    indicators JSONB,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    submitted_at TIMESTAMP,
    approved_at TIMESTAMP,
    approved_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_by UUID
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_me_reports_budget ON me_reports(budget_id);
CREATE INDEX IF NOT EXISTS idx_me_reports_status ON me_reports(status);
CREATE INDEX IF NOT EXISTS idx_me_reports_date ON me_reports(report_date);

-- Create financial_reports table
CREATE TABLE IF NOT EXISTS financial_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    report_date DATE NOT NULL,
    total_spent DECIMAL(15, 2) NOT NULL DEFAULT 0,
    variance DECIMAL(15, 2) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    submitted_at TIMESTAMP,
    approved_at TIMESTAMP,
    approved_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_by UUID
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_financial_reports_budget ON financial_reports(budget_id);
CREATE INDEX IF NOT EXISTS idx_financial_reports_status ON financial_reports(status);

-- Create receipts table
CREATE TABLE IF NOT EXISTS receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    financial_report_id UUID NOT NULL,
    budget_line_id UUID,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    description VARCHAR(255),
    document_uri VARCHAR(500) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    checksum VARCHAR(64),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_receipts_financial_report ON receipts(financial_report_id);
CREATE INDEX IF NOT EXISTS idx_receipts_budget_line ON receipts(budget_line_id);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    before_state JSONB,
    after_state JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    document_uri VARCHAR(500) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size INTEGER, -- File size in bytes
    version INTEGER NOT NULL DEFAULT 1,
    checksum VARCHAR(64),
    uploaded_by UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);

-- Create compliance_document_types table
CREATE TABLE IF NOT EXISTS compliance_document_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    organization_type VARCHAR(50), -- e.g., 'local', 'international', 'government'
    is_required BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    allowed_mime_types TEXT, -- JSON array of allowed mime types
    max_file_size INTEGER, -- Maximum file size in bytes
    required_fields TEXT, -- JSON array of required fields in the document
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- Create compliance_document_templates table
CREATE TABLE IF NOT EXISTS compliance_document_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_type_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    template_uri VARCHAR(500),
    template_name VARCHAR(255),
    mime_type VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- Create organization_compliance_documents table (linking table)
CREATE TABLE IF NOT EXISTS organization_compliance_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    document_type_id UUID NOT NULL,
    document_id UUID, -- Reference to the actual document in the documents table
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, submitted, approved, rejected
    submitted_at TIMESTAMP,
    approved_at TIMESTAMP,
    approved_by UUID,
    rejection_reason TEXT,
    due_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_compliance_document_types_org_type ON compliance_document_types(organization_type);
CREATE INDEX IF NOT EXISTS idx_compliance_document_types_active ON compliance_document_types(is_active);
CREATE INDEX IF NOT EXISTS idx_compliance_document_templates_type ON compliance_document_templates(document_type_id);
CREATE INDEX IF NOT EXISTS idx_compliance_document_templates_active ON compliance_document_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_org_compliance_docs_org ON organization_compliance_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_compliance_docs_type ON organization_compliance_documents(document_type_id);
CREATE INDEX IF NOT EXISTS idx_org_compliance_docs_status ON organization_compliance_documents(status);