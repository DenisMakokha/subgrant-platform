const express = require('express');
const router = express.Router();
const DocuSignService = require('../services/docusignService');
const logger = require('../utils/logger');

// Webhook endpoint for DocuSign events
router.post('/webhook', async (req, res) => {
  try {
    // Get the webhook data
    const webhookData = req.body;
    
    // Initialize DocuSign service
    const docusignService = new DocuSignService();
    
    // Process the webhook event
    const result = await docusignService.processWebhookEvent(webhookData);
    
    // Send success response
    res.status(200).json({
      message: 'Webhook processed successfully',
      result
    });
  } catch (error) {
    logger.error('Error processing DocuSign webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;