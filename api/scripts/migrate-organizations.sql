-- Migration script to add new columns to organizations table
-- This script adds the missing fields for contract generation

-- Add Primary Contact Information columns
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS primary_contact_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS primary_contact_title VARCHAR(255),
ADD COLUMN IF NOT EXISTS primary_contact_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS primary_contact_email VARCHAR(255);

-- Add Enhanced Address Information columns
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS state_province VARCHAR(100),
ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);

-- Add Banking Information columns
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS bank_branch VARCHAR(255),
ADD COLUMN IF NOT EXISTS account_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS account_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS swift_code VARCHAR(20);

-- Add Authorized Signatory columns
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS signatory_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS signatory_title VARCHAR(255),
ADD COLUMN IF NOT EXISTS signatory_email VARCHAR(255);

-- Add Legal Structure columns
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS legal_structure VARCHAR(100),
ADD COLUMN IF NOT EXISTS incorporation_country VARCHAR(100),
ADD COLUMN IF NOT EXISTS incorporation_date DATE;

-- Create indexes for new fields that might be queried
CREATE INDEX IF NOT EXISTS idx_organizations_primary_contact_email ON organizations(primary_contact_email);
CREATE INDEX IF NOT EXISTS idx_organizations_signatory_email ON organizations(signatory_email);
CREATE INDEX IF NOT EXISTS idx_organizations_legal_structure ON organizations(legal_structure);
CREATE INDEX IF NOT EXISTS idx_organizations_incorporation_country ON organizations(incorporation_country);

-- Add comments for documentation
COMMENT ON COLUMN organizations.primary_contact_name IS 'Primary contact person name for communications';
COMMENT ON COLUMN organizations.primary_contact_title IS 'Primary contact person title/position';
COMMENT ON COLUMN organizations.primary_contact_phone IS 'Primary contact person phone number';
COMMENT ON COLUMN organizations.primary_contact_email IS 'Primary contact person email address';
COMMENT ON COLUMN organizations.city IS 'City from organization address';
COMMENT ON COLUMN organizations.state_province IS 'State or province from organization address';
COMMENT ON COLUMN organizations.postal_code IS 'Postal/ZIP code from organization address';
COMMENT ON COLUMN organizations.bank_name IS 'Bank name for disbursements';
COMMENT ON COLUMN organizations.bank_branch IS 'Bank branch for disbursements';
COMMENT ON COLUMN organizations.account_name IS 'Bank account name for disbursements';
COMMENT ON COLUMN organizations.account_number IS 'Bank account number for disbursements';
COMMENT ON COLUMN organizations.swift_code IS 'SWIFT/BIC code for international transfers';
COMMENT ON COLUMN organizations.signatory_name IS 'Authorized signatory name for contracts';
COMMENT ON COLUMN organizations.signatory_title IS 'Authorized signatory title for contracts';
COMMENT ON COLUMN organizations.signatory_email IS 'Authorized signatory email for DocuSign';
COMMENT ON COLUMN organizations.legal_structure IS 'Legal structure type (NGO, Foundation, Company, etc.)';
COMMENT ON COLUMN organizations.incorporation_country IS 'Country of incorporation';
COMMENT ON COLUMN organizations.incorporation_date IS 'Date of incorporation';
