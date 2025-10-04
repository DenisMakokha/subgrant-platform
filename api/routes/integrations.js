const express = require('express');
const router = express.Router();
const db = require('../config/database');
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');
const { Client } = require('pg');

// Database connection
const getDbClient = () => {
  return new Client({
    user: process.env.DB_USER || 'subgrant_user',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'subgrant_platform',
    password: process.env.DB_PASSWORD || 'subgrant_password',
    port: process.env.DB_PORT || 5432,
  });
};

// GET /api/integrations/settings - Retrieve integration settings
router.get('/settings', async (req, res) => {
  const client = getDbClient();
  
  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT integration_type, enabled, settings 
      FROM integration_settings 
      WHERE organization_id IS NULL
      ORDER BY integration_type
    `);
    
    // Transform database results to frontend format
    const integrationSettings = {};
    result.rows.forEach(row => {
      integrationSettings[row.integration_type] = {
        enabled: row.enabled,
        ...row.settings
      };
    });
    
    logger.info('Loading integration settings from database:', integrationSettings);
    res.json(integrationSettings);
  } catch (error) {
    logger.error('Error loading integration settings:', error);
    res.status(500).json({ error: 'Failed to load integration settings' });
  } finally {
    await client.end();
  }
});

// POST /api/integrations/settings - Save integration settings
router.post('/settings', async (req, res) => {
  const client = getDbClient();
  
  try {
    const newSettings = req.body;
    logger.info('Saving integration settings:', newSettings);
    
    // Validate required fields for enabled integrations
    if (newSettings.sendgrid?.enabled && (!newSettings.sendgrid.api_key || !newSettings.sendgrid.from_email)) {
      return res.status(400).json({ error: 'SendGrid API key and from email are required when enabled' });
    }
    
    if (newSettings.custom_smtp?.enabled && (!newSettings.custom_smtp.host || !newSettings.custom_smtp.username || !newSettings.custom_smtp.password)) {
      return res.status(400).json({ error: 'SMTP host, username, and password are required when enabled' });
    }
    
    if (newSettings.docusign?.enabled && (!newSettings.docusign.api_key || !newSettings.docusign.account_id)) {
      return res.status(400).json({ error: 'DocuSign API key and account ID are required when enabled' });
    }
    
    if (newSettings.quickbooks?.enabled && (!newSettings.quickbooks.client_id || !newSettings.quickbooks.client_secret)) {
      return res.status(400).json({ error: 'QuickBooks client ID and secret are required when enabled' });
    }
    
    if (newSettings.twilio?.enabled && (!newSettings.twilio.account_sid || !newSettings.twilio.auth_token)) {
      return res.status(400).json({ error: 'Twilio account SID and auth token are required when enabled' });
    }
    
    await client.connect();
    
    // Update each integration setting in the database
    for (const [integrationType, settings] of Object.entries(newSettings)) {
      const { enabled, ...settingsData } = settings;
      
      // First, delete any existing records for this integration type
      await client.query(`
        DELETE FROM integration_settings 
        WHERE integration_type = $1 AND organization_id IS NULL
      `, [integrationType]);
      
      // Then insert the new record
      await client.query(`
        INSERT INTO integration_settings (organization_id, integration_type, enabled, settings)
        VALUES (NULL, $1, $2, $3)
      `, [integrationType, enabled, JSON.stringify(settingsData)]);
    }
    
    logger.info('Integration settings saved successfully to database');
    res.json({ message: 'Integration settings saved successfully', settings: newSettings });
  } catch (error) {
    logger.error('Error saving integration settings:', error);
    res.status(500).json({ error: 'Failed to save integration settings' });
  } finally {
    await client.end();
  }
});

// POST /api/integrations/test-email - Send test email
router.post('/test-email', async (req, res) => {
  const client = getDbClient();
  
  try {
    const { to, subject, message, integrationType } = req.body;
    
    if (!to || !subject || !message || !integrationType) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, message, integrationType' });
    }
    
    logger.info(`Sending test email via ${integrationType} to ${to}`);
    
    // Connect to database and get integration settings
    await client.connect();
    
    const integrationTypeKey = integrationType === 'SendGrid' ? 'sendgrid' : 'custom_smtp';
    const result = await client.query(
      'SELECT enabled, settings FROM integration_settings WHERE integration_type = $1',
      [integrationTypeKey]
    );
    
    if (result.rows.length === 0 || !result.rows[0].enabled) {
      return res.status(400).json({ error: `${integrationType} integration is not enabled or configured` });
    }
    
    const config = result.rows[0].settings;
    logger.info('Using email config:', { ...config, password: '***' });
    
    let transporter;
    
    if (integrationType === 'SendGrid') {
      // SendGrid configuration
      transporter = nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: 'apikey',
          pass: config.api_key
        }
      });
    } else if (config.host === 'smtp.gmail.com') {
      // Gmail SMTP configuration (more reliable for testing)
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: config.username,
          pass: config.password
        }
      });
    } else {
      // Custom SMTP configuration
      transporter = nodemailer.createTransport({
        host: config.host,
        port: parseInt(config.port),
        secure: config.port === '465', // SSL for port 465, otherwise STARTTLS
        auth: {
          user: config.username,
          pass: config.password
        },
        tls: {
          rejectUnauthorized: false,
          servername: config.host
        },
        requireTLS: config.port !== '465',
        connectionTimeout: 30000,
        greetingTimeout: 10000,
        socketTimeout: 30000,
        debug: true
      });
    }
    
    // Send email
    const mailOptions = {
      from: config.from_email,
      to: to,
      subject: subject,
      text: message,
      html: `<p>${message.replace(/\n/g, '<br>')}</p>`,
      headers: {
        'X-Mailer': 'SubGrant Platform',
        'X-Priority': '3'
      }
    };
    
    logger.info('Mail options:', JSON.stringify(mailOptions, null, 2));
    
    const info = await transporter.sendMail(mailOptions);
    logger.info('Email sent successfully:', info.messageId);
    logger.info('Full email response:', JSON.stringify(info, null, 2));
    
    // Verify the transporter configuration
    try {
      await transporter.verify();
      logger.info('SMTP server connection verified successfully');
    } catch (verifyError) {
      logger.error('SMTP server verification failed:', verifyError);
    }
    
    res.json({ 
      message: `Test email sent successfully via ${integrationType}`,
      details: { 
        to, 
        subject, 
        integrationType, 
        messageId: info.messageId,
        response: info.response,
        envelope: info.envelope
      }
    });
  } catch (error) {
    logger.error('Error sending test email:', error);
    res.status(500).json({ error: `Failed to send test email: ${error.message}` });
  } finally {
    await client.end();
  }
});

module.exports = router;
