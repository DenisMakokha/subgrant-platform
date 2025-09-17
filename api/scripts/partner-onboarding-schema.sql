-- Partner Onboarding Database Schema
-- State machine: email_pending → attachments_pending → financials_pending → under_review
-- → changes_requested (loops back to C or B as flagged) → approved → final_info_pending → finalized

-- Core tables
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email_verified_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email verification tokens
CREATE TABLE IF NOT EXISTS email_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Organization status enum
CREATE TYPE organization_status AS ENUM (
    'email_pending',
    'attachments_pending', 
    'financials_pending',
    'under_review',
    'changes_requested',
    'approved',
    'final_info_pending',
    'finalized'
);

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status organization_status DEFAULT 'email_pending',
    finalized_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SECTION A: Final onboarding (locked until status = approved)
CREATE TYPE registration_type AS ENUM ('NGO', 'CBO', 'Trust', 'Company', 'Other');

CREATE TABLE IF NOT EXISTS org_profile_section_a (
    organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
    legal_name VARCHAR(255),
    trading_name VARCHAR(255),
    registration_number VARCHAR(100),
    registration_type registration_type,
    registration_type_other VARCHAR(100),
    date_of_registration DATE,
    country_of_registration VARCHAR(100),
    tax_identification_number VARCHAR(100),
    physical_address TEXT,
    postal_address TEXT,
    website VARCHAR(255),
    primary_contact_person VARCHAR(255),
    primary_contact_title VARCHAR(100),
    primary_contact_email VARCHAR(255),
    primary_contact_phone VARCHAR(50),
    finance_contact_person VARCHAR(255),
    finance_contact_email VARCHAR(255),
    finance_contact_phone VARCHAR(50),
    submitted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SECTION B: Financial assessments
CREATE TABLE IF NOT EXISTS financial_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    current_annual_budget_amount_usd DECIMAL(18,2),
    current_annual_budget_year INTEGER,
    next_year_annual_budget_estimate_amount_usd DECIMAL(18,2),
    next_year_annual_budget_estimate_year INTEGER,
    largest_grant_ever_managed_amount_usd DECIMAL(18,2),
    largest_grant_ever_managed_year INTEGER,
    current_donor_funding_amount_usd DECIMAL(18,2),
    current_donor_funding_year INTEGER,
    other_funds_amount_usd DECIMAL(18,2),
    other_funds_year INTEGER,
    submitted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SECTION C: Document requirements (admin-configurable checklist)
CREATE TYPE document_category AS ENUM (
    'legal',
    'governance', 
    'financial',
    'operational',
    'compliance',
    'additional'
);

CREATE TABLE IF NOT EXISTS document_requirements (
    code VARCHAR(100) PRIMARY KEY,
    category document_category NOT NULL,
    title VARCHAR(255) NOT NULL,
    is_optional BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SECTION C: Organization documents responses
CREATE TYPE document_availability AS ENUM ('yes', 'na');

CREATE TABLE IF NOT EXISTS org_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    requirement_code VARCHAR(100) NOT NULL REFERENCES document_requirements(code),
    available document_availability,
    na_explanation TEXT,
    note TEXT,
    files_json JSONB DEFAULT '[]'::jsonb,
    last_submitted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, requirement_code)
);

-- Admin reviews
CREATE TYPE review_decision AS ENUM ('approve', 'changes', 'reject');

CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    reviewer_user_id UUID NOT NULL REFERENCES users(id),
    decision review_decision NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Review flags for granular feedback
CREATE TYPE flag_scope AS ENUM ('document', 'financial', 'profile');
CREATE TYPE flag_status AS ENUM ('pending', 'addressed');

CREATE TABLE IF NOT EXISTS review_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    scope flag_scope NOT NULL,
    scope_ref VARCHAR(255), -- requirement_code or field key
    comment TEXT,
    status flag_status DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL
);

-- Assessment streams (9 Focus Areas for internal scoring)
CREATE TYPE assessment_stream AS ENUM (
    'governance',
    'financial_management',
    'legal_compliance',
    'operational_planning',
    'risk_management',
    'community_engagement',
    'data_security_privacy',
    'safeguarding',
    'implementing_partners'
);

CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high');

