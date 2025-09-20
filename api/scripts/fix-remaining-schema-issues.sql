-- Fix remaining schema issues for linear onboarding flow

-- 1. Add missing finalized_at column to organizations table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'organizations' AND column_name = 'finalized_at') THEN
        ALTER TABLE organizations ADD COLUMN finalized_at timestamp;
    END IF;
END $$;

-- 2. Update organizations table to allow name to be nullable temporarily for registration
ALTER TABLE organizations ALTER COLUMN name DROP NOT NULL;

-- 3. Add any other missing columns that might be referenced in the code
DO $$
BEGIN
    -- Add approved_at if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'organizations' AND column_name = 'approved_at') THEN
        ALTER TABLE organizations ADD COLUMN approved_at timestamp;
    END IF;
    
    -- Add rejected_at if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'organizations' AND column_name = 'rejected_at') THEN
        ALTER TABLE organizations ADD COLUMN rejected_at timestamp;
    END IF;
    
    -- Add submitted_at if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'organizations' AND column_name = 'submitted_at') THEN
        ALTER TABLE organizations ADD COLUMN submitted_at timestamp;
    END IF;
END $$;

-- 4. Ensure email_verified_at column exists in users table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'email_verified_at') THEN
        ALTER TABLE users ADD COLUMN email_verified_at timestamp;
    END IF;
END $$;

-- Verification queries
SELECT 'Organizations table columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'organizations' 
AND column_name IN ('name', 'finalized_at', 'approved_at', 'rejected_at', 'submitted_at', 'owner_user_id')
ORDER BY column_name;

SELECT 'Users table columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('role', 'email_verified_at')
ORDER BY column_name;
