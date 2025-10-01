-- Migration: Add is_active column to users table
-- Date: 2025-10-01
-- Purpose: Support user activation/deactivation in admin dashboard

-- Add is_active column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN is_active BOOLEAN DEFAULT true NOT NULL;
        
        RAISE NOTICE 'Added is_active column to users table';
    ELSE
        RAISE NOTICE 'is_active column already exists in users table';
    END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Update any NULL values to true (active by default)
UPDATE users SET is_active = true WHERE is_active IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN users.is_active IS 'Indicates whether the user account is active and can log in';

-- Verify the column was added
SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users' 
AND column_name = 'is_active';
