-- Create integration_settings table for storing third-party integration configurations
CREATE TABLE IF NOT EXISTS integration_settings (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER,
    integration_type VARCHAR(50) NOT NULL,
    enabled BOOLEAN DEFAULT FALSE,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, integration_type)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_integration_settings_org_type 
ON integration_settings(organization_id, integration_type);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_integration_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_integration_settings_updated_at
    BEFORE UPDATE ON integration_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_integration_settings_updated_at();

-- Insert default integration types for system-wide settings (organization_id = NULL)
INSERT INTO integration_settings (organization_id, integration_type, enabled, settings) VALUES
(NULL, 'docusign', FALSE, '{"api_key": "", "account_id": "", "user_id": "", "environment": "sandbox"}'),
(NULL, 'pandadoc', FALSE, '{"api_key": "", "workspace_id": ""}'),
(NULL, 'quickbooks', FALSE, '{"client_id": "", "client_secret": "", "sandbox": true}'),
(NULL, 'sendgrid', FALSE, '{"api_key": "", "from_email": ""}'),
(NULL, 'custom_smtp', FALSE, '{"host": "", "port": "587", "username": "", "password": "", "from_email": "", "encryption": "tls"}'),
(NULL, 'twilio', FALSE, '{"account_sid": "", "auth_token": "", "phone_number": ""}')
ON CONFLICT (organization_id, integration_type) DO NOTHING;
