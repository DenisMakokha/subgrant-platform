// Database initialization script for Sub-Grant Management Platform
// This script creates the necessary tables for the application

const { Client } = require('pg');

// Database connection configuration
const client = new Client({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'subgrant_platform',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

// SQL to create organizations table
const createOrganizationsTable = `
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);
CREATE INDEX IF NOT EXISTS idx_organizations_compliance ON organizations(compliance_status);
`;

// SQL to create users table
const createUsersTable = `
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
CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
`;

// SQL to create projects table
const createProjectsTable = `
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
    created_by UUID NOT NULL,
    updated_by UUID
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_dates ON projects(open_date, close_date);
`;

// SQL to create budget_categories table
const createBudgetCategoriesTable = `
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_budget_categories_project ON budget_categories(project_id);
CREATE INDEX IF NOT EXISTS idx_budget_categories_active ON budget_categories(is_active);
`;

// SQL to create budgets table
const createBudgetsTable = `
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_budgets_organization ON budgets(organization_id);
CREATE INDEX IF NOT EXISTS idx_budgets_project ON budgets(project_id);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON budgets(status);
`;

// SQL to create budget_lines table
const createBudgetLinesTable = `
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_budget_lines_budget ON budget_lines(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_lines_category ON budget_lines(category_id);
`;

// SQL to create contracts table
const createContractsTable = `
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contracts_budget ON contracts(budget_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_envelope ON contracts(envelope_id);
`;

// SQL to create contract_artifacts table
const createContractArtifactsTable = `
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
CREATE INDEX IF NOT EXISTS idx_contract_artifacts_contract ON contract_artifacts(contract_id);
`;

// SQL to create disbursements table
const createDisbursementsTable = `
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
`;

// SQL to create me_reports table
const createMeReportsTable = `
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
`;

// SQL to create financial_reports table
const createFinancialReportsTable = `
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
`;

// SQL to create receipts table
const createReceiptsTable = `
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
`;

// SQL to create documents table
const createDocumentsTable = `
CREATE TABLE IF NOT EXISTS documents (
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
    uploaded_by UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
`;

// SQL to create notifications table
const createNotificationsTable = `
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal',
    audience_type VARCHAR(50) NOT NULL,
    audience_id UUID,
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    scheduled_at TIMESTAMP,
    sent_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_audience ON notifications(audience_type, audience_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_at);
`;

// SQL to create notification_deliveries table
const createNotificationDeliveriesTable = `
CREATE TABLE IF NOT EXISTS notification_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL,
    user_id UUID NOT NULL,
    channel VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    delivered_at TIMESTAMP,
    failure_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_notification ON notification_deliveries(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_user ON notification_deliveries(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_status ON notification_deliveries(status);
`;

// SQL to create audit_logs table
const createAuditLogsTable = `
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
`;

// SQL to create review_comments table
const createReviewCommentsTable = `
CREATE TABLE IF NOT EXISTS review_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    parent_id UUID,
    author_id UUID NOT NULL,
    content TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,
    resolved_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_review_comments_entity ON review_comments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_review_comments_author ON review_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_review_comments_parent ON review_comments(parent_id);
`;

// Function to execute a query
async function executeQuery(query, description) {
  try {
    await client.query(query);
    console.log(`✓ ${description}`);
  } catch (err) {
    console.error(`✗ Error creating ${description}:`, err);
    throw err;
  }
}

// Main function to initialize the database
async function initializeDatabase() {
  try {
    // Connect to the database
    await client.connect();
    console.log('Connected to the database');

    // Create tables
    await executeQuery(createOrganizationsTable, 'organizations table');
    await executeQuery(createUsersTable, 'users table');
    await executeQuery(createProjectsTable, 'projects table');
    await executeQuery(createBudgetCategoriesTable, 'budget_categories table');
    await executeQuery(createBudgetsTable, 'budgets table');
    await executeQuery(createBudgetLinesTable, 'budget_lines table');
    await executeQuery(createContractsTable, 'contracts table');
    await executeQuery(createContractArtifactsTable, 'contract_artifacts table');
    await executeQuery(createDisbursementsTable, 'disbursements table');
    await executeQuery(createMeReportsTable, 'me_reports table');
    await executeQuery(createFinancialReportsTable, 'financial_reports table');
    await executeQuery(createReceiptsTable, 'receipts table');
    await executeQuery(createDocumentsTable, 'documents table');
    await executeQuery(createNotificationsTable, 'notifications table');
    await executeQuery(createNotificationDeliveriesTable, 'notification_deliveries table');
    await executeQuery(createAuditLogsTable, 'audit_logs table');
    await executeQuery(createReviewCommentsTable, 'review_comments table');

    console.log('Database initialization completed successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    await client.end();
  }
}

// Run the initialization
initializeDatabase();