-- Fix schema issues for linear onboarding flow

-- 1. Add role column default value and update existing users
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'partner_user';
UPDATE users SET role = 'partner_user' WHERE role IS NULL;

-- 2. Check if owner_user_id column exists in organizations table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'organizations' AND column_name = 'owner_user_id') THEN
        ALTER TABLE organizations ADD COLUMN owner_user_id uuid REFERENCES users(id);
    END IF;
END $$;

-- 3. Update existing organizations to have an owner
UPDATE organizations 
SET owner_user_id = (
    SELECT u.id 
    FROM users u 
    WHERE u.organization_id = organizations.id 
    LIMIT 1
)
WHERE owner_user_id IS NULL;

-- 4. Ensure email_verification_tokens table exists
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token varchar(255) NOT NULL UNIQUE,
    expires_at timestamp NOT NULL,
    used_at timestamp,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create index for performance
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);

-- Verification queries
SELECT 'Users with roles:' as info;
SELECT role, COUNT(*) as count FROM users GROUP BY role;

SELECT 'Organizations with owners:' as info;
SELECT 
    CASE WHEN owner_user_id IS NULL THEN 'No Owner' ELSE 'Has Owner' END as owner_status,
    COUNT(*) as count 
FROM organizations 
GROUP BY owner_user_id IS NULL;

SELECT 'Email verification tokens table:' as info;
SELECT COUNT(*) as token_count FROM email_verification_tokens;
