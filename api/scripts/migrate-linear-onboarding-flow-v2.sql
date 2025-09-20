-- Migration script to update organization status for linear onboarding flow
-- Current: status is character varying with values like 'active', 'pending'
-- Target: linear flow with email_pending → a_pending → b_pending → c_pending → under_review → changes_requested → finalized

-- Step 1: Create the organization_status enum type
CREATE TYPE organization_status AS ENUM (
    'email_pending',
    'a_pending',
    'b_pending', 
    'c_pending',
    'under_review',
    'changes_requested',
    'finalized'
);

-- Step 2: Add a new column with the enum type
ALTER TABLE organizations ADD COLUMN new_status organization_status;

-- Step 3: Map existing status values to new linear flow statuses
-- Map 'active' to 'finalized' (assuming active organizations are completed)
-- Map 'pending' to 'email_pending' (assuming pending means waiting for email verification)
-- Map any other values to 'email_pending' as default
UPDATE organizations SET new_status = 
    CASE 
        WHEN status = 'active' THEN 'finalized'::organization_status
        WHEN status = 'pending' THEN 'email_pending'::organization_status
        WHEN status = 'approved' THEN 'finalized'::organization_status
        WHEN status = 'under_review' THEN 'under_review'::organization_status
        WHEN status = 'changes_requested' THEN 'changes_requested'::organization_status
        ELSE 'email_pending'::organization_status
    END;

-- Step 4: Drop the old status column and rename the new one
ALTER TABLE organizations DROP COLUMN status;
ALTER TABLE organizations RENAME COLUMN new_status TO status;

-- Step 5: Set NOT NULL constraint and default value
ALTER TABLE organizations ALTER COLUMN status SET NOT NULL;
ALTER TABLE organizations ALTER COLUMN status SET DEFAULT 'email_pending';

-- Step 6: Create index for performance
CREATE INDEX IF NOT EXISTS idx_organizations_status_linear ON organizations(status);

-- Step 7: Verification query
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
