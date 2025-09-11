-- Forum Module Database Schema
-- Based on the Forum Module Functional & Technical Specification v1

-- Create forum_categories table
CREATE TABLE IF NOT EXISTS forum_categories (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES forum_categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    visibility VARCHAR(50) DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'partner')),
    description TEXT,
    order_index INTEGER DEFAULT 0,
    acl_json JSONB DEFAULT '{}',
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create forum_tags table
CREATE TABLE IF NOT EXISTS forum_tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6B7280',
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create forum_topics table
CREATE TABLE IF NOT EXISTS forum_topics (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES forum_categories(id) ON DELETE CASCADE,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) DEFAULT 'discussion' CHECK (type IN ('discussion', 'question', 'announcement', 'poll')),
    title VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    is_locked BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_answered BOOLEAN DEFAULT FALSE,
    views INTEGER DEFAULT 0,
    votes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create forum_topic_tags junction table
CREATE TABLE IF NOT EXISTS forum_topic_tags (
    topic_id INTEGER NOT NULL REFERENCES forum_topics(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES forum_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (topic_id, tag_id)
);

-- Create forum_posts table
CREATE TABLE IF NOT EXISTS forum_posts (
    id SERIAL PRIMARY KEY,
    topic_id INTEGER NOT NULL REFERENCES forum_topics(id) ON DELETE CASCADE,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES forum_posts(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    is_answer BOOLEAN DEFAULT FALSE,
    votes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create forum_attachments table
CREATE TABLE IF NOT EXISTS forum_attachments (
    id SERIAL PRIMARY KEY,
    owner_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id INTEGER REFERENCES forum_topics(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES forum_posts(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    storage_path TEXT NOT NULL,
    storage_key VARCHAR(500) NOT NULL,
    virus_status VARCHAR(20) DEFAULT 'pending' CHECK (virus_status IN ('pending', 'clean', 'infected', 'quarantined')),
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create forum_votes table
CREATE TABLE IF NOT EXISTS forum_votes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('topic', 'post')),
    target_id INTEGER NOT NULL,
    value INTEGER NOT NULL CHECK (value IN (-1, 1)),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, target_type, target_id)
);

-- Create forum_subscriptions table
CREATE TABLE IF NOT EXISTS forum_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('category', 'topic', 'tag')),
    target_id INTEGER NOT NULL,
    level VARCHAR(20) DEFAULT 'watch' CHECK (level IN ('watch', 'mute', 'digest')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, target_type, target_id)
);

-- Create forum_reports table
CREATE TABLE IF NOT EXISTS forum_reports (
    id SERIAL PRIMARY KEY,
    reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('topic', 'post', 'user')),
    target_id INTEGER NOT NULL,
    reason VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
    moderator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    moderator_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create forum_notifications table
CREATE TABLE IF NOT EXISTS forum_notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    payload_json JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_forum_categories_parent_id ON forum_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_forum_categories_visibility ON forum_categories(visibility);
CREATE INDEX IF NOT EXISTS idx_forum_categories_deleted_at ON forum_categories(deleted_at);

CREATE INDEX IF NOT EXISTS idx_forum_tags_name ON forum_tags(name);
CREATE INDEX IF NOT EXISTS idx_forum_tags_slug ON forum_tags(slug);
CREATE INDEX IF NOT EXISTS idx_forum_tags_deleted_at ON forum_tags(deleted_at);

CREATE INDEX IF NOT EXISTS idx_forum_topics_category_id ON forum_topics(category_id);
CREATE INDEX IF NOT EXISTS idx_forum_topics_author_id ON forum_topics(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_topics_type ON forum_topics(type);
CREATE INDEX IF NOT EXISTS idx_forum_topics_created_at ON forum_topics(created_at);
CREATE INDEX IF NOT EXISTS idx_forum_topics_is_pinned ON forum_topics(is_pinned);
CREATE INDEX IF NOT EXISTS idx_forum_topics_deleted_at ON forum_topics(deleted_at);
CREATE INDEX IF NOT EXISTS idx_forum_topics_fulltext ON forum_topics USING gin(to_tsvector('english', title || ' ' || body));

CREATE INDEX IF NOT EXISTS idx_forum_posts_topic_id ON forum_posts(topic_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_author_id ON forum_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_parent_id ON forum_posts(parent_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_is_answer ON forum_posts(is_answer);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at ON forum_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_forum_posts_deleted_at ON forum_posts(deleted_at);
CREATE INDEX IF NOT EXISTS idx_forum_posts_fulltext ON forum_posts USING gin(to_tsvector('english', body));

CREATE INDEX IF NOT EXISTS idx_forum_attachments_owner_user_id ON forum_attachments(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_forum_attachments_topic_id ON forum_attachments(topic_id);
CREATE INDEX IF NOT EXISTS idx_forum_attachments_post_id ON forum_attachments(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_attachments_virus_status ON forum_attachments(virus_status);
CREATE INDEX IF NOT EXISTS idx_forum_attachments_mime_type ON forum_attachments(mime_type);
CREATE INDEX IF NOT EXISTS idx_forum_attachments_deleted_at ON forum_attachments(deleted_at);

CREATE INDEX IF NOT EXISTS idx_forum_votes_user_target ON forum_votes(user_id, target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_forum_votes_target ON forum_votes(target_type, target_id);

CREATE INDEX IF NOT EXISTS idx_forum_subscriptions_user_id ON forum_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_subscriptions_target ON forum_subscriptions(target_type, target_id);

CREATE INDEX IF NOT EXISTS idx_forum_reports_status ON forum_reports(status);
CREATE INDEX IF NOT EXISTS idx_forum_reports_target ON forum_reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_forum_reports_reporter_id ON forum_reports(reporter_id);

CREATE INDEX IF NOT EXISTS idx_forum_notifications_user_id ON forum_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_notifications_is_read ON forum_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_forum_notifications_created_at ON forum_notifications(created_at);

-- Create triggers for updating updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_forum_categories_updated_at BEFORE UPDATE ON forum_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_forum_tags_updated_at BEFORE UPDATE ON forum_tags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_forum_topics_updated_at BEFORE UPDATE ON forum_topics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_forum_posts_updated_at BEFORE UPDATE ON forum_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_forum_attachments_updated_at BEFORE UPDATE ON forum_attachments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO forum_categories (name, slug, visibility, description, order_index, created_by) VALUES
('General Discussion', 'general', 'public', 'General discussions about grants management', 1, 1),
('Grant Management', 'grants', 'public', 'Grant applications, budgeting, and financial management', 2, 1),
('Partner & Contract Management', 'partners-contracts', 'public', 'Partner onboarding, contracts, and compliance topics', 3, 1),
('Monitoring & Reporting', 'monitoring-reporting', 'public', 'M&E reports, KPI tracking, and progress monitoring', 4, 1),
('Technical Support', 'support', 'public', 'Get help with platform technical issues', 5, 1),
('Announcements', 'announcements', 'public', 'Official announcements and platform updates', 6, 1)

-- Insert default tags
INSERT INTO forum_tags (name, slug, description, color, created_by) VALUES
('grants', 'grants', 'Topics related to grant management', '#3B82F6', 1),
('applications', 'applications', 'Grant application processes', '#10B981', 1),
('budgeting', 'budgeting', 'Budget planning and management', '#F59E0B', 1),
('reporting', 'reporting', 'Financial and progress reporting', '#8B5CF6', 1),
('compliance', 'compliance', 'Regulatory and policy compliance', '#EF4444', 1),
('partnerships', 'partnerships', 'Partner management and onboarding', '#06B6D4', 1),
('contracts', 'contracts', 'Contract management and signing', '#84CC16', 1),
('disbursements', 'disbursements', 'Fund disbursement processes', '#F97316', 1),
('monitoring', 'monitoring', 'Project monitoring and evaluation', '#A855F7', 1),
('kpi', 'kpi', 'Key Performance Indicators', '#22C55E', 1),
('training', 'training', 'Training and capacity building', '#6366F1', 1),
('documentation', 'documentation', 'Documentation and guides', '#8B5A2B', 1),
('best-practices', 'best-practices', 'Best practices and lessons learned', '#059669', 1),
('technical-support', 'technical-support', 'Platform technical issues', '#DC2626', 1),
('platform-updates', 'platform-updates', 'Platform updates and announcements', '#9B56A2', 1),
('sub-grants', 'sub-grants', 'Sub-grant management', '#52944E', 1)
ON CONFLICT (slug) DO NOTHING;

COMMENT ON TABLE forum_categories IS 'Forum categories for organizing topics';
COMMENT ON TABLE forum_tags IS 'Tags for cross-cutting topic classification';
COMMENT ON TABLE forum_topics IS 'Forum topics/threads';
COMMENT ON TABLE forum_posts IS 'Replies and comments on forum topics';
COMMENT ON TABLE forum_attachments IS 'File attachments for topics and posts';
COMMENT ON TABLE forum_votes IS 'User votes on topics and posts';
COMMENT ON TABLE forum_subscriptions IS 'User subscriptions to categories, topics, and tags';
COMMENT ON TABLE forum_reports IS 'Content moderation reports';
COMMENT ON TABLE forum_notifications IS 'Forum-related notifications for users';
