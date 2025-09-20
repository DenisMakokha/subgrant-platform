-- Fix financial_assessments table to add missing unique constraint
-- This is needed for ON CONFLICT (organization_id) to work

-- First, remove any duplicate records (keep the most recent one)
DELETE FROM financial_assessments 
WHERE id NOT IN (
    SELECT DISTINCT ON (organization_id) id
    FROM financial_assessments 
    ORDER BY organization_id, updated_at DESC
);

-- Add the unique constraint
ALTER TABLE financial_assessments 
ADD CONSTRAINT unique_financial_assessment_org_id UNIQUE (organization_id);

-- Verify the constraint was added
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'financial_assessments' 
    AND tc.constraint_type = 'UNIQUE';
