-- SSOT Schema Migration Script
-- Ensures all necessary tables and columns exist for SSOT architecture

-- ============================================
-- 1. GRANT REPORTING DATES TABLE (M&E Reports SSOT)
-- ============================================
CREATE TABLE IF NOT EXISTS grant_reporting_dates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grant_id UUID NOT NULL,
    report_type VARCHAR(50) NOT NULL DEFAULT 'monthly',
    due_date TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'due',
    description TEXT,
    content TEXT,
    metrics JSONB,
    submitted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_grant FOREIGN KEY (grant_id) REFERENCES grants(id) ON DELETE CASCADE
);

-- Add missing columns to grant_reporting_dates if they don't exist
ALTER TABLE grant_reporting_dates 
    ADD COLUMN IF NOT EXISTS content TEXT,
    ADD COLUMN IF NOT EXISTS metrics JSONB,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS report_type VARCHAR(50) DEFAULT 'monthly',
    ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_grant_reporting_dates_grant_id ON grant_reporting_dates(grant_id);
CREATE INDEX IF NOT EXISTS idx_grant_reporting_dates_status ON grant_reporting_dates(status);
CREATE INDEX IF NOT EXISTS idx_grant_reporting_dates_due_date ON grant_reporting_dates(due_date);
CREATE INDEX IF NOT EXISTS idx_grant_reporting_dates_report_type ON grant_reporting_dates(report_type);

-- ============================================
-- 2. DISBURSEMENTS TABLE (Disbursements SSOT)
-- ============================================
CREATE TABLE IF NOT EXISTS disbursements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_budget_id UUID NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
    scheduled_date TIMESTAMP NULL,
    planned_date TIMESTAMP NULL,
    paid_at TIMESTAMP NULL,
    invoice_id VARCHAR(255),
    description TEXT,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_partner_budget FOREIGN KEY (partner_budget_id) REFERENCES partner_budgets(id) ON DELETE CASCADE
);

-- Add missing columns to disbursements if they don't exist
ALTER TABLE disbursements 
    ADD COLUMN IF NOT EXISTS partner_budget_id UUID,
    ADD COLUMN IF NOT EXISTS scheduled_date TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS planned_date TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS invoice_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS created_by UUID,
    ADD COLUMN IF NOT EXISTS updated_by UUID;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_disbursements_partner_budget_id ON disbursements(partner_budget_id);
CREATE INDEX IF NOT EXISTS idx_disbursements_status ON disbursements(status);
CREATE INDEX IF NOT EXISTS idx_disbursements_scheduled_date ON disbursements(scheduled_date);

-- ============================================
-- 3. CONTRACTS SSOT TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS contracts_ssot (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_budget_id UUID NOT NULL,
    contract_number VARCHAR(100) UNIQUE,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    value DECIMAL(18,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    template_id UUID,
    generated_document_path VARCHAR(500),
    docusign_envelope_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_partner_budget_contract FOREIGN KEY (partner_budget_id) REFERENCES partner_budgets(id) ON DELETE CASCADE
);

-- Add missing columns to contracts_ssot if they don't exist
ALTER TABLE contracts_ssot 
    ADD COLUMN IF NOT EXISTS start_date TIMESTAMP,
    ADD COLUMN IF NOT EXISTS end_date TIMESTAMP,
    ADD COLUMN IF NOT EXISTS value DECIMAL(18,2),
    ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD',
    ADD COLUMN IF NOT EXISTS docusign_envelope_id VARCHAR(255);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_contracts_ssot_partner_budget_id ON contracts_ssot(partner_budget_id);
CREATE INDEX IF NOT EXISTS idx_contracts_ssot_contract_number ON contracts_ssot(contract_number);
CREATE INDEX IF NOT EXISTS idx_contracts_ssot_end_date ON contracts_ssot(end_date);

-- ============================================
-- 4. CONTRACTS TABLE (State Machine)
-- ============================================
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY,
    partner_id UUID NOT NULL,
    state VARCHAR(50) NOT NULL DEFAULT 'PENDING_SIGNATURE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_contracts_ssot FOREIGN KEY (id) REFERENCES contracts_ssot(id) ON DELETE CASCADE,
    CONSTRAINT fk_partner FOREIGN KEY (partner_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Add missing columns to contracts if they don't exist
ALTER TABLE contracts 
    ADD COLUMN IF NOT EXISTS partner_id UUID,
    ADD COLUMN IF NOT EXISTS state VARCHAR(50) DEFAULT 'PENDING_SIGNATURE';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_contracts_partner_id ON contracts(partner_id);
CREATE INDEX IF NOT EXISTS idx_contracts_state ON contracts(state);

-- ============================================
-- 5. NOTIFICATIONS TABLE (Messages SSOT)
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    user_id UUID,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    priority VARCHAR(20) DEFAULT 'normal',
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Add missing columns to notifications if they don't exist
ALTER TABLE notifications 
    ADD COLUMN IF NOT EXISTS organization_id UUID,
    ADD COLUMN IF NOT EXISTS user_id UUID,
    ADD COLUMN IF NOT EXISTS title VARCHAR(255),
    ADD COLUMN IF NOT EXISTS message TEXT,
    ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'info',
    ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal',
    ADD COLUMN IF NOT EXISTS read_at TIMESTAMP NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_organization_id ON notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);

-- ============================================
-- 6. PARTNER BUDGETS TABLE (Budget SSOT)
-- ============================================
-- Ensure partner_budgets table has all necessary columns
ALTER TABLE partner_budgets 
    ADD COLUMN IF NOT EXISTS partner_id UUID,
    ADD COLUMN IF NOT EXISTS project_id UUID,
    ADD COLUMN IF NOT EXISTS ceiling_total DECIMAL(18,2),
    ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'DRAFT',
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create indexes for partner_budgets
CREATE INDEX IF NOT EXISTS idx_partner_budgets_partner_id ON partner_budgets(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_budgets_project_id ON partner_budgets(project_id);
CREATE INDEX IF NOT EXISTS idx_partner_budgets_status ON partner_budgets(status);

-- ============================================
-- 7. GRANTS TABLE
-- ============================================
-- Ensure grants table exists and has necessary columns
CREATE TABLE IF NOT EXISTS grants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    project_id UUID NOT NULL,
    description TEXT,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    total_amount DECIMAL(18,2),
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Add missing columns to grants if they don't exist
ALTER TABLE grants 
    ADD COLUMN IF NOT EXISTS project_id UUID,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS start_date TIMESTAMP,
    ADD COLUMN IF NOT EXISTS end_date TIMESTAMP,
    ADD COLUMN IF NOT EXISTS total_amount DECIMAL(18,2),
    ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'USD',
    ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

-- Create indexes for grants
CREATE INDEX IF NOT EXISTS idx_grants_project_id ON grants(project_id);
CREATE INDEX IF NOT EXISTS idx_grants_status ON grants(status);

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE 'SSOT Schema migration completed successfully!';
    RAISE NOTICE 'All necessary tables and columns have been created/verified.';
END $$;
