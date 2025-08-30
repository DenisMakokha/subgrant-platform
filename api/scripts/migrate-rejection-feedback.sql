-- Migration script to add detailed rejection feedback fields to organization_compliance_documents table

-- Add rejection_category column
ALTER TABLE organization_compliance_documents 
ADD COLUMN IF NOT EXISTS rejection_category VARCHAR(100);

-- Add rejection_details column
ALTER TABLE organization_compliance_documents 
ADD COLUMN IF NOT EXISTS rejection_details TEXT;

-- Add required_actions column
ALTER TABLE organization_compliance_documents 
ADD COLUMN IF NOT EXISTS required_actions TEXT;

-- Create index on rejection_category for better query performance
CREATE INDEX IF NOT EXISTS idx_org_compliance_docs_rejection_category 
ON organization_compliance_documents(rejection_category);