# Email SSOT (Single Source of Truth) System

The Email SSOT system is a comprehensive email management solution that complements the existing notification system. It provides multi-tenant branding, i18n support, provider configuration, delivery pipeline with retries and bounce handling, user preferences for email frequency, and administrative interfaces.

## Features

1. **Email Templates** - Multi-tenant branding and i18n support
2. **Email Senders** - Sender identities with verification
3. **Email Providers** - Configuration for different email services (SMTP, SendGrid, etc.)
4. **Email Outbox** - Transactional email queue
5. **Email Deliveries** - Delivery tracking with status updates
6. **Email Suppressions** - Suppression lists for bounces, spam complaints, etc.
7. **Email Preferences** - User preferences for email frequency
8. **Email Digests** - Aggregated email deliveries

## Database Schema

The Email SSOT system uses the following database tables:

### email_templates
- Stores email templates with multi-tenant branding and i18n support
- Fields: id, tenant_id, name, key, subject_tpl, body_html_tpl, body_text_tpl, layout_html, version, active, created_at, updated_at

### email_senders
- Stores sender identities
- Fields: id, tenant_id, name, email, reply_to, display_name, verified, active, created_at, updated_at

### email_providers
- Stores provider configuration for different email services
- Fields: id, tenant_id, name, provider_type, config_json, active, default_sender, created_at, updated_at

### email_outbox
- Transactional email queue
- Fields: id, tenant_id, template_id, sender_id, provider_id, to_addresses, cc_addresses, bcc_addresses, subject, body_html, body_text, attachments, metadata, priority, scheduled_for, created_by, created_at, processed_at, status, attempts, last_error

### email_deliveries
- Email delivery tracking
- Fields: id, outbox_id, tenant_id, provider_id, message_id, to_address, status, sent_at, delivered_at, opened_at, clicked_at, bounced_at, bounce_reason, spam_reported_at, error_message, provider_data, created_at, updated_at

### email_suppressions
- Suppression lists
- Fields: id, tenant_id, email, reason, category, suppressed_at, expires_at, created_by, notes, active

### email_preferences
- User preferences for email frequency
- Fields: id, tenant_id, user_id, email_type, enabled, frequency, preferred_time, preferred_tz, created_at, updated_at

### email_digests
- Aggregated email deliveries
- Fields: id, tenant_id, user_id, email_type, frequency, next_run_at, last_run_at, items_json, created_at, updated_at

## API Endpoints

### Email Templates
- `GET /api/email/templates` - Get all email templates
- `GET /api/email/templates/:id` - Get email template by ID
- `POST /api/email/templates` - Create email template
- `PUT /api/email/templates/:id` - Update email template
- `DELETE /api/email/templates/:id` - Delete email template

### Email Senders
- `GET /api/email/senders` - Get all email senders
- `POST /api/email/senders` - Create email sender

### Email Providers
- `GET /api/email/providers` - Get all email providers
- `POST /api/email/providers` - Create email provider

### Email Outbox
- `GET /api/email/outbox` - Get email outbox items
- `GET /api/email/outbox/:id/deliveries` - Get email deliveries for an outbox item

### Email Suppressions
- `GET /api/email/suppressions` - Get email suppressions
- `POST /api/email/suppressions` - Add email to suppression list
- `DELETE /api/email/suppressions` - Remove email from suppression list

### Email Preferences
- `GET /api/email/preferences/:userId/:emailType` - Get user email preferences
- `PUT /api/email/preferences/:userId/:emailType` - Update user email preferences

### Send Email
- `POST /api/email/send` - Send an email

## Services

### EmailSSOTService
The main service for handling email operations including:
- Template rendering with Mustache
- Email sending through configured providers
- Suppression management
- Preference management

## Migration Scripts

The Email SSOT system includes migration scripts for setting up the database tables and seeding initial data:
- `api/scripts/migrations/2025Q4_email_ssot/phaseA.sql` - Creates database tables
- `api/scripts/migrations/2025Q4_email_ssot/phaseB.sql` - Seeds initial data
- `api/scripts/run-email-ssot-migrations.js` - Script to run migrations

## Integration with Notification System

The Email SSOT system integrates with the existing notification system by:
- Using the same tenant and user models
- Supporting the same authentication and authorization middleware
- Providing email delivery as one of the notification channels
- Sharing the same error handling and logging infrastructure

## Configuration

The Email SSOT system can be configured through:
- Environment variables for provider credentials
- Database records for tenant-specific settings
- API endpoints for runtime configuration

## Security

The Email SSOT system implements:
- Authentication through existing middleware
- Authorization through RBAC
- Input validation and sanitization
- Secure storage of provider credentials
- Protection against email injection attacks