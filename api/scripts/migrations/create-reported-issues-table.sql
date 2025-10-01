-- Create reported_issues table for SSOT
CREATE TABLE IF NOT EXISTS reported_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('bug', 'feature_request', 'question', 'complaint', 'other')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'wont_fix')),
  
  -- Reporter information
  reported_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reporter_email VARCHAR(255),
  reporter_name VARCHAR(255),
  reporter_role VARCHAR(50),
  
  -- Issue details
  page_url TEXT,
  browser_info TEXT,
  screenshot_url TEXT,
  attachments JSONB DEFAULT '[]',
  
  -- Admin response
  assigned_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  admin_notes TEXT,
  resolution_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reported_issues_status ON reported_issues(status);
CREATE INDEX IF NOT EXISTS idx_reported_issues_priority ON reported_issues(priority);
CREATE INDEX IF NOT EXISTS idx_reported_issues_category ON reported_issues(category);
CREATE INDEX IF NOT EXISTS idx_reported_issues_reported_by ON reported_issues(reported_by_user_id);
CREATE INDEX IF NOT EXISTS idx_reported_issues_assigned_to ON reported_issues(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_reported_issues_created_at ON reported_issues(created_at DESC);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_reported_issues_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_reported_issues_updated_at
  BEFORE UPDATE ON reported_issues
  FOR EACH ROW
  EXECUTE FUNCTION update_reported_issues_updated_at();

-- Create comments table for issue discussions
CREATE TABLE IF NOT EXISTS reported_issue_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES reported_issues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reported_issue_comments_issue_id ON reported_issue_comments(issue_id);
CREATE INDEX IF NOT EXISTS idx_reported_issue_comments_user_id ON reported_issue_comments(user_id);

-- Add sample data for testing (optional)
-- INSERT INTO reported_issues (title, description, category, priority, status, reported_by_user_id, reporter_email, reporter_name, reporter_role)
-- SELECT 
--   'Sample Issue',
--   'This is a sample reported issue for testing',
--   'bug',
--   'medium',
--   'open',
--   id,
--   email,
--   COALESCE(first_name || ' ' || last_name, email),
--   role
-- FROM users WHERE role = 'admin' LIMIT 1;
