-- ============================================================================
-- Email SSOT Seed Data - Phase B
-- ============================================================================

BEGIN;

-- Insert default email templates
INSERT INTO email_templates (id, tenant_id, name, key, subject_tpl, body_html_tpl, body_text_tpl, version, active, created_at, updated_at) VALUES
-- Welcome email template
('10000000-0000-0000-0000-000000000001', NULL, 'Welcome Email', 'welcome', 
 'Welcome to {{organization_name}}', 
 '<h1>Welcome {{user_name}}!</h1><p>Thank you for joining {{organization_name}}.</p>', 
 'Welcome {{user_name}}! Thank you for joining {{organization_name}}.', 
 1, true, NOW(), NOW()),

-- Password reset template
('10000000-0000-0000-0000-000000000002', NULL, 'Password Reset', 'password_reset', 
 'Password Reset Request for {{organization_name}}', 
 '<h1>Password Reset</h1><p>Click <a href="{{reset_link}}">here</a> to reset your password.</p>', 
 'Password Reset: Click {{reset_link}} to reset your password.', 
 1, true, NOW(), NOW()),

-- Notification template
('10000000-0000-0000-0000-000000000003', NULL, 'Notification', 'notification', 
 '{{title}}', 
 '<h1>{{title}}</h1><p>{{message}}</p>', 
 '{{title}}: {{message}}', 
 1, true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  name = EXCLUDED.name,
  key = EXCLUDED.key,
  subject_tpl = EXCLUDED.subject_tpl,
  body_html_tpl = EXCLUDED.body_html_tpl,
  body_text_tpl = EXCLUDED.body_text_tpl,
  version = EXCLUDED.version,
  active = EXCLUDED.active,
  updated_at = EXCLUDED.updated_at;

-- Insert default email senders
INSERT INTO email_senders (id, tenant_id, name, email, display_name, verified, active, created_at, updated_at) VALUES
-- Default system sender
('20000000-0000-0000-0000-000000000001', NULL, 'System Sender', 'noreply@subgrantplatform.com', 'Sub-Grant Platform', true, true, NOW(), NOW()),
-- Support sender
('20000000-0000-0000-0000-000000000002', NULL, 'Support Sender', 'support@subgrantplatform.com', 'Sub-Grant Platform Support', true, true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  display_name = EXCLUDED.display_name,
  verified = EXCLUDED.verified,
  active = EXCLUDED.active,
  updated_at = EXCLUDED.updated_at;

-- Insert default email providers
INSERT INTO email_providers (id, tenant_id, name, provider_type, config_json, active, created_at, updated_at) VALUES
-- Default SMTP provider
('30000000-0000-0000-0000-000000000001', NULL, 'Default SMTP', 'smtp', 
 '{"host": "smtp.example.com", "port": 587, "secure": false, "user": "smtp_user", "pass": "smtp_pass"}', 
 true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  name = EXCLUDED.name,
  provider_type = EXCLUDED.provider_type,
  config_json = EXCLUDED.config_json,
  active = EXCLUDED.active,
  updated_at = EXCLUDED.updated_at;

-- Link default provider to default sender
UPDATE email_providers 
SET default_sender = '20000000-0000-0000-0000-000000000001'
WHERE id = '30000000-0000-0000-0000-000000000001';

COMMIT;