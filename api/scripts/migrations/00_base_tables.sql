-- Base Tables Migration for Admin Dashboard
-- This script creates all necessary tables for the admin dashboard functionality

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'user',
    organization_id INTEGER,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    registration_number VARCHAR(100),
    tax_id VARCHAR(100),
    legal_structure VARCHAR(100),
    year_established INTEGER,
    email VARCHAR(255),
    phone VARCHAR(50),
    website VARCHAR(255),
    primary_contact_name VARCHAR(255),
    primary_contact_title VARCHAR(100),
    primary_contact_email VARCHAR(255),
    primary_contact_phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state_province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    bank_name VARCHAR(255),
    bank_branch VARCHAR(255),
    account_name VARCHAR(255),
    account_number VARCHAR(100),
    swift_code VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 0
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    organization_id INTEGER REFERENCES organizations(id),
    status VARCHAR(50) DEFAULT 'active',
    budget_amount DECIMAL(15,2),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Approvals table
CREATE TABLE IF NOT EXISTS approvals (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(100) NOT NULL, -- 'project', 'budget', 'contract', etc.
    entity_id INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    requested_by INTEGER REFERENCES users(id),
    reviewed_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    comments TEXT
);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL, -- 'created', 'updated', 'deleted', 'approved', etc.
    entity_type VARCHAR(100) NOT NULL, -- 'user', 'organization', 'project', etc.
    entity_id INTEGER,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Financial assessments table (for Section B data)
CREATE TABLE IF NOT EXISTS financial_assessments (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id) UNIQUE,
    current_annual_budget_amount_usd DECIMAL(15,2),
    current_annual_budget_year INTEGER,
    next_year_annual_budget_estimate_amount_usd DECIMAL(15,2),
    next_year_annual_budget_estimate_year INTEGER,
    largest_grant_ever_managed_amount_usd DECIMAL(15,2),
    largest_grant_ever_managed_year INTEGER,
    current_donor_funding_amount_usd DECIMAL(15,2),
    current_donor_funding_year INTEGER,
    other_funds_amount_usd DECIMAL(15,2),
    other_funds_year INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);

CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);
CREATE INDEX IF NOT EXISTS idx_approvals_entity ON approvals(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_approvals_updated_at BEFORE UPDATE ON approvals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_financial_assessments_updated_at BEFORE UPDATE ON financial_assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing
INSERT INTO users (email, first_name, last_name, role, is_active) VALUES
('admin@example.com', 'System', 'Administrator', 'admin', true),
('user1@example.com', 'John', 'Doe', 'user', true),
('user2@example.com', 'Jane', 'Smith', 'user', true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO organizations (name, legal_name, status) VALUES
('Test Organization 1', 'Test Legal Name 1', 'active'),
('Test Organization 2', 'Test Legal Name 2', 'active')
ON CONFLICT DO NOTHING;

INSERT INTO projects (name, organization_id, status) VALUES
('Test Project 1', 1, 'active'),
('Test Project 2', 1, 'active'),
('Test Project 3', 2, 'active')
ON CONFLICT DO NOTHING;

INSERT INTO approvals (entity_type, entity_id, status, requested_by) VALUES
('project', 1, 'pending', 1),
('project', 2, 'approved', 1),
('budget', 1, 'pending', 2)
ON CONFLICT DO NOTHING;

-- Insert sample audit logs
INSERT INTO audit_log (user_id, action, entity_type, entity_id, metadata)
SELECT
    id,
    'created',
    'user',
    id,
    jsonb_build_object('email', email, 'role', role)
FROM users
ON CONFLICT DO NOTHING;

-- Insert sample financial assessment data
INSERT INTO financial_assessments (organization_id, current_annual_budget_amount_usd, current_annual_budget_year)
VALUES (1, 100000.00, 2025), (2, 150000.00, 2025)
ON CONFLICT (organization_id) DO NOTHING;