CREATE TABLE IF NOT EXISTS assessment_streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    stream assessment_stream NOT NULL,
    q1_score SMALLINT CHECK (q1_score >= 0 AND q1_score <= 5),
    q1_comment TEXT,
    q2_score SMALLINT CHECK (q2_score >= 0 AND q2_score <= 5),
    q2_comment TEXT,
    q3_score SMALLINT CHECK (q3_score >= 0 AND q3_score <= 5),
    q3_comment TEXT,
    q4_score SMALLINT CHECK (q4_score >= 0 AND q4_score <= 5),
    q4_comment TEXT,
    q5_score SMALLINT CHECK (q5_score >= 0 AND q5_score <= 5),
    q5_comment TEXT,
    q6_score SMALLINT CHECK (q6_score >= 0 AND q6_score <= 5),
    q6_comment TEXT,
    q7_score SMALLINT CHECK (q7_score >= 0 AND q7_score <= 5),
    q7_comment TEXT,
    q8_score SMALLINT CHECK (q8_score >= 0 AND q8_score <= 5),
    q8_comment TEXT,
    q9_score SMALLINT CHECK (q9_score >= 0 AND q9_score <= 5),
    q9_comment TEXT,
    q10_score SMALLINT CHECK (q10_score >= 0 AND q10_score <= 5),
    q10_comment TEXT,
    q11_score SMALLINT CHECK (q11_score >= 0 AND q11_score <= 5),
    q11_comment TEXT,
    q12_score SMALLINT CHECK (q12_score >= 0 AND q12_score <= 5),
    q12_comment TEXT,
    q13_score SMALLINT CHECK (q13_score >= 0 AND q13_score <= 5),
    q13_comment TEXT,
    q14_score SMALLINT CHECK (q14_score >= 0 AND q14_score <= 5),
    q14_comment TEXT,
    overall_risk risk_level,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, stream)
);

-- Organization roles for access control
CREATE TYPE org_role AS ENUM ('owner', 'admin_reviewer', 'viewer');

CREATE TABLE IF NOT EXISTS org_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role org_role NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, user_id)
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    action VARCHAR(100) NOT NULL,
    payload_hash VARCHAR(64),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizations_owner ON organizations(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);
CREATE INDEX IF NOT EXISTS idx_org_documents_org_id ON org_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_documents_requirement ON org_documents(requirement_code);
CREATE INDEX IF NOT EXISTS idx_reviews_org_id ON reviews(organization_id);
CREATE INDEX IF NOT EXISTS idx_review_flags_org_id ON review_flags(organization_id);
CREATE INDEX IF NOT EXISTS idx_assessment_streams_org_id ON assessment_streams(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user ON email_verifications(user_id);

-- Seed document requirements
INSERT INTO document_requirements (code, category, title, is_optional, sort_order) VALUES
-- LEGAL DOCUMENTS
('legal_incorporation_cert', 'legal', 'Certificate of Registration/Incorporation', FALSE, 1),
('constitution_articles', 'legal', 'Constitution/Articles of Association', FALSE, 2),
('tax_registration_cert', 'legal', 'Tax registration certificate', FALSE, 3),
('tax_exemption_cert', 'legal', 'Tax Exemption Certificate', TRUE, 4),
('business_operating_license', 'legal', 'Current Business/Operating License', FALSE, 5),

-- GOVERNANCE
('board_directors_list', 'governance', 'Current Board of Directors List with CVs', FALSE, 6),
('organizational_chart', 'governance', 'Organizational Chart', FALSE, 7),
('board_charter_policy', 'governance', 'Board charter/governance policy', FALSE, 8),

-- FINANCIAL
('audited_financial_statements', 'financial', 'Audited Financial Statements (last 2 years)', FALSE, 9),
('current_year_budget', 'financial', 'Current Year Budget', FALSE, 10),
('financial_policies_manual', 'financial', 'Financial Policies and Procedures Manual', FALSE, 11),

-- OPERATIONAL
('strategic_plan', 'operational', 'Current Strategic Plan', FALSE, 12),
('annual_reports', 'operational', 'Annual Reports (last 2 years)', FALSE, 13),

-- COMPLIANCE
('child_protection_policy', 'compliance', 'Child Protection Policy and Procedures', FALSE, 14),
('anti_corruption_policy', 'compliance', 'Anti-Corruption and Ethics Policy', FALSE, 15),
('code_of_conduct', 'compliance', 'Code of Conduct for Staff', FALSE, 16),
('gender_inclusion_policy', 'compliance', 'Gender and Inclusion Policy', FALSE, 17),
('data_protection_policy', 'compliance', 'Data Protection and Privacy Policy', FALSE, 18),
('hr_policy', 'compliance', 'Human Resource Policy', FALSE, 19),

-- ADDITIONAL
('additional_documents', 'additional', 'Additional Important Documents', TRUE, 20)
ON CONFLICT (code) DO NOTHING;
