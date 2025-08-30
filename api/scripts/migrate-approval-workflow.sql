-- Migration script to enhance compliance document approval workflow
-- Add new fields to organization_compliance_documents table

-- Add review_status column
ALTER TABLE organization_compliance_documents 
ADD COLUMN IF NOT EXISTS review_status VARCHAR(50) DEFAULT 'not_reviewed';

-- Add review_comments column
ALTER TABLE organization_compliance_documents 
ADD COLUMN IF NOT EXISTS review_comments TEXT;

-- Add reviewed_at column
ALTER TABLE organization_compliance_documents 
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;

-- Add reviewed_by column
ALTER TABLE organization_compliance_documents 
ADD COLUMN IF NOT EXISTS reviewed_by UUID;

-- Add foreign key constraint for reviewed_by referencing users table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_organization_compliance_documents_reviewed_by'
    ) THEN
        ALTER TABLE organization_compliance_documents 
        ADD CONSTRAINT fk_organization_compliance_documents_reviewed_by 
        FOREIGN KEY (reviewed_by) REFERENCES users(id);
    END IF;
END $$;

-- Create index on review_status for better query performance
CREATE INDEX IF NOT EXISTS idx_org_compliance_docs_review_status 
ON organization_compliance_documents(review_status);

-- Create index on reviewed_by for better query performance
CREATE INDEX IF NOT EXISTS idx_org_compliance_docs_reviewed_by 
ON organization_compliance_documents(reviewed_by);

-- Update existing records to have a default review_status
UPDATE organization_compliance_documents 
SET review_status = 'not_reviewed' 
WHERE review_status IS NULL;