-- Migration script to add expiration_date field to organization_compliance_documents table

-- Add expiration_date column
ALTER TABLE organization_compliance_documents 
ADD COLUMN IF NOT EXISTS expiration_date DATE;

-- Create index on expiration_date for better query performance
CREATE INDEX IF NOT EXISTS idx_org_compliance_docs_expiration_date 
ON organization_compliance_documents(expiration_date);