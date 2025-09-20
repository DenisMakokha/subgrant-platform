-- Migration script to update organization status enum for linear onboarding flow
-- From: email_pending → attachments_pending → financials_pending → under_review → changes_requested → approved → final_info_pending → finalized
-- To: email_pending → a_pending → b_pending → c_pending → under_review → changes_requested → finalized

-- Step 1: Add new enum values
ALTER TYPE organization_status ADD VALUE IF NOT EXISTS 'a_pending';
ALTER TYPE organization_status ADD VALUE IF NOT EXISTS 'b_pending';
ALTER TYPE organization_status ADD VALUE IF NOT EXISTS 'c_pending';

-- Step 2: Update existing organizations to new status values
-- Map old statuses to new linear flow
UPDATE organizations SET status = 'a_pending' WHERE status = 'final_info_pending';
UPDATE organizations SET status = 'b_pending' WHERE status = 'financials_pending';
UPDATE organizations SET status = 'c_pending' WHERE status = 'attachments_pending';
UPDATE organizations SET status = 'finalized' WHERE status = 'approved';

-- Step 3: Create a new enum type with only the values we want
CREATE TYPE organization_status_new AS ENUM (
    'email_pending',
    'a_pending',
    'b_pending', 
    'c_pending',
    'under_review',
    'changes_requested',
    'finalized'
);

-- Step 4: Update the organizations table to use the new enum
ALTER TABLE organizations 
ALTER COLUMN status TYPE organization_status_new 
USING status::text::organization_status_new;

-- Step 5: Drop the old enum and rename the new one
DROP TYPE organization_status;
ALTER TYPE organization_status_new RENAME TO organization_status;

-- Step 6: Update default value
ALTER TABLE organizations ALTER COLUMN status SET DEFAULT 'email_pending';

-- Step 7: Add any missing indexes
CREATE INDEX IF NOT EXISTS idx_organizations_status_updated ON organizations(status, updated_at);

-- Step 8: Update any existing review flags to use the new scope references
-- Update scope_ref values for document flags to match new flow
UPDATE review_flags 
SET scope_ref = CASE 
    WHEN scope = 'profile' THEN 'section-a'
    WHEN scope = 'financial' THEN 'section-b'
    WHEN scope = 'document' THEN 'section-c'
    ELSE scope_ref
END
WHERE scope_ref IS NULL OR scope_ref IN ('final_info', 'financials', 'attachments');

-- Verification query to check the migration
SELECT 
    status, 
    COUNT(*) as count,
    MIN(created_at) as earliest,
    MAX(created_at) as latest
FROM organizations 
GROUP BY status 
ORDER BY 
    CASE status
        WHEN 'email_pending' THEN 1
        WHEN 'a_pending' THEN 2
        WHEN 'b_pending' THEN 3
        WHEN 'c_pending' THEN 4
        WHEN 'under_review' THEN 5
        WHEN 'changes_requested' THEN 6
        WHEN 'finalized' THEN 7
        ELSE 8
    END;
